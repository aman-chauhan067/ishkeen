# Dataset Recovery Research

## 1. Candidate 1: Acne Dataset in YOLOv8 Format
- **Original Creator**: Osman Y. Kagan ("osmanykagan")
- **Primary Source**: Kaggle (https://www.kaggle.com/datasets/osmanykagan/acne-dataset-in-yolov8-format)
- **Associated Paper**: None.
- **Task Type**: Object Detection.
- **Image Count**: 927 images.
- **Annotation Type**: YOLO format bounding boxes.
- **Localization Suitability**: Yes, contains bounding boxes.
- **License Evidence**: Apache 2.0 (as labeled on Kaggle).
- **Commercial-use Classification**: **Unclear / Provenance Risk**. Although labeled Apache 2.0, this is a community upload of web-scraped faces. The uploader likely does not own the copyright to the underlying images.
- **Redistribution Rights**: Claimed as fully allowed, but legally dubious.
- **Modification Rights**: Claimed as fully allowed.
- **Attribution Requirements**: Standard Apache 2.0 attribution.
- **Provenance Risks**: **EXTREME**. Web scraped without subject consent. High risk of DMCA or privacy violation.
- **Selfie-Domain Suitability**: High (composed mostly of consumer selfies).
- **Recommendation**: **REJECT**. Third-party hosting labels are not authoritative, and provenance is unclear.

## 2. Candidate 2: Acne Computer Vision Dataset
- **Original Creator**: Kritsakorn
- **Primary Source**: Roboflow Universe
- **Associated Paper**: None.
- **Task Type**: Object Detection.
- **Image Count**: 929 images.
- **Annotation Type**: Multi-class bounding boxes.
- **Localization Suitability**: Yes.
- **License Evidence**: CC BY 4.0 (as labeled on Roboflow).
- **Commercial-use Classification**: **Unclear / Provenance Risk**. Same issue as Kaggle.
- **Redistribution Rights**: Claimed as allowed with attribution.
- **Modification Rights**: Claimed as allowed.
- **Attribution Requirements**: CC BY 4.0 attribution.
- **Provenance Risks**: **EXTREME**. Unconsented web scraped images.
- **Selfie-Domain Suitability**: High.
- **Recommendation**: **REJECT**.

## Institutional Repositories Conclusion
Official clinical challenges (ISIC) and institutional repositories (Zenodo, Figshare) yield **no explicitly commercially-usable acne localization datasets**. Authoritative datasets like ACNE04 are strictly non-commercial. 

## Final Three-Path Decision
1. **PATH A (Written Permission for ACNE04)**: Best legal clarity if granted. Low engineering effort. High portfolio value.
2. **PATH B (Alternative clearly licensed dataset)**: None exist. Path dead.
3. **PATH C (Original consented dataset)**: Ultimate legal clarity. Extremely high annotation and engineering effort. Lowest initial scale.

**Primary Recommended Path**: PATH A (Attempt written permission).
**Fallback Path**: PATH C (Original consented dataset / feature flag ML disabled).
