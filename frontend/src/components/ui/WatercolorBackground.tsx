import React from 'react';

export const WatercolorBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Cream Paper Background base */}
      <div className="absolute inset-0 bg-[#fcfaf6]" />
      
      {/* Pigment 1: Soft Sage */}
      <div 
        className="absolute top-[-5%] left-[-5%] w-[50vw] h-[50vw] rounded-full mix-blend-multiply opacity-50"
        style={{
          background: 'radial-gradient(circle, rgba(113,156,131,0.6) 0%, rgba(113,156,131,0) 70%)',
          filter: 'blur(80px)',
          transform: 'scale(1.2) rotate(15deg)'
        }}
      />
      
      {/* Pigment 2: Delicate Blush */}
      <div 
        className="absolute top-[10%] right-[-10%] w-[40vw] h-[60vw] rounded-[100%] mix-blend-multiply opacity-40"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(217,143,152,0.6) 0%, rgba(217,143,152,0) 70%)',
          filter: 'blur(90px)',
          transform: 'rotate(-25deg)'
        }}
      />
      
      {/* Pigment 3: Deep Indigo / Navy */}
      <div 
        className="absolute bottom-[-10%] left-[5%] w-[60vw] h-[40vw] rounded-[100%] mix-blend-multiply opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(28,40,65,0.6) 0%, rgba(28,40,65,0) 70%)',
          filter: 'blur(100px)',
          transform: 'rotate(10deg)'
        }}
      />

      {/* Pigment 4: Terracotta / Peach */}
      <div 
        className="absolute bottom-[10%] right-[5%] w-[35vw] h-[35vw] rounded-full mix-blend-multiply opacity-40"
        style={{
          background: 'radial-gradient(circle, rgba(183,104,86,0.6) 0%, rgba(183,104,86,0) 70%)',
          filter: 'blur(70px)',
        }}
      />

      {/* Paper Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          backgroundImage: `url('data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="4" stitchTiles="stitch"/%3E%3CcolorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.15 0" /%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noise)"/%3E%3C/svg%3E')`,
          backgroundRepeat: 'repeat'
        }}
      />
    </div>
  );
};
