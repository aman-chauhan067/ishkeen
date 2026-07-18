# ADR 0001: Primary Key Strategy

## Context
We need to decide the primary key strategy for all database tables in Ishkeen (Users, Analyses, Images, etc.). Options generally include auto-incrementing integers or UUIDs (v4 or v7). 

## Decision
We will use **UUID (v4)** for all primary keys exposed to the application. 

## Alternatives Considered
- **Auto-incrementing Integers**: 
  - *Pros*: Extremely efficient indexing, small storage size, native to SQL. 
  - *Cons*: Exposes business metrics (competitors can see user count by ID). Highly susceptible to Insecure Direct Object Reference (IDOR) or enumeration attacks (guessing `/images/123`).
- **UUIDs**:
  - *Pros*: Completely opaque, impossible to guess, prevents enumeration, naturally supports distributed generation if needed.
  - *Cons*: Larger storage size (16 bytes vs 4/8 bytes), slight indexing penalty.

## Consequences
- The risk of an attacker successfully guessing the ID of another user's facial image or skin profile is effectively zero.
- We accept the minor performance and storage penalty of UUIDs, which is negligible for our expected initial scale.
