"use client"

import { useEffect, useState, useRef } from 'react'
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  suffix?: string
  duration?: number
  className?: string
}

export function AnimatedCounter({ value, suffix = '', duration = 2, className = '' }: AnimatedCounterProps) {
  const ref = useRef<HTMLDivElement>(null)
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { duration: duration * 1000 })
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (isInView) {
      motionValue.set(value)
    }
  }, [motionValue, isInView, value])

  useEffect(() => {
    springValue.on("change", (latest) => {
      setDisplayValue(Math.floor(latest))
    })
  }, [springValue])

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