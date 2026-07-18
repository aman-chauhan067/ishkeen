# Dataset Versioning & Lineage

## Concept
Every training dataset generated is locked behind a immutable **Dataset Version** (e.g., `v1.0.0`).

## Lineage Traceability
Traceability flows exactly as follows:
`Raw Image -> Processed Image -> Annotation -> Manifest -> Dataset Version -> Training Run`

## Dataset Lockfile
When a release is created, a `dataset_<version>_lock.json` file is produced. It contains:
- Total sample counts and class distribution.
- Git commit hash of the pipeline generator.
- `global_hash` (a SHA-256 fingerprint over all manifests involved).
