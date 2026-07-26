import cv2
import numpy as np
import io
from PIL import Image
import mediapipe as mp
try:
    import mediapipe.solutions as mp_solutions
    mp_face_mesh = mp_solutions.face_mesh
except (ImportError, AttributeError):
    mp_face_mesh = getattr(mp, 'solutions', None)
    if mp_face_mesh is not None:
        mp_face_mesh = getattr(mp_face_mesh, 'face_mesh', None)
import logging

logger = logging.getLogger(__name__)

class CVMetrics:
    def __init__(self):
        self.texture_score: float = 0.0 # Higher means rougher
        self.oiliness_score: float = 0.0 # Higher means more specular highlights
        self.redness_score: float = 0.0 # Higher means redder

class CVAnalyzer:
    def __init__(self):
        # Static mode allows it to run on single images
        self.face_mesh = mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5
        )

    def process_image(self, img_bytes: bytes) -> dict:
        """
        Takes raw image bytes, runs MediaPipe to extract ROIs,
        runs OpenCV metrics on ROIs, and returns a dict of metrics
        and base64-encoded visualizations (for dev mode).
        """
        # 1. Decode Image to OpenCV format (RGB for MediaPipe)
        img_np = np.frombuffer(img_bytes, np.uint8)
        img_bgr = cv2.imdecode(img_np, cv2.IMREAD_COLOR)
        
        if img_bgr is None:
            raise ValueError("Failed to decode image bytes")
            
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        h, w, _ = img_rgb.shape

        # 2. Run Face Mesh
        results = self.face_mesh.process(img_rgb)
        
        if not results.multi_face_landmarks:
            raise ValueError("No face detected by MediaPipe")

        landmarks = results.multi_face_landmarks[0]

        # Function to extract ROI from landmark indices
        def get_roi_mask(indices):
            pts = []
            for idx in indices:
                lm = landmarks.landmark[idx]
                x, y = int(lm.x * w), int(lm.y * h)
                pts.append([x, y])
            pts = np.array(pts, np.int32)
            mask = np.zeros((h, w), dtype=np.uint8)
            cv2.fillPoly(mask, [pts], 255)
            
            # Crop the bounding box for processing efficiency
            x, y, bw, bh = cv2.boundingRect(pts)
            # Add padding
            pad = 10
            x1, y1 = max(0, x-pad), max(0, y-pad)
            x2, y2 = min(w, x+bw+pad), min(h, y+bh+pad)
            
            roi_img = img_bgr[y1:y2, x1:x2]
            roi_mask = mask[y1:y2, x1:x2]
            
            # Mask out background in ROI
            roi_img_masked = cv2.bitwise_and(roi_img, roi_img, mask=roi_mask)
            return roi_img_masked, roi_mask

        # --- Define Landmark Regions ---
        # Rough approximations of regions using standard MediaPipe indices
        FOREHEAD_IDX = [103, 67, 109, 10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54] # Note: this is a full face outline roughly. Let's refine.
        
        # Better Forehead
        FOREHEAD_IDX = [10, 109, 67, 103, 54, 21, 162, 127, 234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454, 356, 389, 251, 284, 332, 297, 338]
        # Actually, MediaPipe Face Mesh canonical forehead:
        FOREHEAD = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109] # this is a full loop of the face.
        
        # Simpler ROIs based on center coordinates for a crop
        def crop_center_roi(landmark_center_idx, width_ratio=0.15, height_ratio=0.15):
            lm = landmarks.landmark[landmark_center_idx]
            cx, cy = int(lm.x * w), int(lm.y * h)
            rx = int(w * width_ratio / 2)
            ry = int(h * height_ratio / 2)
            
            x1, y1 = max(0, cx-rx), max(0, cy-ry)
            x2, y2 = min(w, cx+rx), min(h, cy+ry)
            
            return img_bgr[y1:y2, x1:x2], np.ones((y2-y1, x2-x1), dtype=np.uint8) * 255

        # Extract regions
        # 10 is top of forehead, 152 is chin, 1 is tip of nose, 234 is left cheek edge, 454 is right cheek edge
        # Left cheek (from user perspective, so right side of image)
        left_cheek, lc_mask = crop_center_roi(234, 0.15, 0.15) 
        # Right cheek
        right_cheek, rc_mask = crop_center_roi(454, 0.15, 0.15)
        # Forehead
        forehead, fh_mask = crop_center_roi(10, 0.2, 0.1)
        # Nose
        nose, nose_mask = crop_center_roi(1, 0.1, 0.15)

        # --- OpenCV Metrics Calculation ---
        def calc_texture(roi, mask):
            if roi.size == 0: return 0
            gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            # Laplacian variance is a measure of blur/texture
            lap = cv2.Laplacian(gray, cv2.CV_64F)
            return np.var(lap)

        def calc_oiliness(roi, mask):
            if roi.size == 0: return 0
            gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            # Threshold top 5% of brightness to find specular highlights
            # Normalize brightness
            gray = cv2.normalize(gray, None, 0, 255, cv2.NORM_MINMAX)
            _, thresh = cv2.threshold(gray, 230, 255, cv2.THRESH_BINARY)
            # Ratio of bright pixels
            bright_ratio = np.sum(thresh == 255) / (np.sum(mask == 255) + 1e-5)
            return bright_ratio * 100

        def calc_redness(roi, mask):
            if roi.size == 0: return 0
            lab = cv2.cvtColor(roi, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            # 'a' channel: higher is redder. 128 is neutral.
            # Mask out background
            a_masked = cv2.bitwise_and(a, a, mask=mask)
            mean_a = cv2.mean(a_masked, mask=mask)[0]
            # Neutralize: 128 is center
            return max(0, mean_a - 128)

        # Calculate metrics
        texture_val = (calc_texture(left_cheek, lc_mask) + calc_texture(right_cheek, rc_mask)) / 2
        oiliness_val = max(calc_oiliness(forehead, fh_mask), calc_oiliness(nose, nose_mask))
        redness_val = (calc_redness(left_cheek, lc_mask) + calc_redness(right_cheek, rc_mask)) / 2
        
        # Create a visualization image for Dev Mode
        dev_img = img_bgr.copy()
        
        # Draw ROIs on dev_img
        def draw_box(center_idx, width_ratio=0.15, height_ratio=0.15, color=(0, 255, 0)):
            lm = landmarks.landmark[center_idx]
            cx, cy = int(lm.x * w), int(lm.y * h)
            rx = int(w * width_ratio / 2)
            ry = int(h * height_ratio / 2)
            cv2.rectangle(dev_img, (cx-rx, cy-ry), (cx+rx, cy+ry), color, 2)
            
        draw_box(234, color=(255, 0, 0)) # Left cheek (Blue)
        draw_box(454, color=(255, 0, 0)) # Right cheek (Blue)
        draw_box(10, 0.2, 0.1, color=(0, 255, 255)) # Forehead (Yellow)
        draw_box(1, 0.1, 0.15, color=(0, 255, 255)) # Nose (Yellow)
        
        # Encode dev image
        _, buffer = cv2.imencode('.jpg', dev_img)
        import base64
        dev_img_b64 = base64.b64encode(buffer).decode('utf-8')

        return {
            "metrics": {
                "texture_laplacian_variance": float(texture_val),
                "oiliness_specular_ratio": float(oiliness_val),
                "redness_a_channel_shift": float(redness_val)
            },
            "dev_visualization_b64": dev_img_b64
        }
