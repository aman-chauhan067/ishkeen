# Product Fallback Strategy

## Current Blockage
Phase 5B dataset research concluded that no commercially-usable, rigorously annotated acne lesion dataset exists in the public domain. Kaggle and Roboflow datasets suffer from extreme provenance risk and copyright infringement vulnerabilities.

## Impact on Phase 6 (Frontend ML Results)
Phase 6 was intended to consume the ML inference results from the backend and display them to the user. Without a legally viable dataset, we cannot train a legitimate model.

## Recommended Fallback Plan

We will proceed with Phase 6 by implementing a **"Heuristic/Questionnaire-Driven Analysis Fallback"** while we wait for either:
1. Written permission from the ACNE04 authors (Path A).
2. The collection of our own consented dataset (Path C).

### Fallback Implementation:
Instead of running a neural network, the backend analysis endpoint will generate a "Heuristic Result" derived entirely from the user's previously completed Skin Profile (Phase 3). 
For example, if the user reported frequent breakouts and oily skin in their questionnaire, the analysis result will reflect that profile data, bypassing the image entirely.

### Rationale:
This allows us to:
- Complete the full-stack architecture (Phase 6 frontend integration).
- Build the final analysis result UI.
- Establish the backend database structure for analysis results.
- Implement the asynchronous polling mechanism.

By doing this, the entire application infrastructure will be complete and fully functional. The ML model simply remains a modular dependency that can be swapped in once data is secured, without requiring any architectural rework.
