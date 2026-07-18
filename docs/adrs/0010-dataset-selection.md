# ADR 0010: First ML Dataset Selection

## Status
Accepted with Conditions

## Context
We need a dataset to train the MVP acne detection model (binary classification).

Researched Candidates:
1. **ACNE04**: ~1,457 images with bounding boxes/severity. Academic Non-Commercial license. East Asian demographic bias.
2. **Fitzpatrick17k**: 16.5k images with FST labels. CC BY-NC-SA 3.0 (Non-Commercial). Skewed to lighter skin. Extreme domain shift (clinical closeups).
3. **DermNet Scrapes (Kaggle)**: Unofficial. **LICENSE UNCLEAR — DO NOT USE**.

## Decision
We will use **ACNE04** strictly for internal non-commercial R&D, prototype validation, and portfolio demonstration. 

## Rationale
- It is the most robust public dataset specific to acne.
- It contains bounding boxes, allowing us to derive binary labels accurately and potentially crop lesions.
- We must explicitly accept the Non-Commercial restriction for this Phase. 

## Conditions & Consequences
- **Legal**: We cannot use models trained on ACNE04 for a monetized production release without negotiating a commercial license or swapping to a proprietary dataset.
- **Bias Mitigation**: We must be aware of the East Asian demographic bias and lack of darker skin tones. Fairness evaluation will be limited unless augmented with other data.
- **Domain Shift**: ACNE04 images are largely clinical-like. We will rely heavily on spatial/color augmentations and our Face Crop Strategy (ADR 0012) to bridge the gap to smartphone selfies.
