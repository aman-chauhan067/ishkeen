# ADR 0011: Baseline Model Architecture Selection (Object Detection)

## Status
Accepted (Revised from Classification Baseline)

## Context
Following the revision of our first ML task to **Acne Lesion Detection** (ADR 0009), we must select an appropriate object detection architecture. The production backend does not guarantee GPU availability, so inference must be feasible on CPU. We need an architecture that balances localization accuracy with low inference latency and memory footprint.

Considered candidates:
- **Faster R-CNN**: Highly accurate, two-stage detector, but generally too slow/heavy for standard CPU MVP deployment.
- **YOLOv8-Nano / YOLOv11-Nano**: Extremely fast, single-stage, modern architecture. Highly optimized for CPU and edge devices. ~3M parameters.
- **SSD-MobileNetV3**: Fast, lightweight, standard in Torchvision, but often lower recall for small dense objects compared to YOLO variants.

## Decision
We will use a lightweight single-stage detector such as **YOLO-Nano (e.g., YOLOv8n or YOLO11n)** as the primary architecture, or **SSD-MobileNetV3** as a fallback if strict Torchvision-only dependencies are mandated.

## Rationale
- **Inference Speed**: Nano YOLO variants or SSD-MobileNet run comfortably in under 100ms on standard CPUs.
- **Small Object Detection**: YOLO variants have demonstrated superior performance in dense small-object detection (like acne lesions) compared to basic SSDs.
- **Deployment Footprint**: The Nano weights file is typically <10MB, keeping the artifact footprint minimal.

## Consequences
- The training pipeline (Phase 5B) will require data loaders formatted for object detection (e.g., YOLO format or COCO JSON).
- The baseline loss function will inherently be the compound detection loss (bounding box regression + objectness/class loss) provided by the chosen framework, overriding simple BCE/CE loss baseline considerations.
