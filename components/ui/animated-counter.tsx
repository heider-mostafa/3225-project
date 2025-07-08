"use client"

import { useEffect, useState, useRef } from 'react'
import { motion, useInView, animate } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  suffix?: string
  duration?: number
  className?: string
}

export function AnimatedCounter({ value, suffix = '', duration = 2, className = '' }: AnimatedCounterProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (isInView) {
      // Use animate function for smooth, controlled animation
      const controls = animate(0, value, {
        duration: duration,
        ease: "easeOut",
        onUpdate: (latest) => {
          // Ensure we only increase and never exceed target
          setDisplayValue(Math.min(Math.floor(latest), value))
        }
      })
      
      return () => controls.stop()
    }
  }, [isInView, value, duration])

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {formatNumber(displayValue)}{suffix}
    </motion.div>
  )
}