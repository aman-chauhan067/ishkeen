import pytest
from pydantic import ValidationError
from ishkeen_ml.data.schema import CanonicalRecord, BoundingBox

def test_valid_record():
    record = CanonicalRecord(
        image_id="img1",
        image_path="/path/img1.jpg",
        width=256,
        height=256,
        source_dataset="test",
        image_sha256="abc",
        boxes=[
            BoundingBox(class_id=0, class_name="lesion", x_min=10, y_min=10, x_max=50, y_max=50)
        ]
    )
    assert record.image_id == "img1"

def test_empty_boxes():
    record = CanonicalRecord(
        image_id="img1",
        image_path="/path/img1.jpg",
        width=256,
        height=256,
        source_dataset="test",
        image_sha256="abc",
        boxes=[]
    )
    assert len(record.boxes) == 0

def test_missing_required_fields():
    with pytest.raises(ValidationError):
        CanonicalRecord(
            image_id="img1"
            # Missing width, height, etc.
        )
