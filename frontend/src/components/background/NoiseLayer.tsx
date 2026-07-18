import * as React from "react"

export interface NoiseLayerProps {
  opacity?: number;
}

export const NoiseLayer: React.FC<NoiseLayerProps> = ({ opacity = 0.03 }) => {
  return (
    <div 
      className="pointer-events-none fixed inset-0 z-10"
      style={{
        backgroundImage: `url('data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E')`,
        backgroundRepeat: 'repeat',
        opacity: opacity,
      }}
    />
  )
}
