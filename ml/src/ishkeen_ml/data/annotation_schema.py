from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from enum import Enum

class AnnotationStatus(str, Enum):
    UNANNOTATED = "UNANNOTATED"
    IN_PROGRESS = "IN_PROGRESS"
    ANNOTATED = "ANNOTATED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

# --- Geometry & Task Schemas ---

class BoundingBox(BaseModel):
    x_min: float
    y_min: float
    x_max: float
    y_max: float
    class_name: str
    confidence: Optional[float] = None

class Polygon(BaseModel):
    points: List[List[float]] # [[x1, y1], [x2, y2], ...]
    class_name: str

class RLEMask(BaseModel):
    counts: List[int]
    size: List[int]
    class_name: str

class ClassificationLabel(BaseModel):
    class_name: str
    confidence: Optional[float] = None

class MultilabelClassification(BaseModel):
    class_names: List[str]

class SeverityGrading(BaseModel):
    scale_name: str
    grade: Union[int, float]
    max_grade: Union[int, float]

# --- Main Annotation Schema ---

class AnnotationRecord(BaseModel):
    """
    Future-proof annotation format capable of supporting multiple tasks per image.
    """
    image_id: str
    subject_id: str
    session_id: str
    
    # Task specific annotations
    binary_classification: Optional[ClassificationLabel] = None
    multiclass_classification: Optional[ClassificationLabel] = None
    multilabel: Optional[MultilabelClassification] = None
    bounding_boxes: List[BoundingBox] = Field(default_factory=list)
    segmentation_polygons: List[Polygon] = Field(default_factory=list)
    segmentation_rle: List[RLEMask] = Field(default_factory=list)
    severity_grading: List[SeverityGrading] = Field(default_factory=list)
    
    # Workflow & Audit
    status: AnnotationStatus = AnnotationStatus.UNANNOTATED
    annotator_id: Optional[str] = None
    reviewer_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    version: int = 1
    review_notes: Optional[str] = None
    
    def approve(self, reviewer_id: str, notes: Optional[str] = None) -> None:
        self.status = AnnotationStatus.APPROVED
        self.reviewer_id = reviewer_id
        self.review_notes = notes
        self.updated_at = datetime.now(timezone.utc).isoformat()
        
    def reject(self, reviewer_id: str, notes: str) -> None:
        self.status = AnnotationStatus.REJECTED
        self.reviewer_id = reviewer_id
        self.review_notes = notes
        self.updated_at = datetime.now(timezone.utc).isoformat()
        
    def update_annotations(self, annotator_id: str, **kwargs) -> None:
        """Helper to apply edits and bump version."""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.annotator_id = annotator_id
        self.version += 1
        self.updated_at = datetime.now(timezone.utc).isoformat()
        self.status = AnnotationStatus.ANNOTATED
