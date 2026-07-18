"""
Backbone factory for Ishkeen ML binary classification models.

Provides a unified interface to create pretrained backbones from torchvision
with their classifier heads replaced for binary (acne / no-acne) classification.

Supported architectures
-----------------------
- ``mobilenet_v3_large`` — best CPU inference latency & smallest footprint (default)
- ``efficientnet_b0``    — strong accuracy / size trade-off
- ``resnet18``           — simple, well-understood baseline

Usage
-----
>>> from ishkeen_ml.models.backbone import BackboneFactory
>>> model = BackboneFactory.create("mobilenet_v3_large", pretrained=True)
"""

from __future__ import annotations

import torch.nn as nn
from torchvision.models import (
    efficientnet_b0,
    EfficientNet_B0_Weights,
    mobilenet_v3_large,
    MobileNet_V3_Large_Weights,
    resnet18,
    ResNet18_Weights,
)

# ---------------------------------------------------------------------------
# Public constants
# ---------------------------------------------------------------------------

SUPPORTED_BACKBONES: list[str] = [
    "mobilenet_v3_large",
    "efficientnet_b0",
    "resnet18",
]

DEFAULT_BACKBONE: str = "mobilenet_v3_large"
"""Chosen for best CPU inference latency and smallest model size."""


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------

class BackboneFactory:
    """Factory that builds torchvision backbones with a binary classification head.

    The original classifier / fc layer is replaced by::

        nn.Sequential(
            nn.Dropout(0.2),
            nn.Linear(num_features, 1),
        )

    so the returned model outputs raw logits of shape ``(B, 1)``.
    """

    @staticmethod
    def create(name: str, pretrained: bool = True) -> nn.Module:
        """Create a backbone model by name.

        Parameters
        ----------
        name : str
            One of :pydata:`SUPPORTED_BACKBONES`.
        pretrained : bool, optional
            If ``True`` (default), load ImageNet-pretrained weights.

        Returns
        -------
        nn.Module
            The backbone with its head replaced for binary classification.

        Raises
        ------
        ValueError
            If *name* is not in :pydata:`SUPPORTED_BACKBONES`.
        """
        if name not in SUPPORTED_BACKBONES:
            raise ValueError(
                f"Unsupported backbone '{name}'. "
                f"Choose from: {SUPPORTED_BACKBONES}"
            )

        if name == "resnet18":
            return _build_resnet18(pretrained)
        elif name == "mobilenet_v3_large":
            return _build_mobilenet_v3_large(pretrained)
        elif name == "efficientnet_b0":
            return _build_efficientnet_b0(pretrained)

        # Should never reach here due to the guard above, but keeps linters happy.
        raise ValueError(f"Unhandled backbone: {name}")  # pragma: no cover


# ---------------------------------------------------------------------------
# Private builder helpers
# ---------------------------------------------------------------------------

def _binary_head(num_features: int) -> nn.Sequential:
    """Return a dropout + linear head for binary classification."""
    return nn.Sequential(
        nn.Dropout(0.2),
        nn.Linear(num_features, 1),
    )


def _build_resnet18(pretrained: bool) -> nn.Module:
    """Build ResNet-18 with a binary classification head."""
    weights = ResNet18_Weights.DEFAULT if pretrained else None
    model = resnet18(weights=weights)
    num_features: int = model.fc.in_features
    model.fc = _binary_head(num_features)
    return model


def _build_mobilenet_v3_large(pretrained: bool) -> nn.Module:
    """Build MobileNetV3-Large with a binary classification head."""
    weights = MobileNet_V3_Large_Weights.DEFAULT if pretrained else None
    model = mobilenet_v3_large(weights=weights)
    num_features: int = model.classifier[-1].in_features
    model.classifier[-1] = _binary_head(num_features)
    return model


def _build_efficientnet_b0(pretrained: bool) -> nn.Module:
    """Build EfficientNet-B0 with a binary classification head."""
    weights = EfficientNet_B0_Weights.DEFAULT if pretrained else None
    model = efficientnet_b0(weights=weights)
    num_features: int = model.classifier[-1].in_features
    model.classifier[-1] = _binary_head(num_features)
    return model
