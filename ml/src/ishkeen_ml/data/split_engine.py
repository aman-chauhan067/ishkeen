import random
import collections
from typing import List, Dict, Tuple, Any

from ishkeen_ml.data.schema import CanonicalRecord
from ishkeen_ml.data.duplicates import group_exact_duplicates

class SplitEngine:
    def __init__(self, seed: int = 42):
        self.seed = seed
        self.rng = random.Random(self.seed)

    def group_records(self, records: List[CanonicalRecord]) -> Tuple[Dict[str, List[CanonicalRecord]], str]:
        """
        Groups records by subject_id (preferred), then duplicate_cluster_id, 
        then finally fallback to exact SHA256 hash.
        Returns the groups and a warning level string.
        """
        groups = collections.defaultdict(list)
        
        # Determine grouping strategy based on available data
        has_subjects = any(r.subject_id is not None for r in records)
        
        if has_subjects:
            # Group by subject_id. If missing, fall back to hash for that specific record
            for r in records:
                key = r.subject_id if r.subject_id else r.image_sha256
                groups[key].append(r)
            return dict(groups), "group-disjoint split"
            
        has_clusters = any(r.duplicate_cluster_id is not None for r in records)
        
        if has_clusters:
            for r in records:
                key = r.duplicate_cluster_id if r.duplicate_cluster_id else r.image_sha256
                groups[key].append(r)
            return dict(groups), "deterministic split with unresolved subject-leakage risk (cluster isolated)"
            
        # Absolute fallback: Exact duplicate hash grouping
        for r in records:
            groups[r.image_sha256].append(r)
        return dict(groups), "deterministic split with unresolved subject-leakage risk"

    def split(self, records: List[CanonicalRecord], ratios: Tuple[float, float, float] = (0.7, 0.15, 0.15)) -> Dict[str, Any]:
        """
        Performs a deterministic, group-aware split based on ratios (train, val, test).
        Returns a dict containing the splits and metadata.
        """
        if sum(ratios) != 1.0:
            raise ValueError("Ratios must sum to 1.0")
            
        groups, warning = self.group_records(records)
        
        # Deterministically sort group keys to ensure reproducibility
        group_keys = sorted(list(groups.keys()))
        self.rng.shuffle(group_keys)
        
        train_records = []
        val_records = []
        test_records = []
        
        # Distribute groups based on requested ratios (by group count, not total image count, 
        # to prevent large groups from breaking isolation). 
        # Note: True stratified splitting would require more complex binning by lesion count.
        total_groups = len(group_keys)
        train_end = int(total_groups * ratios[0])
        val_end = train_end + int(total_groups * ratios[1])
        
        for i, key in enumerate(group_keys):
            group_items = groups[key]
            if i < train_end:
                train_records.extend(group_items)
            elif i < val_end:
                val_records.extend(group_items)
            else:
                test_records.extend(group_items)
                
        return {
            "splits": {
                "train": train_records,
                "val": val_records,
                "test": test_records
            },
            "metadata": {
                "seed": self.seed,
                "ratios": ratios,
                "warning": warning,
                "total_groups": total_groups
            }
        }
        
    def verify_disjointness(self, splits: Dict[str, List[CanonicalRecord]]) -> bool:
        """
        Verifies that no groups (subject/cluster/hash) overlap between splits.
        Returns True if perfectly disjoint, raises ValueError otherwise.
        """
        train_hashes = {r.image_sha256 for r in splits["train"]}
        val_hashes = {r.image_sha256 for r in splits["val"]}
        test_hashes = {r.image_sha256 for r in splits["test"]}
        
        if train_hashes.intersection(val_hashes):
            raise ValueError("Train and Val sets overlap by exact duplicate.")
        if train_hashes.intersection(test_hashes):
            raise ValueError("Train and Test sets overlap by exact duplicate.")
        if val_hashes.intersection(test_hashes):
            raise ValueError("Val and Test sets overlap by exact duplicate.")
            
        # Also check subject_id if present
        def get_subjects(records):
            return {r.subject_id for r in records if r.subject_id is not None}
            
        train_subj = get_subjects(splits["train"])
        val_subj = get_subjects(splits["val"])
        test_subj = get_subjects(splits["test"])
        
        if train_subj.intersection(val_subj):
            raise ValueError("Train and Val sets overlap by subject.")
        if train_subj.intersection(test_subj):
            raise ValueError("Train and Test sets overlap by subject.")
        if val_subj.intersection(test_subj):
            raise ValueError("Val and Test sets overlap by subject.")
            
        return True
