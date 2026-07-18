"""
Tests for InferenceService, MLPreprocessor, and DI lifecycle.
"""

import io
import pytest
import numpy as np
from PIL import Image

from app.services.ml_preprocessor import MLPreprocessor, QualityCheckResult
from app.services.inference_service import InferenceService


def _create_test_image(width=600, height=600, color=(128, 128, 128)) -> bytes:
    """Create a test JPEG image in memory."""
    img = Image.new("RGB", (width, height), color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()


class TestMLPreprocessor:
    def test_preprocess_shape(self):
        preprocessor = MLPreprocessor()
        img_bytes = _create_test_image()
        result = preprocessor.preprocess(img_bytes)
        
        assert isinstance(result, np.ndarray)
        assert result.shape == (1, 3, 224, 224)
        assert result.dtype == np.float32

    def test_preprocess_normalization_range(self):
        """After ImageNet normalization, values should be roughly in [-2.5, 2.5]."""
        preprocessor = MLPreprocessor()
        img_bytes = _create_test_image()
        result = preprocessor.preprocess(img_bytes)
        
        assert result.min() > -5.0
        assert result.max() < 5.0

    def test_quality_check_good_image(self):
        preprocessor = MLPreprocessor()
        img_bytes = _create_test_image()
        result = preprocessor.check_quality(img_bytes)
        
        assert isinstance(result, QualityCheckResult)
        assert result.brightness_score is not None

    def test_quality_check_dark_image(self):
        preprocessor = MLPreprocessor()
        img_bytes = _create_test_image(color=(5, 5, 5))  # Very dark
        result = preprocessor.check_quality(img_bytes)
        
        assert result.brightness_score is not None
        assert result.brightness_score < 30.0
        assert not result.passed
        assert any("dark" in issue.lower() for issue in result.issues)

    def test_quality_check_bright_image(self):
        preprocessor = MLPreprocessor()
        img_bytes = _create_test_image(color=(250, 250, 250))  # Very bright
        result = preprocessor.check_quality(img_bytes)
        
        assert result.brightness_score is not None
        assert result.brightness_score > 240.0
        assert not result.passed
        assert any("overexposed" in issue.lower() for issue in result.issues)


class TestInferenceService:
    def test_no_model_returns_not_loaded(self):
        """When model file doesn't exist, predict returns model_not_loaded."""
        service = InferenceService(model_path="/nonexistent/model.onnx")
        assert not service.is_available
        
        img_bytes = _create_test_image()
        result = service.predict(img_bytes)
        
        assert result["status"] == "model_not_loaded"
        assert result["acne_detected"] == False
        assert result["acne_confidence"] == 0.0
        assert "model_version" in result

    def test_model_version_always_present(self):
        service = InferenceService(model_path="/nonexistent/model.onnx")
        result = service.predict(_create_test_image())
        assert "model_version" in result

    def test_is_available_property(self):
        service = InferenceService(model_path="/nonexistent/model.onnx")
        assert service.is_available == False


class TestDependencyInjection:
    """Test that the DI wiring is correct at import level."""
    
    def test_get_inference_service_importable(self):
        from app.api.deps import get_inference_service
        assert callable(get_inference_service)

    def test_analysis_service_requires_inference(self):
        """AnalysisService constructor requires an InferenceService parameter."""
        from app.services.analysis_service import AnalysisService
        import inspect
        sig = inspect.signature(AnalysisService.__init__)
        params = list(sig.parameters.keys())
        assert "inference_service" in params
