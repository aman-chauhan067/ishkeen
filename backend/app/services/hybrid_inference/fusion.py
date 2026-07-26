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
        
        # --- 3. Redness ---
        # We fuse Gemini's semantic redness with OpenCV's a-channel shift
        a_shift = cv_metrics.get("redness_a_channel_shift", 0)
        gemini_redness = gemini_data.get("redness", "none").lower()
        if gemini_redness in ["mild", "moderate", "severe"] or a_shift > 5.0:
            sev = gemini_redness.capitalize() if gemini_redness != "none" else ("Mild" if a_shift < 10 else "Moderate")
            concerns.append({
                "name": "Redness",
                "severity": sev,
                "explanation": f"Erythema detected (a* shift: {a_shift:.1f}).",
                "visual": "red",
                "confidence": 85
            })

        # --- 4. Oiliness / Dryness ---
        oil_ratio = cv_metrics.get("oiliness_specular_ratio", 0)
        gemini_oil = gemini_data.get("oiliness", "none").lower()
        gemini_dry = gemini_data.get("dryness", "none").lower()
        
        if gemini_oil in ["mild", "moderate", "severe"] or oil_ratio > 5.0:
            sev = gemini_oil.capitalize() if gemini_oil != "none" else ("High" if oil_ratio > 10 else "Moderate")
            concerns.append({
                "name": "Oily Skin",
                "severity": sev,
                "explanation": f"Excess sebum/specular highlights (ratio: {oil_ratio:.1f}%).",
                "visual": "yellow",
                "confidence": 90
            })
        elif gemini_dry in ["mild", "moderate", "severe"]:
             concerns.append({
                "name": "Dryness",
                "severity": gemini_dry.capitalize(),
                "explanation": "Lack of surface moisture visually apparent.",
                "visual": "blue",
                "confidence": 85
            })

        # --- 5. Texture ---
        lap_var = cv_metrics.get("texture_laplacian_variance", 0)
        gemini_texture = gemini_data.get("texture", "smooth").lower()
        
        if gemini_texture in ["uneven", "rough"] or lap_var > 1500:
            concerns.append({
                "name": "Uneven Texture",
                "severity": "Moderate" if gemini_texture == "rough" else "Mild",
                "explanation": f"Surface irregularity (Laplacian variance: {lap_var:.0f}).",
                "visual": "gray",
                "confidence": 80
            })

        # Construct observations
        for c in concerns:
            observations.append({
                "observation": f"{c['severity']} {c['name']} detected.",
                "reason": c['explanation'],
                "implication": "Will be factored into recommendation.",
                "expected_improvement": "See routine timeline for details."
            })

        return {
            "status": "success",
            "model_version": "hybrid-v1.0",
            # We explicitly pass the max acne confidence for the legacy threshold adapter
            "acne_confidence": 0.9 if gemini_data.get("acne") in ["moderate", "severe"] else (0.8 if gemini_data.get("acne") == "mild" else 0.1),
            "acne_detected": gemini_data.get("acne", "none").lower() in ["mild", "moderate", "severe"],
            "concerns": concerns,
            "observations": observations,
            "ingredients": {"primary": [], "secondary": [], "barrier": [], "avoid": []} # Handled entirely by Engine now, but included for legacy UI structure
        }
