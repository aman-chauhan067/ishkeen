import * as React from "react"
import { LightBloom } from "./LightBloom"
import { AmbientParticles } from "./AmbientParticles"

export const GradientLayer: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background">
      {/* Soft Top Left Sage */}
      <LightBloom 
        color="var(--success)" 
        opacity={0.3} 
        size="40vw" 
        position={{ top: '-10%', left: '-10%' }} 
        delay={0}
      />
      
      {/* Soft Top Right Champagne */}
      <LightBloom 
        color="var(--warning)" 
        opacity={0.2} 
        size="50vw" 
        position={{ top: '-15%', right: '-5%' }} 
        delay={1.5}
      />
      
      {/* Subtle Bottom Blush */}
      <LightBloom 
        color="var(--danger)" 
        opacity={0.15} 
        size="60vw" 
        position={{ bottom: '-20%', left: '20%' }} 
        delay={3}
      />
      
      <AmbientParticles />
    </div>
  )
}
