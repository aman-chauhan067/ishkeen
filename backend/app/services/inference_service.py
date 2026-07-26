"""
Inference Service — Hybrid CV Pipeline.

Architectural rules:
1. Created ONCE at application startup via FastAPI lifespan.
2. Stored in app.state.inference_service.
3. Injected into AnalysisService via get_inference_service dependency.
4. Uses MediaPipe + OpenCV + Gemini Vision.
5. Returns Canonical Evidence Graph.
"""

import logging
from typing import Dict, Any

from app.services.hybrid_inference.cv_analyzer import CVAnalyzer
from app.services.hybrid_inference.gemini_vision import GeminiVisionService
from app.services.hybrid_inference.fusion import EvidenceFusionService

logger = logging.getLogger(__name__)

ML_MODEL_VERSION = "hybrid-1.0"


class InferenceService:
    """
    Singleton service that orchestrates the Hybrid CV Pipeline.
    """
    
    def __init__(self, model_path: str = None):
        self._model_version = ML_MODEL_VERSION
        
        try:
            self.cv_analyzer = CVAnalyzer()
            self.gemini_vision = GeminiVisionService()
            logger.info("Hybrid Inference Pipeline initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Hybrid Inference Pipeline: {e}")
            self.cv_analyzer = None
            self.gemini_vision = None

    @property
    def is_available(self) -> bool:
        return self.cv_analyzer is not None and self.gemini_vision is not None and self.gemini_vision.is_configured

    @property
    def model_version(self) -> str:
        return self._model_version

    def predict(self, img_bytes: bytes) -> Dict[str, Any]:
        """
        Main entrypoint for the inference pipeline.
        """
        if not self.is_available:
            return {
                "acne_detected": False,
                "acne_confidence": 0.0,
                "status": "model_not_loaded",
                "model_version": self._model_version,
                "concerns": [],
                "observations": []
            }
            
        try:
            # 1. MediaPipe & OpenCV
            cv_results = self.cv_analyzer.process_image(img_bytes)
            metrics = cv_results["metrics"]
            
            # 2. Gemini Semantic Observation
            gemini_json = self.gemini_vision.analyze(img_bytes, metrics)
            
            # 3. Fusion to Canonical Evidence
            final_graph = EvidenceFusionService.fuse(metrics, gemini_json)
            
            return final_graph
            
        except Exception as e:
            logger.error(f"Hybrid Inference error: {e}")
            # Fallback gracefully
            return {
                "acne_detected": False,
                "acne_confidence": 0.0,
                "status": f"error: {str(e)}",
                "model_version": self._model_version,
                "concerns": [],
                "observations": []
            }

    def dev_debug(self, img_bytes: bytes) -> Dict[str, Any]:
        """
        Special endpoint for Developer Mode. Returns ALL raw intermediates.
        """
        if not self.is_available:
            raise ValueError("Pipeline not available. Check GEMINI_API_KEY.")
            
        # 1. OpenCV
        cv_results = self.cv_analyzer.process_image(img_bytes)
        metrics = cv_results["metrics"]
        dev_img_b64 = cv_results["dev_visualization_b64"]
        
        # 2. Gemini
        gemini_json = self.gemini_vision.analyze(img_bytes, metrics)
        
        # 3. Fusion
        final_graph = EvidenceFusionService.fuse(metrics, gemini_json)
        
        return {
            "cv_metrics": metrics,
            "dev_visualization_b64": dev_img_b64,
            "gemini_raw_json": gemini_json,
            "final_evidence_graph": final_graph
        }
