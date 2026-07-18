# Authentication and Authorization Architecture

## 1. Session Architecture Decision

Ishkeen is a first-party, browser-based React application communicating with a FastAPI monolith.

**Decision**: We will use **Opaque Server-Side Session Identifiers stored in secure HttpOnly cookies**.

- **Why Not LocalStorage + JWT?**: LocalStorage is accessible via JavaScript, making JWTs extremely vulnerable to Cross-Site Scripting (XSS).
- **Why Opaque Sessions?**: Opaque tokens (UUIDs or secure random strings) are stored in the database (`auth_sessions` table). This allows immediate, definitive server-side session revocation. The token itself carries no data; it is just a lookup key.
- **Cookie Properties**: 
  - `HttpOnly`: True (prevents XSS reading).
  - `Secure`: True (HTTPS only in production).
  - `SameSite`: Lax (or Strict, depending on final UX flow) to mitigate Cross-Site Request Forgery (CSRF).
  - `Max-Age`: Set explicitly to enforce absolute timeouts.
- **Logout Behavior**: The frontend hits `POST /api/auth/logout`. The backend deletes the session from the `auth_sessions` table and instructs the browser to clear the cookie.
- **Logout-All-Devices**: The backend can simply delete all rows in `auth_sessions` where `user_id = X`.

### CSRF Protection Strategy
Since we use cookies, CSRF is a risk. `SameSite=Lax` provides strong baseline defense. Additionally, FastAPI will enforce CORS strictly, and state-changing requests (POST/PUT/DELETE) will require a custom header (e.g., `X-Requested-With: XMLHttpRequest`) which cannot be set by simple cross-origin HTML forms.

## 2. Password Security Design

- **Hashing Algorithm**: Argon2id. It provides excellent resistance against both GPU-cracking and side-channel attacks.
- **Minimum Policy**: 12 characters minimum.
- **Maximum Policy**: 128 characters maximum (to prevent bcrypt/Argon2 DoS attacks via extremely long inputs).
- **Timing Attacks**: Password comparison and user-lookup times must be normalized to prevent user enumeration. Generic error messages ("Invalid email or password") must always be used.
- **Rehashing**: If Argon2id work factors are increased in the future, passwords will be rehashed silently during a successful login.

## 3. Email Verification and Account Recovery

- **Abstraction**: An `EmailService` interface will be used. During early development, this will use a `ConsoleEmailAdapter` to simply print verification links to the terminal.
- **Tokens**: Password reset and email verification tokens will be 32-byte secure random strings.
- **Storage**: Tokens will be stored in the database **hashed** (using SHA256). This prevents database leaks from immediately compromising active reset links.
- **Expiry**: Password reset tokens expire in 15 minutes.
- **Invalidation**: Tokens are strictly single-use. Furthermore, changing a password will immediately invalidate all active sessions.

## 4. Authorization and Admin Security Model

- **Backend Enforcement**: The frontend hiding UI elements is merely UX, not security. All authorization is strictly enforced by FastAPI dependencies.
- **Roles**: Enforced via a `role` enum on the `users` table (`user` or `admin`).
- **Ownership Checks**: Endpoints accessing resources (e.g., `/api/images/{id}`) will verify that `resource.user_id == current_user.id`.
- **Admin Boundaries**: Routes under `/api/admin/*` require an `is_admin` FastAPI dependency. 
- **Audit Logs**: Sensitive admin actions (e.g., deleting a user manually) will write to `admin_audit_logs`. The log will record the `admin_id`, `action`, `target_id`, and `timestamp`. Passwords or raw personal data are NEVER written to audit logs.
