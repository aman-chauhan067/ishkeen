# ADR 0003: Authentication Architecture

## Context
We need to design how user authentication sessions are maintained for Ishkeen, which is a browser-based, first-party monolithic React application communicating with a FastAPI backend.

## Decision
We will use **Opaque Server-Side Session Identifiers stored in secure HttpOnly cookies**.

## Alternatives Considered
- **Access JWT stored in browser localStorage**:
  - *Cons*: Critically vulnerable to Cross-Site Scripting (XSS). If any malicious JS executes, the token can be stolen indefinitely. Explicitly rejected due to insecurity.
- **JWTs in HttpOnly Cookies**:
  - *Pros*: Immune to simple XSS read access. Stateless (no DB lookup).
  - *Cons*: Immediate session revocation is difficult (requires blacklists). Logout relies on the browser deleting the cookie; a stolen cookie remains valid until expiry.
- **Opaque Sessions in HttpOnly Cookies**:
  - *Pros*: Immune to XSS read access. The server maintains the session in the database. Revocation is instantaneous (delete the row). Best security for a monolith.
  - *Cons*: Requires a database lookup on every authenticated request.

## Consequences
- We gain maximum security and absolute control over session lifetimes.
- We must ensure database lookups for the `auth_sessions` table are indexed and fast.
- Future mobile clients will need adaptation (e.g., passing the session token via a secure header instead of a cookie), which is fully compatible with opaque tokens.
