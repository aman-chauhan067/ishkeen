from typing import Dict, Any, List

class EvidenceFusionService:
    @staticmethod
    def fuse(cv_metrics: Dict[str, float], gemini_data: Dict[str, str]) -> Dict[str, Any]:
        """
        Fuses objective OpenCV metrics with semantic Gemini observations
        into the Canonical Evidence Graph format expected by MLEvidenceAdapter.
        """
        concerns = []
        observations = []
        
        # Helper to map Gemini severity string to our internal model structure
        def add_concern(gemini_key: str, concern_name: str, explanation: str, visual: str):
            severity = gemini_data.get(gemini_key, "none").lower()
            if severity in ["mild", "moderate", "severe"]:
                concerns.append({
                    "name": concern_name,
                    "severity": severity.capitalize(),
                    "explanation": explanation,
                    "visual": visual,
                    "confidence": 95 if severity == "severe" else (85 if severity == "moderate" else 75)
                })

        # --- 1. Acne ---
        add_concern("acne", "Acne", "Inflammatory lesions detected by vision model.", "red")
        
        # --- 2. Pigmentation ---
        add_concern("pigmentation", "Pigmentation", "Uneven melanin distribution detected.", "brown")
        
        # --- 3. Redness & Vascularity ---
        a_shift = cv_metrics.get("redness_a_channel_shift", 0.0)
        gemini_redness = gemini_data.get("redness", "none").lower()
        sev_red = gemini_redness.capitalize() if gemini_redness in ["mild", "moderate", "severe"] else ("Moderate" if a_shift > 12 else "Mild")
        concerns.append({
            "name": "Erythema & Vascularity",
            "severity": sev_red,
            "explanation": f"Objective colorimetric a* shift measured at {a_shift:.1f}, indicating {'elevated micro-vascular dilation' if a_shift > 8 else 'subtle localized erythema'}.",
            "visual": "red",
            "confidence": 85
        })

        # --- 4. Sebum & Lipid Balance ---
        oil_ratio = cv_metrics.get("oiliness_specular_ratio", 0.0)
        gemini_oil = gemini_data.get("oiliness", "none").lower()
        sev_oil = gemini_oil.capitalize() if gemini_oil in ["mild", "moderate", "severe"] else ("High" if oil_ratio > 8 else ("Moderate" if oil_ratio > 3 else "Mild"))
        concerns.append({
            "name": "Sebum & Barrier Regulation",
            "severity": sev_oil,
            "explanation": f"Specular reflectance ratio measured at {oil_ratio:.1f}%, showing {'active T-zone sebum hyper-secretion' if oil_ratio > 5 else 'balanced surface lipid distribution'}.",
            "visual": "yellow",
            "confidence": 90
        })

        # --- 5. Epidermal Texture & Follicular Health ---
        lap_var = cv_metrics.get("texture_laplacian_variance", 0.0)
        gemini_texture = gemini_data.get("texture", "smooth").lower()
        sev_tex = "Moderate" if (gemini_texture in ["uneven", "rough"] or lap_var > 800) else "Mild"
        concerns.append({
            "name": "Surface Texture & Follicular Tone",
            "severity": sev_tex,
            "explanation": f"Laplacian variance score of {lap_var:.0f}, reflecting {'micro-comedonal congestion and follicular prominence' if lap_var > 600 else 'fine epidermal micro-relief'}.",
            "visual": "gray",
            "confidence": 88
        })

        # Construct observations
        for c in concerns:
            observations.append({
                "observation": f"{c['severity']} {c['name']} detected across facial ROIs.",
                "reason": c['explanation'],
                "implication": "Will be factored into active ingredient selection and barrier protocol.",
                "expected_improvement": "Visible refinement in skin tone and texture expected within 14-28 days."
            })

        ingredients_protocol = {
            "Morning": [
                {
                    "name": "Niacinamide 5%",
                    "benefit": "Barrier restoration & oil regulation",
                    "why": f"Targets measured specular ratio ({oil_ratio:.1f}%) to balance sebum while calming localized erythema.",
                    "time": "AM",
                    "compatibility": "High"
                }
            ],
            "Night": [
                {
                    "name": "Salicylic Acid 2% (BHA)",
                    "benefit": "Pore decongestion & keratolysis",
                    "why": f"Penetrates lipid barrier to refine Laplacian texture variance ({lap_var:.0f}) and clear follicular congestion.",
                    "time": "PM",
                    "compatibility": "High"
                }
            ]
        }

        return {
            "status": "success",
            "model_version": "hybrid-v1.0",
            "acne_confidence": 0.85 if gemini_data.get("acne") in ["moderate", "severe"] else 0.75,
            "acne_detected": True,
            "concerns": concerns,
            "observations": observations,
            "ingredients": ingredients_protocol
        }
