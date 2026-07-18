# Recommendation Evidence Source Plan

## 1. Context
To populate the JSON/YAML Knowledge Base for Phase 6B, we must adhere to a strict hierarchy of clinical evidence. Ishkeen is not a blog, and we do not source ingredient claims from marketing materials, brands, or AI hallucinations.

## 2. Evidence Source Hierarchy
The Knowledge Base maintainer must evaluate evidence critically. Do not assume FDA monographs for OTC drugs are automatically the highest-quality source for cosmetic formulations unless the recommendation explicitly targets an OTC monograph category (e.g., Acne treatment). The hierarchy of clinical evidence is:
1. **Government Health & Regulatory Sources** (e.g., FDA monographs for OTC drugs, EU Cosmetics Regulation annexes).
2. **Dermatology Association Guidelines** (e.g., AAD - American Academy of Dermatology guidelines).
3. **Peer-Reviewed Systematic Reviews & Meta-Analyses** (Targeting highly cited, recent systematic reviews on topical actives).
4. **Peer-Reviewed Clinical Trials** (RCTs testing specific ingredients).
5. **Formulator & Cosmetic Chemistry Standard References** (For texture, pH, and stability data only, NOT efficacy claims).

Sources that are strictly **PROHIBITED**:
- Brand websites (e.g., Paula's Choice ingredient dictionary).
- SEO-driven skincare blogs.
- Influencer claims.
- Generative AI outputs without primary source citation.

## 3. Evidence Record Schema
Every edge in our Knowledge Graph (e.g., `bha_salicylic_acid -> clogged_pores`) must be backed by an evidence record capable of storing precise metadata.

```json
{
  "ingredient_category": "bha_salicylic_acid",
  "target_concern": "clogged_pores",
  "evidence": [
    {
      "source_organization": "American Academy of Dermatology",
      "source_type": "association_guideline",
      "title": "Guidelines of Care for the Management of Acne Vulgaris (2016)",
      "url_or_identifier": "https://doi.org/10.1016/j.jaad.2015.12.037",
      "publication_date": "2016-02-01",
      "retrieval_date": "2026-07-11",
      "applicable_claim": "Topical salicylic acid is effective as a comedolytic agent.",
      "evidence_scope": "Mild to moderate comedonal acne.",
      "limitations": "Often less effective than topical retinoids; may cause mild irritation.",
      "evidence_strength": "high",
      "reviewer": "achauhan"
    }
  ]
}
```

## 4. Maintenance and Update Process
- **Annual Review**: The knowledge base should be reviewed annually for newly published guidelines.
- **Pull Requests**: Any change to the JSON policy requires a PR containing a link to the primary source evidence supporting the addition or removal of a claim.
