'use client'

import React, { useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface ThreeDTiltWrapperProps {
  children: React.ReactNode
  className?: string
  /** Maximum rotation angle in degrees. Default is 15. */
  maxTilt?: number
}

export function ThreeDTiltWrapper({
  children,
  className,
  maxTilt = 12,
}: ThreeDTiltWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    
    // Relative mouse positions from center (-0.5 to 0.5)
    const relX = (e.clientX - rect.left) / rect.width - 0.5
    const relY = (e.clientY - rect.top) / rect.height - 0.5

    // Calculate rotation angles
    const rotateX = -relY * maxTilt
    const rotateY = relX * maxTilt

    // Set CSS custom properties on the DOM node for maximum performance
    el.style.setProperty('--rx', `${rotateX}deg`)
    el.style.setProperty('--ry', `${rotateY}deg`)

    // Save actual pixel coordinates relative to top-left for the specular reflection glow
    const glowX = e.clientX - rect.left
    const glowY = e.clientY - rect.top
    setCoords({ x: glowX, y: glowY })
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    const el = containerRef.current
    if (!el) return
    
    // Reset rotations smoothly
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative transition-transform duration-300 ease-out preserve-3d will-change-transform rounded-2xl",
        className
      )}
      style={{
        transform: 'perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Specular glare/shine reflection light overlay */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none z-10 transition-opacity duration-300 rounded-2xl",
          isHovered ? "opacity-100" : "opacity-0"
        )}
        style={{
          background: `radial-gradient(circle 240px at ${coords.x}px ${coords.y}px, rgba(255, 255, 255, 0.08), transparent 80%)`,
        }}
      />
      
      {/* Dynamic carbon reflection backing ring */}
      <div
        className={cn(
          "absolute -inset-[1px] pointer-events-none rounded-2xl border transition-opacity duration-300 z-[1]",
          isHovered ? "opacity-100 border-electric/40 shadow-glow" : "opacity-0 border-transparent"
        )}
      />

      <div className="h-full w-full relative z-[2]">
        {children}
      </div>
    </div>
  )
}
