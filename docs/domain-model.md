# Domain and Database Entity Model

## 1. Core Domain Boundaries

### Registered Users
- **Responsibility**: Represents human users of the system.
- **Table**: `users`
- **Ownership**: Root entity.
- **Lifecycle**: Hard deletion when an account is deleted to comply with privacy laws (GDPR/CCPA).
- **Sensitive Fields**: `email`, `hashed_password`. Must not be logged.

### Auth Sessions
- **Responsibility**: Tracks active browser sessions.
- **Table**: `auth_sessions`
- **Ownership**: Belongs to `users`.
- **Lifecycle**: Hard deleted on logout or expiration.

### Skin Profiles
- **Responsibility**: Stores the user's baseline skin characteristics (e.g., skin type, sensitivity).
- **Table**: `skin_profiles`
- **Ownership**: 1:1 with `users`.
- **Lifecycle**: Hard deleted when the user account is deleted.

### Questionnaire Responses
- **Responsibility**: Historical record of answers to onboarding/periodic skin questionnaires.
- **Table**: `questionnaire_submissions`
- **Ownership**: Belongs to `users`.
- **Lifecycle**: Hard deleted with user. Retained historically otherwise.
- **Notes**: Responses are stored as JSONB to allow the questionnaire schema to evolve flexibly without constantly altering table columns.

### Uploaded Images
- **Responsibility**: Manages metadata for uploaded facial images.
- **Table**: `uploaded_images`
- **Ownership**: Belongs to `users`.
- **Lifecycle**: Hard deleted explicitly by the user or upon account deletion. Files must also be removed from the underlying storage abstraction.
- **Sensitive Fields**: `storage_path`, `original_filename`. Images are highly sensitive biometric data.

### Skin Analyses
- **Responsibility**: Represents an event where an image was analyzed by the ML engine.
- **Table**: `skin_analyses`
- **Ownership**: Belongs to `users` and references `uploaded_images`.
- **Lifecycle**: Deleted with user or image.

### Analysis Findings
- **Responsibility**: Structured output from ML predictions (e.g., acne appearance, redness).
- **Table**: `analysis_findings`
- **Ownership**: Belongs to `skin_analyses`.

### Skincare Routines & Steps
- **Responsibility**: Personalized regimens suggested to or created by the user.
- **Table**: `skincare_routines`, `routine_steps`
- **Ownership**: Belongs to `users`.

### Admin Audit Logs
- **Responsibility**: Records sensitive actions performed by administrators.
- **Table**: `admin_audit_logs`
- **Ownership**: Independent (references `users` as actors).
- **Lifecycle**: Immutable. Retained based on organizational retention policies. Never contains passwords, raw image data, or personal secrets.

---

## 2. Initial Database Entity Model Proposal

*Note: Models will use UUIDs for primary keys to prevent enumeration and ID guessing (See ADR-0001).*

### `users`
- **Purpose**: Core identity.
- **Columns**: `id` (UUID), `email` (String, Unique), `hashed_password` (String), `role` (Enum: user, admin), `is_active` (Boolean), `created_at`, `updated_at`.
- **Constraints**: Email must be unique.

### `auth_sessions`
- **Purpose**: Opaque session tracking.
- **Columns**: `id` (UUID), `user_id` (UUID, FK), `expires_at` (DateTime), `created_at`.
- **Indexes**: Indexed on `user_id` for fast invalidation.

### `uploaded_images`
- **Purpose**: Image metadata.
- **Columns**: `id` (UUID), `user_id` (UUID, FK), `storage_key` (String, Unique), `content_type` (String), `created_at`.
- **Deletion**: CASCADE on `user_id`.

### `skin_analyses`
- **Purpose**: Root analysis record.
- **Columns**: `id` (UUID), `user_id` (UUID, FK), `image_id` (UUID, FK), `model_version` (String), `status` (Enum: pending, complete, failed), `created_at`.

### `analysis_findings`
- **Purpose**: Specific visual concerns detected.
- **Columns**: `id` (UUID), `analysis_id` (UUID, FK), `concern_type` (String, e.g., 'redness'), `confidence_score` (Float).
- **Indexes**: Indexed on `analysis_id`.

## 3. API Contract Planning (Route Groups)

- **`/api/auth/*`**: Login, logout, session management, password resets. (Public & Authenticated).
- **`/api/users/*`**: Account management, email updates. (Authenticated, Own resource only).
- **`/api/skin-profile/*`**: Create, read, update skin characteristics. (Authenticated, Own resource only).
- **`/api/images/*`**: Secure upload endpoint, fetching private image URLs. (Authenticated, strict ownership).
- **`/api/analyses/*`**: Trigger ML analysis, fetch history. (Authenticated, Own resource only).
- **`/api/routines/*`**: Manage recommended routines. (Authenticated).
- **`/api/admin/*`**: System health, audit logs, user management. (Strictly Admin Role only).
