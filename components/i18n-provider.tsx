"use client"

import { useEffect, useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/config'

interface I18nProviderProps {
  children: React.ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeI18n = async () => {
      try {
        console.log('i18n initialization check - isInitialized:', i18n.isInitialized)
        // Ensure i18n is initialized
        if (!i18n.isInitialized) {
          console.log('Initializing i18n...')
          await i18n.init()
        }
        console.log('i18n ready, setting state...')
        setIsReady(true)
      } catch (err) {
        console.error('i18n initialization failed:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize translations')
        // Still set ready to true to show the app with fallback
        setIsReady(true)
      }
    }

    initializeI18n()
  }, [])

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    console.warn('Translation system error:', error)
    // Continue rendering but with warning
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  )
} 