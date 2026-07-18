import json
import os
from typing import List, Dict, Any
from ishkeen_ml.data.annotation_schema import AnnotationRecord

class DatasetStatistics:
    def __init__(self):
        pass

    def compute(self, annotations: List[AnnotationRecord]) -> Dict[str, Any]:
        stats = {
            "total_images": len(annotations),
            "status_distribution": {},
            "class_distribution": {},
            "binary_positive_count": 0,
            "binary_negative_count": 0,
            "total_bounding_boxes": 0,
            "bounding_boxes_per_class": {},
            "annotators": set(),
            "reviewers": set()
        }
        
        for record in annotations:
            # Status Distribution
            stats["status_distribution"][record.status.value] = stats["status_distribution"].get(record.status.value, 0) + 1
            
            # Annotator & Reviewer Tracking
            if record.annotator_id:
                stats["annotators"].add(record.annotator_id)
            if record.reviewer_id:
                stats["reviewers"].add(record.reviewer_id)
                
            # Binary Classification
            if record.binary_classification:
                cls_name = record.binary_classification.class_name
                stats["class_distribution"][cls_name] = stats["class_distribution"].get(cls_name, 0) + 1
                if "positive" in cls_name.lower() or "acne" in cls_name.lower():
                    stats["binary_positive_count"] += 1
                else:
                    stats["binary_negative_count"] += 1
            
            # Bounding Boxes
            stats["total_bounding_boxes"] += len(record.bounding_boxes)
            for box in record.bounding_boxes:
                stats["bounding_boxes_per_class"][box.class_name] = stats["bounding_boxes_per_class"].get(box.class_name, 0) + 1
                
        # Convert sets to list for JSON serialization
        stats["annotators"] = list(stats["annotators"])
        stats["reviewers"] = list(stats["reviewers"])
        
        return stats

    def export_json(self, stats: Dict[str, Any], output_path: str) -> None:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(stats, f, indent=2)
            
    def export_markdown(self, stats: Dict[str, Any], output_path: str) -> None:
        lines = [
            "# Dataset Statistics Report",
            "",
            f"**Total Images Tracked:** {stats['total_images']}",
            f"**Total Bounding Boxes:** {stats['total_bounding_boxes']}",
            "",
            "## Status Distribution"
        ]
        
        for status, count in stats["status_distribution"].items():
            lines.append(f"- **{status}**: {count}")
            
        lines.append("")
        lines.append("## Class Distribution (Binary/Multiclass)")
        if stats["class_distribution"]:
            for cls, count in stats["class_distribution"].items():
                lines.append(f"- **{cls}**: {count}")
        else:
            lines.append("- No classification annotations found.")
            
        lines.append("")
        lines.append("## Bounding Boxes per Class")
        if stats["bounding_boxes_per_class"]:
            for cls, count in stats["bounding_boxes_per_class"].items():
                lines.append(f"- **{cls}**: {count}")
        else:
            lines.append("- No bounding boxes found.")
            
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
