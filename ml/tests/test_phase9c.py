import pytest
import os
from PIL import Image
from ishkeen_ml.data.ingestion import IngestionPipeline, PrivacyMetadata
from ishkeen_ml.data.annotation_schema import AnnotationRecord, BoundingBox, ClassificationLabel
from ishkeen_ml.data.validation import DatasetValidator
from ishkeen_ml.data.qa import QAPipeline

@pytest.fixture
def temp_dataset(tmp_path):
    raw_dir = tmp_path / "raw"
    processed_dir = tmp_path / "processed" / "images"
    raw_dir.mkdir(parents=True, exist_ok=True)
    
    img_path = raw_dir / "test_raw.jpg"
    Image.new('RGB', (100, 100), color='white').save(img_path)
    
    return str(raw_dir), str(processed_dir), str(img_path)

def test_ingestion_pipeline(temp_dataset):
    raw_dir, processed_dir, img_path = temp_dataset
    pipeline = IngestionPipeline(raw_dir, processed_dir)
    
    privacy = PrivacyMetadata(
        consent_status="GRANTED",
        consent_version="v1",
        collection_source="ios_app",
        capture_device="iphone_13",
        country="US"
    )
    
    report = pipeline.process_image(img_path, "SUBJ1", "SESS1", privacy)
    
    assert report.status == "SUCCESS"
    assert report.image_id is not None
    assert report.image_metadata.width == 100
    assert report.image_metadata.height == 100
    
    target_path = os.path.join(processed_dir, "SUBJ1", "SESS1", f"{report.image_id}.jpg")
    assert os.path.exists(target_path)

def test_validation_and_qa(tmp_path):
    processed_dir = tmp_path / "processed" / "images"
    
    # create orphan image
    orphan_dir = processed_dir / "SUBJ2" / "SESS1"
    orphan_dir.mkdir(parents=True, exist_ok=True)
    Image.new('RGB', (100, 100), color='black').save(orphan_dir / "orphan_123.jpg")
    
    validator = DatasetValidator(str(processed_dir), {"acne"})
    
    # Missing labels error because status is ANNOTATED but no labels
    bad_record = AnnotationRecord(
        image_id="missing_456",
        subject_id="SUBJ3",
        session_id="SESS1",
        status="ANNOTATED"
    )
    
    reports = validator.scan_directory([bad_record])
    
    # Should flag 1 orphan image and 1 orphan annotation error (missing image).
    # Since the image is missing, label validation is skipped.
    assert len(reports) == 2
    
    qa_pipeline = QAPipeline(reports, [bad_record])
    qa_report = qa_pipeline.generate_report()
    
    assert qa_report.missing_annotations == 0 # the status was ANNOTATED, but it failed validation
    assert qa_report.total_images == 1
    assert len(qa_report.quality_failures) == 2
