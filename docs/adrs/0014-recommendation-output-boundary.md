# ADR 0014: Recommendation Output Boundary

## Status
Accepted

## Context
We need to define what the Recommendation Engine actually outputs. The options range from returning a list of raw ingredients to recommending specific, purchasable commercial products (e.g., "Buy Paula's Choice 2% BHA").

## Decision
The MVP engine will output a **Hybrid Routine Structure + Ingredient Category Guidance**. 
It will NOT output specific commercial product recommendations.

The output will define a routine (Cleanser, Treatment, Moisturizer, Sunscreen) and assign broad categories to those steps (e.g., "Gentle Cleanser", "BHA / Salicylic Acid", "Barrier Repair Moisturizer").

## Consequences
- **Positive**: Eliminates the maintenance burden of tracking thousands of commercial product formulations, discontinuations, and stock statuses.
- **Positive**: Eliminates affiliate bias risk and keeps the product focused on unbiased skincare education.
- **Positive**: Safer from a liability perspective (less risk of making medical claims about specific products).
- **Negative**: Users must take the category guidance and find their own matching commercial products in the real world. (A future Phase could introduce a static, vetted product-mapping layer if requested).
