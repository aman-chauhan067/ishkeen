# ML Framework Decision Matrix (Deferred)

## Context
We need to select an object detection framework for our baseline model. However, because we are currently blocked from acquiring a real dataset (like ACNE04), we lack the empirical dataset statistics (exact lesion sizes, bounding box distributions) required to make a final, scientifically rigorous framework decision.

Therefore, **final detector selection remains CONDITIONAL on real dataset statistics.**

## Candidates

### 1. Ultralytics YOLO-Nano (YOLOv8n or YOLO11n)
- **Small-Object Behavior**: Generally excellent. YOLO architectures handle dense, small objects (like acne) well due to modern FPN (Feature Pyramid Network) designs.
- **CPU Inference**: Highly optimized. Easily runs <100ms on modern CPUs.
- **ONNX Export**: Native, one-line export (`yolo export format=onnx`).
- **Dependency Footprint**: Moderate to high (requires the `ultralytics` pip package, which pulls in many CV libraries).
- **License Implications**: AGPL-3.0. **This is a major consideration.** If we use Ultralytics directly, our backend code that heavily integrates with it might be subject to AGPL viral clauses unless we run it purely via an isolated ONNX runtime or a subprocess.
- **Reproducibility**: Good, though Ultralytics abstracts away many training loop details, which can hide default augmentations (mosaic, mixup) that we may want to disable for a naive baseline.
- **Implementation Complexity**: Very low (highly abstracted).
- **Interview Explainability**: Good, demonstrates knowledge of state-of-the-art edge detection, but requires defending the AGPL license choice.

### 2. torchvision SSDlite320 MobileNetV3 Large
- **Small-Object Behavior**: Often struggles with very small, dense objects compared to YOLO, though fine-tuning anchor boxes can help.
- **CPU Inference**: Excellent. Specifically designed for mobile/CPU.
- **ONNX Export**: Standard PyTorch export.
- **Dependency Footprint**: Low (only requires standard `torch` and `torchvision`).
- **License Implications**: BSD 3-Clause (Extremely permissive, commercial-friendly).
- **Reproducibility**: Excellent. We write the training loop ourselves, giving total control over augmentations.
- **Implementation Complexity**: Moderate. Requires manually writing dataset classes, data loaders, and training loops.
- **Interview Explainability**: Very high. Demonstrates deep understanding of PyTorch internals and anchor-based detection mechanics.

## Deferred Decision Rule
Once a dataset is secured, we will run the `ishkeen_ml dataset stats` CLI tool.
- If the median bounding box area is extremely small (< 1% of image area) and dense, we will lean towards **YOLO-Nano** (via ONNX to avoid AGPL issues).
- If the bounding boxes are relatively large or if we strictly require a permissive BSD license and a custom PyTorch training loop for maximum R&D transparency, we will choose **torchvision SSDlite320**.
