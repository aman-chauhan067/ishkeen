# ADR 0009: First ML Task Selection (Acne Lesion Detection)

## Status
Accepted (Revised from Binary Classification)

## Context
Ishkeen requires a first Machine Learning model for analyzing user-uploaded selfies. Initially, binary image-level classification (Acne vs. Clear) was selected. 

However, a critical review identified that our primary dataset (ACNE04) does not contain a "clear/no-acne" negative class; it exclusively contains patients presenting with acne. Attempting to combine ACNE04 with a distinct clear-skin dataset (e.g., FFHQ) would create severe dataset-source confounding (the model would learn clinical lighting vs. studio lighting, rather than acne vs. clear).

We re-evaluated the following tasks:
1. **Binary Classification**: Rejected due to lack of a legitimate negative class and fatal dataset confounding risks.
2. **ACNE04 Severity Classification (0-3)**: Feasible on ACNE04 alone, but risks pushing the product into making clinical severity claims.
3. **Lesion-Count Regression**: Feasible, but lacks visual interpretability.
4. **Acne Lesion Detection**: Predict bounding boxes for individual lesions using existing ACNE04 dense annotations.

## Decision
We will implement **Acne Lesion Detection** (Object Detection) as the first ML task.

## Rationale
- **Scientifically Defensible**: Lesion detection forces the model to learn localized visual features of acne rather than relying on global image shortcuts (lighting, camera, background).
- **Supports Abstention via Zero Output**: An object detector naturally handles "clear" images by outputting zero bounding boxes with confidence > threshold, avoiding the need for a disjoint negative-class dataset.
- **Explainability**: Bounding boxes are directly interpretable by developers during evaluation, ensuring the model is actually looking at acne.

## Allowed & Prohibited Claims
- **Allowed**: "Visible breakout pattern detected", "No visible breakout pattern detected", "Unable to assess reliably".
- **Prohibited**: "Clear/No Breakouts", "You have Severe Acne", clinical diagnostic wording, or explicitly showing bounding boxes/counts to the user as a medical assessment.

## Consequences
- We will require an object detection architecture (e.g., a lightweight YOLO, SSD, or Faster R-CNN) rather than a simple image classifier.
- The `AnalysisFinding` schema must accommodate bounding box outputs or aggregate detection counts.
- Inference preprocessing must support spatial coordinate transformations if images are resized.
