import os
import json
import subprocess
import time
import platform
import torch
from datetime import datetime, timezone
from typing import Dict, Any

from ishkeen_ml.training.config import TrainingConfig

class ExperimentTracker:
    """
    Lightweight local experiment tracker writing to experiments/<run_id>/log.json.
    Ensures exact reproducibility by capturing configuration, git commit, python version, 
    torch version, onnx version, hardware information, and timestamps.
    """
    def __init__(self, experiment_dir: str = "experiments", run_name: str = None):
        self.experiment_dir = experiment_dir
        self.run_id = run_name or datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        self.run_dir = os.path.join(self.experiment_dir, self.run_id)
        os.makedirs(self.run_dir, exist_ok=True)
        self.log_file = os.path.join(self.run_dir, "log.json")
        self.start_time = time.time()
        self.log_data = {
            "run_id": self.run_id,
            "timestamp_start": datetime.now(timezone.utc).isoformat(),
            "environment": self._capture_environment(),
            "config": {},
            "dataset_version": "unknown",
            "checkpoints": [],
            "best_metrics": {}
        }
        self._flush()

    def _capture_environment(self) -> Dict[str, Any]:
        env = {
            "python_version": platform.python_version(),
            "torch_version": torch.__version__,
            "onnx_version": "unknown",
            "hardware": {
                "system": platform.system(),
                "processor": platform.processor(),
                "cuda_available": torch.cuda.is_available()
            },
            "git_commit": self._get_git_commit()
        }
        
        try:
            import onnx
            env["onnx_version"] = onnx.__version__
        except ImportError:
            pass
            
        if torch.cuda.is_available():
            env["hardware"]["gpu_name"] = torch.cuda.get_device_name(0)
            env["hardware"]["gpu_count"] = torch.cuda.device_count()
            
        return env
        
    def _get_git_commit(self) -> str:
        try:
            result = subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True, text=True, check=True)
            return result.stdout.strip()
        except (subprocess.CalledProcessError, FileNotFoundError):
            return "unknown"

    def log_config(self, config: TrainingConfig, dataset_version: str):
        self.log_data["config"] = config.model_dump()
        self.log_data["dataset_version"] = dataset_version
        self._flush()

    def log_checkpoint(self, path: str, epoch: int, metrics: Dict[str, Any]):
        self.log_data["checkpoints"].append({
            "path": path,
            "epoch": epoch,
            "metrics": metrics,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        self._flush()
        
    def finalize(self, best_metrics: Dict[str, Any]):
        self.log_data["timestamp_end"] = datetime.now(timezone.utc).isoformat()
        self.log_data["duration_seconds"] = time.time() - self.start_time
        self.log_data["best_metrics"] = best_metrics
        self._flush()
        
    def _flush(self):
        with open(self.log_file, "w", encoding="utf-8") as f:
            json.dump(self.log_data, f, indent=2)
