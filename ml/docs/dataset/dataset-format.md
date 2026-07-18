# Dataset Format Specification

## Subject-Centric Organization

The processed dataset is organized by subject and session to support longitudinal tracking:

```text
dataset/processed/images/
└── <subject_id>/
    └── <session_id>/
        ├── <image_id_1>.jpg
        └── <image_id_2>.jpg
```

## Annotation Format
The `AnnotationRecord` serves as a future-proof, multi-task schema containing:
- **Binary/Multiclass Classification**
- **Multilabel Classification**
- **Bounding Boxes** (with confidence)
- **Segmentation** (Polygons and RLE Masks)
- **Severity Grading**

Every record maintains its lifecycle status (e.g. `UNANNOTATED`, `IN_PROGRESS`, `ANNOTATED`, `REVIEW_REQUIRED`, `APPROVED`, `REJECTED`) and full audit trailing (`annotator_id`, `reviewer_id`, timestamps, and version).
