/**
 * ISHKEEN AMBIENT BACKGROUND ENGINE — PRODUCTION RELEASE
 * AMBIENT LIFE & CINEMATIC MOTION ENGINE
 *
 * Final Art Direction Philosophy:
 * - Motion must be subconscious — never consciously perceived.
 * - Think: printed ink settling, not particles moving.
 * - Noise at 0.18 Hz — one gentle breath every ~5.5 seconds.
 * - Copper highlights: accidental reflections in aged print, never LEDs.
 * - Depth through layer opacity and density, not obvious effects.
 * - Scroll: purely physical sensation, ±0.25% max — below conscious notice.
 * - Cursor: ink warmth within 100px — imperceptible unless you know to look.
 */

// ============================================================================
// 1. GLYPH TABLE
// ============================================================================

export const GLYPH_TABLE: readonly string[] = [
  ".",  // 0 — mist
  "+",  // 1 — medium
  ":",  // 2 — light
  ";",  // 3 — light
  "•",  // 4 — dot
  "×",  // 5 — medium
  "░",  // 6 — medium-dense
  "▒",  // 7 — dense
  "█",  // 8 — heaviest (very rare)
  "#",  // 9 — heavy
  "%",  // 10 — medium-dense
  "@",  // 11 — dense
] as const;

// ============================================================================
// 2. GLYPH ATLAS
// ============================================================================

export interface GlyphMetrics {
  glyph: string;
  width: number;
  height: number;
  baseline: number;
  advance: number;
  atlasX: number;
  atlasY: number;
  cellWidth: number;
  cellHeight: number;
}

export class GlyphAtlas {
  public readonly canvas: HTMLCanvasElement | OffscreenCanvas;
  public readonly ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  public readonly metrics: GlyphMetrics[] = [];
  public readonly width: number;
  public readonly height: number;
  public readonly fontSize: number;
  public readonly dpr: number;
  public readonly colorToken: string;

  constructor(fontSize: number = 10, dpr: number = 1, colorToken: string = 'rgb(160, 165, 175)') {
    this.fontSize = fontSize;
    this.dpr = dpr;
    this.colorToken = colorToken;

    const scaledSize = Math.max(8, Math.floor(fontSize * dpr));
    const cellW = scaledSize * 2;
    const cellH = scaledSize * 2;
    const cols = GLYPH_TABLE.length;

    this.width = cols * cellW;
    this.height = cellH;

    const buffer = createOffscreenBuffer(this.width, this.height);
    this.canvas = buffer.canvas;
    this.ctx = buffer.ctx;

    this.prerender(scaledSize, cellW, cellH, colorToken);
  }

  private prerender(scaledSize: number, cellW: number, cellH: number, colorToken: string): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.font = `${scaledSize}px monospace`;
    ctx.fillStyle = colorToken;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < GLYPH_TABLE.length; i++) {
      const glyph = GLYPH_TABLE[i];
      const atlasX = i * cellW;
      const atlasY = 0;
      const measurement = ctx.measureText(glyph);

      this.metrics.push({
        glyph,
        width: measurement.width,
        height: scaledSize,
        baseline: measurement.actualBoundingBoxAscent || scaledSize / 2,
        advance: measurement.width,
        atlasX,
        atlasY,
        cellWidth: cellW,
        cellHeight: cellH,
      });

      ctx.fillText(glyph, atlasX + cellW / 2, atlasY + cellH / 2);
    }
  }

  public getMetrics(index: number): GlyphMetrics {
    return this.metrics[index] || this.metrics[0];
  }
}

// ============================================================================
// 3. COLOR TOKENS (SEMANTIC — NEVER HARDCODE)
// ============================================================================

export interface AmbientColorTokens {
  particleDefault: string;
  particleHighlight: string;
  particleShadow: string;
  background: string;
}

