import hashlib
import json
from typing import Any, Dict, List
from ishkeen_ml.data.schema import CanonicalRecord

def hash_file(filepath: str) -> str:
    """Returns the SHA-256 hash of a file."""
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        # Read and update hash string value in blocks of 4K
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def canonicalize_manifest_for_hashing(records: List[CanonicalRecord]) -> str:
    """
    Serializes a list of CanonicalRecords deterministically for hashing.
    Records are sorted by image_id since ordering shouldn't matter semantically.
    JSON keys are sorted, and no insignificant whitespace is used.
    """
    sorted_records = sorted(records, key=lambda r: r.image_id)
    # Dump to dicts
    dict_records = [r.model_dump(mode="json") for r in sorted_records]
    
    # Serialize deterministically
    serialized = json.dumps(dict_records, sort_keys=True, separators=(',', ':'))
    return serialized

def hash_manifest(records: List[CanonicalRecord]) -> str:
    """Returns the SHA-256 hash of a canonicalized manifest."""
    serialized = canonicalize_manifest_for_hashing(records)
    return hashlib.sha256(serialized.encode('utf-8')).hexdigest()

class PerceptualHasher:
    """
    Interface for perceptual hashing to identify near-duplicates.
    The implementation is deferred as it requires heavy dependencies (e.g. imagehash, scipy).
    """
    
    def __init__(self):
        # Deferred dependency check would go here.
        pass
        
    def hash_image(self, filepath: str) -> str:
        """
        Calculates a perceptual hash.
        Currently a stub.
        """
        raise NotImplementedError("Perceptual hashing requires optional dependencies (e.g., imagehash).")
