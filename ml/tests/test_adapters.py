import json
import os
import pytest
from ishkeen_ml.data.label_studio_adapter import parse_label_studio_export
from ishkeen_ml.data.cvat_adapter import parse_cvat_export

@pytest.fixture
def mock_label_studio(tmp_path):
    data = [{
        "data": {"image": "/data/upload/1/SUBJECT_A/SESSION_1/IMG_001.jpg"},
        "annotations": [{
            "was_cancelled": False,
            "completed_by": 1,
            "result": [
                {
                    "original_width": 1000,
                    "original_height": 1000,
                    "type": "rectanglelabels",
                    "value": {
                        "x": 10, "y": 10, "width": 5, "height": 5,
                        "rectanglelabels": ["acne"]
                    }
                }
            ]
        }]
    }]
    path = tmp_path / "ls_export.json"
    path.write_text(json.dumps(data))
    return str(path)

@pytest.fixture
def mock_cvat_json(tmp_path):
    data = [{
        "image": {"file_name": "SUBJECT_B/SESSION_2/IMG_002.jpg", "width": 800, "height": 800},
        "annotations": [
            {
                "bbox": [50, 50, 20, 20],
                "category_id": "acne"
            }
        ]
    }]
    path = tmp_path / "cvat_export.json"
    path.write_text(json.dumps(data))
    return str(path)

def test_label_studio_adapter(mock_label_studio):
    annos, canons = parse_label_studio_export(mock_label_studio)
    assert len(annos) == 1
    a = annos[0]
    assert a.subject_id == "SUBJECT_A"
    assert a.session_id == "SESSION_1"
    assert a.image_id == "IMG_001"
    assert len(a.bounding_boxes) == 1
    assert a.bounding_boxes[0].class_name == "acne"
    # 10% of 1000 = 100
    assert a.bounding_boxes[0].x_min == 100

def test_cvat_adapter_json(mock_cvat_json):
    annos, canons = parse_cvat_export(mock_cvat_json, format_type="json")
    assert len(annos) == 1
    a = annos[0]
    assert a.subject_id == "SUBJECT_B"
    assert a.session_id == "SESSION_2"
    assert a.image_id == "IMG_002"
    assert len(a.bounding_boxes) == 1
    assert a.bounding_boxes[0].class_name == "acne"
    assert a.bounding_boxes[0].x_min == 50
    assert a.bounding_boxes[0].x_max == 70
