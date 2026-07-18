"""
Training orchestrator for Ishkeen ML.

Wires together the model, optimizer, scheduler, loss function, checkpoint
manager, metrics tracker, and validator into a single ``Trainer`` object.

This module defines the **framework only** — ``train()`` is never invoked
automatically.  Call it explicitly once data loaders are ready.

Usage
-----
>>> from ishkeen_ml.training.config import TrainingConfig
>>> from ishkeen_ml.training.trainer import Trainer
>>> trainer = Trainer(TrainingConfig())
>>> trainer.setup(train_loader, val_loader)
>>> # trainer.train()  # ← call when ready
"""

from __future__ import annotations

from typing import Any, Dict, Optional

import torch
import torch.nn as nn
from torch.cuda.amp import GradScaler, autocast
from torch.optim import AdamW, SGD
from torch.optim.lr_scheduler import CosineAnnealingLR, StepLR
from torch.utils.data import DataLoader

from ishkeen_ml.models.backbone import BackboneFactory
from ishkeen_ml.training.checkpoint import CheckpointManager
from ishkeen_ml.training.config import TrainingConfig
from ishkeen_ml.training.metrics.training import TrainingMetrics
from ishkeen_ml.training.validator import Validator
import logging

logger = logging.getLogger("ishkeen_ml.trainer")


