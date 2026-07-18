import pytest
import os
import json
import torch
from PIL import Image

from ishkeen_ml.data.schema import DatasetManifest, CanonicalRecord, BoundingBox
from ishkeen_ml.data.manifest import ManifestManager
from ishkeen_ml.data.dataset import IshkeenDataset
from ishkeen_ml.data.quality import QualityPipeline
from ishkeen_ml.data.transforms import get_val_transforms

@pytest.fixture
def temp_dataset(tmp_path):
    img_dir = tmp_path / "images"
    img_dir.mkdir()
    
    # Create dummy images
    img1_path = img_dir / "test1.jpg"
    img2_path = img_dir / "test2.jpg"
    
    Image.new('RGB', (256, 256), color='red').save(img1_path)
    Image.new('RGB', (256, 256), color='blue').save(img2_path)
    
    # Create manifest
    manifest_meta = DatasetManifest(
        dataset_version="v1",
        created_at="2026-07-12",
        generated_by="pytest",
        total_samples=2,
        task_type="acne_detection",
        label_space=["acne"],
        split_strategy="random"
    )
    
    records = [
        CanonicalRecord(
            image_id="1",
            image_path="test1.jpg",
            width=256,
            height=256,
            boxes=[BoundingBox(class_id=1, class_name="acne", x_min=10, y_min=10, x_max=50, y_max=50)],
            source_dataset="test",
            image_sha256="hash1"
        ),
        CanonicalRecord(
            image_id="2",
            image_path="test2.jpg",
            width=256,
            height=256,
            boxes=[],
            source_dataset="test",
            image_sha256="hash2"
        )
    ]
    
    manifest_path = tmp_path / "manifest.jsonl"
    ManifestManager.write(str(manifest_path), manifest_meta, records)
    
    return str(manifest_path), str(img_dir)


def test_manifest_read_write(temp_dataset):
    manifest_path, _ = temp_dataset
    meta, records = ManifestManager.read(manifest_path)
    
    assert meta.dataset_version == "v1"
    assert len(records) == 2
    assert records[0].image_id == "1"
    assert len(records[0].boxes) == 1
    assert len(records[1].boxes) == 0

def test_dataset_loading_multi_task(temp_dataset):
    manifest_path, img_dir = temp_dataset
    
    dataset = IshkeenDataset(manifest_path, img_dir)
    assert len(dataset) == 2
    
    # Item 0 (positive)
    img, target = dataset[0]
    assert isinstance(img, Image.Image)
    assert target["classification"]["binary_acne"] == 1.0
    assert len(target["bounding_boxes"]) == 1
    assert target["bounding_boxes"][0]["class_name"] == "acne"
    
    # Item 1 (negative)
    img, target = dataset[1]
    assert target["classification"]["binary_acne"] == 0.0
    assert len(target["bounding_boxes"]) == 0

def test_dataset_with_transforms(temp_dataset):
    manifest_path, img_dir = temp_dataset
    
    transforms = get_val_transforms(image_size=128)
    dataset = IshkeenDataset(manifest_path, img_dir, transforms=transforms)
    
    img, target = dataset[0]
    assert isinstance(img, torch.Tensor)
    assert img.shape == (3, 128, 128)

def test_quality_pipeline(temp_dataset):
    manifest_path, img_dir = temp_dataset
    
    # Create a completely black (dark) image to fail brightness test
    bad_img_path = os.path.join(img_dir, "bad.jpg")
    Image.new('RGB', (256, 256), color='black').save(bad_img_path)
    
    # Add it to manifest
    meta, records = ManifestManager.read(manifest_path)
    records.append(
        CanonicalRecord(
            image_id="3", image_path="bad.jpg", width=256, height=256,
            boxes=[], source_dataset="test", image_sha256="hash3"
        )
    )
    ManifestManager.write(manifest_path, meta, records)
    
    # Init dataset with quality pipeline
    quality_pipeline = QualityPipeline(min_brightness=10.0, blur_threshold=0.0, min_contrast=0.0) # Black image has mean 0, solid colors have 0 variance and 0 contrast
    dataset = IshkeenDataset(manifest_path, img_dir, validate_quality=True, quality_pipeline=quality_pipeline)
    
    # It should have filtered the bad image
    assert len(dataset) == 2
    assert len(dataset.quality_reports) == 1
    
    report = dataset.quality_reports[0]
    assert report.severity == "medium"
    assert "too dark" in report.reason
