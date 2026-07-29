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

        def safe_float(val, default=0.0):
            try:
                return float(val)
            except (ValueError, TypeError):
                return default

        a_shift = safe_float(cv_metrics.get("redness_a_channel_shift", 0.0))
        oil_ratio = safe_float(cv_metrics.get("oiliness_specular_ratio", 0.0))
        lap_var = safe_float(cv_metrics.get("texture_laplacian_variance", 0.0))

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
        add_concern("acne", "Acne & Breakouts", "Inflammatory lesions detected by vision model.", "red")
        
        # --- 2. Pigmentation ---
        add_concern("pigmentation", "Hyperpigmentation & Dark Spots", "Uneven melanin distribution detected.", "brown")
        
        # --- 3. Rosacea & Erythema Tendency ---
        add_concern("rosacea_tendency", "Rosacea & Vascular Reactivity", "Persistent flushing and vascular sensitivity detected.", "red")
        
        # --- 4. Wrinkles & Fine Lines ---
        add_concern("wrinkles_fine_lines", "Wrinkles & Fine Lines", "Visible expression lines and micro-wrinkling detected.", "blue")
        
        # --- 5. Epidermal Dehydration ---
        add_concern("dehydration", "Epidermal Dehydration", "Trans-epidermal water loss and tightness markers detected.", "cyan")
        
        # --- 6. Dryness & Flakiness ---
        add_concern("dryness", "Dryness & Lipid Deficiency", "Surface scaling and depleted lipid mantle detected.", "yellow")
        
        # --- 7. Dark Circles ---
        add_concern("dark_circles", "Dark Circles & Under-Eye Puffiness", "Under-eye shadowing and vascular pooling detected.", "purple")

        # --- 8. Redness & Vascularity ---
        gemini_redness = gemini_data.get("redness", "none").lower()
        sev_red = gemini_redness.capitalize() if gemini_redness in ["mild", "moderate", "severe"] else ("Moderate" if a_shift > 12 else "Mild")
        concerns.append({
            "name": "Erythema & Vascularity",
            "severity": sev_red,
            "explanation": f"Objective colorimetric a* shift measured at {a_shift:.1f}, indicating {'elevated micro-vascular dilation' if a_shift > 8 else 'subtle localized erythema'}.",
            "visual": "red",
            "confidence": 85
        })

        # --- 9. Sebum & Lipid Balance ---
        gemini_oil = gemini_data.get("oiliness", "none").lower()
        sev_oil = gemini_oil.capitalize() if gemini_oil in ["mild", "moderate", "severe"] else ("High" if oil_ratio > 8 else ("Moderate" if oil_ratio > 3 else "Mild"))
        concerns.append({
            "name": "Sebum & Barrier Regulation",
            "severity": sev_oil,
            "explanation": f"Specular reflectance ratio measured at {oil_ratio:.1f}%, showing {'active T-zone sebum hyper-secretion' if oil_ratio > 5 else 'balanced surface lipid distribution'}.",
            "visual": "yellow",
            "confidence": 90
        })

        # --- 10. Epidermal Texture & Follicular Health ---
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

        # Dynamic AM / PM clinical protocol
        night_steps = []
        has_dryness = any("dry" in c["name"].lower() or "dehydration" in c["name"].lower() for c in concerns)
        has_rosacea = any("rosacea" in c["name"].lower() or "erythema" in c["name"].lower() for c in concerns)
        has_aging = any("wrinkle" in c["name"].lower() or "fine line" in c["name"].lower() for c in concerns)
        has_acne = gemini_data.get("acne", "none").lower() in ["mild", "moderate", "severe"]

        if has_dryness:
            night_steps.append({
                "name": "Ceramide 3:1:1 + Hyaluronic Acid Complex",
                "benefit": "Lipid mantle barrier repair & deep cellular hydration",
                "why": "Restores essential epidermal lipid ratios to reverse trans-epidermal water loss (TEWL) and eliminate flakiness.",
                "time": "PM",
                "compatibility": "High"
            })
        elif has_rosacea:
            night_steps.append({
                "name": "Azelaic Acid 10% Clinical Gel",
                "benefit": "Anti-inflammatory erythema control & micro-vascular calming",
                "why": f"Targets colorimetric a* shift ({a_shift:.1f}) to soothe chronic flushing and reduce sensitivity.",
                "time": "PM",
                "compatibility": "High"
            })
        elif has_aging:
            night_steps.append({
                "name": "Retinoid / Bio-Peptide Renewal Serum",
                "benefit": "Collagen synthesis & fine line smoothing",
                "why": "Stimulates dermal cellular turnover to smooth micro-relief without compromising lipid barrier.",
                "time": "PM",
                "compatibility": "High"
            })
        else:
            night_steps.append({
                "name": "Salicylic Acid 2% (BHA)",
                "benefit": "Pore decongestion & keratolysis",
                "why": f"Penetrates lipid barrier to refine Laplacian texture variance ({lap_var:.0f}) and clear follicular congestion.",
                "time": "PM",
                "compatibility": "High"
            })

        ingredients_protocol = {
            "Morning": [
                {
                    "name": "Niacinamide 5% Barrier Serum",
                    "benefit": "Barrier restoration, pigmentation balance & oil regulation",
                    "why": f"Targets measured specular ratio ({oil_ratio:.1f}%) and pigment uniformity while reinforcing epidermal resilience.",
                    "time": "AM",
                    "compatibility": "High"
                }
            ],
            "Night": night_steps
        }

        acne_is_detected = has_acne or (a_shift > 15)

        return {
            "status": "success",
            "model_version": "hybrid-v1.0",
            "acne_confidence": 0.85 if gemini_data.get("acne") in ["moderate", "severe"] else 0.75,
            "acne_detected": acne_is_detected,
            "concerns": concerns,
            "observations": observations,
            "ingredients": ingredients_protocol
        }
