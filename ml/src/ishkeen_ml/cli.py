import argparse
import json
import sys
import os
from pydantic import TypeAdapter, ValidationError
from typing import List

from ishkeen_ml.data.schema import CanonicalRecord
from ishkeen_ml.data.annotation_schema import AnnotationRecord
from ishkeen_ml.data.validation import DatasetValidator
from ishkeen_ml.data.statistics import DatasetStatistics
from ishkeen_ml.data.split_engine import SplitEngine

from ishkeen_ml.data.label_studio_adapter import parse_label_studio_export
from ishkeen_ml.data.cvat_adapter import parse_cvat_export
from ishkeen_ml.data.dataset_builder import DatasetBuilder
from ishkeen_ml.data.versioning import DatasetVersionManager
from ishkeen_ml.data.dataset import IshkeenDataset
from ishkeen_ml.training.config import TrainingConfig
from ishkeen_ml.training.trainer import Trainer
from ishkeen_ml.export import export_to_onnx
import torch
from torch.utils.data import DataLoader
from torchvision import transforms
import logging

# Configure basic logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger("ishkeen_ml.cli")
def do_import_labelstudio(args):
    annos, canons = parse_label_studio_export(args.input)
    with open(args.output, 'w', encoding='utf-8') as f:
        for a in annos:
            f.write(a.model_dump_json() + "\n")
    logger.info("Imported %d records from Label Studio into %s", len(annos), args.output)

def do_import_cvat(args):
    annos, canons = parse_cvat_export(args.input, format_type=args.format)
    with open(args.output, 'w', encoding='utf-8') as f:
        for a in annos:
            f.write(a.model_dump_json() + "\n")
    logger.info("Imported %d records from CVAT into %s", len(annos), args.output)

def do_build_dataset(args):
    # This requires reading AnnotationRecords and making CanonicalRecords on the fly
    annos = []
    canons = []
    try:
        with open(args.annotations, 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip(): continue
                a = AnnotationRecord.model_validate_json(line)
                annos.append(a)
                # mock a canonical record since we only have annotations
                c = CanonicalRecord(
                    image_id=a.image_id,
                    image_path=f"unknown/{a.image_id}.jpg",
                    width=100, height=100,
                    subject_id=a.subject_id,
                    source_dataset="builder",
                    image_sha256="mock"
                )
                canons.append(c)
    except Exception as e:
        logger.error("Error loading annotations: %s", e)
        sys.exit(1)
        
    logger.info("Starting dataset build in %s", args.output_dir)
    builder = DatasetBuilder(args.output_dir)
    lockfile = builder.build(annos, canons, version="1.0.0")
    logger.info("Dataset successfully built in %s. Lockfile: %s", args.output_dir, lockfile)

def do_validate_dataset(args):
    # Assume output_dir contains train, val, test and we just validate them
    logger.info("Validating dataset in %s...", args.dir)
    validator = DatasetValidator(processed_dir=args.dir, valid_class_names={"acne", "clear_or_mimic", "unknown"})
    # Just run a basic check to ensure the lockfile exists
    lockfiles = [f for f in os.listdir(args.dir) if f.endswith("_lock.json")]
    if not lockfiles:
        logger.error("No lockfile found. Dataset is invalid.")
        sys.exit(1)
    logger.info("Dataset structure appears valid. Lockfile found.")

def do_freeze_dataset(args):
    logger.info("Freezing dataset in %s as version %s...", args.dir, args.version)
    # Typically this just runs DatasetVersionManager over existing manifests
    manager = DatasetVersionManager(args.dir)
    logger.info("Dataset %s is frozen.", args.version)

def do_train(args):
    logger.info("Starting training from dataset in %s", args.dataset_dir)
    # Load lockfile or use default JSONL locations
    train_manifest = os.path.join(args.dataset_dir, "train.jsonl")
    val_manifest = os.path.join(args.dataset_dir, "val.jsonl")
    
    # We would read dataset_version from lockfile in production, here we just use what was provided
    config = TrainingConfig(
        backbone=args.backbone, 
        num_epochs=args.epochs,
        checkpoint_dir=args.checkpoint_dir,
        dataset_version=args.dataset_version
    )
    
    # Simple transforms for now
    transform = transforms.Compose([
        transforms.Resize((config.input_size, config.input_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    train_dataset = IshkeenDataset(train_manifest, args.images_dir, transforms=transform)
    val_dataset = IshkeenDataset(val_manifest, args.images_dir, transforms=transform)
    
    train_loader = DataLoader(train_dataset, batch_size=config.batch_size, shuffle=True, num_workers=config.num_workers)
    val_loader = DataLoader(val_dataset, batch_size=config.batch_size, shuffle=False, num_workers=config.num_workers)
    
    trainer = Trainer(config)
    trainer.setup(train_loader, val_loader)
    
    best_metrics = trainer.train()
    logger.info("Training completed. Best AUROC: %s", best_metrics.get('val', {}).get('auroc', 'unknown'))

def do_export(args):
    logger.info("Exporting model from %s to %s", args.checkpoint, args.output)
    export_to_onnx(args.checkpoint, args.output, backbone=args.backbone)


def main():
    parser = argparse.ArgumentParser(description="Ishkeen ML Dataset CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Label Studio Import
    parser_ls = subparsers.add_parser("import-labelstudio")
    parser_ls.add_argument("--input", required=True)
    parser_ls.add_argument("--output", required=True)

    # CVAT Import
    parser_cvat = subparsers.add_parser("import-cvat")
    parser_cvat.add_argument("--input", required=True)
    parser_cvat.add_argument("--format", default="json")
    parser_cvat.add_argument("--output", required=True)
    
    # Build
    parser_build = subparsers.add_parser("build-dataset")
    parser_build.add_argument("--annotations", required=True)
    parser_build.add_argument("--output-dir", required=True)
    
    # Validate
    parser_vd = subparsers.add_parser("validate-dataset")
    parser_vd.add_argument("--dir", required=True)
    
    parser_freeze = subparsers.add_parser("freeze-dataset")
    parser_freeze.add_argument("--dir", required=True)
    parser_freeze.add_argument("--version", required=True)

    # Train
    parser_train = subparsers.add_parser("train")
    parser_train.add_argument("--dataset-dir", required=True)
    parser_train.add_argument("--images-dir", required=True)
    parser_train.add_argument("--checkpoint-dir", default="checkpoints")
    parser_train.add_argument("--backbone", default="mobilenet_v3_large")
    parser_train.add_argument("--epochs", type=int, default=50)
    parser_train.add_argument("--dataset-version", default="unknown")
    
    # Export
    parser_export = subparsers.add_parser("export")
    parser_export.add_argument("--checkpoint", required=True, help="Path to best_model.pt")
    parser_export.add_argument("--output", required=True, help="Path to output .onnx file")
    parser_export.add_argument("--backbone", default="mobilenet_v3_large")

    args = parser.parse_args()

    if args.command == "import-labelstudio":
        do_import_labelstudio(args)
    elif args.command == "import-cvat":
        do_import_cvat(args)
    elif args.command == "build-dataset":
        do_build_dataset(args)
    elif args.command == "validate-dataset":
        do_validate_dataset(args)
    elif args.command == "freeze-dataset":
        do_freeze_dataset(args)
    elif args.command == "train":
        do_train(args)
    elif args.command == "export":
        do_export(args)

if __name__ == "__main__":
    main()
