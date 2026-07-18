# ADR 0012: ROI / Face Crop Strategy (Deferred)

## Status
Revised (Deferred)

## Context
We initially proposed a face bounding-box crop as an ML preprocessing step to mitigate the domain shift between smartphone selfies and clinical training data (like ACNE04). 

However, a re-evaluation highlighted several risks:
1. **Geometric Inconsistency**: ACNE04 images are often tight crops of specific facial regions (cheeks, forehead) rather than full aligned faces. A standard face detector (like MediaPipe) crops the full face (often excluding the neck and jawline), which may not geometrically align with the dataset's framing.
2. **Lesion Exclusion**: A strict face bounding box may clip severe acne occurring on the jawline, neck, or hairline, resulting in false negatives.
3. **Premature Complexity**: Introducing a face detection dependency adds failure modes (0 faces, false positives) before establishing if a naive full-image baseline can learn robustly.

## Decision
We will **defer** implementing face detection and ROI cropping. The first Phase 5B baseline model will be trained and evaluated on **full normalized images** (resized with aspect ratio preserved).

## Rationale
- **Simplicity**: A naive baseline establishes a floor for performance without introducing compound pipeline errors.
- **Object Detection Synergy**: Since we revised our task to Lesion Detection (ADR 0009), the model inherently learns localized spatial features. It may be less sensitive to background/domain shifts than a global image classifier, potentially rendering face cropping unnecessary.

## Consequences
- We will not install MediaPipe, OpenCV, or face detection models during the initial Phase 5B baseline.
- If the baseline severely struggles with background false positives during validation, we will revisit face cropping via an ablation experiment.
