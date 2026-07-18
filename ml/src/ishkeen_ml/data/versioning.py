import json
import os
import hashlib
import subprocess
from datetime import datetime, timezone
from typing import Dict, List, Any
from pydantic import BaseModel

class DatasetLockfile(BaseModel):
    dataset_version: str
    schema_version: str
    creation_date: str
    sample_count: int
    class_distribution: Dict[str, int]
    split_statistics: Dict[str, int]
    generator_version: str
    git_commit: str
    global_hash: str
    lineage_metadata: Dict[str, Any]

class DatasetVersionManager:
    """
    Manages complete dataset traceability and generates versioned lockfiles.
    """
    def __init__(self, releases_dir: str):
        self.releases_dir = releases_dir
        os.makedirs(self.releases_dir, exist_ok=True)

    def _get_git_commit(self) -> str:
        try:
            result = subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True, text=True, check=True)
            return result.stdout.strip()
        except (subprocess.CalledProcessError, FileNotFoundError):
            return "unknown"
            
    def _compute_file_hash(self, filepath: str) -> str:
        sha256_hash = hashlib.sha256()
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    def create_release(
        self,
        version: str,
        manifest_paths: Dict[str, str], # {"train": "path", "val": "path"}
        class_distribution: Dict[str, int],
        split_statistics: Dict[str, int],
        lineage_details: Dict[str, Any]
    ) -> str:
        """
        Creates a DatasetLockfile tracking exactly what went into this version.
        """
        # Compute global hash across all manifests
        hash_sources = []
        total_samples = sum(split_statistics.values())
        
        for split, path in manifest_paths.items():
            if os.path.exists(path):
                file_hash = self._compute_file_hash(path)
                hash_sources.append(f"{split}:{file_hash}")
                
        hash_sources.sort()
        global_hash_input = "|".join(hash_sources).encode('utf-8')
        global_hash = hashlib.sha256(global_hash_input).hexdigest()
        
        lockfile = DatasetLockfile(
            dataset_version=version,
            schema_version="1.0",
            creation_date=datetime.now(timezone.utc).isoformat(),
            sample_count=total_samples,
            class_distribution=class_distribution,
            split_statistics=split_statistics,
            generator_version="ishkeen_ml-0.1.0",
            git_commit=self._get_git_commit(),
            global_hash=global_hash,
            lineage_metadata=lineage_details
        )
        
        release_path = os.path.join(self.releases_dir, f"dataset_{version}_lock.json")
        with open(release_path, "w", encoding="utf-8") as f:
            f.write(lockfile.model_dump_json(indent=2))
            
        return release_path
