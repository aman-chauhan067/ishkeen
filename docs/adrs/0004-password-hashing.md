# ADR 0004: Password Hashing

## Context
We must securely hash user passwords before storing them in the database to mitigate damage in the event of a data breach.

## Decision
We will use **Argon2id**.

## Alternatives Considered
- **bcrypt**: 
  - *Pros*: Industry standard for a decade, very well supported.
  - *Cons*: Only compute-hard, making it increasingly vulnerable to custom ASIC or GPU cracking clusters.
- **Argon2id**:
  - *Pros*: Winner of the Password Hashing Competition. It is both compute-hard and memory-hard, making it highly resistant to GPU and ASIC cracking. The 'id' variant protects against side-channel timing attacks.

## Consequences
- We will configure Argon2id with safe default work factors (time, memory, parallelism).
- Passwords will be inherently protected against modern hardware cracking.
- We will enforce a maximum password length (e.g., 128 characters) at the API boundary to prevent CPU-exhaustion Denial of Service attacks caused by hashing gigabytes of input.
