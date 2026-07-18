# ADR 0005: Image Retention Policy

## Context
Ishkeen analyzes highly sensitive facial images. We must determine how long to store the original images after analysis completes.

## Decision
Images will be **retained by default** in private storage to support long-term user progress tracking, but will be subject to strict user-controlled deletion capabilities.

## Alternatives Considered
- **Ephemeral Storage (Delete Immediately)**:
  - *Pros*: Maximum privacy. Virtually zero data liability.
  - *Cons*: Destroys a core product value proposition: showing users their skin progress over time (e.g., "before" and "after" a routine).
- **Default Retention**:
  - *Pros*: Enables progress tracking and historical review.
  - *Cons*: Increases privacy liability and storage costs.

## Consequences
- We accept the privacy liability of storing facial images to deliver the core product experience.
- To mitigate this, ALL EXIF data will be stripped upon upload.
- Images will NEVER be publicly accessible.
- We will build an explicit "Delete Image" feature, and account deletion will enforce a hard cascade deletion of all associated images to comply with privacy expectations.
