import torch
from torch.utils.data import WeightedRandomSampler
from typing import List

from ishkeen_ml.data.dataset import IshkeenDataset

def create_balanced_sampler(dataset: IshkeenDataset) -> WeightedRandomSampler:
    """
    Creates a WeightedRandomSampler that balances positive and negative classes
    dynamically for the binary acne classification task.
    """
    labels = []
    for record in dataset.records:
        # Extract binary label exactly as the dataset does
        is_positive = float(len(record.boxes) > 0)
        labels.append(is_positive)
        
    labels_tensor = torch.tensor(labels, dtype=torch.float32)
    
    num_positive = int(labels_tensor.sum().item())
    num_negative = len(labels) - num_positive
    
    if num_positive == 0 or num_negative == 0:
        # If one class is missing, fallback to uniform weights
        weights = torch.ones(len(labels))
    else:
        weight_positive = 1.0 / num_positive
        weight_negative = 1.0 / num_negative
        
        weights = torch.zeros(len(labels))
        weights[labels_tensor == 1.0] = weight_positive
        weights[labels_tensor == 0.0] = weight_negative
        
    sampler = WeightedRandomSampler(
        weights=weights,
        num_samples=len(weights),
        replacement=True
    )
    
    return sampler
