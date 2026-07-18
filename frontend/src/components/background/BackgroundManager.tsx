import * as React from "react"
import { LiquidMarble } from "../ui/LiquidMarble"

export interface BackgroundManagerProps {
  children: React.ReactNode;
}

export const BackgroundManager: React.FC<BackgroundManagerProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full bg-background overflow-hidden text-foreground selection:bg-accent/30 selection:text-foreground">
      {/* 1. Global Liquid Marble Canvas */}
      <LiquidMarble />

      {/* 2. Main Content Layer */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
