import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from PIL import Image
from typing import List
from ishkeen_ml.data.annotation_schema import AnnotationRecord

class DatasetVisualizer:
    def __init__(self, output_dir: str):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        
    def plot_bounding_boxes(
        self, 
        image_path: str, 
        record: AnnotationRecord,
        output_filename: str
    ) -> None:
        """
        Draws an image and overlays its bounding boxes, saving to disk for human QA.
        """
        if not os.path.exists(image_path):
            return
            
        try:
            img = Image.open(image_path).convert("RGB")
            fig, ax = plt.subplots(1, figsize=(8, 8))
            ax.imshow(img)
            
            for box in record.bounding_boxes:
                width = box.x_max - box.x_min
                height = box.y_max - box.y_min
                
                rect = patches.Rectangle(
                    (box.x_min, box.y_min), width, height,
                    linewidth=2, edgecolor='r', facecolor='none'
                )
                ax.add_patch(rect)
                plt.text(
                    box.x_min, box.y_min - 5, box.class_name, 
                    color='red', fontsize=12, weight='bold'
                )
                
            plt.axis('off')
            plt.tight_layout()
            
            save_path = os.path.join(self.output_dir, output_filename)
            plt.savefig(save_path, bbox_inches='tight', dpi=150)
            plt.close()
            
        except Exception as e:
            print(f"Failed to generate visualization for {image_path}: {e}")
            
    def plot_class_distribution(
        self, 
        class_counts: dict,
        output_filename: str
    ) -> None:
        """
        Generates a bar chart of class frequencies.
        """
        if not class_counts:
            return
            
        classes = list(class_counts.keys())
        counts = list(class_counts.values())
        
        plt.figure(figsize=(10, 6))
        plt.bar(classes, counts, color='skyblue')
        plt.xlabel('Classes')
        plt.ylabel('Frequency')
        plt.title('Class Distribution')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        
        save_path = os.path.join(self.output_dir, output_filename)
        plt.savefig(save_path)
        plt.close()
