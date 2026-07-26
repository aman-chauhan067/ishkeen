import React, { useEffect, useRef } from 'react';

interface Point3D {
  x: number;
  y: number;
  z: number;
  type: 'eye' | 'body' | 'tail' | 'wing' | 'highlight';
  intensity: number; // 0.0 to 1.0
}

interface AsciiDragonflyBackgroundProps {
  className?: string;
}

export const AsciiDragonflyBackground: React.FC<AsciiDragonflyBackgroundProps> = ({
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // ============================================================================
    // 1. PROCEDURAL 3D DRAGONFLY SCULPTURE GENERATOR (~3,800 POINTS)
    // ============================================================================
    const generateDragonfly = (): Point3D[] => {
      const pts: Point3D[] = [];

      // A. Compound Eyes & Head (Spherical faceted clusters)
      const addSphere = (
        cx: number,
        cy: number,
        cz: number,
        radius: number,
        stepsU: number,
        stepsV: number,
        type: 'eye' | 'body' | 'highlight'
      ) => {
        for (let u = 0; u <= stepsU; u++) {
          const theta = (u / stepsU) * Math.PI;
          for (let v = 0; v < stepsV; v++) {
            const phi = (v / stepsV) * Math.PI * 2;
            const x = cx + radius * Math.sin(theta) * Math.cos(phi);
            const y = cy + radius * Math.sin(theta) * Math.sin(phi);
            const z = cz + radius * Math.cos(theta);
            const intensity = Math.sin(theta);
            pts.push({ x, y, z, type, intensity });
          }
        }
      };

      // Left eye, Right eye, and central head capsule
      addSphere(-0.35, 0.1, 1.45, 0.42, 8, 12, 'eye');
      addSphere(0.35, 0.1, 1.45, 0.42, 8, 12, 'eye');
      addSphere(0.0, -0.05, 1.55, 0.28, 6, 8, 'highlight');

      // B. Thorax (Robust ribbed ellipsoid body)
      for (let z = 0.1; z <= 1.2; z += 0.08) {
        const t = (z - 0.1) / 1.1;
        const radiusX = 0.45 * Math.sin(t * Math.PI);
        const radiusY = 0.42 * Math.sin(t * Math.PI);
        const steps = 16;
        for (let i = 0; i < steps; i++) {
          const angle = (i / steps) * Math.PI * 2;
          const x = Math.cos(angle) * radiusX;
          const y = Math.sin(angle) * radiusY - 0.05;
          const isRib = Math.abs(Math.sin(z * 15)) > 0.6;
          pts.push({
            x,
            y,
            z,
            type: isRib ? 'highlight' : 'body',
            intensity: isRib ? 0.95 : 0.7,
          });
        }
      }

      // C. Abdomen / Tail (Long 12-segment tapering tail extending back to z = -4.6)
      const numSegments = 14;
      for (let seg = 0; seg < numSegments; seg++) {
        const zStart = 0.1 - seg * 0.35;
        const zEnd = zStart - 0.3;
        const taper = 1.0 - seg * 0.055; // Tapers down towards tip
        const rad = Math.max(0.06, 0.28 * taper);

        // Inter-segment ring highlight
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          pts.push({
            x: Math.cos(angle) * (rad + 0.03),
            y: Math.sin(angle) * (rad + 0.03),
            z: zStart,
            type: 'highlight',
            intensity: 0.9,
          });
        }

        // Segment cylinder body
        for (let z = zStart - 0.05; z >= zEnd; z -= 0.06) {
          for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            pts.push({
              x: Math.cos(angle) * rad,
              y: Math.sin(angle) * rad,
              z,
              type: 'tail',
              intensity: 0.6,
            });
          }
        }
      }

      // D. Four Wings (Lace-like vein networks: Forewings & Hindwings)
      const buildWing = (
        zBase: number,
        length: number,
        maxWidth: number,
        isLeft: boolean,
        sweepAngle: number
      ) => {
        const dir = isLeft ? -1 : 1;
        const numSpans = 28;
        for (let s = 0; s <= numSpans; s++) {
          const t = s / numSpans;
          // Wing profile curve (aerodynamic dragonfly wing shape)
          const dist = t * length;
          const w =
            maxWidth *
            Math.sin(Math.pow(t, 0.7) * Math.PI) *
            (1.0 - 0.3 * t);

          const numVeins = Math.max(3, Math.floor(w * 18));
          for (let v = 0; v < numVeins; v++) {
            const vt = (v / (numVeins - 1)) * 2 - 1; // -1 to 1 across wing width
            const localX = dir * dist;
            const localZ = zBase - vt * w * 0.5 + dist * Math.sin(sweepAngle);
            const localY = 0.15 + Math.sin(t * Math.PI) * 0.08 - Math.abs(vt) * 0.04;

            // Highlight leading edge (nodus / pterostigma of dragonfly wing)
            const isLeadingEdge = vt > 0.75;
            const isVeinCross = (s % 3 === 0) || (v % 3 === 0);

            pts.push({
              x: localX,
              y: localY,
              z: localZ,
              type: isLeadingEdge ? 'highlight' : 'wing',
              intensity: isLeadingEdge ? 0.95 : isVeinCross ? 0.7 : 0.45,
            });
          }
        }
      };

      // Left Forewing & Right Forewing
      buildWing(0.85, 3.8, 0.82, true, 0.15);
      buildWing(0.85, 3.8, 0.82, false, 0.15);

      // Left Hindwing & Right Hindwing (slightly wider at base)
      buildWing(0.45, 3.5, 0.95, true, -0.1);
      buildWing(0.45, 3.5, 0.95, false, -0.1);

      return pts;
    };

    const dragonflyPoints = generateDragonfly();

    // ============================================================================
    // 2. ASCII CHAR PALETTES (FROM LIGHTEST TO DENSET)
    // ============================================================================
    // Dense technical characters just like dragonfly.xyz
    const asciiPalette = [' ', '.', ',', ':', ';', 'i', '1', 't', 'f', 'L', 'C', 'G', '0', '8', '@', '#'];
    const wingPalette = [' ', '.', ',', '-', '~', '+', '=', '*', '/', '\\', '%', '#'];

    // ============================================================================
    // 3. 3D PROJECTION & SCROLL-DRIVEN ROTATION LOOP
    // ============================================================================
    const charWidth = 9;
    const charHeight = 15;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const cols = Math.floor(width / charWidth);
      const rows = Math.floor(height / charHeight);

      // Z-buffer and Char-buffer for visible ASCII rendering
      const zBuffer: number[] = new Array(cols * rows).fill(-9999);
      const charBuffer: string[] = new Array(cols * rows).fill(' ');
      const colorBuffer: string[] = new Array(cols * rows).fill('#26384B');

      // Scroll position influences 3D rotation angles!
      const scrollY = window.scrollY || 0;
      const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
      const scrollProgress = scrollY / maxScroll;

      // Base rotation + scroll-driven 3D flight rotation
      const time = performance.now() * 0.001;
      const pitch = 0.4 + scrollProgress * 1.8 + Math.sin(time * 0.6) * 0.08; // X axis
      const yaw = 0.6 + scrollY * 0.002 + time * 0.15; // Y axis (rotates as you scroll!)
      const roll = 0.15 + Math.sin(time * 0.8) * 0.08; // Z axis

      // Wing flapping physics (subtle organic hover breath)
      const wingFlap = Math.sin(time * 3.2) * 0.12;

      // Trigonometry lookup for Euler rotation
      const cosX = Math.cos(pitch), sinX = Math.sin(pitch);
      const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
      const cosZ = Math.cos(roll), sinZ = Math.sin(roll);

      const scale = Math.min(width, height) * 0.115;
      const centerX = width * 0.5;
      const centerY = height * 0.52;

      for (let i = 0; i < dragonflyPoints.length; i++) {
        const pt = dragonflyPoints[i];
        let { x, y, z } = pt;

        // Apply wing flapping rotation around Z axis for wings
        if (pt.type === 'wing' || (pt.type === 'highlight' && Math.abs(x) > 0.8)) {
          const flapAngle = x < 0 ? -wingFlap : wingFlap;
          const cosF = Math.cos(flapAngle), sinF = Math.sin(flapAngle);
          const nx = x * cosF - y * sinF;
          const ny = x * sinF + y * cosF;
          x = nx;
          y = ny;
        }

        // 1. Rotate around Y (Yaw)
        let x1 = x * cosY + z * sinY;
        let y1 = y;
        let z1 = -x * sinY + z * cosY;

        // 2. Rotate around X (Pitch)
        let x2 = x1;
        let y2 = y1 * cosX - z1 * sinX;
        let z2 = y1 * sinX + z1 * cosX;

        // 3. Rotate around Z (Roll)
        let rx = x2 * cosZ - y2 * sinZ;
        let ry = x2 * sinZ + y2 * cosZ;
        let rz = z2;

        // Perspective camera distance
        const cameraDist = 7.5;
        const depth = cameraDist - rz;
        if (depth < 0.5) continue;

        const fovFactor = cameraDist / depth;
        const screenX = Math.round((rx * scale * fovFactor + centerX) / charWidth);
        const screenY = Math.round((ry * scale * fovFactor + centerY) / charHeight);

        if (screenX >= 0 && screenX < cols && screenY >= 0 && screenY < rows) {
          const idx = screenY * cols + screenX;
          if (rz > zBuffer[idx]) {
            zBuffer[idx] = rz;

            // Choose character based on intensity & depth
            const intensityIdx = Math.floor(
              Math.min(0.99, pt.intensity * (0.6 + 0.4 * fovFactor)) *
                asciiPalette.length
            );

            let ch = asciiPalette[intensityIdx];
            if (pt.type === 'wing') {
              const wingIdx = Math.floor(
                Math.min(0.99, pt.intensity) * wingPalette.length
              );
              ch = wingPalette[wingIdx];
            }

            charBuffer[idx] = ch;

            // Choose color based on Swiss Clinical Editorial V1.0
            if (pt.type === 'highlight' || pt.type === 'eye') {
              colorBuffer[idx] = '#C67C5A'; // Copper accent highlighted particles
            } else {
              colorBuffer[idx] = '#202020'; // #202020 editorial ASCII
            }
          }
        }
      }

      // Render buffered ASCII grid to canvas
      ctx.font = `400 11px 'JetBrains Mono', monospace`;
      ctx.textBaseline = 'top';

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const char = charBuffer[idx];
          if (char !== ' ') {
            ctx.fillStyle = colorBuffer[idx];
            ctx.fillText(char, c * charWidth, r * charHeight);
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={`fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-15 transition-opacity duration-500"
      />
    </div>
  );
};

export default AsciiDragonflyBackground;
