import pytest
import os
import torch
import torch.nn as nn
from pydantic import ValidationError

from ishkeen_ml.training.config import TrainingConfig
from ishkeen_ml.training.metrics.training import TrainingMetrics
from ishkeen_ml.training.metrics.validation import ValidationMetrics

def test_config_validation():
    # Valid config
    config = TrainingConfig(batch_size=32, input_size=224)
    assert config.batch_size == 32
    
    # Invalid batch size
    with pytest.raises(ValidationError):
        TrainingConfig(batch_size=0)
        
    # Invalid image size
    with pytest.raises(ValidationError):
        TrainingConfig(input_size=64)
        
    # Invalid backbone
    with pytest.raises(ValidationError):
        TrainingConfig(backbone="unknown_net")
        
    # Invalid optimizer
    with pytest.raises(ValidationError):
        TrainingConfig(optimizer="rmsprop")

def test_training_metrics():
    metrics = TrainingMetrics()
    
    # Dummy loss
    loss = 0.5
    
    # batch size 4
    # true: [1, 0, 1, 0]
    # pred logits: [1.0, -1.0, 2.0, -2.0] -> sigmoid: [0.73, 0.26, 0.88, 0.11]
    # predicted: [1, 0, 1, 0] -> 100% correct
    predictions = torch.tensor([1.0, -1.0, 2.0, -2.0])
    labels = torch.tensor([1.0, 0.0, 1.0, 0.0])
    
    metrics.update(loss, predictions, labels)
    
    res = metrics.compute()
    assert res["accuracy"] == 1.0
    assert res["avg_loss"] == 0.5
    
def test_validation_metrics():
    metrics = ValidationMetrics()
    
    # true: [1, 1, 0, 0]
    # pred: [1, 0, 1, 0]  (1 TP, 1 FN, 1 FP, 1 TN)
    
    predictions = torch.tensor([2.0, -2.0, 2.0, -2.0]) # sigmoids: 0.88, 0.11, 0.88, 0.11
    labels = torch.tensor([1.0, 1.0, 0.0, 0.0])
    
    metrics.update(0.5, predictions, labels)
    
    res = metrics.compute()
    assert res["accuracy"] == 0.5
    
    # Precision pos = TP / (TP + FP) = 1 / 2 = 0.5
    assert res["precision"] == 0.5
    
    # Recall pos = TP / (TP + FN) = 1 / 2 = 0.5
    assert res["recall"] == 0.5
    
    # Confusion matrix: [[tn, fp], [fn, tp]] -> [[1, 1], [1, 1]]
    assert res["confusion_matrix"] == [[1, 1], [1, 1]]
