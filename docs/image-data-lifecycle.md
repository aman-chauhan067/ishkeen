# Image Data Lifecycle & Privacy Policy

Facial images are highly sensitive personal biometric data. Ishkeen operates on a strict Privacy-by-Design principle.

## 1. Image Retrieval Policy
The normalized facial image is private.
- **No Public Static Mount**: Images are NEVER served from a public `/static/` URL.
- **Ownership Check**: Retrieval goes through `GET /api/analyses/{id}/image`. The authenticated session (`current_user.id`) MUST match the `user_id` of the requested `SkinAnalysis`.
- **No Client Paths**: The API does not accept direct storage keys or paths from the client.
- **Headers**: Responses include strict `Cache-Control: private, no-store` headers and proper `Content-Type: image/jpeg`.

## 2. Model Training Consent
- **MVP Default Policy**: User images are **NOT** used for ML model training.
- Future usage requires explicit double-opt-in consent.

## 3. Storage Deletion Semantics
- **Account Deletion**: Deleting a user triggers a database `ON DELETE CASCADE` which removes the `SkinAnalysis`.
- **Physical Reconciliation**: Deleting the database row does not natively delete the file. The MVP architecture mandates a service-layer deletion transaction that manually calls `storage.delete(key)`.
- **Orphan Reconciliation (Future)**: If physical deletion fails (e.g., storage network timeout), the orphaned file remains on disk. A future async cron job will reconcile the filesystem against the database and clean up objects lacking a database reference. MVP focuses on synchronous best-effort deletion logging.
