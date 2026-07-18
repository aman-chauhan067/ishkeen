import torch
import numpy as np
from typing import List, Dict, Any

class ValidationMetrics:
    """
    Computes rigorous validation metrics for binary classification:
    Accuracy, Precision, Recall, F1, ROC-AUC, PR-AUC, 
    2x2 Confusion Matrix, Calibration Curve, Per-class metrics.
    """
    def __init__(self) -> None:
        self.reset()

    def update(self, loss: float, predictions: torch.Tensor, labels: torch.Tensor) -> None:
        self._losses.append(loss)
        self._predictions.append(predictions.detach().cpu().view(-1))
        self._labels.append(labels.detach().cpu().view(-1))

    def compute(self) -> Dict[str, Any]:
        if not self._predictions:
            return {}

        all_preds = torch.cat(self._predictions)
        all_labels = torch.cat(self._labels)

        avg_loss = sum(self._losses) / len(self._losses)

        probs = torch.sigmoid(all_preds)
        binary_preds = (probs >= 0.5).long()
        labels_long = all_labels.long()

        tp = int(((binary_preds == 1) & (labels_long == 1)).sum())
        fp = int(((binary_preds == 1) & (labels_long == 0)).sum())
        tn = int(((binary_preds == 0) & (labels_long == 0)).sum())
        fn = int(((binary_preds == 0) & (labels_long == 1)).sum())

        confusion_matrix = [
            [tn, fp],
            [fn, tp]
        ]

        accuracy = self._safe_div(tp + tn, tp + fp + tn + fn)
        precision_pos = self._safe_div(tp, tp + fp)
        recall_pos = self._safe_div(tp, tp + fn)
        f1_pos = self._safe_div(2.0 * precision_pos * recall_pos, precision_pos + recall_pos)

        precision_neg = self._safe_div(tn, tn + fn)
        recall_neg = self._safe_div(tn, tn + fp)
        
        per_class = {
            "positive": {"precision": precision_pos, "recall": recall_pos, "f1": f1_pos},
            "negative": {"precision": precision_neg, "recall": recall_neg}
        }

        auroc = self._compute_auroc(probs, labels_long)
        pr_auc = self._compute_pr_auc(probs, labels_long)
        calibration = self._compute_calibration(probs, labels_long)

        return {
            "accuracy": accuracy,
            "precision": precision_pos,
            "recall": recall_pos,
            "f1": f1_pos,
            "auroc": auroc,
            "pr_auc": pr_auc,
            "avg_loss": avg_loss,
            "confusion_matrix": confusion_matrix,
            "per_class": per_class,
            "calibration_curve": calibration
        }

    def reset(self) -> None:
        self._losses: List[float] = []
        self._predictions: List[torch.Tensor] = []
        self._labels: List[torch.Tensor] = []

    def _safe_div(self, numerator: float, denominator: float) -> float:
        return float(numerator / denominator) if denominator != 0 else 0.0

    def _compute_auroc(self, probs: torch.Tensor, labels: torch.Tensor) -> float:
        unique_labels = labels.unique()
        if unique_labels.numel() < 2:
            return 0.0

        sorted_indices = torch.argsort(probs, descending=True)
        sorted_labels = labels[sorted_indices].float()

        total_pos = sorted_labels.sum().item()
        total_neg = (1.0 - sorted_labels).sum().item()

        cum_tp = torch.cumsum(sorted_labels, dim=0)
        cum_fp = torch.cumsum(1.0 - sorted_labels, dim=0)

        tpr = cum_tp / total_pos
        fpr = cum_fp / total_neg

        tpr = torch.cat([torch.tensor([0.0]), tpr])
        fpr = torch.cat([torch.tensor([0.0]), fpr])

        return float(torch.trapezoid(tpr, fpr))

    def _compute_pr_auc(self, probs: torch.Tensor, labels: torch.Tensor) -> float:
        unique_labels = labels.unique()
        if unique_labels.numel() < 2:
            return 0.0

        sorted_indices = torch.argsort(probs, descending=True)
        sorted_labels = labels[sorted_indices].float()
        
        total_pos = sorted_labels.sum().item()
        cum_tp = torch.cumsum(sorted_labels, dim=0)
        
        # precision = TP / (TP + FP) which is TP / rank
        ranks = torch.arange(1, len(sorted_labels) + 1, dtype=torch.float32)
        precision = cum_tp / ranks
        recall = cum_tp / total_pos
        
        # Prepend (Recall=0, Precision=1)
        precision = torch.cat([torch.tensor([1.0]), precision])
        recall = torch.cat([torch.tensor([0.0]), recall])
        
        # Note: trapezoid integration for PR curve can be slightly optimistic, 
        # but is standard for basic implementations without scikit-learn.
        return float(torch.trapezoid(precision, recall))

    def _compute_calibration(self, probs: torch.Tensor, labels: torch.Tensor, bins: int = 10) -> List[Dict[str, float]]:
        """Returns mean predicted prob and true fraction of positives per bin."""
        probs_np = probs.numpy()
        labels_np = labels.numpy()
        
        bin_edges = np.linspace(0.0, 1.0, bins + 1)
        calibration = []
        
        for i in range(bins):
            mask = (probs_np >= bin_edges[i]) & (probs_np < bin_edges[i+1])
            if i == bins - 1:
                mask = (probs_np >= bin_edges[i]) & (probs_np <= bin_edges[i+1])
            
            if mask.sum() > 0:
                mean_prob = probs_np[mask].mean()
                true_frac = labels_np[mask].mean()
                calibration.append({
                    "bin_start": float(bin_edges[i]),
                    "bin_end": float(bin_edges[i+1]),
                    "mean_prob": float(mean_prob),
                    "true_fraction": float(true_frac),
                    "count": int(mask.sum())
                })
        return calibration
