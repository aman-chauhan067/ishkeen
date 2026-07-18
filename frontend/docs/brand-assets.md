# Ishkeen Brand Assets Documentation

This document freezes the permanent visual assets for Ishkeen. Every future page must reuse these exact assets instead of inventing new ones.

## 1. Logo Usage Rules
- **Primary Logo**: Typographic mark using `Instrument Serif`. No complex glyphs.
- **Clearance**: Minimum clear space around the logo must equal the height of the 'I' in Ishkeen.
- **Coloring**: Always Charcoal on light themes, Off-White on dark themes. Never colored.
- **Proportions**: Never stretched or compressed.

## 2. Gradient Recipes
Do NOT generate random gradients. Use these permanent reusable recipes acting as ambient light.

- **Gradient A: The Hero Glow**
  - **Path**: Ivory → Cream → Blush
  - **Usage**: Hero sections, primary landing moments.
  - **Behavior**: Slow, breathing radial pulse.

- **Gradient B: The Upload Aura**
  - **Path**: Ivory → Powder Blue → Champagne
  - **Usage**: UploadPage, scientific/analysis focus areas.
  - **Behavior**: Extremely slow drift across the background.

- **Gradient C: The Recommendation Light**
  - **Path**: Cream → Sage → Ivory
  - **Usage**: Recommendations, care plans, restorative contexts.
  - **Behavior**: Soft, static bloom originating from corners.

- **Gradient D: The Depth**
  - **Path**: Charcoal → Graphite
  - **Usage**: Dark Mode backgrounds, footer depth.
  - **Behavior**: Deep, noisey void.

## 3. Noise Recipes
- **Base Grain**: 2% opacity SVG fractal noise overlay. Applied globally above the `bg` layer but below the `UI` layer.
- **Tactile Paper**: 4% opacity grain used exclusively on highlighted floating cards to give physical texture.

## 4. Shadow Recipes (Elevation)
- **Elevation 1 (Hover)**: `0 4px 20px -2px rgba(0,0,0,0.03)` — Extremely soft, wide spread for subtle lifting.
- **Elevation 2 (Floating Card)**: `0 10px 40px -5px rgba(0,0,0,0.05)` — Deeper blur for items permanently detached from the background.
- **Elevation 3 (Dialog/Modal)**: `0 25px 60px -10px rgba(0,0,0,0.08)` — Maximum depth, used to obscure the layer beneath.

## 5. Glass Recipes
*Recall: Max 10-15% of UI surface may be glass.*
- **Subtle Frost**: `backdrop-blur-md bg-white/40` — Used for Navbar, floating action bars.
- **Deep Frost**: `backdrop-blur-2xl bg-white/60` — Used for overlay panels requiring higher text contrast.

## 6. Border Recipes
- **Standard Soft**: 1px solid `rgba(0,0,0,0.04)`. Barely visible separation.
- **Interactive Focus**: 1px solid `rgba(0,0,0,0.1)`. Used for inputs and focused states.
- **Glass Edge**: 1px solid `rgba(255,255,255,0.4)`. Used exclusively to create a tactile highlight on the top edge of a glass component.

## 7. Glow Recipes
- **Subtle Bloom**: `box-shadow: 0 0 15px 0 rgba(var(--accent-sage), 0.15)` — Used for active state markers or highly positive feedback loops.
- **Input Focus Ring**: `box-shadow: 0 0 0 3px rgba(0,0,0,0.03)` — Non-intrusive, soft ring.

## 8. Accent Shapes
- **Organic Radius**: Primary border radius should feel soft. e.g., `rounded-2xl` for cards, `rounded-full` for badges. No sharp geometric rectangles unless full-bleed.
- **Floating Orbs**: Background light gradients should be rendered as soft, borderless radial orbs deeply blurred into the base layer.

## 9. Decorative Elements
- **Minimal Indicators**: Small 4px solid dots (Charcoal) to indicate new or active items.
- **Typography Flourish**: Occasional use of italicized `Instrument Serif` for emphasis or quotes.

## 10. Section Dividers
- **Primary Divider**: Generous whitespace (120px+). Do not use lines to divide primary sections.
- **Secondary Divider**: 1px horizontal line, `rgba(0,0,0,0.04)`. Used only within dense cards or lists.
