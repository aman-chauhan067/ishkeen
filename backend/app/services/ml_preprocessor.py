"""
ML Preprocessing Pipeline — independent module for inference-time image preparation.

Separates ML-specific preprocessing (resize, crop, normalize for model input)
from the existing upload pipeline (sanitize_and_normalize in image_pipeline.py).

The upload pipeline handles security, format validation, and storage normalization.
This module handles model-specific tensor preparation and quality checks.
"""

import io
import numpy as np
from typing import Dict, Any, Optional
from PIL import Image, ImageFilter
from pydantic import BaseModel


class QualityCheckResult(BaseModel):
    """Structured result from image quality validation hooks."""
    passed: bool
    blur_score: Optional[float] = None
    brightness_score: Optional[float] = None
    issues: list[str] = []


class MLPreprocessor:
    """
    Preprocesses image bytes into model-ready numpy tensors.
    Also provides quality check hooks for blur and brightness.
    """
    
    # ImageNet normalization constants
    MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    
    RESIZE_SIZE = 256
    CROP_SIZE = 224
    
    # Quality thresholds
    MIN_BLUR_SCORE = 50.0       # Laplacian variance below this = too blurry
    MIN_BRIGHTNESS = 30.0       # Mean pixel value below this = too dark
    MAX_BRIGHTNESS = 240.0      # Mean pixel value above this = too bright

    def preprocess(self, img_bytes: bytes) -> np.ndarray:
        """
        Convert image bytes to model-ready numpy array.
        Returns shape [1, 3, 224, 224] float32.
        """
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        
        # Resize shortest edge to 256, then center crop to 224
        img = img.resize((self.RESIZE_SIZE, self.RESIZE_SIZE), Image.Resampling.BILINEAR)
        left = (self.RESIZE_SIZE - self.CROP_SIZE) / 2
        top = (self.RESIZE_SIZE - self.CROP_SIZE) / 2
        right = (self.RESIZE_SIZE + self.CROP_SIZE) / 2
        bottom = (self.RESIZE_SIZE + self.CROP_SIZE) / 2
        img = img.crop((left, top, right, bottom))
        
        # Convert to float32 and normalize
        img_np = np.array(img).astype(np.float32) / 255.0
        img_np = (img_np - self.MEAN) / self.STD
        
        # HWC -> CHW
        img_np = np.transpose(img_np, (2, 0, 1))
        
        # Add batch dimension
        return np.expand_dims(img_np, axis=0)

    def check_quality(self, img_bytes: bytes) -> QualityCheckResult:
        """
        Run quality validation hooks on raw image bytes.
        Returns structured results — never raises.
        """
        issues = []
        blur_score = None
        brightness_score = None
        
        try:
            img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
            
            # Blur detection via Laplacian variance
            gray = img.convert('L')
            laplacian = gray.filter(ImageFilter.Kernel(
                size=(3, 3),
                kernel=[-1, -1, -1, -1, 8, -1, -1, -1, -1],
                scale=1,
                offset=128
            ))
            lap_array = np.array(laplacian, dtype=np.float32) - 128.0
            blur_score = float(np.var(lap_array))
            
            if blur_score < self.MIN_BLUR_SCORE:
                issues.append(f"Image appears blurry (score: {blur_score:.1f}, min: {self.MIN_BLUR_SCORE})")
            
            # Brightness validation via mean pixel value
            brightness_score = float(np.mean(np.array(img)))
            
            if brightness_score < self.MIN_BRIGHTNESS:
                issues.append(f"Image appears too dark (brightness: {brightness_score:.1f})")
            elif brightness_score > self.MAX_BRIGHTNESS:
                issues.append(f"Image appears overexposed (brightness: {brightness_score:.1f})")
                
        except Exception as e:
            issues.append(f"Quality check failed: {str(e)}")
        
        return QualityCheckResult(
            passed=len(issues) == 0,
            blur_score=blur_score,
            brightness_score=brightness_score,
            issues=issues
        )
