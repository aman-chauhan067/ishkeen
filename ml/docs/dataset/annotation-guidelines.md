# Annotation Guidelines

## Lifecycle Workflow

1. **UNANNOTATED**: Initial state upon ingestion.
2. **IN_PROGRESS**: Annotator has checked out the image.
3. **ANNOTATED**: Annotator has submitted labels.
4. **REVIEW_REQUIRED**: Triggered automatically or via sampling for QA.
5. **APPROVED**: Reviewer approved labels. Ready for Dataset Generation.
6. **REJECTED**: Reviewer found issues; `review_notes` are provided to the annotator.

## Principles
- Always bound lesions as tightly as possible.
- If unsure, use the `confidence` flag.
- Never assume absence unless the skin is clearly visible and in-focus.
