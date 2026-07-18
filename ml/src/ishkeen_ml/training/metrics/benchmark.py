import time
import torch
import torch.nn as nn
from typing import Dict, Any

class BenchmarkMetrics:
    """
    Computes strict benchmarking metrics for model evaluation.
    Metrics: Latency, Throughput, Memory, Parameters, Size.
    """
    @staticmethod
    def compute(
        model: nn.Module, 
        image_size: int = 224, 
        batch_size: int = 1, 
        device: str = "cpu",
        warmup_iterations: int = 10,
        iterations: int = 50
    ) -> Dict[str, Any]:
        """
        Runs a benchmark on the given model under isolated, identical conditions.
        """
        model.eval()
        model.to(device)
        
        dummy_input = torch.randn(batch_size, 3, image_size, image_size).to(device)
        
        # Warmup
        with torch.no_grad():
            for _ in range(warmup_iterations):
                _ = model(dummy_input)
                
        # Latency / Throughput measurement
        start = time.perf_counter()
        with torch.no_grad():
            for _ in range(iterations):
                _ = model(dummy_input)
        end = time.perf_counter()
        
        total_time = end - start
        avg_latency_ms = (total_time / iterations) * 1000.0
        throughput = (batch_size * iterations) / total_time
        
        # Parameter count
        params = sum(p.numel() for p in model.parameters() if p.requires_grad)
        
        # Model Size (Approximate bytes = params * 4 for FP32)
        model_size_mb = (params * 4) / (1024 * 1024)
        
        # Memory estimation (simple peak estimation for PyTorch)
        memory_mb = 0.0
        if device.startswith("cuda"):
            torch.cuda.reset_peak_memory_stats(device)
            with torch.no_grad():
                _ = model(dummy_input)
            memory_mb = torch.cuda.max_memory_allocated(device) / (1024 * 1024)
        else:
            # CPU memory estimation is harder in pure PyTorch without external libs,
            # we estimate it based on parameter size + activations sizes (roughly 3x model size)
            memory_mb = model_size_mb * 3.0
            
        return {
            "parameters": params,
            "model_size_mb": model_size_mb,
            "latency_ms": avg_latency_ms,
            "throughput_img_per_sec": throughput,
            "memory_mb": memory_mb
        }
