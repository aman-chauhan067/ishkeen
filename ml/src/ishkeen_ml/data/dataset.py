import os
import torch
from torch.utils.data import Dataset
from PIL import Image
from typing import Callable, Optional, Dict, Any, List

from ishkeen_ml.data.manifest import ManifestManager
from ishkeen_ml.data.schema import CanonicalRecord
from ishkeen_ml.data.quality import QualityPipeline, QualityReport

class IshkeenDataset(Dataset):
    """
    Multi-task ready PyTorch Dataset.
    Reads a JSONL manifest and yields (image_tensor, target_dict).
    target_dict contains generic label representations supporting multiple tasks.
    """
    def __init__(
        self,
        manifest_path: str,
        image_dir: str,
        transforms: Optional[Callable] = None,
        validate_quality: bool = False,
        quality_pipeline: Optional[QualityPipeline] = None
    ):
        super().__init__()
        self.image_dir = image_dir
        self.transforms = transforms
        
        self.manifest_meta, self.records = ManifestManager.read(manifest_path)
        self.quality_reports: List[QualityReport] = []
        
        if validate_quality:
            if quality_pipeline is None:
                quality_pipeline = QualityPipeline()
                
            valid_records = []
            for record in self.records:
                full_path = os.path.join(self.image_dir, record.image_path)
                report = quality_pipeline.check_image(full_path)
                if report:
                    self.quality_reports.append(report)
                else:
                    valid_records.append(record)
            self.records = valid_records

    def __len__(self) -> int:
        return len(self.records)

    def _extract_target(self, record: CanonicalRecord) -> Dict[str, Any]:
        """
        Builds a multi-task ready target_dict.
        """
        # For our immediate task, presence of any acne boxes implies positive (1.0).
        is_positive = float(len(record.boxes) > 0)
        
        target = {
            "classification": {
                "binary_acne": is_positive
            },
            # Future multi-class additions would populate this space:
            "multi_label": {}, 
            "bounding_boxes": [],
            "metadata": {
                "image_id": record.image_id,
                "subject_id": record.subject_id
            }
        }
        
        # Populate bounding boxes if present
        for box in record.boxes:
            target["bounding_boxes"].append({
                "class_id": box.class_id,
                "class_name": box.class_name,
                "bbox": [box.x_min, box.y_min, box.x_max, box.y_max]
            })
            
        return target

    def __getitem__(self, idx: int) -> tuple:
        record = self.records[idx]
        full_path = os.path.join(self.image_dir, record.image_path)
        
        # We assume image passes quality checks by the time __getitem__ is called.
        try:
            image = Image.open(full_path).convert("RGB")
        except Exception as e:
            raise RuntimeError(f"Failed to load {full_path}: {e}")
            
        target = self._extract_target(record)
        
        if self.transforms:
            # torchvision v2 transforms handle dicts or tuples if properly formatted,
            # but for standard usage we usually just transform the image.
            # If bounding boxes need transformation, v2 transforms can handle it,
            # but we pass just the image for the classification pipeline.
            image = self.transforms(image)
            
        return image, target
