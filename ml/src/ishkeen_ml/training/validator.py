"""
Validation loop for Ishkeen ML.

Runs the model in ``eval()`` mode over an entire ``DataLoader`` and returns
epoch-level binary classification metrics.

Usage
-----
>>> validator = Validator(model, device="cuda")
>>> metrics = validator.validate(val_loader)
>>> print(metrics["auroc"])
"""

from __future__ import annotations

from typing import Dict

import torch
import torch.nn as nn
from torch.utils.data import DataLoader

from ishkeen_ml.training.metrics.validation import ValidationMetrics


class Validator:
    """Run inference over a validation set and compute metrics.

    Parameters
    ----------
    model : nn.Module
        The model to evaluate.  Its output is expected to be raw logits
        of shape ``(B, 1)``.
    device : str, optional
        Device on which to run inference (default ``"cpu"``).
    """

    def __init__(self, model: nn.Module, device: str = "cpu") -> None:
        self.model = model
        self.device = torch.device(device)

    def validate(self, dataloader: DataLoader) -> Dict[str, float]:
        """Evaluate the model on *dataloader*.

        The model is set to ``eval()`` mode and all computation is wrapped
        in :func:`torch.no_grad` to save memory.

        Parameters
        ----------
        dataloader : DataLoader
            Yields ``(images, labels)`` batches.  Labels should be binary
            tensors of shape ``(B,)`` or ``(B, 1)``.

        Returns
        -------
        dict[str, float]
            Metrics dictionary with keys: ``accuracy``, ``precision``,
            ``recall``, ``f1``, ``auroc``, ``avg_loss``.
        """
        self.model.eval()
        tracker = ValidationMetrics()
        loss_fn = torch.nn.BCEWithLogitsLoss()

        with torch.no_grad():
            for images, targets in dataloader:
                images = images.to(self.device)
                if isinstance(targets, dict) and "classification" in targets:
                    labels = targets["classification"]["binary_acne"].to(self.device).float()
                else:
                    labels = targets.to(self.device).float()

                logits: torch.Tensor = self.model(images)
                logits = logits.view(-1)
                labels = labels.view(-1)

                loss = loss_fn(logits, labels)
                tracker.update(
                    loss=loss.item(),
                    predictions=logits,
                    labels=labels,
                )

        return tracker.compute()
