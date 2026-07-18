import io
import warnings
from typing import BinaryIO
from PIL import Image, ImageOps

# Configure Pillow to protect against decompression bombs. 
# 16_000_000 pixels = e.g. 4000x4000.
Image.MAX_IMAGE_PIXELS = 16_000_000

IMAGE_PREPROCESSING_VERSION = "1.0"

class ImageValidationError(Exception):
    pass

class UnsupportedFormatError(ImageValidationError):
    pass

class ImageTooLargeError(ImageValidationError):
    pass

class DimensionsTooSmallError(ImageValidationError):
    pass

class InvalidImageError(ImageValidationError):
    pass

def _verify_magic_bytes(stream: BinaryIO) -> None:
    """Read the first few bytes to explicitly check signatures."""
    stream.seek(0)
    header = stream.read(32)
    stream.seek(0)

    is_jpeg = header.startswith(b"\xff\xd8\xff")
    is_png = header.startswith(b"\x89PNG\r\n\x1a\n")
    is_webp = header.startswith(b"RIFF") and b"WEBP" in header

    if not (is_jpeg or is_png or is_webp):
        raise UnsupportedFormatError("Unsupported image format. Allowed: JPEG, PNG, WebP.")

def sanitize_and_normalize(stream: BinaryIO) -> bytes:
    """
    Validates, decodes, standardizes, and re-encodes an image safely.
    Raises subclasses of ImageValidationError on failure.

    The caller is responsible for closing the input stream.
    This function always closes the Pillow Image object before returning.
    """
    _verify_magic_bytes(stream)

    img = None
    try:
        # Convert DecompressionBombWarning into an error so we strictly reject
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            try:
                img = Image.open(stream)
                # Force decode to ensure file isn't truncated/corrupted
                img.load()
            except Image.DecompressionBombWarning:
                raise ImageTooLargeError("Image pixel count approaches maximum allowed bounds")
            except Image.DecompressionBombError:
                raise ImageTooLargeError("Image pixel count exceeds maximum allowed bounds")
            except (ImageTooLargeError, UnsupportedFormatError, DimensionsTooSmallError, InvalidImageError):
                raise
            except Exception as e:
                raise InvalidImageError(f"Structurally invalid or corrupted image: {e}")

        # Ensure format matches allowed
        if img.format not in ("JPEG", "PNG", "WEBP"):
            raise UnsupportedFormatError(f"Unsupported decoded format: {img.format}")

        # Apply EXIF orientation — create a new image object; close old one below
        try:
            oriented = ImageOps.exif_transpose(img)
        except Exception:
            oriented = img  # If transpose fails, proceed with original

        # Close the original decoded image only if exif_transpose produced a new one
        if oriented is not img:
            img.close()
        img = oriented

        width, height = img.size
        if width < 500 or height < 500:
            raise DimensionsTooSmallError(
                f"Image dimensions too small ({width}x{height}). Minimum is 500x500."
            )

        # Resize if longest edge > 2000px
        max_edge = 2000
        if width > max_edge or height > max_edge:
            ratio = max_edge / max(width, height)
            new_size = (int(width * ratio), int(height * ratio))
            resized = img.resize(new_size, Image.Resampling.LANCZOS)
            img.close()
            img = resized

        # Normalize color mode to RGB (strips Alpha/Palette)
        # ICC colour profiles are dropped — documented limitation for MVP.
        if img.mode != "RGB":
            converted = img.convert("RGB")
            img.close()
            img = converted

        # Encode to new JPEG buffer, dropping all metadata (no exif kwarg)
        output_stream = io.BytesIO()
        img.save(output_stream, format="JPEG", quality=85)
        return output_stream.getvalue()

    finally:
        # Always close the last Pillow image object to release any underlying
        # file handle.  Safe to call even if img is None (exception during open).
        if img is not None:
            img.close()
