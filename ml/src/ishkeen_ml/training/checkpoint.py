"""
Checkpoint management for Ishkeen ML training.

Handles saving, loading, and rotating model checkpoints so that only the
*max_checkpoints* most recent files are kept on disk.

Usage
-----
>>> mgr = CheckpointManager("checkpoints", max_checkpoints=3)
>>> mgr.save(model, optimizer, epoch=5, metrics={"val_auroc": 0.92}, config={})
>>> meta = mgr.load_best(model)
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional

import torch
import torch.nn as nn


class CheckpointManager:
    """Save / load / rotate training checkpoints.

    Parameters
    ----------
    checkpoint_dir : str
        Directory where ``checkpoint_epoch_*.pt`` files are stored.
    max_checkpoints : int, optional
        Maximum number of checkpoint files to keep.  Oldest files are
        deleted when this limit is exceeded.  Defaults to ``3``.
    """

    FILENAME_TEMPLATE = "checkpoint_epoch_{epoch}.pt"

    def __init__(self, checkpoint_dir: str, max_checkpoints: int = 3) -> None:
        self.checkpoint_dir = Path(checkpoint_dir)
        self.max_checkpoints = max_checkpoints
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # Save
    # ------------------------------------------------------------------

    def save(
        self,
        model: nn.Module,
        optimizer: torch.optim.Optimizer,
        epoch: int,
        metrics: Dict[str, Any],
        config: Dict[str, Any],
        metadata: Dict[str, Any] = None,
        scheduler: Optional[Any] = None,
        scaler: Optional[Any] = None,
    ) -> Path:
        """Persist a checkpoint to disk."""
        checkpoint: Dict[str, Any] = {
            "model_state": model.state_dict(),
            "optimizer_state": optimizer.state_dict(),
            "epoch": epoch,
            "metrics": metrics,
            "config": config,
            "metadata": metadata or {},
        }
        if scheduler:
            checkpoint["scheduler_state"] = scheduler.state_dict()
        if scaler:
            checkpoint["scaler_state"] = scaler.state_dict()

        filepath = self.checkpoint_dir / self.FILENAME_TEMPLATE.format(epoch=epoch)
        torch.save(checkpoint, filepath)

        self._rotate_checkpoints()
        return filepath

    # ------------------------------------------------------------------
    # Load helpers
    # ------------------------------------------------------------------

    def load_best(
        self,
        model: nn.Module,
        optimizer: Optional[torch.optim.Optimizer] = None,
    ) -> Dict[str, Any]:
        """Load the checkpoint with the highest ``val_auroc``.

        Parameters
        ----------
        model : nn.Module
            Model into which the state dict will be loaded.
        optimizer : torch.optim.Optimizer, optional
            If provided, its state dict is also restored.

        Returns
        -------
        dict
            The full checkpoint metadata dictionary.

        Raises
        ------
        FileNotFoundError
            If no checkpoint files exist in the checkpoint directory.
        """
        checkpoints = self._list_checkpoints()
        if not checkpoints:
            raise FileNotFoundError(
                f"No checkpoints found in {self.checkpoint_dir}"
            )

        best_path: Optional[Path] = None
        best_auroc: float = -1.0

        for path in checkpoints:
            meta = torch.load(path, map_location="cpu", weights_only=False)
            auroc = meta.get("metrics", {}).get("val_auroc", -1.0)
            if auroc > best_auroc:
                best_auroc = auroc
                best_path = path

        assert best_path is not None  # guaranteed by non-empty list
        return self._load_checkpoint(best_path, model, optimizer)

    def load_latest(
        self,
        model: nn.Module,
        optimizer: Optional[torch.optim.Optimizer] = None,
    ) -> Dict[str, Any]:
        """Load the most recent checkpoint (highest epoch number).

        Parameters
        ----------
        model : nn.Module
            Model into which the state dict will be loaded.
        optimizer : torch.optim.Optimizer, optional
            If provided, its state dict is also restored.

        Returns
        -------
        dict
            The full checkpoint metadata dictionary.

        Raises
        ------
        FileNotFoundError
            If no checkpoint files exist in the checkpoint directory.
        """
        checkpoints = self._list_checkpoints()
        if not checkpoints:
            raise FileNotFoundError(
                f"No checkpoints found in {self.checkpoint_dir}"
            )

        # Sort by modification time; newest last.
        checkpoints.sort(key=lambda p: p.stat().st_mtime)
        return self._load_checkpoint(checkpoints[-1], model, optimizer)

    def load_metadata(self, filepath: Path) -> Dict[str, Any]:
        """Loads just the metadata from a checkpoint without model weights."""
        meta = torch.load(filepath, map_location="cpu", weights_only=False)
        return meta.get("metadata", {})

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _list_checkpoints(self) -> list[Path]:
        """Return all ``checkpoint_epoch_*.pt`` files in the directory."""
        return sorted(self.checkpoint_dir.glob("checkpoint_epoch_*.pt"))

    def _load_checkpoint(
        self,
        path: Path,
        model: nn.Module,
        optimizer: Optional[torch.optim.Optimizer],
    ) -> Dict[str, Any]:
        """Load a single checkpoint file and restore model/optimizer state."""
        checkpoint: Dict[str, Any] = torch.load(
            path, map_location="cpu", weights_only=False
        )
        if "model_state" in checkpoint:
            model.load_state_dict(checkpoint["model_state"])
        elif "model_state_dict" in checkpoint:
            model.load_state_dict(checkpoint["model_state_dict"])
            
        if optimizer is not None:
            if "optimizer_state" in checkpoint:
                optimizer.load_state_dict(checkpoint["optimizer_state"])
            elif "optimizer_state_dict" in checkpoint:
                optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
        return checkpoint

    def _rotate_checkpoints(self) -> None:
        """Delete oldest checkpoints if the count exceeds *max_checkpoints*."""
        checkpoints = self._list_checkpoints()
        if len(checkpoints) <= self.max_checkpoints:
            return
        # Oldest files first (by modification time).
        checkpoints.sort(key=lambda p: p.stat().st_mtime)
        excess = len(checkpoints) - self.max_checkpoints
        for path in checkpoints[:excess]:
            path.unlink(missing_ok=True)
