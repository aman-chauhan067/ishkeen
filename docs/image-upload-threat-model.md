# Image Upload Threat Model

## 1. Upload Byte Limit Enforcement
- **Limit Strategy**: 10 MB limit enforced via chunked reading on the FastAPI upload stream.
- **Implementation**: We do not trust `Content-Length`. We do not load arbitrarily large files into memory. As chunks are read into a `SpooledTemporaryFile` or memory buffer, an accumulator tracks bytes. If `bytes_read > 10MB`, the stream is forcefully closed, temporary resources are cleared, and HTTP `413 Payload Too Large` is returned.

## 2. Format & MIME Spoofing
- **MIME Validation**: Browser-provided `Content-Type` headers are ignored for trust.
- **Signature Detection**: The first few bytes (magic bytes) of the file are checked against known signatures for JPEG, PNG, and WebP.
- **Extension Spoofing**: User-provided filenames and extensions are entirely discarded. The output is always securely saved as `{uuid}.jpg`.

## 3. Decompression Bombs & Image Integrity
- **Protection**: Before decoding the image, Pillow's `Image.MAX_IMAGE_PIXELS` is strictly configured to a ceiling of 16,000,000 pixels (~4000x4000).
- **Decoder Errors**: Any `UnidentifiedImageError` or buffer truncation raises a handled 422 error, preventing malformed image bytes from passing downstream.

## 4. Metadata & EXIF Stripping
- **Risk**: EXIF data contains highly sensitive GPS coordinates, device identifiers, and timestamp leakage.
- **Mitigation**: The normalized image pipeline extracts orientation, rotates the image buffer, and explicitly encodes a brand-new JPEG, omitting the `exif` header entirely. The original file is never saved to disk.

## 5. Storage Security & Path Traversal
- **Filenames**: Original filenames are discarded. The system generates its own `uuid4()` key for storage. Path traversal via malicious filenames (e.g., `../../../etc/passwd`) is impossible.
- **Access Control**: Images are never mounted to a public static route.

## 6. Rate Limiting and Abuse Boundary
- **Current Constraints**: Authenticated upload requirement (no guest uploads).
- **Future MVP Bounds**: 
  - Per-user rate limiting (e.g., 5 analyses per hour) to prevent storage exhaustion and compute abuse.
  - Concurrent processing limit (rejecting new requests if the ML service is saturated).