export const DEFAULT_COLOR_TOKENS: AmbientColorTokens = {
  // Warm ivory background — canvas provides the app background color
  particleDefault: 'rgb(148, 152, 162)',
  particleHighlight: 'rgb(205, 148, 108)',
  particleShadow: 'rgb(100, 104, 112)',
  background: 'rgb(246, 244, 239)',  // #F6F4EF — Ishkeen warm ivory
};

// ============================================================================
// 4. MASK PROVIDER INTERFACE
// ============================================================================

export interface ParticleTarget {
  x: number;
  y: number;
}

export interface ParticleMaskProvider {
  readonly id: string;
  getTargetPositions(count: number, width: number, height: number): Float32Array;
}

// ============================================================================
// 5. SEEDED RNG & ADAPTIVE PARTICLE COUNTS
// ============================================================================

export class SeededRNG {
  private state: number;

  constructor(seed: number = 0x15438865) {
    this.state = seed;
  }

  public reset(seed: number = 0x15438865): void {
    this.state = seed;
  }

  public nextFloat(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public nextRange(min: number, max: number): number {
    return min + this.nextFloat() * (max - min);
  }
}

export function getAdaptiveParticleCount(width: number): number {
  if (width >= 2000) return 14000;
  if (width >= 1200) return 11000;
  if (width >= 900)  return 8000;
  if (width >= 600)  return 5500;
  return 3000;
}

// ============================================================================
// 6. COHERENT NOISE (Zero-allocation harmonic Simplex approximation)
// ============================================================================

/**
 * Zero-allocation 2D coherent noise.
 * Three orthogonal sine/cosine harmonics produce smooth, organic flow.
 * Returns [-1.0, 1.0].
 */
export function coherentNoise2D(x: number, y: number): number {
  const sx = Math.sin(x * 1.31 + y * 0.97);
  const sy = Math.cos(x * 0.79 - y * 1.13);
  const sz = Math.sin(x * 0.43 + y * 0.59);
  return (sx + sy + sz) * 0.3333;
}

// ============================================================================
// 7. PARTICLE BUFFER — TYPED ARRAYS
// ============================================================================

export class ParticleBuffer {
  public readonly maxCount: number;
  public activeCount: number;

  // Positions
  public readonly positionX: Float32Array;
  public readonly positionY: Float32Array;
  public readonly currentX: Float32Array;
  public readonly currentY: Float32Array;
  public readonly targetX: Float32Array;
  public readonly targetY: Float32Array;
  public readonly velocityX: Float32Array;
  public readonly velocityY: Float32Array;

  // Appearance
  public readonly opacity: Float32Array;
  public readonly baseOpacity: Float32Array;
  public readonly brightness: Float32Array;
  public readonly baseBrightness: Float32Array;
  public readonly rotation: Float32Array;
  public readonly fontSize: Float32Array;
  public readonly glyphIndex: Uint8Array;
  public readonly layerIndex: Uint8Array;

  // Animation seeds (Phase 3 motion)
  public readonly animSeed: Float32Array;
  public readonly noiseOffset: Float32Array;
  public readonly phase: Float32Array;

  // Copper highlight state machine
  public readonly highlightIntensity: Float32Array;
  public readonly highlightState: Uint8Array;  // 0=idle 1=hold 2=fade
  public readonly highlightTimer: Float32Array;

  constructor(maxCount: number = 15000) {
    this.maxCount = maxCount;
    this.activeCount = 11000;

    this.positionX = new Float32Array(maxCount);
    this.positionY = new Float32Array(maxCount);
    this.currentX = new Float32Array(maxCount);
    this.currentY = new Float32Array(maxCount);
    this.targetX = new Float32Array(maxCount);
    this.targetY = new Float32Array(maxCount);
    this.velocityX = new Float32Array(maxCount);
    this.velocityY = new Float32Array(maxCount);
    this.opacity = new Float32Array(maxCount);
    this.baseOpacity = new Float32Array(maxCount);
    this.brightness = new Float32Array(maxCount);
    this.baseBrightness = new Float32Array(maxCount);
    this.rotation = new Float32Array(maxCount);
    this.fontSize = new Float32Array(maxCount);
    this.glyphIndex = new Uint8Array(maxCount);
    this.layerIndex = new Uint8Array(maxCount);
    this.animSeed = new Float32Array(maxCount);
    this.noiseOffset = new Float32Array(maxCount);
    this.phase = new Float32Array(maxCount);
    this.highlightIntensity = new Float32Array(maxCount);
    this.highlightState = new Uint8Array(maxCount);
    this.highlightTimer = new Float32Array(maxCount);
  }

