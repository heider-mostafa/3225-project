/**
 * Enhanced Translation Service for Complete App Translation
 * Provides both UI and content translation with better English fallback
 */

import React from 'react'

interface TranslationCache {
  [key: string]: {
    [targetLang: string]: string
  }
}

interface GoogleTranslateResponse {
  data: {
    translations: Array<{
      translatedText: string
      detectedSourceLanguage?: string
    }>
  }
}

class TranslationService {
  private cache: TranslationCache = {}
  private apiKey: string
  private isEnabled: boolean = false
  private pendingTranslations = new Map<string, Promise<string>>()
  private currentLanguage: string = 'en'
  private originalTexts = new Map<string, string>() // Store original English texts

  constructor() {
    // Using i18n for translations
    this.apiKey = ''
    this.isEnabled = true // Enable for PropertyTranslationWrapper compatibility
    
    console.info('Translation service enabled - using i18n translations')

    // Load cache and current language from localStorage
    this.loadCache()
    this.loadCurrentLanguage()
  }

  private loadCache() {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('translation-cache')
        if (cached) {
          this.cache = JSON.parse(cached)
        }
      } catch (error) {
        console.warn('Failed to load translation cache:', error)
      }
    }
  }

  private saveCache() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('translation-cache', JSON.stringify(this.cache))
      } catch (error) {
        console.warn('Failed to save translation cache:', error)
      }
    }
  }

  private loadCurrentLanguage() {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('i18nextLng') || localStorage.getItem('preferred-language') || 'en'
      this.currentLanguage = savedLang
    }
  }

  saveCurrentLanguage(lang: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('i18nextLng', lang)
      this.currentLanguage = lang
    }
  }

  getCurrentLanguage(): string {
    return this.currentLanguage
  }

  private getCacheKey(text: string): string {
    return btoa(encodeURIComponent(text.trim())).replace(/[+/=]/g, '_')
  }

  /**
   * Store original English text for later retrieval
   */
  private storeOriginalText(text: string) {
    const key = this.getCacheKey(text)
    if (!this.originalTexts.has(key)) {
      this.originalTexts.set(key, text)
    }
  }

  /**
   * Get original English text
   */
  private getOriginalText(text: string): string {
    const key = this.getCacheKey(text)
    return this.originalTexts.get(key) || text
  }

  /**
   * Translate a single text string
   */
  async translateText(
    text: string, 
    targetLang: string = 'ar', 
    sourceLang: string = 'en'
  ): Promise<string> {
    // If target language is same as source, return original
    if (targetLang === sourceLang || targetLang === 'en') {
      return text
    }

    // Check cache first
    const cacheKey = this.getCacheKey(text)
    if (this.cache[cacheKey] && this.cache[cacheKey][targetLang]) {
      console.log('Using cached translation for:', text.substring(0, 50) + '...')
      return this.cache[cacheKey][targetLang]
    }

    // Store original text
    this.storeOriginalText(text)

    // Check if translation is already pending
    const pendingKey = `${text}_${targetLang}`
    if (this.pendingTranslations.has(pendingKey)) {
      return this.pendingTranslations.get(pendingKey)!
    }

    // Perform translation
    const translationPromise = this.performTranslation(text, targetLang, sourceLang)
    this.pendingTranslations.set(pendingKey, translationPromise)

    try {
      const result = await translationPromise
      
      // Cache the result
      if (!this.cache[cacheKey]) {
        this.cache[cacheKey] = {}
      }
      this.cache[cacheKey][targetLang] = result
      this.saveCache()
      
      return result
    } catch (error) {
      console.error('Translation failed:', error)
      return text // Fallback to original
    } finally {
      this.pendingTranslations.delete(pendingKey)
    }
  }

  private async performTranslation(
    text: string, 
    targetLang: string, 
    sourceLang: string
  ): Promise<string> {
    try {
      const response = await fetch(`/api/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLang,
          sourceLang
        })
      })

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`)
      }

      const data = await response.json()
      return data.translatedText || text
    } catch (error) {
      console.error('Translation failed:', error)
      return text // Fallback to original text
    }
  }

  /**
   * Translate multiple texts in batch
   */
  async translateBatch(
    texts: string[], 
    targetLang: string = 'ar', 
    sourceLang: string = 'en'
  ): Promise<string[]> {
    // If target language is same as source, return original
    if (targetLang === sourceLang || targetLang === 'en') {
      return texts
    }

    // Filter out empty strings and translate each
    const translations = await Promise.all(
      texts.map(text => 
        text.trim() ? this.translateText(text, targetLang, sourceLang) : text
      )
    )
    
    return translations
  }

  /**
   * Translate all text content in a DOM element - DISABLED (i18n only)
   */
  async translateElement(element: Element, targetLang: string = 'ar'): Promise<void> {
    // No-op - translation handled by i18n
    return
  }

  private getTextNodes(element: Element): Text[] {
    const textNodes: Text[] = []
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip script and style elements
          const parent = node.parentElement
          if (parent && ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) {
            return NodeFilter.FILTER_REJECT
          }
          // Skip empty or whitespace-only nodes
          if (!node.textContent?.trim()) {
            return NodeFilter.FILTER_REJECT
          }
          return NodeFilter.FILTER_ACCEPT
        }
      }
    )

    let node
    while (node = walker.nextNode()) {
      textNodes.push(node as Text)
    }

    return textNodes
  }

  private isNonTranslatableText(text: string): boolean {
    // Skip numbers, currencies, emails, URLs, etc.
    const patterns = [
      /^\d+$/, // Pure numbers
      /^[\d\s,.$€£¥]+$/, // Currency/price patterns
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Emails
      /^https?:\/\//, // URLs
      /^[\d\s()+-]+$/, // Phone numbers
      /^[A-Z]{2,10}$/, // Currency codes, country codes
      /^\d+\/\d+\/\d+$/, // Dates
      /^#[a-fA-F0-9]{3,6}$/, // Hex colors
    ]

    return patterns.some(pattern => pattern.test(text))
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.cache = {}
    this.originalTexts.clear()
    this.saveCache()
  }

  /**
   * Reset to English (clear all translations)
   */
  resetToEnglish(): void {
    this.saveCurrentLanguage('en')
    
    // Dispatch language change event
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('languageChange', { detail: 'en' })
      window.dispatchEvent(event)
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'ar', name: 'العربية', flag: '🇪🇬' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
      { code: 'it', name: 'Italiano', flag: '🇮🇹' },
      { code: 'pt', name: 'Português', flag: '🇵🇹' },
      { code: 'ru', name: 'Русский', flag: '🇷🇺' },
      { code: 'zh', name: '中文', flag: '🇨🇳' },
      { code: 'ja', name: '日本語', flag: '🇯🇵' },
    ]
  }

  /**
   * Check if translation service is available - DISABLED (i18n only)
   */
  isAvailable(): boolean {
    return true
  }
}

