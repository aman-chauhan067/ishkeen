/**
 * ISHKEEN AMBIENT BACKGROUND ENGINE — PRODUCTION RELEASE
 * ASCII MASK GENERATION (TextMaskProvider)
 *
 * Final Art Direction Philosophy:
 * - "ISHKEEN" should NOT immediately read as text.
 * - First impression: texture, depth, atmosphere.
 * - Discovery: only after a moment of looking should the name appear.
 * - Logo occupies 30–35% of viewport width — generous breathing room.
 * - Background noise clusters near center, dissolves at edges. No perfectly filled canvas.
 * - 4-Strata density: Core → Inner Body → Outer Falloff → Atmospheric Mist
 * - Cubic luminance easing for organic, printed-material edge transitions.
 * - No hard character rows. No rectangular silhouettes. No mechanical spacing.
 */

import {
  type ParticleMaskProvider,
  ParticleBuffer,
  SeededRNG,
  createOffscreenBuffer,
} from './ambientEngine';

export interface MaskPoint {
  x: number;
  y: number;
  luminance: number;
}

export class TextMaskProvider implements ParticleMaskProvider {
  public readonly id = 'TextMaskProvider:ISHKEEN';
  private readonly text: string;

  constructor(text: string = 'ISHKEEN') {
    this.text = text;
  }

