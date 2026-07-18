# Image Pipeline Architecture

This document describes the image capture, upload, validation, and preprocessing pipeline for Ishkeen Phase 4.

## 1. Scope & Input Strategy
- **MVP Strategy**: A single frontal face image per analysis. Multiple images (profile views) are deferred to avoid complex stitching and UI friction.
- **Upload Formats Accepted**: `JPEG`, `PNG`, `WebP`.
  - *Note*: HEIC/HEIF is rejected at the frontend boundary to avoid heavy server-side C-library dependencies (e.g., `libheif`).

## 2. Canonical Normalized Output Format
- **Format**: `JPEG`.
- **Quality Setting**: 85 (preserves photographic detail while reducing file size).
- **Color Profile**: Normalized to `sRGB`. ICC profiles are not retained; the image is explicitly converted to standard RGB space.
- **Metadata**: All EXIF data (including GPS) is aggressively stripped during re-encoding.
- **Storage Keys**: All normalized keys will strictly use a `.jpg` extension (e.g., `{uuid4}.jpg`).

## 3. Preprocessing Order
1. **Bounded Stream Ingestion**: FastAPI reads the upload in chunks. If the accumulated chunk size exceeds 10 MB, reading halts immediately, resources are closed, and an HTTP `413 Payload Too Large` is returned.
2. **Format Signature Detection**: Read the first few bytes (magic bytes) to verify it is genuinely a JPEG, PNG, or WebP. Reject if invalid (HTTP `415 Unsupported Media Type`).
3. **Decompression Bomb Protection**: Configure Pillow's `Image.MAX_IMAGE_PIXELS` to a safe threshold (e.g., 4000x4000 = 16MP) before full decode.
4. **Safe Decode**: Decode the image using Pillow. Catch and handle `UnidentifiedImageError` (HTTP `422 Unprocessable Entity`).
5. **EXIF Orientation Application**: Read EXIF orientation tags and physically rotate the image matrix so 'up' is correctly represented, ensuring dimensions map accurately.
6. **Dimension Validation**: Validate dimensions *after* orientation. Reject if width/height < 500px (HTTP `422`).
7. **Resizing Policy**: Downscale proportionally if the longest edge exceeds 2000px using high-quality resampling (Lanczos).
8. **Color Mode Normalization**: Convert the image to `RGB` (drops alpha channels from PNGs).
9. **Metadata-Free Re-encoding**: Save the buffer as a new JPEG (Quality 85).
10. **Persistence**: Write the sanitized buffer to the storage abstraction.

## 4. Quality Check Matrix
These checks are executed during ML preprocessing (after normalization) to determine analysis readiness.

### HARD REJECT (Blocks Analysis)
- Unsupported or invalid image (handled at upload).
- Oversized upload (handled at upload).
- Dimensions below minimum (handled at upload).
- **No face detected**.
- **Multiple faces detected** (Ishkeen requires exactly one usable face to ensure the correct user is analyzed; we do not silently guess the 'primary' face).
- Face bounding box too small relative to frame.
- Severe decode failure.

### SOFT WARNING (Proceeds with Warning)
- Moderate blur (detected via Laplacian variance heuristic; threshold configurable).
- Poor brightness/underexposure.

### DEFERRED
- Makeup detection, beauty-filter detection, reliable occlusion detection, colored-lighting detection.

## 5. Face Detection Strategy
- **Direction**: **MediaPipe Face Detection (CPU)**.
- **Fallback**: OpenCV DNN module.
- **Reasoning**: MediaPipe is extremely lightweight, fast on CPU, and resilient to orientation variance. It provides accurate bounding boxes without requiring massive PyTorch/TensorFlow deep learning dependencies like RetinaFace.

## 6. Storage Atomicity and Compensation
The filesystem and PostgreSQL are not intrinsically transactional. The Phase 4B operation order is:
1. Validate, normalize, and encode image to an in-memory buffer.
2. Save buffer to the filesystem at a temporary/staging key (e.g., `tmp_{uuid}.jpg`).
3. Open DB Transaction, create `SkinAnalysis` record pointing to the final `{uuid}.jpg`.
4. Commit DB Transaction.
5. If DB commit succeeds: Rename `tmp_{uuid}.jpg` to `{uuid}.jpg`.
6. If DB commit fails: Rollback DB, `os.remove(tmp_{uuid}.jpg)`.
7. **Orphan Reconciliation**: A future background job will scrub `tmp_*.jpg` files older than 24 hours.
