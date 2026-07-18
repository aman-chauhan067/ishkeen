import io
import pytest
from PIL import Image
from app.services.image_pipeline import (
    sanitize_and_normalize, 
    UnsupportedFormatError, 
    ImageTooLargeError, 
    DimensionsTooSmallError, 
    InvalidImageError
)

def _create_valid_image(fmt="JPEG", size=(600, 600)) -> io.BytesIO:
    img = Image.new("RGB", size, color="red")
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    buf.seek(0)
    return buf

def test_valid_jpeg():
    buf = _create_valid_image("JPEG")
    out = sanitize_and_normalize(buf)
    
    out_buf = io.BytesIO(out)
    img = Image.open(out_buf)
    assert img.format == "JPEG"
    assert img.size == (600, 600)

def test_valid_png_converted_to_jpeg():
    buf = _create_valid_image("PNG")
    out = sanitize_and_normalize(buf)
    
    out_buf = io.BytesIO(out)
    img = Image.open(out_buf)
    assert img.format == "JPEG"

def test_invalid_magic_bytes():
    buf = io.BytesIO(b"GIF89a...")
    with pytest.raises(UnsupportedFormatError):
        sanitize_and_normalize(buf)

def test_dimensions_too_small():
    buf = _create_valid_image("JPEG", size=(300, 300))
    with pytest.raises(DimensionsTooSmallError):
        sanitize_and_normalize(buf)

def test_resize_large_image():
    # Long edge > 2000 gets resized
    buf = _create_valid_image("JPEG", size=(2500, 1000))
    out = sanitize_and_normalize(buf)
    img = Image.open(io.BytesIO(out))
    
    assert img.size[0] == 2000
    assert img.size[1] == 800

def test_corrupted_image():
    buf = io.BytesIO(b"\xff\xd8\xff\x00\x00\x00corrupted")
    with pytest.raises(InvalidImageError):
        sanitize_and_normalize(buf)

def test_decompression_bomb(monkeypatch):
    # Simulate DecompressionBombWarning/Error by lowering limit for test
    import app.services.image_pipeline
    monkeypatch.setattr(app.services.image_pipeline.Image, "MAX_IMAGE_PIXELS", 1000)
    
    # 600x600 = 360,000 pixels > 1,000
    buf = _create_valid_image("JPEG", size=(600, 600))
    with pytest.raises(ImageTooLargeError):
        sanitize_and_normalize(buf)