  private generateMaskPoints(width: number, height: number): MaskPoint[] {
    const scale = Math.min(1.0, Math.max(0.35, 800 / width));
    const maskW = Math.max(100, Math.floor(width * scale));
    const maskH = Math.max(50, Math.floor(height * scale));

    const buffer = createOffscreenBuffer(maskW, maskH);
    const ctx = buffer.ctx;
    ctx.clearRect(0, 0, maskW, maskH);

    // Logo sizing: target 30-35% of viewport width
    // At 1440px: 0.135 * maskW (≈777) ≈ 105px mask font → maps to ~191px screen
    // "ISHKEEN" at 191px height spans ~7 chars × 191×0.55 ≈ 735px = 51% too wide
    // Use a tighter height but rely on font metrics: width-driven sizing
    let fontSizePx: number;
    if (width >= 1200) {
      // Target: logo occupies ~33% of viewport width
      // "ISHKEEN" at 7 chars — measured char width ≈ 0.58× font size
      // 0.33 × 1440 ≈ 475px → font = 475 / (7 × 0.58) ≈ 117px viewport
      // In mask space (scale ≈ 0.55): 117 × 0.55 ≈ 64px mask font
      fontSizePx = Math.min(maskW * 0.082, maskH * 0.32); // ≈ 64px at 1440 mask
    } else if (width >= 600) {
      fontSizePx = Math.min(maskW * 0.095, maskH * 0.30); // Tablet
    } else {
      fontSizePx = Math.min(maskW * 0.115, maskH * 0.28); // Mobile
    }

    const fSize = Math.max(18, Math.floor(fontSizePx));
    ctx.font = `900 ${fSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;

    // Vertical centering: slightly above mathematical center for optical balance
    const textY = maskH * 0.485;

    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, maskW / 2, textY);

    // Multi-pass blur simulation: re-draw with slight spread for softer edges
    ctx.globalAlpha = 0.18;
    ctx.fillText(this.text, maskW / 2 + 0.5, textY + 0.5);
    ctx.fillText(this.text, maskW / 2 - 0.5, textY - 0.5);
    ctx.globalAlpha = 1.0;

    const imageData = ctx.getImageData(0, 0, maskW, maskH).data;
    const points: MaskPoint[] = [];
    const invScale = 1.0 / scale;

    // Step 2 sampling with sub-pixel dithering for non-mechanical distribution
    const rng = new SeededRNG(0xdeadbeef);
    for (let y = 0; y < maskH; y += 2) {
      for (let x = 0; x < maskW; x += 2) {
        const idx = (y * maskW + x) * 4;
        const alpha = imageData[idx + 3];

        if (alpha > 8) {
          // Sub-pixel jitter breaks visible character row alignment
          const jx = rng.nextRange(-0.8, 0.8);
          const jy = rng.nextRange(-0.8, 0.8);
          points.push({
            x: (x + jx) * invScale,
            y: (y + jy) * invScale,
            luminance: alpha / 255.0,
          });
        }
      }
    }

    return points;
  }

  public getTargetPositions(count: number, width: number, height: number): Float32Array {
    const maskPoints = this.generateMaskPoints(width, height);
    const targets = new Float32Array(count * 2);
    const rng = new SeededRNG(0x15438865);

    if (maskPoints.length === 0) {
      for (let i = 0; i < count; i++) {
        targets[i * 2] = rng.nextRange(0, width);
        targets[i * 2 + 1] = rng.nextRange(0, height);
      }
      return targets;
    }

    const noiseCount = Math.floor(count * 0.20);
    const logoCount = Math.floor(count * 0.68);

    for (let i = 0; i < count; i++) {
      if (i < noiseCount) {
        targets[i * 2] = rng.nextRange(0, width);
        targets[i * 2 + 1] = rng.nextRange(0, height);
      } else if (i < noiseCount + logoCount) {
        const pt = maskPoints[Math.floor(rng.nextFloat() * maskPoints.length)];
        targets[i * 2] = pt.x + rng.nextRange(-0.8, 0.8);
        targets[i * 2 + 1] = pt.y + rng.nextRange(-0.8, 0.8);
      } else {
        const pt = maskPoints[Math.floor(rng.nextFloat() * maskPoints.length)];
        targets[i * 2] = pt.x + rng.nextRange(-1.8, 1.8);
        targets[i * 2 + 1] = pt.y + rng.nextRange(-1.8, 1.8);
      }
    }

    return targets;
  }

  /**
   * 4-Strata ASCII Glyph Selection — Printed Museum Sculpture feel.
   *
   * Glyph density maps to perceived ink weight:
   *   "." → extremely light impression (mist, edge dissolve)
   *   ":" ";" "•" → light dot impression (outer halo)
   *   "+" "×" "░" → medium weight (body texture)
   *   "▒" "%" "@" → dense but structured (mid-stroke)
   *   "#" "█" → heaviest (core only, very rare)
   *
   * This produces the "texture first, text second" perception.
   */
  private selectGlyphIndex(luminance: number, layer: number, rng: SeededRNG): number {
    const r = rng.nextFloat();

    if (layer === 1) {
      // Atmospheric background noise: almost entirely delicate dots
      if (r < 0.78) return 0; // "."
      if (r < 0.90) return 2; // ":"
      if (r < 0.97) return 3; // ";"
      return 4;               // "•"
    }

    if (layer === 3) {
      // Foreground detail: refined editorial accent characters
      if (r < 0.42) return 1; // "+"
      if (r < 0.70) return 5; // "×"
      if (r < 0.88) return 4; // "•"
      return 10;              // "%"
    }

    // Layer 2: 4-Strata Logo Sculpture
    if (luminance > 0.90) {
      // Strata 1: Core stroke (heaviest) — rarely, almost never a solid block
      if (r < 0.06) return 8;  // "█" (very rare — 6% of core)
      if (r < 0.22) return 9;  // "#"
      if (r < 0.58) return 7;  // "▒"
      if (r < 0.80) return 11; // "@"
      return 10;               // "%"
    } else if (luminance > 0.65) {
      // Strata 2: Inner body — structured mid-weight texture
      if (r < 0.22) return 1;  // "+"
      if (r < 0.50) return 6;  // "░"
      if (r < 0.74) return 5;  // "×"
      if (r < 0.90) return 10; // "%"
      return 2;                // ":"
    } else if (luminance > 0.32) {
      // Strata 3: Outer falloff — transitional light dots
      if (r < 0.32) return 0;  // "."
      if (r < 0.62) return 2;  // ":"
      if (r < 0.88) return 3;  // ";"
      return 4;                // "•"
    } else {
      // Strata 4: Atmospheric mist (luminance 0.03–0.32)
      // Almost exclusively "." — makes edges vanish into atmosphere
      if (r < 0.72) return 0;  // "."
      if (r < 0.88) return 2;  // ":"
      if (r < 0.96) return 3;  // ";"
      return 4;                // "•"
    }
  }

  public applyToBuffer(buffer: ParticleBuffer, count: number, width: number, height: number): void {
    const maskPoints = this.generateMaskPoints(width, height);
    const rng = new SeededRNG(0x15438865);

    // Layer ratios: 20% Atmospheric Noise | 68% Logo Sculpture | 12% Foreground Detail
    const noiseCount = Math.floor(count * 0.20);
    const logoCount = Math.floor(count * 0.68);

    const px = buffer.positionX;
    const py = buffer.positionY;
    const cx = buffer.currentX;
    const cy = buffer.currentY;
    const tx = buffer.targetX;
    const ty = buffer.targetY;
    const vx = buffer.velocityX;
    const vy = buffer.velocityY;
    const opacity = buffer.opacity;
    const brightness = buffer.brightness;
    const fontSize = buffer.fontSize;
    const glyphIndex = buffer.glyphIndex;

    const maskLen = Math.max(1, maskPoints.length);
    const cx2 = width * 0.5;
    const cy2 = height * 0.5;

    for (let i = 0; i < count; i++) {
      let layer = 1;
      let targetX = 0;
      let targetY = 0;
      let luminance = 0.2;

      if (i < noiseCount || maskPoints.length === 0) {
        // ── Layer 1: Atmospheric Background Noise ──
        // Gaussian-clustered distribution: denser near center, dissolving at edges.
        // This creates genuine negative space rather than a uniformly filled canvas.
        layer = 1;
        const angle = rng.nextRange(0, Math.PI * 2);
        // Box-Muller transform approximation for Gaussian spread
        const u1 = Math.max(0.0001, rng.nextFloat());
        const u2 = rng.nextFloat();
        const mag = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        // Sigma: 42% of half-viewport so noise fills center but dissolves at edges
        const sigma = Math.min(width, height) * 0.42;
        targetX = Math.max(0, Math.min(width, cx2 + Math.cos(angle) * Math.abs(mag) * sigma * 0.6));
        targetY = Math.max(0, Math.min(height, cy2 + Math.sin(angle) * Math.abs(mag) * sigma * 0.5));
        luminance = 0.18;

        vx[i] = rng.nextRange(-0.10, 0.10);
        vy[i] = rng.nextRange(-0.10, 0.10);
        opacity[i] = rng.nextRange(0.12, 0.28); // Very faint — atmospheric
        fontSize[i] = Math.floor(rng.nextRange(8, 10));

      } else if (i < noiseCount + logoCount) {
        // ── Layer 2: Primary Logo Sculpture ──
        layer = 2;
        const pt = maskPoints[Math.floor(rng.nextFloat() * maskLen)];
        targetX = pt.x + rng.nextRange(-0.7, 0.7);
        targetY = pt.y + rng.nextRange(-0.7, 0.7);
        luminance = pt.luminance;

        vx[i] = 0.0;
        vy[i] = 0.0;

        // Organic density: cubic easing on luminance for natural printed falloff
        // Lower max opacity (0.55) so logo must be "discovered" not immediately "read"
        const edgeEase = luminance < 0.5
          ? 2 * luminance * luminance          // ease-in for mist
          : 1 - Math.pow(-2 * luminance + 2, 2) / 2; // ease-out for core
        opacity[i] = rng.nextRange(0.28, 0.55) * Math.max(0.35, edgeEase);
        fontSize[i] = Math.floor(rng.nextRange(9, 11));

      } else {
        // ── Layer 3: Foreground Detail Accents ──
        layer = 3;
        const pt = maskPoints[Math.floor(rng.nextFloat() * maskLen)];
        // Only accent high-luminance points (inner core) — no edge detail accents
        targetX = pt.x + rng.nextRange(-1.6, 1.6);
        targetY = pt.y + rng.nextRange(-1.6, 1.6);
        luminance = pt.luminance;

        vx[i] = 0.0;
        vy[i] = 0.0;
        opacity[i] = rng.nextRange(0.55, 0.80) * Math.max(0.5, luminance);
        fontSize[i] = Math.floor(rng.nextRange(10, 12));
      }

      px[i] = cx[i] = tx[i] = targetX;
      py[i] = cy[i] = ty[i] = targetY;
      brightness[i] = buffer.baseBrightness[i] = luminance;
      opacity[i] = buffer.baseOpacity[i] = opacity[i];
      glyphIndex[i] = this.selectGlyphIndex(luminance, layer, rng);
      buffer.layerIndex[i] = layer;
    }
  }
}
