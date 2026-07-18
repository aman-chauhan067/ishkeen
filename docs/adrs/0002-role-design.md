# ADR 0002: Role Design

## Context
Ishkeen requires authorization distinctions between standard users and system administrators. We need to decide how to represent roles in the database.

## Decision
We will use a **constrained role enum field** directly on the `users` table (`role: Enum(user, admin)`).

## Alternatives Considered
- **Roles Table & Many-to-Many Mapping**:
  - *Pros*: Highly flexible for complex RBAC (Role-Based Access Control) systems. Easy to add arbitrary new roles dynamically.
  - *Cons*: Requires an extra table, join queries on every auth check, and significantly increases complexity for a system that currently only has two known states.
- **Role Enum on User Model**:
  - *Pros*: Extremely simple, fast, zero joins, clearly models the current binary requirement.

## Consequences
- We prioritize simplicity. Authorization boundaries can be easily checked via `if user.role == 'admin'`.
- If a future enterprise requirement demands complex dynamic permissions, a migration to a full RBAC system will require a schema change. We accept this trade-off to avoid premature complexity.
