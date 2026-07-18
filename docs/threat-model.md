# Threat Model

This document outlines practical threats to the Ishkeen platform and mitigations.

| Threat | Attack Scenario | Risk Level | Prevention Strategy | Implementation Phase |
|--------|-----------------|------------|---------------------|----------------------|
| **Credential Stuffing** | Attackers use leaked passwords from other sites to log in. | High | Rate limiting on login endpoints. Argon2id hashing prevents local cracking if DB leaks. | Phase 2 (Auth) / Later (Rate Limits) |
| **Account Enumeration** | Attacker uses reset-password or signup to check if an email exists. | Medium | Generic responses ("If an account exists, an email was sent"). Consistent timing for login failures. | Phase 2 |
| **Session Theft (XSS)** | Malicious script steals JWT from localStorage. | High | Store opaque session IDs in HttpOnly cookies. | Phase 2 |
| **CSRF** | Attacker tricks user into making state-changing requests. | High | SameSite=Lax cookies, strict CORS, custom headers on POST/PUT. | Phase 2 |
| **Insecure Direct Object References (IDOR)** | User increments an image ID (`/images/123` to `124`) to view others' images. | High | 1. Use UUIDs instead of sequential integers. 2. Backend enforces strict `user_id` ownership checks. | Phase 2 (DB Design) |
| **Malicious Image Uploads** | User uploads PHP/JS pretending to be an image. | High | Validate file signatures (magic bytes), not just extensions. Never serve images from executable directories. | Phase 3 (Uploads) |
| **Decompression / Pixel Bombs** | User uploads a massive image to exhaust server RAM during ML analysis. | Medium | Enforce strict file size limits (e.g., 5MB). Use safe image decoding libraries with pixel limits. | Phase 3 |
| **EXIF Privacy Leakage** | Uploaded image contains GPS coordinates. | Medium | Strip all EXIF metadata using a safe library immediately upon upload processing. | Phase 3 |
| **Leaked Secrets** | Developer commits `.env` containing DB passwords. | High | Strictly utilize `.env.example`. Ensure `.gitignore` ignores `.env`. CI/CD secret scanning. | Phase 1 (Completed) |

## Rate Limiting and Abuse Control Design

To mitigate brute force and abuse, rate limiting will be required for:
- Login (e.g., 5 attempts per 5 minutes per IP/User)
- Password Reset Request (e.g., 3 per hour)
- Image Upload (e.g., 10 per day to prevent storage exhaustion)

**Architecture**: 
Initially, rate limiting can be implemented in-process (e.g., a token bucket in FastAPI memory) to keep infrastructure simple. When Ishkeen scales beyond a single backend container instance, this state must be moved to a shared store like **Redis**. Redis will not be installed until that scaling need arises.