  public initialize(width: number, height: number, rng: SeededRNG): void {
    rng.reset(0x15438865);
    for (let i = 0; i < this.maxCount; i++) {
      const x = rng.nextRange(0, width);
      const y = rng.nextRange(0, height);

      this.positionX[i] = x;
      this.positionY[i] = y;
      this.currentX[i] = x;
      this.currentY[i] = y;
      this.targetX[i] = x;
      this.targetY[i] = y;

      this.velocityX[i] = 0.0;
      this.velocityY[i] = 0.0;
      this.opacity[i] = this.baseOpacity[i] = rng.nextRange(0.22, 0.48);
      this.brightness[i] = this.baseBrightness[i] = rng.nextRange(0.78, 1.0);
      this.rotation[i] = 0.0;
      this.fontSize[i] = Math.floor(rng.nextRange(9, 12));
      this.glyphIndex[i] = 0;
      this.layerIndex[i] = 1;

      // Wide-spread phase and offset for maximum cycle variety
      this.animSeed[i] = rng.nextFloat() * 1000.0;
      this.noiseOffset[i] = rng.nextFloat() * 250.0;
      this.phase[i] = rng.nextFloat() * Math.PI * 2;

      this.highlightIntensity[i] = 0.0;
      this.highlightState[i] = 0;
      this.highlightTimer[i] = 0.0;
    }
  }

  public scaleBounds(oldW: number, oldH: number, newW: number, newH: number): void {
    if (oldW <= 0 || oldH <= 0) return;
    const rx = newW / oldW;
    const ry = newH / oldH;
    for (let i = 0; i < this.maxCount; i++) {
      this.positionX[i] *= rx;  this.positionY[i] *= ry;
      this.currentX[i] *= rx;   this.currentY[i] *= ry;
      this.targetX[i] *= rx;    this.targetY[i] *= ry;
    }
  }

