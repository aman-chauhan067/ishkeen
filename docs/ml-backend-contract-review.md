# ML Backend Contract Review

## Current Backend State
The current Ishkeen backend successfully implements:
- `SkinAnalysis` database model with strict status state machine (`created`, `uploaded`, `ready`, `processing`, `completed`, `failed`).
- Local `ImageStorage` abstraction.
- Authenticated HTTP endpoints that accept images and link them to `QuestionnaireSubmission` provenance.
- Preprocessing that strips EXIF data and normalizes images to RGB JPEGs.

## Proposed Inference Integration Boundary
To keep the FastAPI web server responsive and memory footprint low, the ML inference should be isolated.
**Recommendation**: 
The inference boundary should be a background task (e.g., Celery/Redis or simple FastAPI `BackgroundTasks`) that loads an exported ONNX model. The web request returns a `202 Accepted` status, and the frontend polls for completion.

## Internal Detection Representation (Raw)
Internally, the inference service will generate raw bounding boxes and confidence scores for every detected lesion.
```json
{
  "model_version": "1.0-onnx",
  "task": "acne_lesion_detection",
  "detections": [
    {"class": "lesion", "confidence": 0.85, "box": [10, 20, 30, 40]}
  ],
  "latency_ms": 45
}
```

## Aggregate User-Facing Representation (Safe)
To comply with our allowed product claims (ADR 0009), the raw detections must **never** be exposed directly to the frontend. The backend will aggregate the raw data into a safe summary.
```json
{
  "prediction_text": "Visible breakout pattern detected",
  "max_confidence": 0.85,
  "abstained": false
}
```

## Storage Policy for Raw Boxes
**Recommendation**: 
Do **NOT** store the raw bounding box JSON arrays in PostgreSQL `AnalysisFinding` tables.
Storing dense coordinate arrays in Postgres bloats the DB unnecessarily. 
If raw boxes are needed for debugging or future model retraining, they should be serialized to a JSON file and stored in the `ImageStorage` bucket (e.g., alongside the image as `analysis_123_boxes.json`). The database should only store the aggregate finding and the storage key to the raw JSON.
