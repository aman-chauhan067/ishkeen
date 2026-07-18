# ML Inference Lifecycle

> From FastAPI startup to prediction result — how Ishkeen loads, preprocesses, infers, and degrades gracefully.

---

## Problem: Phase 9A's Per-Request Model Loading

Phase 9A created a new `InferenceService` instance inside `AnalysisService.__init__()`:

```python
class AnalysisService:
    def __init__(self):
        self.inference = InferenceService()  # loads ONNX model every time
```

This meant:

- **Every request** deserialized the ONNX model from disk (~15 MB).
- **Cold start latency** was paid on every analysis, not just once.
- **Memory** was wasted on duplicate ONNX sessions that were immediately discarded.

---

## Solution: Singleton InferenceService via Lifespan

`InferenceService` is initialized **once** at FastAPI startup and shared across all requests:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.inference_service = InferenceService()
    yield
    # cleanup on shutdown

app = FastAPI(lifespan=lifespan)
```

### Dependency Injection

A FastAPI dependency extracts the singleton from `app.state`:

```python
def get_inference_service(request: Request) -> InferenceService:
    return request.app.state.inference_service
```

`AnalysisService` receives the service as a constructor parameter — it never creates or manages the ONNX session:

```python
class AnalysisService:
    def __init__(self, inference_service: InferenceService):
        self.inference = inference_service  # injected, not constructed
```

---

## ONNX Session Thread Safety

ONNXRuntime's `InferenceSession` is thread-safe. The underlying C++ runtime handles internal locking, so a single session can serve concurrent FastAPI requests without external synchronization.

This is why a singleton pattern works — there is no need for per-thread or per-request sessions.

---

## Preprocessing Pipeline: MLPreprocessor

Image preprocessing is handled by a dedicated `MLPreprocessor` module, separate from inference logic:

```
Raw image bytes
    → Decode (PIL/OpenCV)
    → Resize to 256px (shorter edge)
    → Center crop to 224×224
    → Normalize (ImageNet mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    → HWC → CHW (channel-first for ONNX)
    → Add batch dimension → [1, 3, 224, 224] float32 ndarray
```

| Step | Value | Rationale |
|---|---|---|
| Resize | 256px | Standard ImageNet preprocessing; preserves aspect ratio before crop |
| Center crop | 224×224 | Matches backbone's expected input resolution |
| Normalize | ImageNet mean/std | Pretrained backbones expect ImageNet-normalized inputs |
| Layout | CHW | ONNX models exported from PyTorch expect channel-first layout |

The preprocessor is a pure function: `preprocess(image_bytes: bytes) -> np.ndarray`. No state, no side effects.

---

## Quality Hooks

Before inference, uploaded images pass through quality validation:

### Blur Detection

- **Method**: Laplacian variance — computes the variance of the Laplacian-filtered image.
- **Threshold**: Images below the variance threshold are flagged as too blurry for reliable classification.
- **Rationale**: Blurry skin images produce unreliable predictions. It is better to reject and ask for a re-upload than to return a low-confidence result.

### Brightness Validation

- **Method**: Mean pixel value of the grayscale image.
- **Threshold**: Images that are too dark or too bright are flagged.
- **Rationale**: Extreme lighting conditions distort skin appearance, leading to model predictions that reflect lighting artifacts rather than skin conditions.

Both hooks return a structured `QualityCheckResult`:

```python
@dataclass
class QualityCheckResult:
    passed: bool
    blur_score: float
    brightness_score: float
    messages: List[str]  # human-readable failure reasons
```

Quality checks are advisory — the system can be configured to warn rather than block.

---

## Graceful Degradation

If the ONNX model file is missing at startup or becomes unavailable:

1. `InferenceService.predict()` returns an **abstain status** — not an exception.
2. The abstain result flows through `MLEvidenceAdapter`, which produces an empty concern list.
3. `RecommendationEngine` proceeds with non-ML evidence only.
4. The user receives recommendations — just without ML-augmented signals.

**The system never crashes due to a missing model.** This is critical for:

- First-time deployments before any model has been trained.
- Rolling updates where the model file may briefly be unavailable.
- Development environments where ML infrastructure is not configured.

---

## Full Request Flow

```
HTTP POST /analyze (image upload)
    → FastAPI route handler
    → get_inference_service(request) → singleton InferenceService
    → MLPreprocessor.preprocess(image_bytes) → [1, 3, 224, 224] ndarray
    → Quality hooks (blur, brightness) → QualityCheckResult
    → InferenceService.predict(preprocessed) → {probability, status}
    → Store in SkinAnalysis.ml_results (JSONB)
    → MLEvidenceAdapter.adapt(ml_results, policy) → List[str]
    → RecommendationService merges ML concerns into evidence
    → RecommendationEngine.recommend(evidence) → recommendations
    → HTTP response
```

---

## Why This Matters

1. **Singleton initialization** eliminates ~100ms+ of per-request model loading overhead. The ONNX session is loaded once and amortized across all requests.
2. **Dependency injection** makes `AnalysisService` testable — tests can inject a mock `InferenceService` without touching ONNX or file I/O.
3. **Separated preprocessing** ensures that image normalization logic is testable and consistent between training and inference — a common source of train/serve skew bugs.
4. **Quality hooks** catch garbage-in before it becomes garbage-out. Rejecting a blurry image is a better user experience than returning a meaningless prediction.
5. **Graceful degradation** means the ML subsystem is additive — it enhances recommendations when available but never blocks the core product flow when unavailable.
