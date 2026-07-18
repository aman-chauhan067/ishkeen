"""
Training configuration for Ishkeen ML.

All hyper-parameters and runtime settings are defined as a single Pydantic
model so they can be serialised to / from JSON, validated automatically,
and passed around as a single object.

Usage
-----
>>> from ishkeen_ml.training.config import TrainingConfig
>>> cfg = TrainingConfig(backbone="resnet18", num_epochs=100)
>>> cfg.model_dump()
"""

from __future__ import annotations

from pydantic import BaseModel, Field, model_validator


class TrainingConfig(BaseModel):
    """Complete set of hyper-parameters for an Ishkeen training run.

    Attributes
    ----------
    backbone : str
        Name of the torchvision backbone (see ``BackboneFactory``).
    learning_rate : float
        Peak learning rate for AdamW.
    weight_decay : float
        L2 regularisation coefficient.
    batch_size : int
        Mini-batch size for both training and validation.
    num_epochs : int
        Maximum number of training epochs.
    early_stopping_patience : int
        Stop training after this many epochs without val improvement.
    mixed_precision : bool
        Enable AMP (``torch.cuda.amp``) for faster GPU training.
    input_size : int
        Spatial resolution of input images (square crop).
    num_workers : int
        ``DataLoader`` worker processes.
    checkpoint_dir : str
        Directory to save model checkpoints.
    positive_threshold : float
        Sigmoid probability above which a prediction is *positive*.
    negative_threshold : float
        Sigmoid probability below which a prediction is *negative*.
    seed : int
        Global random seed for reproducibility.
    """

    backbone: str = Field(default="mobilenet_v3_large")
    optimizer: str = Field(default="adamw")
    scheduler: str = Field(default="cosine")
    learning_rate: float = Field(default=1e-4, gt=0.0)
    weight_decay: float = Field(default=1e-5, ge=0.0)
    batch_size: int = Field(default=32, gt=0)
    num_epochs: int = Field(default=50, gt=0)
    early_stopping_patience: int = Field(default=7, ge=0)
    mixed_precision: bool = Field(default=True)
    input_size: int = Field(default=224, ge=128)
    num_workers: int = Field(default=4, ge=0)
    checkpoint_dir: str = Field(default="checkpoints")
    positive_threshold: float = Field(default=0.80, ge=0.0, le=1.0)
    negative_threshold: float = Field(default=0.20, ge=0.0, le=1.0)
    seed: int = Field(default=42)
    device: str = Field(default="cuda")
    dataset_version: str = Field(default="unknown")
    augmentations: list[str] = Field(default_factory=lambda: ["flip", "rotate", "jitter", "blur"])
    checkpoint_interval: int = Field(default=1, gt=0)

    @model_validator(mode='after')
    def validate_config(self) -> 'TrainingConfig':
        valid_backbones = ["resnet18", "mobilenet_v3_large", "efficientnet_b0"]
        if self.backbone not in valid_backbones:
            raise ValueError(f"Invalid backbone: {self.backbone}. Must be one of {valid_backbones}")
            
        valid_optimizers = ["adamw", "sgd"]
        if self.optimizer not in valid_optimizers:
            raise ValueError(f"Invalid optimizer: {self.optimizer}. Must be one of {valid_optimizers}")
            
        valid_schedulers = ["cosine", "step", "none"]
        if self.scheduler not in valid_schedulers:
            raise ValueError(f"Invalid scheduler: {self.scheduler}. Must be one of {valid_schedulers}")
            
        return self
