import React, { useEffect, useRef, useState } from 'react';
import {
  SeededRNG,
  ParticleBuffer,
  getAdaptiveParticleCount,
  simulateParticles,
  createOffscreenBuffer,
  type OffscreenBuffer,
  GlyphAtlas,
  DEFAULT_COLOR_TOKENS,
  executeClearPass,
  executeParticlePass,
  executeHighlightPass,
  executeGlowPass,
  executeCompositePass,
} from './ambientEngine';
import { TextMaskProvider } from './textMaskProvider';
import { AmbientDebugPanel, type AmbientDebugPanelProps } from './AmbientDebugPanel';

const AmbientBackgroundComponent: React.FC = () => {
  const canvasRef   = useRef<HTMLCanvasElement | null>(null);
  const frameIdRef  = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);

  // All interaction in refs — zero React re-renders inside animation loop
  const mouseXRef      = useRef<number>(-9999);
  const mouseYRef      = useRef<number>(-9999);
  const scrollScaleRef = useRef<number>(1.0);
  const lastScrollYRef = useRef<number>(typeof window !== 'undefined' ? window.scrollY : 0);
  const lastTsRef      = useRef<number>(0);

  const [debugTelemetry, setDebugTelemetry] = useState<AmbientDebugPanelProps>({
    fps: 60.0,
    particleCount: 11000,
    frameTimeMs: 0.34,
    dpr: 1.0,
    rendererType: 'OffscreenCanvas',
    atlasSize: '240 × 20 px (×2)',
    memoryKB: 870,
    seed: '0x15438865',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false }); // alpha:false for faster compositing
    if (!ctx) return;

    // ── COORDINATE SYSTEM: VIEWPORT ONLY ──────────────────────────────────
    // width / height are ALWAYS window.innerWidth / window.innerHeight.
    // They are NEVER document size, scroll height, clientHeight, or offsetHeight.
    // They are updated ONLY on genuine window resize, NEVER on scroll.
    // ──────────────────────────────────────────────────────────────────────
    let vpW = window.innerWidth;   // viewport width  — the ONLY horizontal unit
    let vpH = window.innerHeight;  // viewport height — the ONLY vertical unit
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Canvas physical pixels = viewport CSS pixels × DPR (never page/document size)
    const setCanvasSize = () => {
      const pw = Math.floor(vpW * dpr);
      const ph = Math.floor(vpH * dpr);
      canvas.width  = pw;
      canvas.height = ph;
      offscreen.canvas.width  = pw;
      offscreen.canvas.height = ph;
    };

    const offscreen: OffscreenBuffer = createOffscreenBuffer(
      Math.floor(vpW * dpr),
      Math.floor(vpH * dpr)
    );

    const rng          = new SeededRNG(0x15438865);
    const maskProvider = new TextMaskProvider('ISHKEEN');

    // Particle world initialised at viewport dimensions
    const buffer = new ParticleBuffer(15000);
    buffer.initialize(vpW, vpH, rng);
    buffer.activeCount = getAdaptiveParticleCount(vpW);

    // Generate exactly ONE ISHKEEN sculpture centered in the viewport
    maskProvider.applyToBuffer(buffer, buffer.activeCount, vpW, vpH);

    let atlas       = new GlyphAtlas(10, dpr, DEFAULT_COLOR_TOKENS.particleDefault);
    let copperAtlas = new GlyphAtlas(10, dpr, DEFAULT_COLOR_TOKENS.particleHighlight);

    // ── RESIZE: fires ONLY on actual window/viewport dimension change ──────
    // Using 'window resize' event instead of ResizeObserver on documentElement.
    // ResizeObserver on documentElement fires on every scroll because
    // scrolling changes scrollHeight, triggering a false "resize" each frame.
    // ──────────────────────────────────────────────────────────────────────
    const handleResize = () => {
      const newW = window.innerWidth;
      const newH = window.innerHeight;
      const newDpr = Math.min(window.devicePixelRatio || 1, 2);

      // Only act if the viewport dimensions genuinely changed
      if (newW === vpW && newH === vpH && newDpr === dpr) return;

      vpW = newW;
      vpH = newH;
      dpr = newDpr;

      setCanvasSize();

      // Rebuild glyph atlases only if DPR changed
      if (atlas.dpr !== dpr) {
        atlas       = new GlyphAtlas(10, dpr, DEFAULT_COLOR_TOKENS.particleDefault);
        copperAtlas = new GlyphAtlas(10, dpr, DEFAULT_COLOR_TOKENS.particleHighlight);
      }

      // Regenerate exactly ONE sculpture for the new viewport
      buffer.activeCount = getAdaptiveParticleCount(vpW);
      maskProvider.applyToBuffer(buffer, buffer.activeCount, vpW, vpH);
    };

    // Set initial canvas size (viewport pixels only)
    setCanvasSize();

    let telemetryTs  = performance.now();
    let frameCount   = 0;
    let totalFrameMs = 0;

    // ── SCROLL: spacing micro-compression only — never repositions the world ──
    const handleScroll = () => {
      const sy    = window.scrollY;
      const delta = sy - lastScrollYRef.current;
      lastScrollYRef.current = sy;
      // ±0.25% max — purely physical sensation, never moves the artwork
      const shift = Math.max(-0.0025, Math.min(0.0025, delta * -0.00010));
      scrollScaleRef.current = Math.max(0.9975, Math.min(1.0025, scrollScaleRef.current + shift));
    };

    // ── CURSOR: viewport coordinates (e.clientX/Y, not page coordinates) ──
    const handleMouseMove = (e: MouseEvent) => {
      // clientX/Y are always viewport-relative — correct for our coordinate system
      mouseXRef.current = e.clientX;
      mouseYRef.current = e.clientY;
    };

    window.addEventListener('resize',    handleResize,    { passive: true });
    window.addEventListener('scroll',    handleScroll,    { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // ── RENDER LOOP ────────────────────────────────────────────────────────
    const renderLoop = (timestamp: number) => {
      if (isPausedRef.current) return;

      const dtMs = lastTsRef.current === 0
        ? 16.67
        : Math.min(50, timestamp - lastTsRef.current);
      lastTsRef.current = timestamp;

      const t0 = performance.now();

      // Damped spring: scroll scale eases back to 1.0 (~13 frames at 60fps)
      if (Math.abs(scrollScaleRef.current - 1.0) > 0.00003) {
        scrollScaleRef.current += (1.0 - scrollScaleRef.current) * 0.08;
      } else {
        scrollScaleRef.current = 1.0;
      }

      // Simulation uses VIEWPORT dimensions — vpW, vpH — not page dimensions
      simulateParticles(
        buffer, buffer.activeCount,
        vpW, vpH,          // viewport width/height ONLY
        timestamp, dtMs,
        mouseXRef.current, mouseYRef.current,
        scrollScaleRef.current
      );

      // Clear offscreen (physical pixel dimensions = vpW*dpr × vpH*dpr)
      executeClearPass(
        offscreen.ctx,
        offscreen.canvas.width,
        offscreen.canvas.height,
        DEFAULT_COLOR_TOKENS.background
      );

      // Render passes
      executeParticlePass(offscreen.ctx, buffer, buffer.activeCount, atlas, dpr);
      executeHighlightPass(offscreen.ctx, buffer, buffer.activeCount, copperAtlas, dpr);
      executeGlowPass(offscreen.ctx, buffer, buffer.activeCount, DEFAULT_COLOR_TOKENS);
      executeCompositePass(ctx, offscreen.canvas, canvas.width, canvas.height);

      frameCount++;
      totalFrameMs += performance.now() - t0;

      if (timestamp - telemetryTs >= 500) {
        const elapsed  = (timestamp - telemetryTs) / 1000;
        const fps      = frameCount / elapsed;
        const avgFrame = totalFrameMs / Math.max(1, frameCount);
        const memB     = buffer.getEstimatedMemoryBytes() + atlas.width * atlas.height * 4 * 2;

        setDebugTelemetry({
          fps:           Math.min(60.0, fps),
          particleCount: buffer.activeCount,
          frameTimeMs:   avgFrame,
          dpr,
          rendererType:  offscreen.isNativeOffscreen ? 'OffscreenCanvas' : 'DOM Canvas',
          atlasSize:     `${atlas.width} × ${atlas.height} px (×2)`,
          memoryKB:      Math.round(memB / 1024),
          seed:          '0x15438865',
        });

        frameCount   = 0;
        totalFrameMs = 0;
        telemetryTs  = timestamp;
      }

      frameIdRef.current = requestAnimationFrame(renderLoop);
    };

    frameIdRef.current = requestAnimationFrame(renderLoop);

    // Pause rendering when tab is hidden — zero wasted CPU
    const handleVisibility = () => {
      if (document.hidden) {
        isPausedRef.current = true;
        if (frameIdRef.current) {
          cancelAnimationFrame(frameIdRef.current);
          frameIdRef.current = 0;
        }
      } else if (isPausedRef.current) {
        isPausedRef.current  = false;
        telemetryTs          = performance.now();
        lastTsRef.current    = performance.now();
        frameIdRef.current   = requestAnimationFrame(renderLoop);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
      window.removeEventListener('resize',    handleResize);
      window.removeEventListener('scroll',    handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <>
      {/*
        Canvas CSS: position:fixed, 100vw × 100vh, z-index:-1.
        Physical pixel dimensions are set via canvas.width/height = vpW*dpr × vpH*dpr.
        The canvas NEVER translates on scroll. Foreground content scrolls over it.
      */}
      <canvas
        ref={canvasRef}
        style={{
          position:      'fixed',
          top:           0,
          left:          0,
          width:         '100vw',
          height:        '100vh',
          zIndex:        -1,
          pointerEvents: 'none',
        }}
      />
      <AmbientDebugPanel {...debugTelemetry} />
    </>
  );
};

// Never re-renders from parent React updates
export const AmbientBackground = React.memo(AmbientBackgroundComponent, () => true);
