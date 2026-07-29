import os
import json
import logging
from typing import Dict, Any

try:
    import google.generativeai as genai
    from google.generativeai.types import HarmCategory, HarmBlockThreshold
except ImportError:
    genai = None

from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure GEMINI_API_KEY
gemini_api_key = settings.GEMINI_API_KEY
if genai and gemini_api_key and gemini_api_key != "your_gemini_api_key_here":
    genai.configure(api_key=gemini_api_key)

class GeminiVisionService:
    def __init__(self):
        self.is_configured = (genai is not None) and bool(gemini_api_key) and (gemini_api_key != "your_gemini_api_key_here")
        if self.is_configured:
            # We use gemini-1.5-flash for fast vision analysis
            self.model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                generation_config={
                    "temperature": 0.0,
                    "response_mime_type": "application/json",
                },
                safety_settings={
                    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                }
            )

    def analyze(self, img_bytes: bytes, cv_metrics: Dict[str, float]) -> Dict[str, Any]:
        """
        Sends the image and OpenCV metrics to Gemini and asks for a structured observation JSON.
        """
        if not self.is_configured:
            raise ValueError("Gemini API key is not configured or google-generativeai is not installed.")

        prompt = f"""
You are a deterministic cosmetic skin analysis observer.
I am providing you with an image of a face and some objective metrics extracted via computer vision:
- Texture/Laplacian Variance (higher = rougher): {cv_metrics.get('texture_laplacian_variance', 0):.2f}
- Oiliness/Specular Highlight Ratio: {cv_metrics.get('oiliness_specular_ratio', 0):.2f}%
- Redness/a-channel shift: {cv_metrics.get('redness_a_channel_shift', 0):.2f}

Your ONLY job is to observe the visual state of the skin and output a STRICT JSON object containing the severity levels of common concerns.
Do NOT give medical diagnoses, do NOT recommend products, do NOT output markdown, just output the JSON.

Expected schema:
{{
  "acne": "none" | "mild" | "moderate" | "severe",
  "pigmentation": "none" | "mild" | "moderate" | "severe",
  "redness": "none" | "mild" | "moderate" | "severe",
  "oiliness": "none" | "mild" | "moderate" | "severe",
  "dryness": "none" | "mild" | "moderate" | "severe",
  "texture": "smooth" | "uneven" | "rough",
  "rosacea_tendency": "none" | "mild" | "moderate" | "severe",
  "wrinkles_fine_lines": "none" | "mild" | "moderate" | "severe",
  "dark_circles": "none" | "mild" | "moderate" | "severe",
  "dehydration": "none" | "mild" | "moderate" | "severe",
  "pores": "normal" | "enlarged" | "congested"
}}

Output ONLY the JSON object.
"""
        
        try:
            image_part = {
                "mime_type": "image/jpeg",
                "data": img_bytes
            }
            
            response = self.model.generate_content([image_part, prompt])
            
            # The model is configured to output JSON
            result_json = json.loads(response.text)
            return result_json
            
        except Exception as e:
            logger.error(f"Gemini Vision API failed: {e}")
            raise e
