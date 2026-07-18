import os
import uuid
import hashlib
from datetime import datetime, timezone
from typing import Optional, List, Dict
from pydantic import BaseModel
from PIL import Image, UnidentifiedImageError

class PrivacyMetadata(BaseModel):
    consent_status: str
    consent_version: str
    collection_source: str
    capture_device: str
    country: str

class ImageMetadata(BaseModel):
    width: int
    height: int
    aspect_ratio: float
    format: str
    sha256: str
    file_size_bytes: int
    capture_timestamp: Optional[str] = None
    orientation: Optional[int] = None

class IngestionReport(BaseModel):
    original_filename: str
    status: str # "SUCCESS" or "FAILED"
    reason: Optional[str] = None
    subject_id: Optional[str] = None
    session_id: Optional[str] = None
    image_id: Optional[str] = None
    privacy_metadata: Optional[PrivacyMetadata] = None
    image_metadata: Optional[ImageMetadata] = None

class IngestionPipeline:
    def __init__(self, raw_dir: str, processed_dir: str):
        self.raw_dir = raw_dir
        self.processed_dir = processed_dir
        os.makedirs(self.processed_dir, exist_ok=True)

    def _compute_sha256(self, filepath: str) -> str:
        sha256_hash = hashlib.sha256()
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    def process_image(
        self, 
        source_filepath: str, 
        subject_id: str, 
        session_id: str, 
        privacy_meta: PrivacyMetadata
    ) -> IngestionReport:
        """
        Validates, extracts metadata, assigns IDs, and safely copies the image into the processed hierarchy.
        """
        original_filename = os.path.basename(source_filepath)
        
        if not os.path.exists(source_filepath):
            return IngestionReport(
                original_filename=original_filename, 
                status="FAILED", 
                reason="File does not exist."
            )
            
        try:
            # Verify integrity & extract metadata
            file_size = os.path.getsize(source_filepath)
            sha256 = self._compute_sha256(source_filepath)
            
            with Image.open(source_filepath) as img:
                img.verify() # verify integrity without decoding entirely
                
            # Re-open to get properties safely
            with Image.open(source_filepath) as img:
                width, height = img.size
                img_format = img.format or "UNKNOWN"
                # Exif parsing for orientation/timestamp could go here
                exif = img.getexif()
                orientation = exif.get(0x0112) if exif else None
                
            image_meta = ImageMetadata(
                width=width,
                height=height,
                aspect_ratio=float(width) / float(height) if height > 0 else 0.0,
                format=img_format,
                sha256=sha256,
                file_size_bytes=file_size,
                capture_timestamp=datetime.now(timezone.utc).isoformat(), # Mock fallback
                orientation=orientation
            )
            
            # Generate Internal IDs
            image_id = str(uuid.uuid4())
            
            # Build Subject-Centric Directory
            target_dir = os.path.join(self.processed_dir, subject_id, session_id)
            os.makedirs(target_dir, exist_ok=True)
            
            # Save using Internal ID
            # e.g. dataset/processed/images/SUBJ1/SESS1/uuid.jpg
            ext = os.path.splitext(original_filename)[1].lower()
            if not ext:
                ext = ".jpg"
            target_filename = f"{image_id}{ext}"
            target_filepath = os.path.join(target_dir, target_filename)
            
            # Perform actual copy
            with open(source_filepath, 'rb') as src, open(target_filepath, 'wb') as dst:
                dst.write(src.read())
                
            return IngestionReport(
                original_filename=original_filename,
                status="SUCCESS",
                subject_id=subject_id,
                session_id=session_id,
                image_id=image_id,
                privacy_metadata=privacy_meta,
                image_metadata=image_meta
            )
            
        except UnidentifiedImageError:
            return IngestionReport(
                original_filename=original_filename, 
                status="FAILED", 
                reason="Corrupt or unidentified image format."
            )
        except Exception as e:
            return IngestionReport(
                original_filename=original_filename, 
                status="FAILED", 
                reason=f"Unexpected error: {str(e)}"
            )
