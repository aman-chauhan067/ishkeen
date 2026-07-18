from typing import Optional
from pydantic import BaseModel
from PIL import Image, ImageStat, UnidentifiedImageError
import numpy as np

class QualityReport(BaseModel):
    """
    Structured report for images failing quality checks.
    """
    image_path: str
    reason: str
    severity: str  # "high", "medium", "low"
    recommended_action: str

class QualityPipeline:
    """
    Automated checks on PIL images:
    - Blur detection (Laplacian variance threshold)
    - Brightness/Contrast (grayscale mean and std-dev)
    - Resolution checks
    - Corrupt image detection
    """
    def __init__(
        self, 
        min_width: int = 128, 
        min_height: int = 128,
        blur_threshold: float = 10.0,
        min_brightness: float = 20.0,
        max_brightness: float = 240.0,
        min_contrast: float = 10.0
    ):
        self.min_width = min_width
        self.min_height = min_height
        self.blur_threshold = blur_threshold
        self.min_brightness = min_brightness
        self.max_brightness = max_brightness
        self.min_contrast = min_contrast

    def check_image(self, image_path: str) -> Optional[QualityReport]:
        """
        Validates an image from disk. Returns a QualityReport if it fails, else None.
        """
        try:
            with Image.open(image_path) as img:
                img.load()  # verify data integrity
                
                if img.width < self.min_width or img.height < self.min_height:
                    return QualityReport(
                        image_path=image_path,
                        reason=f"Resolution too low: {img.width}x{img.height}",
                        severity="high",
                        recommended_action="Discard image"
                    )
                
                # Convert to grayscale for stats
                gray = img.convert("L")
                stat = ImageStat.Stat(gray)
                mean = stat.mean[0]
                stddev = stat.stddev[0]
                
                if mean < self.min_brightness:
                    return QualityReport(
                        image_path=image_path,
                        reason=f"Image too dark (mean: {mean:.1f})",
                        severity="medium",
                        recommended_action="Discard or apply aggressive brightness augmentation"
                    )
                
                if mean > self.max_brightness:
                    return QualityReport(
                        image_path=image_path,
                        reason=f"Image too bright (mean: {mean:.1f})",
                        severity="medium",
                        recommended_action="Discard or apply aggressive brightness augmentation"
                    )
                    
                if stddev < self.min_contrast:
                    return QualityReport(
                        image_path=image_path,
                        reason=f"Contrast too low (stddev: {stddev:.1f})",
                        severity="medium",
                        recommended_action="Discard image"
                    )
                
                # Blur detection using Laplacian variance
                arr = np.array(gray, dtype=np.int32)
                # Simple laplacian filter 
                # (approximate cv2.Laplacian(img, cv2.CV_64F).var())
                # Kernel: [[0, 1, 0], [1, -4, 1], [0, 1, 0]]
                lap = (
                    arr[1:-1, 1:-1] * -4 +
                    arr[:-2, 1:-1] +
                    arr[2:, 1:-1] +
                    arr[1:-1, :-2] +
                    arr[1:-1, 2:]
                )
                variance = np.var(lap)
                
                if variance < self.blur_threshold:
                    return QualityReport(
                        image_path=image_path,
                        reason=f"Image too blurry (variance: {variance:.1f})",
                        severity="high",
                        recommended_action="Discard image"
                    )
                    
                return None
                
        except UnidentifiedImageError:
            return QualityReport(
                image_path=image_path,
                reason="Corrupted image or unidentified format",
                severity="high",
                recommended_action="Discard image completely"
            )
        except Exception as e:
            return QualityReport(
                image_path=image_path,
                reason=f"Unexpected error during read: {e}",
                severity="high",
                recommended_action="Investigate file"
            )
