from ishkeen_ml.data.schema import CanonicalRecord
from ishkeen_ml.data.hashing import hash_manifest, canonicalize_manifest_for_hashing
from ishkeen_ml.data.duplicates import group_exact_duplicates

def test_manifest_hash_stability():
    r1 = CanonicalRecord(image_id="1", image_path="p1", width=10, height=10, source_dataset="test", image_sha256="abc", boxes=[])
    r2 = CanonicalRecord(image_id="2", image_path="p2", width=10, height=10, source_dataset="test", image_sha256="def", boxes=[])
    
    # Order should not matter
    hash1 = hash_manifest([r1, r2])
    hash2 = hash_manifest([r2, r1])
    
    assert hash1 == hash2

def test_exact_duplicate_grouping():
    r1 = CanonicalRecord(image_id="1", image_path="p1", width=10, height=10, source_dataset="test", image_sha256="abc", boxes=[])
    r2 = CanonicalRecord(image_id="2", image_path="p2", width=10, height=10, source_dataset="test", image_sha256="abc", boxes=[])
    r3 = CanonicalRecord(image_id="3", image_path="p3", width=10, height=10, source_dataset="test", image_sha256="def", boxes=[])
    
    groups = group_exact_duplicates([r1, r2, r3])
    
    assert len(groups) == 2
    assert len(groups["abc"]) == 2
    assert len(groups["def"]) == 1