// Export singleton instance
export const translationService = new TranslationService()

// Make it globally available for sync with react-i18next
if (typeof window !== 'undefined') {
  (window as any).translationService = translationService
}

/**
 * React Hook for easy translation in components - SIMPLIFIED (i18n only)
 */
export function useAutoTranslate() {
  const [currentLang, setCurrentLang] = React.useState('en')

  React.useEffect(() => {
    // Load current language on mount
    const lang = translationService.getCurrentLanguage()
    setCurrentLang(lang)

    // Listen for language changes
    const handleLanguageChange = (event: CustomEvent<string>) => {
      setCurrentLang(event.detail)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('languageChange', handleLanguageChange as EventListener)
      return () => {
        window.removeEventListener('languageChange', handleLanguageChange as EventListener)
      }
    }
  }, [])

  const translateText = async (text: string, targetLang?: string) => {
    // Return original text - translation handled by i18n
    return text
  }

  const translatePage = async (targetLang: string) => {
    // Update current language
    setCurrentLang(targetLang)
    translationService.saveCurrentLanguage(targetLang)
    
    // Update document language and direction
    document.documentElement.lang = targetLang
    document.documentElement.dir = targetLang === 'ar' ? 'rtl' : 'ltr'
    document.body.classList.toggle('rtl', targetLang === 'ar')
    
    // Dispatch language change event for components to re-render
    const event = new CustomEvent('languageChange', { detail: targetLang })
    window.dispatchEvent(event)
  }

  return {
    currentLang,
    translateText,
    translatePage,
    isTranslating: false,
    isAvailable: true
  }
}

