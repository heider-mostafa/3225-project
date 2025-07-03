"use client"

import React, { Suspense } from 'react'
import { useTranslation } from 'react-i18next'

interface SafeTranslationProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Wrapper component that provides safe translation handling
 * Prevents white screens when translation system fails
 */
export function SafeTranslation({ children, fallback }: SafeTranslationProps) {
  const { ready } = useTranslation()

  const defaultFallback = (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-24"></div>
    </div>
  )

  if (!ready) {
    return fallback || defaultFallback
  }

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  )
}

/**
 * Safe translation hook that provides fallbacks
 */
export function useSafeTranslation() {
  const { t, i18n, ready } = useTranslation()

  const safeT = (key: string, fallback?: string, options?: any): string => {
    if (!ready) {
      return fallback || key
    }
    
    try {
      const result = t(key, fallback, options)
      // If translation returns the key itself, use fallback
      return result === key && fallback ? fallback : result
    } catch (error) {
      console.warn('Translation error for key:', key, error)
      return fallback || key
    }
  }

  return {
    t: safeT,
    i18n,
    ready,
    isArabic: i18n.language === 'ar',
    currentLanguage: i18n.language
  }
}