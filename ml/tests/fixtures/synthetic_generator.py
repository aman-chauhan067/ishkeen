import os
import json
import hashlib
from PIL import Image, ImageDraw

def create_image(filepath: str, color: tuple, rects: list = None):
    img = Image.new('RGB', (256, 256), color=color)
    draw = ImageDraw.Draw(img)
    if rects:
        for r in rects:
            draw.rectangle(r, outline="red", width=2)
    img.save(filepath)
    with open(filepath, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()

def generate_fixtures():
    base_dir = os.path.dirname(__file__)
    img_dir = os.path.join(base_dir, "images")
    os.makedirs(img_dir, exist_ok=True)
    
    records = []
    
    # 1. Valid single box (Subject A)
    path1 = os.path.join(img_dir, "img1.jpg")
    sha1 = create_image(path1, (200, 200, 255), [(50, 50, 100, 100)])
    records.append({
        "schema_version": "1.0",
        "image_id": "img1",
        "image_path": path1,
        "width": 256,
        "height": 256,
        "subject_id": "subject_A",
        "source_dataset": "synthetic",
        "image_sha256": sha1,
        "boxes": [{"class_id": 0, "class_name": "lesion", "x_min": 50, "y_min": 50, "x_max": 100, "y_max": 100}]
    })
    
    # 2. Multiple boxes (Subject A)
    path2 = os.path.join(img_dir, "img2.jpg")
    sha2 = create_image(path2, (200, 255, 200), [(10, 10, 30, 30), (200, 200, 220, 220)])
    records.append({
        "schema_version": "1.0",
        "image_id": "img2",
        "image_path": path2,
        "width": 256,
        "height": 256,
        "subject_id": "subject_A",
        "source_dataset": "synthetic",
        "image_sha256": sha2,
        "boxes": [
            {"class_id": 0, "class_name": "lesion", "x_min": 10, "y_min": 10, "x_max": 30, "y_max": 30},
            {"class_id": 0, "class_name": "lesion", "x_min": 200, "y_min": 200, "x_max": 220, "y_max": 220}
        ]
    })
    
    # 3. Empty image (Subject B)
    path3 = os.path.join(img_dir, "img3.jpg")
    sha3 = create_image(path3, (255, 200, 200), [])
    records.append({
        "schema_version": "1.0",
        "image_id": "img3",
        "image_path": path3,
        "width": 256,
        "height": 256,
        "subject_id": "subject_B",
        "source_dataset": "synthetic",
        "image_sha256": sha3,
        "boxes": []
    })
    
    # 4. Exact duplicate of img3 (No subject_id, should cluster by SHA256)
    path4 = os.path.join(img_dir, "img4_dup.jpg")
    sha4 = create_image(path4, (255, 200, 200), []) # Same content as img3
    records.append({
        "schema_version": "1.0",
        "image_id": "img4_dup",
        "image_path": path4,
        "width": 256,
        "height": 256,
        "subject_id": None,
        "duplicate_cluster_id": None,
        "source_dataset": "synthetic",
        "image_sha256": sha4,
        "boxes": []
    })

    # 5. Invalid: Zero-area box (No subject_id)
    path5 = os.path.join(img_dir, "img5.jpg")
    sha5 = create_image(path5, (100, 100, 100), [])
    records.append({
        "schema_version": "1.0",
        "image_id": "img5_zero_area",
        "image_path": path5,
        "width": 256,
        "height": 256,
        "subject_id": None,
        "source_dataset": "synthetic",
        "image_sha256": sha5,
        "boxes": [{"class_id": 0, "class_name": "lesion", "x_min": 50, "y_min": 50, "x_max": 50, "y_max": 100}]
    })

    # 6. Invalid: Out of bounds
    path6 = os.path.join(img_dir, "img6.jpg")
    sha6 = create_image(path6, (150, 150, 150), [])
    records.append({
        "schema_version": "1.0",
        "image_id": "img6_oob",
        "image_path": path6,
        "width": 256,
        "height": 256,
        "subject_id": None,
        "source_dataset": "synthetic",
        "image_sha256": sha6,
        "boxes": [{"class_id": 0, "class_name": "lesion", "x_min": 50, "y_min": 50, "x_max": 300, "y_max": 100}]
    })
    
    # 7. Invalid: Negative coordinates
    path7 = os.path.join(img_dir, "img7.jpg")
    sha7 = create_image(path7, (180, 180, 180), [])
    records.append({
        "schema_version": "1.0",
        "image_id": "img7_neg",
        "image_path": path7,
        "width": 256,
        "height": 256,
        "subject_id": None,
        "source_dataset": "synthetic",
        "image_sha256": sha7,
        "boxes": [{"class_id": 0, "class_name": "lesion", "x_min": -10, "y_min": 50, "x_max": 30, "y_max": 100}]
    })

    manifest_path = os.path.join(base_dir, "synthetic_manifest.jsonl")
    with open(manifest_path, 'w') as f:
        for r in records:
            f.write(json.dumps(r) + "\n")
            
    # Also write a purely valid manifest for split testing
    valid_records = records[:4]
    valid_manifest_path = os.path.join(base_dir, "valid_manifest.jsonl")
    with open(valid_manifest_path, 'w') as f:
        for r in valid_records:
            f.write(json.dumps(r) + "\n")
            
    print("Fixtures generated successfully.")

if __name__ == "__main__":
    generate_fixtures()
