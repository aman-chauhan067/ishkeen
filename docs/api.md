# Ishkeen API Documentation

The Ishkeen backend provides a secure REST API built with FastAPI. It handles user authentication, profile management, image uploads for ML inference, and skincare recommendation generation.

## OpenAPI Usage Guide

The Ishkeen backend auto-generates interactive API documentation conforming to the OpenAPI (Swagger) specification.

1. Run the backend server locally (`uvicorn app.main:app --reload`).
2. Navigate to `http://localhost:8000/docs` in your browser.
3. You can execute API calls directly from this interface.
4. For raw JSON OpenAPI specifications, visit `http://localhost:8000/openapi.json`.

## Authentication Flow

Ishkeen uses cookie-based authentication with secure `HttpOnly` sessions.

1. **Register**: `POST /api/auth/register` with `email` and `password`.
2. **Login**: `POST /api/auth/login` with `email` and `password`. 
   - On success, the server sets a `Set-Cookie` header containing the `ishkeen_session` token.
   - This cookie is automatically sent by the browser in subsequent requests.
3. **Logout**: `POST /api/auth/logout`.
   - Revokes the session in the database and clears the cookie.
4. **Current User**: `GET /api/auth/me`.
   - Returns the active user profile (if the session is valid).

## Upload Flow (ML Inference)

To analyze a skin image, use the Analyses endpoints:

1. **Upload**: `POST /api/analyses`
   - **Content-Type**: `multipart/form-data`
   - **Payload**: `file` (the image bytes, up to 10MB).
   - **Process**: The backend validates the magic bytes, prevents decompression bombs, resizes the image safely, and passes it to the `InferenceService` (ONNX model).
   - **Response**: Returns a `SkinAnalysisResponse` containing the `acne_detected` boolean and `confidence` score.
2. **List Analyses**: `GET /api/analyses` (supports pagination via `page` and `size`).
3. **View Image**: `GET /api/analyses/{analysis_id}/image` returns the raw JPEG stream.

## Recommendation Flow

Recommendations use an Evidence Graph to deterministicly map user profiles to skincare advice.

1. **Submit Questionnaire**: `POST /api/profile/questionnaire`
   - Saves the user's skin type, sensitivities, and environmental factors.
2. **Generate Recommendation**: `POST /api/recommendations/generate`
   - **Body**: `{ "provenance_analysis_id": "<UUID>" }` (optional). If provided, it links the ML analysis results as evidence.
   - **Process**: The Evidence Graph maps conditions to actionable advice, filtering out unsafe ingredients based on the user's profile.
   - **Response**: Returns the selected routine and products. If the `X-Ishkeen-Debug: true` header is provided, it also returns a full decision trace.
3. **List Recommendations**: `GET /api/recommendations`
