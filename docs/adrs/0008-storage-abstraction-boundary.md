# 8. Storage Abstraction Boundary

Date: 2026-07-10

## Status
Accepted

## Context
For Phase 4 development, uploading images to the local filesystem is required. However, saving images to direct static paths (`app/static/images`) couples the backend tightly to local disk state, violates privacy by exposing endpoints, and breaks production deployment scalability (e.g. Docker, Heroku, AWS S3).

## Decision
We will define an `ImageStorage` abstraction interface in the application service layer. 
For local development, we implement `LocalStorageService` which writes to a gitignored volume (`backend/private_uploads`).
Database tables (`SkinAnalysis`) will strictly store opaque object keys (e.g., `{uuid}.jpg`), never absolute filesystem paths.

## Consequences
- **Positive:** The API and ML layers are completely decoupled from filesystem specifics. We can swap `LocalStorageService` for `S3StorageService` in production without altering the database schema or API endpoints.
- **Negative:** Adds a slight layer of boilerplate to the upload/retrieval endpoints. Local development requires volume mounting for data persistence.
