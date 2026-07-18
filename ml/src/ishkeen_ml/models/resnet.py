import torch.nn as nn
from torchvision.models import resnet18, ResNet18_Weights

class IshkeenBaselineModel(nn.Module):
    """
    Baseline Ishkeen ML Model using ResNet18 backbone.
    Outputs a single sigmoid logit for binary classification (acne / no acne).
    """
    def __init__(self, pretrained: bool = True):
        super().__init__()
        weights = ResNet18_Weights.DEFAULT if pretrained else None
        self.backbone = resnet18(weights=weights)
        
        # Replace the classifier head
        num_features = self.backbone.fc.in_features
        self.backbone.fc = nn.Sequential(
            nn.Dropout(0.2),
            nn.Linear(num_features, 1)
        )

    def forward(self, x):
        """
        x: [B, C, H, W] tensor of images
        returns: [B, 1] logits
        """
        return self.backbone(x)
