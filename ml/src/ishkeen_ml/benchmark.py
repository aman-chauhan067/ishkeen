import time
import torch
from tabulate import tabulate
from ishkeen_ml.models.backbone import BackboneFactory
from ishkeen_ml.training.metrics.benchmark import BenchmarkMetrics

def determine_suitability(latency: float, params: int) -> str:
    if latency < 20.0 and params < 6000000:
        return "Excellent (Mobile Ready)"
    elif latency < 50.0 and params < 15000000:
        return "Good (Edge/Cloud)"
    else:
        return "Poor (Too Heavy)"

def benchmark():
    print("--- BENCHMARK START ---")
    print("Conditions: batch_size=1, image_size=224, precision=fp32, device=cpu")
    print("Accuracy not measured (dataset unavailable).")
    print()
    
    backbones = ["resnet18", "mobilenet_v3_large", "efficientnet_b0"]
    results = []
    
    for name in backbones:
        print(f"Benchmarking {name}...")
        model = BackboneFactory.create(name, pretrained=False)
        metrics = BenchmarkMetrics.compute(
            model=model,
            image_size=224,
            batch_size=1,
            device="cpu",
            warmup_iterations=10,
            iterations=50
        )
        
        suitability = determine_suitability(metrics["latency_ms"], metrics["parameters"])
        
        results.append([
            name,
            f"{metrics['parameters']:,}",
            f"{metrics['model_size_mb']:.1f} MB",
            f"{metrics['latency_ms']:.2f} ms",
            f"{metrics['throughput_img_per_sec']:.1f} img/s",
            f"{metrics['memory_mb']:.1f} MB",
            suitability,
            "Accuracy not measured"
        ])
        
    print("\n--- FINAL RECOMMENDATION TABLE ---")
    headers = ["Backbone", "Parameters", "Model Size", "Latency", "Throughput", "Memory", "Deployment Suitability", "Comments"]
    print(tabulate(results, headers=headers, tablefmt="github"))
    print("--- BENCHMARK END ---")

if __name__ == "__main__":
    benchmark()

