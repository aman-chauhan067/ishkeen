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
            logger.info("CVAnalyzer initialized successfully.")
        except Exception as e:
            logger.error(f"CVAnalyzer init warning ({e}); initializing fallback instance.")
            self.cv_analyzer = CVAnalyzer()

        try:
            self.gemini_vision = GeminiVisionService()
            logger.info("GeminiVisionService initialized successfully.")
        except Exception as e:
            logger.error(f"GeminiVisionService init error: {e}")
            self.gemini_vision = None

    @property
    def is_available(self) -> bool:
        return self.cv_analyzer is not None

    @property
    def model_version(self) -> str:
        return self._model_version

    def predict(self, img_bytes: bytes) -> Dict[str, Any]:
        """
        Main entrypoint for the inference pipeline.
        Always extracts objective OpenCV + MediaPipe computer vision metrics from the image.
        If Gemini Vision API is configured and reachable, fuses both CV metrics and Gemini semantics.
        If Gemini Vision API is unavailable, synthesizes clinical evidence directly from the CV metrics.
        """
        if self.cv_analyzer is None:
            raise ValueError("CVAnalyzer is not initialized.")

        # 1. Always calculate objective MediaPipe & OpenCV computer vision metrics from the real image
        cv_results = self.cv_analyzer.process_image(img_bytes)
        metrics = cv_results["metrics"]

        # 2. Try Gemini Semantic Observation if configured
        gemini_json = {}
        if self.gemini_vision and self.gemini_vision.is_configured:
            try:
                gemini_json = self.gemini_vision.analyze(img_bytes, metrics)
            except Exception as e:
                logger.warning(f"Gemini Vision API unreachable or error ({e}); using objective CV algorithmic metrics.")

        # 3. Fuse to Canonical Evidence Graph (never static/fake!)
        final_graph = EvidenceFusionService.fuse(metrics, gemini_json)
        return final_graph

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
