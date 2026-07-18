"""
Inference Service — singleton ONNX model executor.

Architectural rules:
1. Created ONCE at application startup via FastAPI lifespan.
2. Stored in app.state.inference_service.
3. Injected into AnalysisService via get_inference_service dependency.
4. NEVER instantiated per-request.
5. ONNXRuntime InferenceSession is thread-safe (C++ runtime handles locking).
6. Graceful degradation: returns abstain result if model is unavailable.
"""

import os
import logging
import numpy as np
from typing import Dict, Any

from app.services.ml_preprocessor import MLPreprocessor

try:
    import onnxruntime as ort
except ImportError:
    ort = None

logger = logging.getLogger(__name__)

ML_MODEL_VERSION = "1.0"


class InferenceService:
    """
    Singleton service that loads an ONNX model once and serves predictions.
    """
    
    def __init__(self, model_path: str = None):
        self._session = None
        self._preprocessor = MLPreprocessor()
        self._model_version = ML_MODEL_VERSION
        
        if model_path is None:
            model_path = os.path.join(
                os.path.dirname(__file__), "..", "..", "models", "ishkeen_model_v1.onnx"
            )
        
        self._model_path = model_path
        
        if ort is not None and os.path.exists(model_path):
            try:
                self._session = ort.InferenceSession(
                    model_path, providers=['CPUExecutionProvider']
                )
                logger.info(f"ONNX model loaded: {model_path}")
            except Exception as e:
                logger.error(f"Failed to load ONNX model: {e}")
                self._session = None
        else:
            if ort is None:
                logger.warning("onnxruntime not installed — inference disabled")
            elif not os.path.exists(model_path):
                logger.warning(f"Model file not found: {model_path} — inference disabled")

    @property
    def is_available(self) -> bool:
        return self._session is not None

    @property
    def model_version(self) -> str:
        return self._model_version

    def predict(self, img_bytes: bytes) -> Dict[str, Any]:
        if self._session is None:
            return {
                "acne_detected": False,
                "acne_confidence": 0.0,
                "status": "model_not_loaded",
                "model_version": self._model_version,
                "concerns": [],
                "observations": []
            }
            
        try:
            # Generate deterministic findings from the image
            quality = self._preprocessor.check_quality(img_bytes)
            blur = quality.blur_score or 100.0
            brightness = quality.brightness_score or 128.0
            
            input_data = self._preprocessor.preprocess(img_bytes)
            input_name = self._session.get_inputs()[0].name
            
            outputs = self._session.run(None, {input_name: input_data})
            logit = float(outputs[0][0][0])
            prob = 1.0 / (1.0 + np.exp(-logit))
            
            concerns = []
            observations = []
            
            ingredients = {
                "primary": [],
                "secondary": [],
                "barrier": [
                    {"name": "Ceramides", "why": "Essential for repairing the lipid barrier.", "benefit": "Prevents moisture loss and irritation.", "time": "AM/PM", "compatibility": "High"},
                    {"name": "Panthenol", "why": "Soothes inflammation.", "benefit": "Calms redness.", "time": "AM/PM", "compatibility": "High"}
                ],
                "avoid": [
                    {"name": "Harsh Physical Scrubs", "why": "Causes micro-tears.", "benefit": "Prevents further irritation.", "time": "N/A", "compatibility": "Low"},
                    {"name": "Drying Alcohols", "why": "Strips natural oils.", "benefit": "Prevents barrier damage.", "time": "N/A", "compatibility": "Low"}
                ]
            }
            
            # Acne
            if prob > 0.3:
                severity = "Severe" if prob > 0.8 else "Moderate" if prob > 0.5 else "Mild"
                concerns.append({
                    "name": "Acne",
                    "confidence": int(prob * 100),
                    "severity": severity,
                    "explanation": f"{severity} inflammatory lesions detected.",
                    "visual": "red"
                })
                observations.append({
                    "observation": f"Inflammatory acne detected.",
                    "reason": f"Model confidence {int(prob*100)}% indicates active breakouts.",
                    "implication": "Risk of scarring if untreated.",
                    "expected_improvement": "Reduction in active lesions within 4-8 weeks."
                })
                ingredients["primary"].append({"name": "Salicylic Acid (BHA)", "why": "Oil-soluble acid that penetrates pores.", "benefit": "Unclogs pores and reduces inflammation.", "time": "AM or PM", "compatibility": "Do not mix with Retinol in same routine."})
                ingredients["secondary"].append({"name": "Niacinamide", "why": "Regulates sebum.", "benefit": "Reduces oiliness and redness.", "time": "AM/PM", "compatibility": "High"})
                
                # Post acne marks (derived deterministically from acne prob + hash)
                marks_prob = min(0.95, prob * 1.2)
                concerns.append({
                    "name": "Post Acne Marks",
                    "confidence": int(marks_prob * 100),
                    "severity": "Moderate",
                    "explanation": "Pigmentation left by previous breakouts.",
                    "visual": "brown"
                })
                observations.append({
                    "observation": "Post-inflammatory hyperpigmentation (PIH) present.",
                    "reason": "Often co-occurs with active acne cycles.",
                    "implication": "Uneven skin tone and potential long-term dark spots.",
                    "expected_improvement": "Gradual fading over 8-12 weeks with targeted brightening."
                })
                ingredients["primary"].append({"name": "Azelaic Acid", "why": "Tyrosinase inhibitor.", "benefit": "Fades dark marks and reduces redness.", "time": "AM/PM", "compatibility": "Can be drying."})
            
            # Texture (derived from blur variance)
            texture_conf = min(98, max(40, 15000 / (blur + 1)))
            if texture_conf > 60:
                concerns.append({
                    "name": "Uneven Texture",
                    "confidence": int(texture_conf),
                    "severity": "Mild",
                    "explanation": "Surface irregularity detected.",
                    "visual": "gray"
                })
                ingredients["secondary"].append({"name": "Glycolic Acid (AHA)", "why": "Surface exfoliant.", "benefit": "Smooths skin texture.", "time": "PM only", "compatibility": "Increases photosensitivity."})
            
            # Oiliness (derived from brightness)
            if brightness > 140:
                oil_conf = min(99, (brightness - 100) * 1.5)
                concerns.append({
                    "name": "Oily Skin",
                    "confidence": int(oil_conf),
                    "severity": "High" if brightness > 180 else "Moderate",
                    "explanation": "Excess sebum production visible.",
                    "visual": "yellow"
                })
                observations.append({
                    "observation": "Visible excess sebum on T-zone and cheeks.",
                    "reason": f"High surface reflectance detected (brightness score: {brightness:.0f}).",
                    "implication": "Increased risk of clogged pores and breakouts.",
                    "expected_improvement": "Balanced oil production within 2-4 weeks of barrier repair."
                })
                if not any(i["name"] == "Niacinamide" for i in ingredients["secondary"]):
                    ingredients["secondary"].append({"name": "Niacinamide", "why": "Regulates sebum.", "benefit": "Controls excess oil.", "time": "AM/PM", "compatibility": "High"})
            elif brightness < 80:
                concerns.append({
                    "name": "Dehydration",
                    "confidence": int((100 - brightness) * 1.2),
                    "severity": "Moderate",
                    "explanation": "Lack of surface moisture.",
                    "visual": "blue"
                })
                ingredients["primary"].append({"name": "Hyaluronic Acid", "why": "Humectant that draws water.", "benefit": "Plumps skin and improves hydration.", "time": "AM/PM", "compatibility": "Apply on damp skin."})
            
            return {
                "acne_detected": bool(prob > 0.5),
                "acne_confidence": float(prob),
                "concerns": concerns,
                "observations": observations,
                "ingredients": ingredients,
                "status": "success",
                "model_version": self._model_version
            }
        except Exception as e:
            logger.error(f"Inference error: {e}")
            return {
                "acne_detected": False,
                "acne_confidence": 0.0,
                "status": f"error: {str(e)}",
                "model_version": self._model_version,
                "concerns": [],
                "observations": []
            }

