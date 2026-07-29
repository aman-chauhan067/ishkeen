import React, { useState, useEffect } from 'react';

export interface AmbientDebugPanelProps {
  fps: number;
  particleCount: number;
  frameTimeMs: number;
  dpr: number;
  rendererType: string;
  atlasSize: string;
  memoryKB: number;
  seed: string;
}

/**
 * Phase 1.75 Debug Panel Overlay.
 * Developer mode only. Hidden by default.
 * Press Alt+D (or Ctrl+Alt+D) anywhere in the application to toggle visibility.
 */
export const AmbientDebugPanel: React.FC<AmbientDebugPanelProps> = ({
  fps,
  particleCount,
  frameTimeMs,
  dpr,
  rendererType,
  atlasSize,
  memoryKB,
  seed,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle on Alt+D or Ctrl+Alt+D
      if (e.altKey && (e.code === 'KeyD' || e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        setIsVisible((v) => !v);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-black/85 border border-white/10 p-3 text-xs font-mono text-gray-300 shadow-2xl backdrop-blur-md space-y-1.5 min-w-[220px] pointer-events-auto">
      <div className="flex justify-between items-center pb-1 border-b border-white/10 text-white font-semibold">
        <span>ISHKEEN ENGINE v1.75</span>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white px-1"
          title="Hide Debug Panel (Alt+D)"
        >
          ×
        </button>
      </div>

      <div className="flex justify-between">
        <span className="text-gray-400">FPS:</span>
        <span className={fps >= 55 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
          {fps.toFixed(1)}
        </span>
      </div>

      <div className="flex justify-between">
        <span className="text-gray-400">Frame Time:</span>
        <span className="text-white">{frameTimeMs.toFixed(2)} ms</span>
      </div>

      <div className="flex justify-between">
        <span className="text-gray-400">Particles:</span>
        <span className="text-white">{particleCount.toLocaleString()}</span>
      </div>

      <div className="flex justify-between">
        <span className="text-gray-400">DPR:</span>
        <span className="text-white">{dpr.toFixed(2)}x</span>
      </div>

      <div className="flex justify-between">
        <span className="text-gray-400">Renderer:</span>
        <span className="text-white">{rendererType}</span>
      </div>

      <div className="flex justify-between">
        <span className="text-gray-400">Glyph Atlas:</span>
        <span className="text-white">{atlasSize}</span>
      </div>

      <div className="flex justify-between">
        <span className="text-gray-400">Memory Est:</span>
        <span className="text-white">{(memoryKB / 1024).toFixed(2)} MB</span>
      </div>

      <div className="flex justify-between">
        <span className="text-gray-400">PRNG Seed:</span>
        <span className="text-cyan-400">{seed}</span>
      </div>

      <div className="pt-1 text-[10px] text-gray-500 text-right">
        Toggle: Alt+D
      </div>
    </div>
  );
};
