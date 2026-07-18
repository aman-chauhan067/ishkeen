# Dataset Quality & Validation

## Ingestion Quality
During ingestion, we enforce:
- Non-corrupt image integrity via PIL.
- Explicit `PrivacyMetadata` (consent, origin).
- Duplicate prevention via SHA-256 fingerprinting.

## Annotation Validation
Before release, the `DatasetValidator` scans for:
- Missing labels despite `ANNOTATED` status.
- Invalid class names not registered in the taxonomy.
- Bounding boxes exceeding image dimensions or possessing zero/negative area.
- Orphan images and Orphan annotations.
