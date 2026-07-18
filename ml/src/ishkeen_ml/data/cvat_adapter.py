import json
import xml.etree.ElementTree as ET
import os
from typing import List, Tuple
from ishkeen_ml.data.annotation_schema import AnnotationRecord, BoundingBox as AnnoBox, AnnotationStatus, ClassificationLabel
from ishkeen_ml.data.schema import CanonicalRecord, BoundingBox as CanonBox

def parse_cvat_export(filepath: str, format_type: str = "json") -> Tuple[List[AnnotationRecord], List[CanonicalRecord]]:
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"CVAT export not found: {filepath}")
        
    if format_type.lower() == "json":
        return _parse_cvat_json(filepath)
    elif format_type.lower() == "xml":
        return _parse_cvat_xml(filepath)
    else:
        raise ValueError(f"Unsupported format: {format_type}")

def _extract_metadata(image_name: str) -> Tuple[str, str, str]:
    parts = image_name.strip('/').split('/')
    if len(parts) >= 3:
        subject_id = parts[-3]
        session_id = parts[-2]
        image_id = os.path.splitext(parts[-1])[0]
    else:
        subject_id = "UNKNOWN"
        session_id = "UNKNOWN"
        image_id = os.path.splitext(os.path.basename(image_name))[0]
    return subject_id, session_id, image_id

def _parse_cvat_json(json_path: str) -> Tuple[List[AnnotationRecord], List[CanonicalRecord]]:
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    annotation_records = []
    canonical_records = []
    
    # CVAT JSON structure depends on the exact format, typically COCO or Datumaro
    # Let's assume a generic JSON format where items have 'id', 'image', 'annotations'
    for item in data:
        img_meta = item.get("image", {})
        if not img_meta:
            img_meta = {"file_name": item.get("file_name", "unknown.jpg"), "width": 100, "height": 100}
            
        file_name = img_meta.get("file_name", "unknown.jpg")
        subject_id, session_id, image_id = _extract_metadata(file_name)
        
        orig_width = int(img_meta.get("width", 100))
        orig_height = int(img_meta.get("height", 100))
        
        anno_boxes = []
        canon_boxes = []
        
        annotations = item.get("annotations", [])
        for ann in annotations:
            # bbox usually [x, y, width, height]
            bbox = ann.get("bbox", [])
            if len(bbox) == 4:
                x_min = float(bbox[0])
                y_min = float(bbox[1])
                x_max = x_min + float(bbox[2])
                y_max = y_min + float(bbox[3])
                class_name = str(ann.get("category_id", "unknown")) # would need a map in real life
                
                anno_boxes.append(AnnoBox(
                    x_min=x_min, y_min=y_min, x_max=x_max, y_max=y_max, class_name=class_name
                ))
                canon_boxes.append(CanonBox(
                    class_id=0, class_name=class_name, x_min=x_min, y_min=y_min, x_max=x_max, y_max=y_max
                ))
                
        status = AnnotationStatus.APPROVED
        
        a_rec = AnnotationRecord(
            image_id=image_id,
            subject_id=subject_id,
            session_id=session_id,
            bounding_boxes=anno_boxes,
            status=status
        )
        
        c_rec = CanonicalRecord(
            image_id=image_id,
            image_path=file_name,
            width=orig_width,
            height=orig_height,
            boxes=canon_boxes,
            subject_id=subject_id,
            source_dataset="cvat",
            image_sha256="unknown"
        )
        
        annotation_records.append(a_rec)
        canonical_records.append(c_rec)
        
    return annotation_records, canonical_records

def _parse_cvat_xml(xml_path: str) -> Tuple[List[AnnotationRecord], List[CanonicalRecord]]:
    tree = ET.parse(xml_path)
    root = tree.getroot()
    
    annotation_records = []
    canonical_records = []
    
    for image_elem in root.findall('image'):
        file_name = image_elem.get('name', 'unknown.jpg')
        orig_width = int(image_elem.get('width', '100'))
        orig_height = int(image_elem.get('height', '100'))
        
        subject_id, session_id, image_id = _extract_metadata(file_name)
        
        anno_boxes = []
        canon_boxes = []
        
        for box_elem in image_elem.findall('box'):
            class_name = box_elem.get('label', 'unknown')
            x_min = float(box_elem.get('xtl', '0'))
            y_min = float(box_elem.get('ytl', '0'))
            x_max = float(box_elem.get('xbr', '0'))
            y_max = float(box_elem.get('ybr', '0'))
            
            anno_boxes.append(AnnoBox(
                x_min=x_min, y_min=y_min, x_max=x_max, y_max=y_max, class_name=class_name
            ))
            canon_boxes.append(CanonBox(
                class_id=0, class_name=class_name, x_min=x_min, y_min=y_min, x_max=x_max, y_max=y_max
            ))
            
        status = AnnotationStatus.APPROVED
        
        a_rec = AnnotationRecord(
            image_id=image_id,
            subject_id=subject_id,
            session_id=session_id,
            bounding_boxes=anno_boxes,
            status=status
        )
        
        c_rec = CanonicalRecord(
            image_id=image_id,
            image_path=file_name,
            width=orig_width,
            height=orig_height,
            boxes=canon_boxes,
            subject_id=subject_id,
            source_dataset="cvat",
            image_sha256="unknown"
        )
        
        annotation_records.append(a_rec)
        canonical_records.append(c_rec)
        
    return annotation_records, canonical_records
