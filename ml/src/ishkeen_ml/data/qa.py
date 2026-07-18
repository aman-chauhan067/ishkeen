import json
from typing import List, Dict, Any
from ishkeen_ml.data.annotation_schema import AnnotationRecord, AnnotationStatus
from ishkeen_ml.data.validation import ValidationReport
from pydantic import BaseModel

class DatasetQAReport(BaseModel):
    total_images: int
    approved_images: int
    pending_review: int
    rejected_images: int
    missing_annotations: int
    class_balance: Dict[str, int]
    quality_failures: List[Dict[str, str]] # list of validation reports dumped to dict

class QAPipeline:
    def __init__(self, validation_reports: List[ValidationReport], annotations: List[AnnotationRecord]):
        self.validation_reports = validation_reports
        self.annotations = annotations
        
    def generate_report(self) -> DatasetQAReport:
        approved = 0
        pending = 0
        rejected = 0
        missing = 0
        
        class_balance = {}
        
        for record in self.annotations:
            if record.status == AnnotationStatus.APPROVED:
                approved += 1
            elif record.status == AnnotationStatus.REVIEW_REQUIRED:
                pending += 1
            elif record.status == AnnotationStatus.REJECTED:
                rejected += 1
            elif record.status in [AnnotationStatus.UNANNOTATED, AnnotationStatus.IN_PROGRESS]:
                missing += 1
                
            if record.binary_classification:
                cls_name = record.binary_classification.class_name
                class_balance[cls_name] = class_balance.get(cls_name, 0) + 1
                
        failures = [
            {"issue_type": r.issue_type, "severity": r.severity, "description": r.description, "image_id": r.image_id or ""} 
            for r in self.validation_reports
        ]
        
        return DatasetQAReport(
            total_images=len(self.annotations),
            approved_images=approved,
            pending_review=pending,
            rejected_images=rejected,
            missing_annotations=missing,
            class_balance=class_balance,
            quality_failures=failures
        )
        
    def export_markdown(self, report: DatasetQAReport, output_path: str) -> None:
        lines = [
            "# Dataset QA Summary Dashboard",
            "",
            "## Overview",
            f"- **Total Images Tracked:** {report.total_images}",
            f"- **Approved Images (Ready for Training):** {report.approved_images}",
            f"- **Pending Review:** {report.pending_review}",
            f"- **Rejected Images:** {report.rejected_images}",
            f"- **Missing Annotations:** {report.missing_annotations}",
            "",
            "## Class Balance (Binary Classification)",
        ]
        
        if report.class_balance:
            for cls, count in report.class_balance.items():
                lines.append(f"- **{cls}**: {count}")
        else:
            lines.append("- No classes annotated yet.")
            
        lines.append("")
        lines.append("## Quality Failures & Validations")
        
        if not report.quality_failures:
            lines.append("✅ **No validation or quality failures detected.**")
        else:
            lines.append(f"**{len(report.quality_failures)} issues detected.**")
            for f in report.quality_failures[:20]: # show top 20
                lines.append(f"- **{f['severity']}** [{f['issue_type']}] {f['description']} (Image: {f['image_id']})")
            if len(report.quality_failures) > 20:
                lines.append(f"- ... and {len(report.quality_failures) - 20} more issues. Check JSON for details.")
                
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
            
    def export_json(self, report: DatasetQAReport, output_path: str) -> None:
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(report.model_dump_json(indent=2))
