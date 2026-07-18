import os
from typing import List, Dict, Optional, Set
from pydantic import BaseModel
from ishkeen_ml.data.annotation_schema import AnnotationRecord
from PIL import Image

class ValidationReport(BaseModel):
    issue_type: str # e.g. "MISSING_LABEL", "ORPHAN_IMAGE", "OUT_OF_BOUNDS_BBOX"
    severity: str # "HIGH", "MEDIUM", "LOW"
    description: str
    image_id: Optional[str] = None
    annotation_id: Optional[str] = None

class DatasetValidator:
    """
    Scans the processed dataset directory for structural and annotation consistency.
    """
    def __init__(
        self, 
        processed_dir: str, 
        valid_class_names: Set[str]
    ):
        self.processed_dir = processed_dir
        self.valid_class_names = valid_class_names
        
    def validate_annotation(self, record: AnnotationRecord, img_width: int, img_height: int) -> List[ValidationReport]:
        reports = []
        
        # Check Bounding Boxes
        for idx, box in enumerate(record.bounding_boxes):
            if box.class_name not in self.valid_class_names:
                reports.append(ValidationReport(
                    issue_type="INVALID_CLASS",
                    severity="HIGH",
                    description=f"Bounding box has invalid class '{box.class_name}'",
                    image_id=record.image_id
                ))
            
            if box.x_min < 0 or box.y_min < 0 or box.x_max > img_width or box.y_max > img_height:
                reports.append(ValidationReport(
                    issue_type="OUT_OF_BOUNDS_BBOX",
                    severity="HIGH",
                    description=f"Box {box.x_min},{box.y_min},{box.x_max},{box.y_max} outside image {img_width}x{img_height}",
                    image_id=record.image_id
                ))
                
            if box.x_max <= box.x_min or box.y_max <= box.y_min:
                reports.append(ValidationReport(
                    issue_type="INVALID_BBOX_DIMENSIONS",
                    severity="HIGH",
                    description=f"Box has negative or zero area: {box.x_min},{box.y_min},{box.x_max},{box.y_max}",
                    image_id=record.image_id
                ))

        # Check binary classification
        if record.binary_classification:
            if record.binary_classification.class_name not in self.valid_class_names:
                reports.append(ValidationReport(
                    issue_type="INVALID_CLASS",
                    severity="HIGH",
                    description=f"Binary classification has invalid class '{record.binary_classification.class_name}'",
                    image_id=record.image_id
                ))

        # Ensure at least ONE task is populated if marked as ANNOTATED or higher
        if record.status in ["ANNOTATED", "REVIEW_REQUIRED", "APPROVED"]:
            has_label = any([
                record.binary_classification,
                record.multiclass_classification,
                record.multilabel,
                record.bounding_boxes,
                record.segmentation_polygons,
                record.segmentation_rle,
                record.severity_grading
            ])
            if not has_label:
                reports.append(ValidationReport(
                    issue_type="MISSING_LABEL",
                    severity="HIGH",
                    description="Record status is ANNOTATED but no labels exist.",
                    image_id=record.image_id
                ))
                
        return reports

    def scan_directory(self, annotations: List[AnnotationRecord]) -> List[ValidationReport]:
        """
        Scans all files and annotations to find orphans and duplicates.
        Assumes image files are named {image_id}.jpg in subject/session/ subdirectories.
        """
        all_reports = []
        
        # 1. Discover all images on disk
        images_on_disk = set()
        image_dimensions = {} # image_id -> (width, height)
        
        if os.path.exists(self.processed_dir):
            for root, _, files in os.walk(self.processed_dir):
                for file in files:
                    if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                        image_id = os.path.splitext(file)[0]
                        images_on_disk.add(image_id)
                        
                        try:
                            with Image.open(os.path.join(root, file)) as img:
                                image_dimensions[image_id] = img.size
                        except:
                            image_dimensions[image_id] = (0, 0) # Corrupt
        
        # 2. Discover all annotations
        annotated_image_ids = set()
        for record in annotations:
            if record.image_id in annotated_image_ids:
                all_reports.append(ValidationReport(
                    issue_type="DUPLICATE_ANNOTATION",
                    severity="HIGH",
                    description=f"Multiple AnnotationRecords found for image {record.image_id}",
                    image_id=record.image_id
                ))
            annotated_image_ids.add(record.image_id)
            
            # Orphan Annotation?
            if record.image_id not in images_on_disk:
                all_reports.append(ValidationReport(
                    issue_type="ORPHAN_ANNOTATION",
                    severity="HIGH",
                    description=f"Annotation exists but image file is missing.",
                    image_id=record.image_id
                ))
            else:
                w, h = image_dimensions.get(record.image_id, (0, 0))
                if w > 0 and h > 0:
                    all_reports.extend(self.validate_annotation(record, w, h))

        # 3. Orphan Images?
        orphan_images = images_on_disk - annotated_image_ids
        for orphan in orphan_images:
            all_reports.append(ValidationReport(
                issue_type="ORPHAN_IMAGE",
                severity="MEDIUM",
                description="Image file exists but no AnnotationRecord tracks it.",
                image_id=orphan
            ))
            
        return all_reports
