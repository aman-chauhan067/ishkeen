# Privacy and Data Lifecycle

Facial images and skin profiles are highly sensitive personal and biometric data. Ishkeen operates on a principle of privacy-by-design.

## 1. Image Lifecycle

1. **Upload & Validation**: Images are uploaded directly via authenticated endpoints. Files are validated using magic bytes (not just extensions) to ensure they are standard image formats (JPEG, PNG).
2. **Metadata Stripping**: Upon receipt, ALL EXIF data (including GPS coordinates, device information, and timestamps) must be stripped from the image before it touches persistent storage.
3. **Storage**: Images are stored in an abstracted object store. They are **never** placed in a publicly accessible static web directory. 
4. **Retrieval**: The frontend requests images via an authenticated backend proxy endpoint or temporary signed URLs. Authorization (ownership) is strictly checked before bytes are served.
5. **Retention & Deletion**: Original images are retained to allow users to track progress and compare analyses over time. 
   - Users can explicitly delete an image at any time. This triggers a hard delete from the storage abstraction and database.
   - If an account is deleted, a background cascade deletes all associated images.

## 2. Temporary Processing Files

During ML analysis (e.g., if OpenCV requires writing to disk temporarily), files must be written to restricted, ephemeral `/tmp` directories, and immediately deleted in a `finally` block regardless of analysis success or failure.

## 3. Account Deletion

When a user requests account deletion, a **Hard Deletion** policy is enforced for personal data:
- `users` record is deleted.
- `auth_sessions` are deleted.
- `uploaded_images` records and physical files are deleted.
- `skin_profiles` are deleted.

**Analytics**: If aggregate analytics are required for ML model performance tracking, analysis results (`analysis_findings`) may be retained *only* if they are fully anonymized and decoupled from the user ID before deletion.
