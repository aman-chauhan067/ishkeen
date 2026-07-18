import json
from typing import List, Dict, Any
from ishkeen_ml.data.schema import CanonicalRecord
from ishkeen_ml.data.validation import validate_record
from ishkeen_ml.data.statistics import compute_statistics

def run_audit(records: List[CanonicalRecord]) -> Dict[str, Any]:
    """
    Runs a full dataset audit, combining validation and statistics.
    """
    total = len(records)
    valid_records = []
    invalid_records = []
    
    for r in records:
        errors = validate_record(r)
        if errors:
            invalid_records.append({"image_id": r.image_id, "errors": errors})
        else:
            valid_records.append(r)
            
    stats = compute_statistics(records)
    
    report = {
        "summary": {
            "total_records_processed": total,
            "valid_records": len(valid_records),
            "invalid_records": len(invalid_records),
            "is_valid": len(invalid_records) == 0
        },
        "statistics": stats,
        "invalid_details": invalid_records
    }
    
    return report

def generate_markdown_audit(audit_report: Dict[str, Any]) -> str:
    """Generates a human-readable markdown summary from the audit report."""
    s = audit_report["summary"]
    stats = audit_report["statistics"]
    
    lines = [
        "# Dataset Audit Report",
        f"- **Total Records**: {s['total_records_processed']}",
        f"- **Valid Records**: {s['valid_records']}",
        f"- **Invalid Records**: {s['invalid_records']}",
        "",
        "## Statistics",
        f"- **Total Boxes**: {stats['total_box_count']}",
        f"- **Empty Images**: {stats['empty_image_count']}",
        f"- **Subjects**: {stats['subject_count']}",
        f"- **Exact Duplicates**: {stats['exact_duplicate_count']}",
        f"- **Boxes/Image (Mean)**: {stats['boxes_per_image']['mean']:.2f}",
        f"- **Box Area/Image Area (Mean)**: {stats['normalized_box_area_mean']:.4f}",
    ]
    return "\n".join(lines)
