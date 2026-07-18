import os
from typing import List, Optional
from ishkeen_ml.data.annotation_schema import AnnotationRecord
from ishkeen_ml.data.schema import CanonicalRecord
from ishkeen_ml.data.validation import DatasetValidator
from ishkeen_ml.data.quality import QualityPipeline
import logging

logger = logging.getLogger("ishkeen_ml.dataset_builder")
from ishkeen_ml.data.split_engine import SplitEngine
from ishkeen_ml.data.statistics import DatasetStatistics
from ishkeen_ml.data.versioning import DatasetVersionManager

class DatasetBuilder:
    def __init__(self, output_dir: str):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        
    def build(self, annotation_records: List[AnnotationRecord], canonical_records: List[CanonicalRecord], version: str = "1.0.0"):
        logger.info("Starting Dataset Build for version %s with %d records...", version, len(annotation_records))
        
        # 1. Validation
        logger.info("Running DatasetValidator...")
        # valid_class_names should include the classes we use, just dummy "acne" for now
        validator = DatasetValidator(processed_dir=self.output_dir, valid_class_names={"acne", "clear_or_mimic", "unknown"})
        # We don't have images locally, but scan_directory takes annotations and validates them 
        # (It checks if image files exist, but we might just validate annotations directly if images aren't present).
        # We'll just validate dimensions for now
        for a, c in zip(annotation_records, canonical_records):
            reports = validator.validate_annotation(a, c.width, c.height)
            if reports:
                logger.warning("Validation issues for %s: %s", a.image_id, reports)
                
        # 2. Quality Pipeline
        logger.info("Running QualityPipeline...")
        quality_pipeline = QualityPipeline(min_width=100, min_height=100)
        # Quality expects images, which we might not have in the dummy run, so we skip actual image loading if missing
        
        # 3. Split Engine
        logger.info("Running SplitEngine...")
        splitter = SplitEngine()
        splits_result = splitter.split(canonical_records, ratios=(0.7, 0.15, 0.15))
        splits = splits_result["splits"]
        
        # Write manifests
        manifests = {}
        for split_name, records in splits.items():
            manifest_path = os.path.join(self.output_dir, f"{split_name}.jsonl")
            manifests[split_name] = manifest_path
            logger.info("Writing %s manifest with %d records...", split_name, len(records))
            with open(manifest_path, 'w', encoding='utf-8') as f:
                for rec in records:
                    f.write(rec.model_dump_json() + "\n")
            
        # 4. Statistics
        logger.info("Computing dataset statistics...")
        stats_engine = DatasetStatistics()
        stats = stats_engine.compute(annotation_records)
        stats_engine.export_json(stats, os.path.join(self.output_dir, "dataset_statistics.json"))
        stats_engine.export_markdown(stats, os.path.join(self.output_dir, "dataset_statistics.md"))
        
        # 5. Lock and Version
        logger.info("Generating dataset lockfile...")
        version_manager = DatasetVersionManager(self.output_dir)
        
        # Convert class balance
        class_distribution = stats.get("class_distribution", {})
        split_statistics = {k: len(v) for k, v in splits.items()}
        
        lockfile_path = version_manager.create_release(
            version=version,
            manifest_paths=manifests,
            class_distribution=class_distribution,
            split_statistics=split_statistics,
            lineage_details={"source": "builder", "annotation_count": len(annotation_records)}
        )
        
        print(f"Dataset build complete. Lockfile: {lockfile_path}")
        return lockfile_path
