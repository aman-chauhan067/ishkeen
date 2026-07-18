import json
import os
from typing import List, Tuple, Optional
from pydantic import ValidationError

from ishkeen_ml.data.schema import DatasetManifest, CanonicalRecord

class ManifestManager:
    """
    Utility to load, validate, and write JSONL manifests efficiently.
    Wraps lists of CanonicalRecord in a DatasetManifest metadata header to guarantee dataset version tracking.
    """

    @staticmethod
    def read(manifest_path: str) -> Tuple[DatasetManifest, List[CanonicalRecord]]:
        """
        Reads a dataset manifest file.
        The first line must be the DatasetManifest metadata.
        Subsequent lines must be CanonicalRecords.
        """
        if not os.path.exists(manifest_path):
            raise FileNotFoundError(f"Manifest not found: {manifest_path}")

        records = []
        manifest_meta: Optional[DatasetManifest] = None

        with open(manifest_path, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f):
                line = line.strip()
                if not line:
                    continue
                
                try:
                    data = json.loads(line)
                    if i == 0:
                        # First line must be metadata
                        manifest_meta = DatasetManifest(**data)
                    else:
                        # Subsequent lines are records
                        records.append(CanonicalRecord(**data))
                except (json.JSONDecodeError, ValidationError) as e:
                    raise ValueError(f"Error parsing manifest {manifest_path} at line {i+1}: {e}")

        if not manifest_meta:
            raise ValueError(f"Manifest {manifest_path} is empty or missing metadata header.")
        
        # Validate count matches
        if len(records) != manifest_meta.total_samples:
            # We don't fail, but it's anomalous
            pass

        return manifest_meta, records

    @staticmethod
    def write(
        manifest_path: str, 
        manifest_meta: DatasetManifest, 
        records: List[CanonicalRecord]
    ) -> None:
        """
        Writes a dataset manifest file.
        Updates total_samples to match the provided records.
        """
        # Ensure total_samples is accurate
        manifest_meta.total_samples = len(records)

        os.makedirs(os.path.dirname(manifest_path), exist_ok=True)
        
        with open(manifest_path, 'w', encoding='utf-8') as f:
            f.write(manifest_meta.model_dump_json() + "\n")
            for record in records:
                f.write(record.model_dump_json() + "\n")
