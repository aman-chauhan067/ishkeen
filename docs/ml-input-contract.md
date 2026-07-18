# ML Input Contract

This document defines the stable contract boundary between the Web Application layer (FastAPI) and the ML Inference layer.

## 1. Storage Independence
The ML boundary must **never** accept raw filesystem paths (`image_path: str`). This leaks local development assumptions into the ML layer, breaking compatibility with future distributed workers or S3-compatible cloud storage.

## 2. Input Abstraction
The API boundary will pass an `AnalysisInput` object to the ML service.

```python
class AnalysisInput(BaseModel):
    analysis_id: UUID
    image_bytes: bytes  # The loaded normalized JPEG bytes
    preprocessing_version: str
```
*(Note: `image_bytes` or a generic `BytesIO` stream ensures the ML layer does not need to know where the file came from).*

The ML service will not receive `user_id` or database session instances to ensure strict domain decoupling.

## 3. Output Abstraction
The ML service returns a versionable `AnalysisResult` object.

```python
class FindingDict(BaseModel):
    concern_type: str
    confidence: float
    # severity and region are omitted for Phase 4A until model dataset evaluation proves they are viable

class AnalysisResult(BaseModel):
    model_version: str
    findings: List[FindingDict]
    inference_duration_ms: int
```

## 4. First Model Task Recommendation
- **Scope**: Acne/Breakout-related visual analysis.
- **Task Recommendation**: **Binary Presence Classification** (Acne present: Yes/No, or a singular Confidence score).
- **Reasoning**: We must not assume one model can credibly perform lesion count estimation, severity grading, and localization simultaneously. Binary presence classification is the most realistic task to achieve with publicly available cosmetic datasets.

## 5. Dataset Licensing Research Gates
Prior to downloading or training on any datasets (e.g. ACNE04, Fitzpatrick 17k), the research phase MUST document:
1. Source and License.
2. Commercial vs Non-commercial restrictions.
3. Redistribution rules & Citation requirements.
4. Demographic skin-tone representation (to prevent biased inference).
5. Subject-level identity leakage risk.
