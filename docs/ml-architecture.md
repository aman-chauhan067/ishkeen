# Ishkeen ML Architecture

> System-level overview of Ishkeen's machine learning pipeline — from training to production inference.

---

## System Overview

Ishkeen's ML pipeline follows a strict **train-offline, infer-locally** architecture:

```
PyTorch Training → ONNX Export → ONNXRuntime CPU Inference (FastAPI backend)
```

There are no LLM calls, no cloud inference endpoints, and no external model APIs. All inference runs locally on the server CPU, giving full control over latency, cost, and data privacy.

---

## BackboneFactory Pattern

Model backbone selection is handled through a `BackboneFactory` that decouples architecture choice from training and inference logic.

| Backbone | Size (approx.) | Notes |
|---|---|---|
| **MobileNetV3-Large** | ~15 MB | Default. Optimized for CPU latency. |
| EfficientNet-B0 | ~20 MB | Compound-scaled; slightly heavier. |
| ResNet18 | ~44 MB | Classic residual network; larger footprint. |

The factory accepts a string identifier and returns the corresponding `torch.nn.Module` with its classifier head replaced by Ishkeen's binary classification head.

---

## Why MobileNetV3-Large Is the Default

- **Model size**: ~15 MB vs ~44 MB for ResNet18 — critical when the ONNX file ships with the backend.
- **CPU throughput**: Depthwise separable convolutions and squeeze-and-excitation blocks are purpose-built for mobile and CPU targets, not GPU tensor cores.
- **Accuracy**: Comparable ImageNet top-1 accuracy to ResNet18 (~75%), making it a Pareto-optimal choice for binary skin-concern classification.
- **ONNX compatibility**: Clean export with no custom ops; runs on `CPUExecutionProvider` without fallback warnings.

---

## Binary Classification Head

The final classifier is a single-logit linear layer:

```
nn.Linear(backbone.feature_dim, 1)
```

- **Loss**: `BCEWithLogitsLoss` (numerically stable sigmoid + binary cross-entropy).
- **Output**: A raw logit at training time; a sigmoid probability at inference time.
- **No softmax, no multi-class** — the task is binary detection (concern present vs. absent).

---

## ONNX Export Pipeline

```
PyTorch checkpoint
    → torch.onnx.export(model, dummy_input, path, opset_version=18)
    → ONNX model file (ishkeen_model_v{version}.onnx)
    → ONNXRuntime InferenceSession(CPUExecutionProvider)
```

- **Opset 18**: Chosen for broad operator coverage including recent normalization and activation ops.
- **Dynamic axes**: Batch dimension is dynamic; spatial dimensions are fixed at 224×224.
- **Validation**: Exported model is verified against PyTorch output with `numpy.allclose` before promotion.

---

## Model Versioning

Models are stored as:

```
ishkeen_model_v{version}.onnx
```

The active version is tracked by the `ML_MODEL_VERSION` constant in the codebase. This constant is the single source of truth — the inference service loads whichever version it specifies, and the training pipeline increments it on successful export.

---

## Why This Matters

This architecture makes three deliberate trade-offs:

1. **Local-only inference** eliminates per-request cloud costs and network latency, but requires the server to have enough CPU headroom.
2. **ONNX as the serving format** decouples the training framework (PyTorch) from the serving runtime (ONNXRuntime), allowing either side to evolve independently.
3. **MobileNetV3-Large as the default backbone** optimizes for the CPU-bound deployment target rather than chasing marginal accuracy gains with heavier models.

The result is a pipeline that is reproducible, self-contained, and deployable on any machine with a CPU — no GPU, no API keys, no external dependencies.
