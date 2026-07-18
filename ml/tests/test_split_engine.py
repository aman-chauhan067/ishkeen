import pytest
from ishkeen_ml.data.schema import CanonicalRecord
from ishkeen_ml.data.split_engine import SplitEngine

def create_mock_record(image_id, subject_id, sha256):
    return CanonicalRecord(
        image_id=image_id,
        image_path="",
        width=100, height=100,
        source_dataset="test",
        image_sha256=sha256,
        subject_id=subject_id,
        boxes=[]
    )

def test_subject_isolation():
    records = [
        create_mock_record("1", "A", "h1"),
        create_mock_record("2", "A", "h2"),
        create_mock_record("3", "B", "h3"),
        create_mock_record("4", "C", "h4"),
        create_mock_record("5", "D", "h5"),
        create_mock_record("6", "E", "h6"),
    ]
    
    engine = SplitEngine(seed=42)
    res = engine.split(records, ratios=(0.5, 0.25, 0.25))
    splits = res["splits"]
    
    engine.verify_disjointness(splits)
    
    # Check A elements are together
    a_in_train = any(r.subject_id == "A" for r in splits["train"])
    a_in_val = any(r.subject_id == "A" for r in splits["val"])
    a_in_test = any(r.subject_id == "A" for r in splits["test"])
    
    assert sum([a_in_train, a_in_val, a_in_test]) == 1

def test_split_determinism():
    records = [create_mock_record(str(i), f"S{i}", f"h{i}") for i in range(20)]
    engine1 = SplitEngine(seed=10)
    engine2 = SplitEngine(seed=10)
    
    res1 = engine1.split(records)
    res2 = engine2.split(records)
    
    assert [r.image_id for r in res1["splits"]["train"]] == [r.image_id for r in res2["splits"]["train"]]

def test_verify_disjointness_fails_on_overlap():
    records1 = [create_mock_record("1", "A", "h1")]
    records2 = [create_mock_record("2", "A", "h2")]
    
    engine = SplitEngine()
    with pytest.raises(ValueError, match="overlap by subject"):
        engine.verify_disjointness({"train": records1, "val": records2, "test": []})
