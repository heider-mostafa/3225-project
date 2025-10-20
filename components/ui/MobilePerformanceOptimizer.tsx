'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Smartphone, Wifi, WifiOff, Battery, Zap, Monitor } from 'lucide-react'

interface PerformanceMetrics {
  deviceType: 'mobile' | 'tablet' | 'desktop'
  connectionType: string
  batteryLevel?: number
  memoryInfo?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
  viewportSize: {
    width: number
    height: number
  }
  isReducedMotion: boolean
  timestamp: number
}

interface MobilePerformanceOptimizerProps {
  children: React.ReactNode
  enableOptimizations?: boolean
  onPerformanceChange?: (metrics: PerformanceMetrics) => void
}

export default function MobilePerformanceOptimizer({
  children,
  enableOptimizations = true,
  onPerformanceChange
}: MobilePerformanceOptimizerProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [optimizationLevel, setOptimizationLevel] = useState<'high' | 'medium' | 'low'>('medium')

  // Collect performance metrics
  const collectMetrics = useCallback(() => {
    const performance = window.performance as any
    const navigator = window.navigator as any
    
    const deviceType = window.innerWidth <= 480 ? 'mobile' : 
                      window.innerWidth <= 768 ? 'tablet' : 'desktop'
    
    const connectionType = navigator.connection?.effectiveType || '4g'
    
    const batteryLevel = navigator.getBattery ? 
      navigator.getBattery().then((battery: any) => battery.level) : 
      undefined
    
    const memoryInfo = performance.memory ? {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
    } : undefined
    
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    const newMetrics: PerformanceMetrics = {
      deviceType,
      connectionType,
      memoryInfo,
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      isReducedMotion,
      timestamp: Date.now()
    }
    
    if (batteryLevel) {
      batteryLevel.then((level: number) => {
        newMetrics.batteryLevel = level
        setMetrics(newMetrics)
        onPerformanceChange?.(newMetrics)
      })
    } else {
      setMetrics(newMetrics)
      onPerformanceChange?.(newMetrics)
    }
  }, [onPerformanceChange])

  // Determine optimization level based on metrics
  useEffect(() => {
    if (!metrics) return
    
    let level: 'high' | 'medium' | 'low' = 'medium'
    
    // High optimization for low-end devices
    if (
      metrics.deviceType === 'mobile' &&
      (metrics.connectionType === 'slow-2g' || metrics.connectionType === '2g') ||
      (metrics.batteryLevel && metrics.batteryLevel < 0.2) ||
      (metrics.memoryInfo && metrics.memoryInfo.usedJSHeapSize / metrics.memoryInfo.jsHeapSizeLimit > 0.8)
    ) {
      level = 'high'
    }
    // Low optimization for high-end devices
    else if (
      metrics.deviceType === 'desktop' &&
      metrics.connectionType === '4g' &&
      (metrics.batteryLevel === undefined || metrics.batteryLevel > 0.5)
    ) {
      level = 'low'
    }
    
    setOptimizationLevel(level)
  }, [metrics])

  // Apply CSS optimizations based on performance level
  useEffect(() => {
    if (!enableOptimizations || !metrics) return
    
    const root = document.documentElement
    
    // Apply optimizations
    switch (optimizationLevel) {
      case 'high':
        root.style.setProperty('--animation-duration', '0ms')
        root.style.setProperty('--transition-duration', '0ms')
        root.style.setProperty('--blur-amount', '0px')
        root.style.setProperty('--shadow-amount', 'none')
        break
        
      case 'medium':
        root.style.setProperty('--animation-duration', '150ms')
        root.style.setProperty('--transition-duration', '200ms')
        root.style.setProperty('--blur-amount', '2px')
        root.style.setProperty('--shadow-amount', '0 1px 3px rgba(0,0,0,0.1)')
        break
        
      case 'low':
        root.style.setProperty('--animation-duration', '300ms')
        root.style.setProperty('--transition-duration', '300ms')
        root.style.setProperty('--blur-amount', '4px')
        root.style.setProperty('--shadow-amount', '0 4px 6px rgba(0,0,0,0.1)')
        break
    }
    
    // Reduced motion
    if (metrics.isReducedMotion) {
      root.style.setProperty('--animation-duration', '0ms')
      root.style.setProperty('--transition-duration', '0ms')
    }
    
    // Add performance class to body
    document.body.className = document.body.className.replace(/perf-\w+/g, '')
    document.body.classList.add(`perf-${optimizationLevel}`)
    document.body.classList.add(`device-${metrics.deviceType}`)
    document.body.classList.add(`connection-${metrics.connectionType}`)
    
  }, [optimizationLevel, metrics, enableOptimizations])

  // Monitor viewport changes and battery
  useEffect(() => {
    collectMetrics()
    
    const handleResize = () => collectMetrics()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        collectMetrics()
      }
    }
    
    window.addEventListener('resize', handleResize)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Periodic metrics collection
    const interval = setInterval(collectMetrics, 30000) // Every 30 seconds
    
    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(interval)
    }
  }, [collectMetrics])

  // Preload critical resources for mobile
  useEffect(() => {
    if (metrics?.deviceType === 'mobile' && enableOptimizations) {
      // Preload critical fonts
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = '/fonts/inter-var.woff2'
      link.as = 'font'
      link.type = 'font/woff2'
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
      
      // Prefetch likely navigation targets
      const prefetchLinks = ['/properties', '/saved', '/profile']
      prefetchLinks.forEach(href => {
        const prefetchLink = document.createElement('link')
        prefetchLink.rel = 'prefetch'
        prefetchLink.href = href
        document.head.appendChild(prefetchLink)
      })
    }
  }, [metrics, enableOptimizations])

  return (
    <>
      {children}
      
      {/* Performance Debug Panel (Development Only) */}
      {process.env.NODE_ENV === 'development' && metrics && (
        <div className="fixed bottom-4 left-4 z-50 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            {metrics.deviceType === 'mobile' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
            <span className="font-bold">Performance Monitor</span>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {metrics.connectionType === 'slow-2g' || metrics.connectionType === '2g' ? 
                <WifiOff className="w-3 h-3 text-red-400" /> : 
                <Wifi className="w-3 h-3 text-green-400" />
              }
              <span>{metrics.connectionType}</span>
            </div>
            
            {metrics.batteryLevel && (
              <div className="flex items-center gap-2">
                <Battery className="w-3 h-3" />
                <span>{Math.round(metrics.batteryLevel * 100)}%</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Zap className={`w-3 h-3 ${
                optimizationLevel === 'high' ? 'text-red-400' :
                optimizationLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'
              }`} />
              <span>Optimization: {optimizationLevel}</span>
            </div>
            
            {metrics.memoryInfo && (
              <div className="text-xs opacity-75">
                Memory: {Math.round(metrics.memoryInfo.usedJSHeapSize / 1024 / 1024)}MB used
              </div>
            )}
            
            <div className="text-xs opacity-75">
              {metrics.viewportSize.width}×{metrics.viewportSize.height}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Custom hook for accessing performance metrics
export const useMobilePerformance = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics[]>([])
  
  const addMetrics = (metrics: PerformanceMetrics) => {
    setPerformanceData(prev => {
      const updated = [...prev, metrics]
      // Keep only last 50 entries
      return updated.slice(-50)
    })
  }
  
  const getAverageMetrics = () => {
    if (performanceData.length === 0) return null
    
    const recent = performanceData.slice(-10) // Last 10 entries
    
    return {
      avgMemoryUsage: recent.reduce((acc, d) => 
        acc + (d.memoryInfo?.usedJSHeapSize || 0), 0) / recent.length,
      avgBatteryLevel: recent.reduce((acc, d) => 
        acc + (d.batteryLevel || 1), 0) / recent.length,
      mobilePercentage: recent.filter(d => d.deviceType === 'mobile').length / recent.length,
      slowConnectionPercentage: recent.filter(d => 
        d.connectionType === 'slow-2g' || d.connectionType === '2g').length / recent.length
    }
  }
  
  return {
    performanceData,
    addMetrics,
    getAverageMetrics,
    totalSamples: performanceData.length
  }
}