  public getEstimatedMemoryBytes(): number {
    // 19 Float32Array (×4) + 3 Uint8Array (×1) = 79 bytes/particle
    return this.maxCount * 79;
  }
}

// ============================================================================
// 8. CINEMATIC MOTION SIMULATION
// ============================================================================

let _nextHighlightMs = 3000;

/**
 * Particle state update. Called once per requestAnimationFrame.
 * Zero GC allocations. Zero React re-renders.
 *
 * Motion characteristics (final tuned values):
 *   Noise speed:     0.18 Hz  — one breath every ~5.5 seconds
 *   Logo disp max:   0.15 px  — imperceptible individual particle movement
 *   Noise disp max:  0.50 px  — barely visible atmospheric drift
 *   Detail disp max: 0.28 px  — subtle foreground presence
 *   Opacity breath:  ±11%     — like ink settling, not particles pulsing
 *   Brightness:      97–107%  — light catching printed surface
 *   Copper:          < 2%     — accidental reflection, never decoration
 *   Scroll max:      ±0.25%   — purely physical, below conscious notice
 *   Cursor radius:   100 px   — smooth radial ink warmth, +3% max
 */
export function simulateParticles(
  buffer: ParticleBuffer,
  count: number,
  width: number,
  height: number,
  timestampMs: number,
  dtMs: number,
  mouseX: number,
  mouseY: number,
  scrollScale: number
): void {
  const cx   = buffer.currentX;
  const cy   = buffer.currentY;
  const tx   = buffer.targetX;
  const ty   = buffer.targetY;
  const op   = buffer.opacity;
  const bOp  = buffer.baseOpacity;
  const br   = buffer.brightness;
  const bBr  = buffer.baseBrightness;
  const li   = buffer.layerIndex;
  const no   = buffer.noiseOffset;
  const ph   = buffer.phase;
  const as   = buffer.animSeed;
  const hI   = buffer.highlightIntensity;
  const hS   = buffer.highlightState;
  const hT   = buffer.highlightTimer;

  const t    = timestampMs * 0.001;
  const midX = width  * 0.5;
  const midY = height * 0.5;

  // ── A. Copper Highlight Spawn (accidental editorial reflections) ──
  if (timestampMs >= _nextHighlightMs) {
    // Derive spawn parameters from timestamp (deterministic-ish, no allocation)
    const seed = (timestampMs * 0.07) | 0;
    const s0 = (seed ^ (seed >>> 15)) * 0x9e3779b9;
    const pickCount = 2 + ((s0 >>> 28) % 3); // 2, 3, or 4 particles

    for (let s = 0; s < pickCount; s++) {
      const pick = (s0 ^ (s0 >>> (s * 7 + 5))) >>> 0;
      const idx = pick % count;
      if ((li[idx] === 2 || li[idx] === 3) && hS[idx] === 0) {
        hS[idx] = 1;
        hT[idx] = 320 + ((s0 >>> (s * 3)) % 130); // 320–450ms hold
      }
    }

    // Next spawn in 3–6 seconds
    const gap = 3000 + ((s0 >>> 16) % 3000);
    _nextHighlightMs = timestampMs + gap;
  }

  // ── B. Per-Particle Update (zero allocation hot loop) ──
  for (let i = 0; i < count; i++) {
    const layer = li[i];

    // Layer-differentiated displacement envelope
    let maxD = 0.15;                    // Logo: barely perceptible
    if (layer === 1) maxD = 0.50;       // Noise: atmospheric drift
    else if (layer === 3) maxD = 0.28;  // Detail: subtle presence

    // Coherent noise displacement at 0.18 Hz stately wave
    const nx = coherentNoise2D(tx[i] * 0.009 + no[i],        t * 0.18);
    const ny = coherentNoise2D(ty[i] * 0.009 + no[i] + 60.0, t * 0.18);

    // Scroll reaction: micro-compression/stretch around center
    const dx = (tx[i] - midX) * scrollScale;
    const dy = (ty[i] - midY) * scrollScale;
    cx[i] = midX + dx + nx * maxD;
    cy[i] = midY + dy + ny * maxD;

    // Opacity breathing: 4–9s independent cycle, ±11% variation
    const freq = 0.698 + (as[i] % 0.524); // 4s–9s period
    op[i] = bOp[i] * (1.0 + 0.11 * Math.sin(t * freq + ph[i]));

    // Brightness: 97%–107% ink shimmer — slow 0.38 Hz
    const ink = Math.cos(t * 0.38 + ph[i] * 1.15);
    let bMod = 1.02 + 0.05 * ink;

    // Cursor: smooth radial ink warmth, 100px radius, +3% max
    if (mouseX >= 0 && mouseY >= 0) {
      const ddx = cx[i] - mouseX;
      const ddy = cy[i] - mouseY;
      const dSq = ddx * ddx + ddy * ddy;
      if (dSq < 10000) { // 100²
        bMod *= (1.0 + 0.03 * (1.0 - Math.sqrt(dSq) / 100.0));
      }
    }
    br[i] = bBr[i] * bMod;

    // Copper highlight state machine
    if (hS[i] === 1) {
      // Fade in gently to max 0.60 — never LED-bright
      hI[i] = Math.min(0.60, hI[i] + 0.055);
      hT[i] -= dtMs;
      if (hT[i] <= 0) {
        hS[i] = 2;
        hT[i] = 1200; // 1.2s fade — slow and organic
      }
    } else if (hS[i] === 2) {
      hI[i] = Math.max(0.0, hI[i] - (dtMs / 1200.0) * 0.60);
      if (hI[i] <= 0.004) {
        hS[i] = 0;
        hI[i] = 0.0;
      }
    }
  }
}

// ============================================================================
// 9. RENDER PASSES
// ============================================================================

export function executeClearPass(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  backgroundToken: string
): void {
  ctx.clearRect(0, 0, width, height);
  if (backgroundToken && backgroundToken !== 'rgba(0, 0, 0, 0)') {
    ctx.fillStyle = backgroundToken;
    ctx.fillRect(0, 0, width, height);
  }
}

export function executeParticlePass(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  buffer: ParticleBuffer,
  count: number,
  atlas: GlyphAtlas,
  dpr: number
): void {
  const cx  = buffer.currentX;
  const cy  = buffer.currentY;
  const op  = buffer.opacity;
  const gi  = buffer.glyphIndex;
  const ac  = atlas.canvas;

  for (let i = 0; i < count; i++) {
    const m = atlas.getMetrics(gi[i]);
    ctx.globalAlpha = Math.max(0, Math.min(1, op[i]));
    ctx.drawImage(
      ac as CanvasImageSource,
      m.atlasX, m.atlasY, m.cellWidth, m.cellHeight,
      cx[i] * dpr - m.cellWidth  / 2,
      cy[i] * dpr - m.cellHeight / 2,
      m.cellWidth, m.cellHeight
    );
  }
  // CRITICAL: reset globalAlpha so subsequent passes and composite are unaffected
  ctx.globalAlpha = 1.0;
}

export function executeHighlightPass(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  buffer: ParticleBuffer,
  count: number,
  copperAtlas: GlyphAtlas,
  dpr: number
): void {
  const cx  = buffer.currentX;
  const cy  = buffer.currentY;
  const op  = buffer.opacity;
  const gi  = buffer.glyphIndex;
  const hI  = buffer.highlightIntensity;
  const ac  = copperAtlas.canvas;

  for (let i = 0; i < count; i++) {
    if (hI[i] > 0.008) {
      const m = copperAtlas.getMetrics(gi[i]);
      ctx.globalAlpha = Math.max(0, Math.min(1, op[i] * hI[i]));
      ctx.drawImage(
        ac as CanvasImageSource,
        m.atlasX, m.atlasY, m.cellWidth, m.cellHeight,
        cx[i] * dpr - m.cellWidth  / 2,
        cy[i] * dpr - m.cellHeight / 2,
        m.cellWidth, m.cellHeight
      );
    }
  }
  // CRITICAL: reset globalAlpha so executeCompositePass drawImage renders at full opacity
  ctx.globalAlpha = 1.0;
}

export function executeGlowPass(
  _ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  _buffer: ParticleBuffer,
  _count: number,
  _tokens: AmbientColorTokens
): void {
  // Architectural hook — reserved for Phase 4
}

export function executeCompositePass(
  mainCtx: CanvasRenderingContext2D,
  offscreenCanvas: HTMLCanvasElement | OffscreenCanvas,
  width: number,
  height: number
): void {
  mainCtx.clearRect(0, 0, width, height);
  mainCtx.drawImage(offscreenCanvas as CanvasImageSource, 0, 0);
}

// ============================================================================
// 10. OFFSCREEN BUFFER
// ============================================================================

export interface OffscreenBuffer {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  isNativeOffscreen: boolean;
}

export function createOffscreenBuffer(width: number, height: number): OffscreenBuffer {
  if (typeof OffscreenCanvas !== 'undefined') {
    try {
      const canvas = new OffscreenCanvas(Math.max(1, width), Math.max(1, height));
      const ctx = canvas.getContext('2d', { alpha: true });
      if (ctx) return { canvas, ctx, isNativeOffscreen: true };
    } catch { /* fallthrough */ }
  }
  const canvas = document.createElement('canvas');
  canvas.width  = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext('2d', { alpha: true })!;
  return { canvas, ctx, isNativeOffscreen: false };
}
