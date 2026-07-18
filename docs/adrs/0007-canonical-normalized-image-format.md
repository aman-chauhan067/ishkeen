# 7. Canonical Normalized Image Retention

Date: 2026-07-10

## Status
Accepted

## Context
When users upload photos, they include various metadata (EXIF/GPS), color profiles, arbitrary formats (HEIC/PNG/WebP), and massive dimensions. Storing both the original and a processed copy increases storage overhead, and retaining the original preserves sensitive metadata.

## Decision
Ishkeen will immediately strip EXIF metadata, normalize color/dimensions, and encode the buffer into a canonical **JPEG (Quality 85, sRGB)** image. Only this normalized copy will be persisted to storage. The original raw upload bytes will be discarded.

## Consequences
- **Positive:** Enforces a strong privacy boundary by guarantees no EXIF data touches disk. Reduces storage footprint drastically. The ML pipeline gets a predictable image contract.
- **Negative:** We cannot re-process historical images with higher resolution or a different decoder if the original normalization was poor.
- **Mitigation:** Safe sizing constraints (e.g. 2000px longest edge) ensure the normalized copy remains high enough quality for any future dermatological ML model tasks.
