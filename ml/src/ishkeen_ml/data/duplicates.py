from typing import List, Dict
from ishkeen_ml.data.schema import CanonicalRecord
import collections

def group_exact_duplicates(records: List[CanonicalRecord]) -> Dict[str, List[CanonicalRecord]]:
    """
    Groups records by their image_sha256 hash.
    Returns a dictionary mapping sha256 -> List of records that share that hash.
    """
    groups = collections.defaultdict(list)
    for record in records:
        groups[record.image_sha256].append(record)
    return dict(groups)

def find_duplicate_clusters(records: List[CanonicalRecord]) -> List[List[CanonicalRecord]]:
    """
    Returns only the clusters that contain more than 1 record (i.e. actual duplicates).
    """
    groups = group_exact_duplicates(records)
    return [cluster for cluster in groups.values() if len(cluster) > 1]
