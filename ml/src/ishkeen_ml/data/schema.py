from typing import List, Optional
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    """
    Represents a bounding box using absolute pixel coordinates.
    
    Coordinate Convention:
    - Absolute pixel coordinates.
    - XYXY format.
    - Origin (0,0) is at the top-left of the image.
    - X increases rightward, Y increases downward.
    - max coordinates (x_max, y_max) are exclusive. 
      (e.g., width = x_max - x_min)
    - Bounds policy: x_min >= 0, y_min >= 0, x_max <= image_width, y_max <= image_height.
      A valid box must have x_max > x_min and y_max > y_min.
    """
    class_id: int
    class_name: str
    x_min: float
    y_min: float
    x_max: float
    y_max: float

class CanonicalRecord(BaseModel):
    """
    A single image record and its annotations in the canonical JSONL format.
    """
    schema_version: str = "1.0"
    image_id: str
    image_path: str
    width: int
    height: int
    boxes: List[BoundingBox] = Field(default_factory=list)
    subject_id: Optional[str] = None
    source_dataset: str
    source_record_id: Optional[str] = None
    image_sha256: str
    duplicate_cluster_id: Optional[str] = None

class DatasetManifest(BaseModel):
    """
    Metadata header for dataset versioning and reproducibility.
    Usually stored as the first line of a JSONL manifest or as a separate file.
    """
    dataset_version: str
    schema_version: str = "1.0"
    created_at: str
    generated_by: str
    total_samples: int
    task_type: str
    label_space: List[str]
    split_strategy: str