class Trainer:
    """End-to-end training loop for binary classification.

    Parameters
    ----------
    config : TrainingConfig
        All hyper-parameters and runtime settings.
    """

    def __init__(self, config: TrainingConfig) -> None:
        self.config = config
        self.device = torch.device(self.config.device if torch.cuda.is_available() or self.config.device == "cpu" else "cpu")

        # Populated by ``setup()``
        self.model: Optional[nn.Module] = None
        self.optimizer: Optional[torch.optim.Optimizer] = None
        self.scheduler: Optional[torch.optim.lr_scheduler.LRScheduler] = None
        self.loss_fn: Optional[nn.BCEWithLogitsLoss] = None
        self.scaler: Optional[GradScaler] = None
        self.checkpoint_mgr: Optional[CheckpointManager] = None
        self.metrics: Optional[TrainingMetrics] = None
        self.validator: Optional[Validator] = None
        self.train_loader: Optional[DataLoader] = None
        self.val_loader: Optional[DataLoader] = None
        self.start_epoch: int = 1

    # ------------------------------------------------------------------
    # Setup
    # ------------------------------------------------------------------

    def setup(self, train_loader: DataLoader, val_loader: DataLoader) -> None:
        """Initialise all training components.

        Must be called **once** before :meth:`train` or :meth:`train_epoch`.
        """
        self.train_loader = train_loader
        self.val_loader = val_loader

        # Model -----------------------------------------------------------
        self.model = BackboneFactory.create(
            self.config.backbone, pretrained=True
        )
        self.model.to(self.device)

        # Optimiser -------------------------------------------------------
        if self.config.optimizer == "adamw":
            self.optimizer = AdamW(
                self.model.parameters(),
                lr=self.config.learning_rate,
                weight_decay=self.config.weight_decay,
            )
        elif self.config.optimizer == "sgd":
            self.optimizer = SGD(
                self.model.parameters(),
                lr=self.config.learning_rate,
                weight_decay=self.config.weight_decay,
                momentum=0.9
            )

        # Scheduler -------------------------------------------------------
        if self.config.scheduler == "cosine":
            self.scheduler = CosineAnnealingLR(
                self.optimizer,
                T_max=self.config.num_epochs,
            )
        elif self.config.scheduler == "step":
            self.scheduler = StepLR(self.optimizer, step_size=30, gamma=0.1)
        else:
            self.scheduler = None

        # Loss ------------------------------------------------------------
        self.loss_fn = nn.BCEWithLogitsLoss()

        # Mixed precision -------------------------------------------------
        self.scaler = (
            GradScaler() if self.config.mixed_precision else None
        )

        # Tracking --------------------------------------------------------
        self.checkpoint_mgr = CheckpointManager(
            checkpoint_dir=self.config.checkpoint_dir,
        )
        self.metrics = TrainingMetrics()
        self.validator = Validator(self.model, device=str(self.device))

    def resume(self, checkpoint_path: str) -> None:
        """Resume training from a checkpoint."""
        assert self.model is not None and self.optimizer is not None, "Call setup() before resume()"
        
        checkpoint = torch.load(checkpoint_path, map_location=self.device)
        self.model.load_state_dict(checkpoint["model_state"])
        self.optimizer.load_state_dict(checkpoint["optimizer_state"])
        
        if self.scheduler and "scheduler_state" in checkpoint:
            self.scheduler.load_state_dict(checkpoint["scheduler_state"])
            
        if self.scaler and "scaler_state" in checkpoint:
            self.scaler.load_state_dict(checkpoint["scaler_state"])
            
        self.start_epoch = checkpoint["metadata"]["epoch"] + 1
        logger.info("Resumed from checkpoint %s at epoch %d", checkpoint_path, self.start_epoch)

    # ------------------------------------------------------------------
    # Single epoch
    # ------------------------------------------------------------------

    def train_epoch(self) -> Dict[str, float]:
        """Execute a single training epoch.

        Returns
        -------
        dict[str, float]
            Training metrics for this epoch (accuracy, precision, recall,
            f1, auroc, avg_loss).
        """
        assert self.model is not None, "Call setup() before train_epoch()"
        assert self.train_loader is not None
        assert self.optimizer is not None
        assert self.loss_fn is not None
        assert self.metrics is not None

        self.model.train()
        self.metrics.reset()

        for images, targets in self.train_loader:
            images = images.to(self.device)
            # targets is a dict of batched lists/dicts if using default collate, but usually default collate turns dict of lists into dict of tensors.
            # Assuming default collate: targets["classification"]["binary_acne"] is a tensor
            if isinstance(targets, dict) and "classification" in targets:
                labels = targets["classification"]["binary_acne"].to(self.device).float()
            else:
                labels = targets.to(self.device).float()

            self.optimizer.zero_grad()

            if self.scaler is not None:
                # Mixed-precision forward pass
                with autocast(device_type=str(self.device)):
                    logits: torch.Tensor = self.model(images).view(-1)
                    loss = self.loss_fn(logits, labels.view(-1))

                self.scaler.scale(loss).backward()
                self.scaler.unscale_(self.optimizer)
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
                self.scaler.step(self.optimizer)
                self.scaler.update()
            else:
                logits = self.model(images).view(-1)
                loss = self.loss_fn(logits, labels.view(-1))
                loss.backward()
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
                self.optimizer.step()

            self.metrics.update(
                loss=loss.item(),
                predictions=logits,
                labels=labels,
            )

        return self.metrics.compute()

    # ------------------------------------------------------------------
    # Full training loop
    # ------------------------------------------------------------------

    def train(self) -> Dict[str, Any]:
        """Run the full training loop with early stopping.

        Early stopping is triggered when the validation AUROC does not
        improve for ``config.early_stopping_patience`` consecutive epochs.

        Returns
        -------
        dict[str, Any]
            Best validation metrics achieved during training.
        """
        assert self.model is not None, "Call setup() before train()"
        assert self.val_loader is not None
        assert self.scheduler is not None
        assert self.checkpoint_mgr is not None
        assert self.optimizer is not None
        assert self.validator is not None

        best_val_auroc: float = -1.0
        best_metrics: Dict[str, Any] = {}
        patience_counter: int = 0

        for epoch in range(self.start_epoch, self.config.num_epochs + 1):
            # --- Train ---------------------------------------------------
            train_metrics = self.train_epoch()

            # --- Validate ------------------------------------------------
            val_metrics = self.validator.validate(self.val_loader)

            # --- Scheduler step ------------------------------------------
            self.scheduler.step()

            # --- Logging -------------------------------------------------
            _log_epoch(epoch, self.config.num_epochs, train_metrics, val_metrics)

            # --- Checkpoint ----------------------------------------------
            if epoch % self.config.checkpoint_interval == 0 or val_metrics["auroc"] > best_val_auroc:
                metadata = {
                    "epoch": epoch,
                    "backbone": self.config.backbone,
                    "config_hash": str(hash(self.config.model_dump_json())),
                    "best_metric": val_metrics["auroc"],
                    "dataset_version": self.config.dataset_version
                }
                
                self.checkpoint_mgr.save(
                    model=self.model,
                    optimizer=self.optimizer,
                    epoch=epoch,
                    metrics={"val_auroc": val_metrics["auroc"], **val_metrics},
                    config=self.config.model_dump(),
                    metadata=metadata,
                    scheduler=self.scheduler,
                    scaler=self.scaler
                )

            # --- Early stopping ------------------------------------------
            if val_metrics["auroc"] > best_val_auroc:
                best_val_auroc = val_metrics["auroc"]
                best_metrics = {
                    "epoch": epoch,
                    "train": train_metrics,
                    "val": val_metrics,
                }
                patience_counter = 0
            else:
                patience_counter += 1
                if patience_counter >= self.config.early_stopping_patience:
                    logger.info(
                        "[Ishkeen] Early stopping at epoch %d (no improvement for %d epochs).",
                        epoch, self.config.early_stopping_patience
                    )
                    break

        return best_metrics


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _log_epoch(
    epoch: int,
    total: int,
    train: Dict[str, float],
    val: Dict[str, float],
) -> None:
    """Print a single-line epoch summary to stdout."""
    logger.info(
        "[Epoch %3d/%d] train_loss=%.4f train_auroc=%.4f | val_loss=%.4f val_auroc=%.4f",
        epoch, total, train['avg_loss'], train['auroc'], val['avg_loss'], val['auroc']
    )
