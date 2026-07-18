from torchvision.transforms import v2
import torch
from typing import Callable

def get_train_transforms(image_size: int = 224) -> Callable:
    """
    Production augmentation pipeline for training.
    Uses torchvision.transforms.v2 for maximum efficiency.
    """
    return v2.Compose([
        v2.ToImage(),  # Convert PIL to Tensor
        v2.RandomResizedCrop(size=(image_size, image_size), scale=(0.8, 1.0)),
        v2.RandomHorizontalFlip(p=0.5),
        v2.RandomRotation(degrees=15),
        v2.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.05),
        v2.RandomApply([v2.GaussianBlur(kernel_size=3)], p=0.2),
        v2.ToDtype(torch.float32, scale=True),
        v2.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

def get_val_transforms(image_size: int = 224) -> Callable:
    """
    Production augmentation pipeline for validation/testing.
    """
    return v2.Compose([
        v2.ToImage(),
        v2.Resize(size=(image_size, image_size), antialias=True),
        v2.ToDtype(torch.float32, scale=True),
        v2.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
