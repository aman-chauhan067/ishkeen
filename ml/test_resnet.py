import torch
from src.ishkeen_ml.models.resnet import IshkeenBaselineModel

def test_model():
    print("Instantiating IshkeenBaselineModel...")
    model = IshkeenBaselineModel(pretrained=False)
    model.eval()
    
    # Create dummy input batch (Batch size: 2, Channels: 3, Height: 224, Width: 224)
    dummy_input = torch.randn(2, 3, 224, 224)
    print(f"Created dummy input with shape: {dummy_input.shape}")
    
    print("Running forward pass...")
    with torch.no_grad():
        output = model(dummy_input)
        
    print(f"Output shape: {output.shape}")
    print(f"Output logits:\n{output}")
    print("Model ran successfully!")

if __name__ == "__main__":
    test_model()
