import torch
from typing import List, Dict

class TrainingMetrics:
    """
    Accumulates basic batch-level metrics for the training loop:
    - Loss
    - Basic accuracy
    - Step throughput (optional, omitted here for simplicity, typically tracked via time)
    """
    def __init__(self) -> None:
        self.reset()

    def update(self, loss: float, predictions: torch.Tensor, labels: torch.Tensor) -> None:
        self._losses.append(loss)
        self._predictions.append(predictions.detach().cpu().view(-1))
        self._labels.append(labels.detach().cpu().view(-1))

    def compute(self) -> Dict[str, float]:
        if not self._predictions:
            return {"accuracy": 0.0, "avg_loss": 0.0, "auroc": 0.0}

        all_preds = torch.cat(self._predictions)
        all_labels = torch.cat(self._labels)

        avg_loss = sum(self._losses) / len(self._losses)

        probs = torch.sigmoid(all_preds)
        binary_preds = (probs >= 0.5).long()
        labels_long = all_labels.long()

        correct = (binary_preds == labels_long).sum().item()
        total = labels_long.numel()
        accuracy = correct / total if total > 0 else 0.0

        # We keep AUROC here minimally just for logging consistency with previous trainer
        # though the main logic lives in validation
        return {
            "accuracy": accuracy,
            "avg_loss": avg_loss,
            "auroc": 0.0 # Placeholder for training to keep log clean
        }

    def reset(self) -> None:
        self._losses: List[float] = []
        self._predictions: List[torch.Tensor] = []
        self._labels: List[torch.Tensor] = []
