# ML Training Framework

> Architecture of Ishkeen's training pipeline — config-driven, checkpoint-managed, and designed for reproducibility.

---

## Overview

The training framework is a modular pipeline with clearly separated responsibilities:

```
TrainingConfig → Trainer → Validator → MetricsTracker → CheckpointManager
```

Each component is independently testable and replaceable. No dataset collection or model training is performed in the current phase — this framework provides the infrastructure for when labeled data becomes available.

---

## Component Architecture

### TrainingConfig

A Pydantic model that serves as the single source of truth for all training hyperparameters:

| Parameter | Default | Purpose |
|---|---|---|
| `backbone` | `"mobilenetv3_large"` | Architecture selection via BackboneFactory |
| `learning_rate` | `1e-4` | Initial LR for AdamW |
| `batch_size` | `32` | Training batch size |
| `num_epochs` | `50` | Maximum training epochs |
| `early_stopping_patience` | `7` | Epochs without val_auroc improvement before stopping |
| `positive_threshold` | `0.80` | ConfidencePolicy positive threshold |
| `negative_threshold` | `0.20` | ConfidencePolicy negative threshold |
| `use_mixed_precision` | `True` | Enable AMP via GradScaler |

Pydantic validation ensures type safety and catches invalid configurations (e.g., `negative_threshold >= positive_threshold`) before training begins.

---

### Trainer

The core training loop orchestrator:

1. **Model creation**: Delegates to `BackboneFactory` based on `config.backbone`.
2. **Optimizer**: `AdamW` with weight decay — chosen over vanilla Adam for better generalization in fine-tuning scenarios.
3. **Scheduler**: `CosineAnnealingLR` — smoothly decays the learning rate to near-zero by the final epoch, avoiding the sharp drops of step-based schedulers.
4. **Loss**: `BCEWithLogitsLoss` — combines sigmoid and binary cross-entropy in a single numerically stable operation.
5. **Mixed precision**: Optional `torch.cuda.amp.GradScaler` for faster training on GPU. Disabled automatically when training on CPU.

Each epoch:
```
for batch in train_loader:
    forward → loss → backward → optimizer.step() → scheduler.step()
    → MetricsTracker.update(predictions, labels)

val_metrics = Validator.evaluate(model, val_loader)
CheckpointManager.save_if_improved(model, val_metrics)
early_stop_check(val_metrics["auroc"])
```

---

### Validator

Runs the evaluation loop under `torch.no_grad()` to compute validation metrics without gradient computation:

- Iterates over the validation DataLoader.
- Collects all predictions and labels.
- Delegates metric computation to `MetricsTracker`.
- Returns a metrics dictionary for checkpoint and early stopping decisions.

The validator is stateless — it receives a model and DataLoader, returns a dict.

---

### MetricsTracker

Accumulates predictions and labels across batches within an epoch, then computes aggregate metrics at epoch end:

| Metric | Implementation | Purpose |
|---|---|---|
| **Accuracy** | `(TP + TN) / total` | Baseline correctness measure |
| **Precision** | `TP / (TP + FP)` | How many positive predictions are correct |
| **Recall** | `TP / (TP + FN)` | How many actual positives are caught |
| **F1** | Harmonic mean of precision and recall | Balanced measure for imbalanced data |
| **AUROC** | Area under ROC curve | Threshold-independent ranking quality |

AUROC is the primary metric for model selection and early stopping because it is independent of the classification threshold — critical when that threshold is set by `ConfidencePolicy`, not by the model itself.

---

### CheckpointManager

Manages model checkpoint persistence with a top-K strategy:

- **Saves the top 3 checkpoints** ranked by `val_auroc`.
- Automatically deletes lower-ranked checkpoints when a new one enters the top 3.
- Supports `load_best()` (highest val_auroc) and `load_latest()` (most recent epoch).
- Checkpoint files include: model state dict, optimizer state dict, epoch number, metrics, and `TrainingConfig`.

This ensures training can be resumed from any saved state and that the best model is always recoverable.

---

## Early Stopping

Training halts early when `val_auroc` has not improved for `patience` consecutive epochs (default: 7):

```
if epochs_without_improvement >= patience:
    stop training
    load best checkpoint
    proceed to ONNX export
```

This prevents overfitting on small datasets and avoids wasting compute on plateaued training runs.

---

## Why This Matters

1. **Reproducibility**: `TrainingConfig` as a Pydantic model means every training run is fully specified by a serializable configuration object. No hidden state, no implicit defaults.
2. **Separation of concerns**: The Trainer orchestrates but does not compute metrics (MetricsTracker), does not manage files (CheckpointManager), and does not evaluate (Validator). Each component can be tested in isolation.
3. **AUROC as primary metric**: In a binary classification task with configurable thresholds, accuracy is misleading. AUROC measures ranking quality independent of threshold choice — the right metric for a system where `ConfidencePolicy` controls the operating point.
4. **Infrastructure-first**: Building the training framework before collecting data ensures that when labeled images arrive, the path from data to deployed ONNX model is already paved.
