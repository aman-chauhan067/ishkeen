"""
ONNX Export — exports a trained PyTorch model to ONNX format for production inference.

Uses BackboneFactory to support configurable architectures.
"""

import os
import torch
from ishkeen_ml.models.backbone import BackboneFactory, DEFAULT_BACKBONE
import logging

logger = logging.getLogger("ishkeen_ml.export")


def export_to_onnx(
    model_path: str, 
    output_path: str, 
    backbone: str = DEFAULT_BACKBONE
):
    """
    Export a trained PyTorch model to ONNX format.
    
    Parameters:
        model_path: Path to .pt weights file (skipped if not found).
        output_path: Path to save the .onnx file.
        backbone: Backbone architecture name from BackboneFactory.
    """
    model = BackboneFactory.create(backbone, pretrained=False)
    
    if os.path.exists(model_path):
        model.load_state_dict(torch.load(model_path, map_location='cpu'))
    else:
        logger.warning("No trained weights found at %s. Exporting randomly initialized model.", model_path)
        
    model.eval()
    
    dummy_input = torch.randn(1, 3, 224, 224, requires_grad=True)
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    torch.onnx.export(
        model, 
        dummy_input, 
        output_path, 
        export_params=True,
        opset_version=18, 
        do_constant_folding=True, 
        input_names=['input'], 
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )
    logger.info("Model (%s) successfully exported to %s", backbone, output_path)


if __name__ == "__main__":
    model_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "backend", "models")
    export_to_onnx("dummy.pth", os.path.join(model_dir, "ishkeen_model_v1.onnx"))