/**
 * React Hook for content translation with i18n integration
 * Returns original content as PropertyTranslationWrapper manages the flow
 */
export function useContentTranslation(content: string) {
  const [currentLang, setCurrentLang] = React.useState('en')
  const [translatedContent, setTranslatedContent] = React.useState(content)
  const [isTranslating, setIsTranslating] = React.useState(false)

  // Get user's preferred language from the service
  React.useEffect(() => {
    const lang = translationService.getCurrentLanguage()
    setCurrentLang(lang)
  }, [])

  // Update translated content when content or language changes
  React.useEffect(() => {
    if (!content || content.trim().length === 0) {
      setTranslatedContent(content)
      return
    }

    // If English, return original content
    if (currentLang === 'en') {
      setTranslatedContent(content)
      return
    }

    // Perform translation
    const translate = async () => {
      setIsTranslating(true)
      try {
        const translated = await translationService.translateText(content, currentLang, 'en')
        setTranslatedContent(translated)
      } catch (error) {
        console.error('Content translation failed:', error)
        setTranslatedContent(content) // Fallback to original
      } finally {
        setIsTranslating(false)
      }
    }

    translate()
  }, [content, currentLang])

  // Listen for language changes from other components
  React.useEffect(() => {
    const handleLanguageChange = (event: CustomEvent<string>) => {
      const newLang = event.detail
      setCurrentLang(newLang)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('languageChange', handleLanguageChange as EventListener)
      return () => {
        window.removeEventListener('languageChange', handleLanguageChange as EventListener)
      }
    }
  }, [])

  return {
    translatedContent,
    isTranslating,
    currentLang
  }
}

/**
 * Hook for translating arrays of text (useful for property lists, etc.)
 */
export function useBatchTranslation(texts: string[]) {
  const [translatedTexts, setTranslatedTexts] = React.useState<string[]>(texts)
  const [isTranslating, setIsTranslating] = React.useState(false)
  const [currentLang, setCurrentLang] = React.useState('en')

  React.useEffect(() => {
    const lang = translationService.getCurrentLanguage()
    setCurrentLang(lang)
  }, [])

  React.useEffect(() => {
    // Handle empty or invalid texts immediately
    if (!texts || texts.length === 0) {
      setTranslatedTexts([])
      setIsTranslating(false)
      return
    }

    // Filter out empty strings to avoid unnecessary translations
    const validTexts = texts.filter(text => text && text.trim().length > 0)
    if (validTexts.length === 0) {
      setTranslatedTexts(texts) // Return original array to maintain indices
      setIsTranslating(false)
      return
    }

    const translateTexts = async () => {
      // For English or when service unavailable, return original texts
      if (currentLang === 'en' || !translationService.isAvailable()) {
        setTranslatedTexts(texts)
        setIsTranslating(false)
        return
      }

      setIsTranslating(true)
      try {
        const translated = await translationService.translateBatch(texts, currentLang, 'en')
        setTranslatedTexts(translated)
      } catch (error) {
        console.error('Batch translation failed:', error)
        setTranslatedTexts(texts)
      } finally {
        setIsTranslating(false)
      }
    }

    translateTexts()
  }, [JSON.stringify(texts), currentLang])

  // Listen for language changes
  React.useEffect(() => {
    const handleLanguageChange = (event: CustomEvent<string>) => {
      const newLang = event.detail
      setCurrentLang(newLang)
      
      if (newLang === 'en') {
        setTranslatedTexts(texts)
        setIsTranslating(false)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('languageChange', handleLanguageChange as EventListener)
      return () => {
        window.removeEventListener('languageChange', handleLanguageChange as EventListener)
      }
    }
  }, [texts])

  return {
    translatedTexts,
    isTranslating,
    currentLang
  }
} 