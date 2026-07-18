import os
import pytest
from ishkeen_ml.data.dataset_builder import DatasetBuilder
from ishkeen_ml.data.annotation_schema import AnnotationRecord, AnnotationStatus
from ishkeen_ml.data.schema import CanonicalRecord

def test_dataset_builder(tmp_path):
    output_dir = tmp_path / "dataset"
    builder = DatasetBuilder(str(output_dir))
    
    # Create 10 dummy records so SplitEngine can run
    annos = []
    canons = []
    for i in range(10):
        a = AnnotationRecord(
            image_id=f"img_{i}",
            subject_id=f"subj_{i}",
            session_id="sess_1",
            status=AnnotationStatus.APPROVED
        )
        c = CanonicalRecord(
            image_id=f"img_{i}",
            image_path=f"subj_{i}/sess_1/img_{i}.jpg",
            width=100, height=100,
            subject_id=f"subj_{i}",
            source_dataset="mock",
            image_sha256="mock"
        )
        annos.append(a)
        canons.append(c)
        
    lockfile_path = builder.build(annos, canons, version="1.0.0")
    
    assert os.path.exists(lockfile_path)
    assert os.path.exists(output_dir / "train.jsonl")
    assert os.path.exists(output_dir / "val.jsonl")
    assert os.path.exists(output_dir / "test.jsonl")
    assert os.path.exists(output_dir / "dataset_statistics.json")
    assert os.path.exists(output_dir / "dataset_statistics.md")
