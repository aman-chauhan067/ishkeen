import json
import os
from typing import List, Tuple, Dict, Any
from ishkeen_ml.data.annotation_schema import AnnotationRecord, BoundingBox as AnnoBox, AnnotationStatus, ClassificationLabel
from ishkeen_ml.data.schema import CanonicalRecord, BoundingBox as CanonBox

def parse_label_studio_export(json_path: str) -> Tuple[List[AnnotationRecord], List[CanonicalRecord]]:
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"Label Studio export not found: {json_path}")
        
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    if not isinstance(data, list):
        raise ValueError("Invalid Label Studio export format: Expected a JSON array.")
        
    annotation_records = []
    canonical_records = []
    
    for task in data:
        # Extract metadata from task['data']['image'] which we assume is "subject_id/session_id/image_id.jpg"
        image_path = task.get('data', {}).get('image', '')
        if not image_path:
            continue
            
        parts = image_path.strip('/').split('/')
        if len(parts) >= 3:
            subject_id = parts[-3]
            session_id = parts[-2]
            image_id = os.path.splitext(parts[-1])[0]
        else:
            subject_id = "UNKNOWN"
            session_id = "UNKNOWN"
            image_id = os.path.splitext(os.path.basename(image_path))[0]
            
        # Parse the most recent annotation
        annotations = task.get('annotations', [])
        if not annotations:
            continue
            
        latest_anno = annotations[-1]
        results = latest_anno.get('result', [])
        
        anno_boxes = []
        canon_boxes = []
        
        # Original dimensions are usually in the first result
        orig_width = 100
        orig_height = 100
        if results:
            orig_width = results[0].get('original_width', 100)
            orig_height = results[0].get('original_height', 100)
            
        binary_class = None
            
        for res in results:
            if res.get('type') == 'rectanglelabels':
                val = res.get('value', {})
                labels = val.get('rectanglelabels', [])
                class_name = labels[0] if labels else "unknown"
                
                # Label studio uses percentages for x, y, width, height
                x_pct = val.get('x', 0)
                y_pct = val.get('y', 0)
                w_pct = val.get('width', 0)
                h_pct = val.get('height', 0)
                
                x_min = (x_pct / 100.0) * orig_width
                y_min = (y_pct / 100.0) * orig_height
                x_max = x_min + ((w_pct / 100.0) * orig_width)
                y_max = y_min + ((h_pct / 100.0) * orig_height)
                
                anno_boxes.append(AnnoBox(
                    x_min=x_min, y_min=y_min, x_max=x_max, y_max=y_max, class_name=class_name
                ))
                canon_boxes.append(CanonBox(
                    class_id=0, class_name=class_name, x_min=x_min, y_min=y_min, x_max=x_max, y_max=y_max
                ))
            elif res.get('type') == 'choices':
                val = res.get('value', {})
                choices = val.get('choices', [])
                if choices:
                    binary_class = ClassificationLabel(class_name=choices[0], confidence=1.0)
                    
        was_cancelled = latest_anno.get('was_cancelled', False)
        status = AnnotationStatus.REJECTED if was_cancelled else AnnotationStatus.APPROVED
        
        annotator_id = str(latest_anno.get('completed_by', "unknown"))
        
        a_rec = AnnotationRecord(
            image_id=image_id,
            subject_id=subject_id,
            session_id=session_id,
            binary_classification=binary_class,
            bounding_boxes=anno_boxes,
            status=status,
            annotator_id=annotator_id
        )
        
        c_rec = CanonicalRecord(
            image_id=image_id,
            image_path=image_path,
            width=int(orig_width),
            height=int(orig_height),
            boxes=canon_boxes,
            subject_id=subject_id,
            source_dataset="label_studio",
            image_sha256="unknown" # Typically injected later by the ingestion pipeline
        )
        
        annotation_records.append(a_rec)
        canonical_records.append(c_rec)
        
    return annotation_records, canonical_records
