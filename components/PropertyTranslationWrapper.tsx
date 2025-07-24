"use client"

import React from 'react'
import { useContentTranslation, useBatchTranslation } from '@/lib/translation-service'

interface PropertyBase {
  id: string
  title: string
  description?: string
  marketing_headline?: string
  address: string
  neighborhood?: string
  compound?: string
  features?: string[]
  amenities?: string[]
  key_features?: string[]
  [key: string]: any
}

interface PropertyTranslationWrapperProps {
  property: PropertyBase
  children: (translatedProperty: PropertyBase, isTranslating: boolean) => React.ReactNode
}

/**
 * Optimized wrapper component for property translation
 * Uses single batch translation to prevent excessive re-renders
 */
export const PropertyTranslationWrapper = React.memo(function PropertyTranslationWrapper({ 
  property, 
  children 
}: PropertyTranslationWrapperProps) {
  const [translatedProperty, setTranslatedProperty] = React.useState<PropertyBase>(property)
  const [isTranslating, setIsTranslating] = React.useState(false)
  const [currentLang, setCurrentLang] = React.useState('en')

  // Listen for language changes
  React.useEffect(() => {
    const handleLanguageChange = (event: CustomEvent<string>) => {
      setCurrentLang(event.detail)
    }

    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('i18nextLng') || localStorage.getItem('preferred-language') || 'en'
      setCurrentLang(savedLang)
      
      window.addEventListener('languageChange', handleLanguageChange as EventListener)
      return () => {
        window.removeEventListener('languageChange', handleLanguageChange as EventListener)
      }
    }
  }, [])

  // Batch translate all property fields efficiently
  React.useEffect(() => {
    if (currentLang === 'en') {
      setTranslatedProperty(property)
      setIsTranslating(false)
      return
    }

    const translateProperty = async () => {
      setIsTranslating(true)
      
      try {
        // Collect all text fields that need translation
        const textsToTranslate = [
          property.title || '',
          property.description || '',
          property.marketing_headline || '',
          property.address || '',
          property.neighborhood || '',
          property.compound || '',
          ...(property.features || []),
          ...(property.amenities || []),
          ...(property.key_features || [])
        ].filter(text => text.trim().length > 0)

        // Use single batch translation call
        const response = await fetch('/api/translate-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            texts: textsToTranslate,
            targetLang: currentLang,
            sourceLang: 'en'
          })
        })

        if (response.ok) {
          const { translations } = await response.json()
          const translatedTexts = translations || []
          
          // Map translated texts back to property fields
          let index = 0
          const translated: PropertyBase = {
            ...property,
            title: property.title ? (translatedTexts[index++] || property.title) : property.title,
            description: property.description ? (translatedTexts[index++] || property.description) : property.description,
            marketing_headline: property.marketing_headline ? (translatedTexts[index++] || property.marketing_headline) : property.marketing_headline,
            address: property.address ? (translatedTexts[index++] || property.address) : property.address,
            neighborhood: property.neighborhood ? (translatedTexts[index++] || property.neighborhood) : property.neighborhood,
            compound: property.compound ? (translatedTexts[index++] || property.compound) : property.compound,
            features: property.features?.length ? translatedTexts.slice(index, index + property.features.length) : property.features,
            amenities: property.amenities?.length ? translatedTexts.slice(index + (property.features?.length || 0), index + (property.features?.length || 0) + property.amenities.length) : property.amenities,
            key_features: property.key_features?.length ? translatedTexts.slice(index + (property.features?.length || 0) + (property.amenities?.length || 0)) : property.key_features
          }

          setTranslatedProperty(translated)
        } else {
          setTranslatedProperty(property) // Fallback to original
        }
      } catch (error) {
        console.error('Property translation failed:', error)
        setTranslatedProperty(property) // Fallback to original
      } finally {
        setIsTranslating(false)
      }
    }

    translateProperty()
  }, [property, currentLang])

  return <>{children(translatedProperty, isTranslating)}</>
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return prevProps.property.id === nextProps.property.id &&
         prevProps.property.title === nextProps.property.title &&
         prevProps.property.description === nextProps.property.description
})

/**
 * Hook for translating a single property object
 * Useful for individual property components
 */
export function usePropertyTranslation(property: PropertyBase | null) {
  const [translatedProperty, setTranslatedProperty] = React.useState<PropertyBase | null>(property)
  const [isTranslating, setIsTranslating] = React.useState(false)

  // Early return for null property to avoid unnecessary hook calls
  const shouldTranslate = property !== null && property !== undefined

  // Main text fields - only call hooks if property exists
  const { translatedContent: translatedTitle, isTranslating: isTitleTranslating } = 
    useContentTranslation(shouldTranslate ? (property?.title || '') : '')
  
  const { translatedContent: translatedDescription, isTranslating: isDescTranslating } = 
    useContentTranslation(shouldTranslate ? (property?.description || '') : '')
    
  const { translatedContent: translatedHeadline, isTranslating: isHeadlineTranslating } = 
    useContentTranslation(shouldTranslate ? (property?.marketing_headline || '') : '')
    
  const { translatedContent: translatedAddress, isTranslating: isAddressTranslating } = 
    useContentTranslation(shouldTranslate ? (property?.address || '') : '')
    
  const { translatedContent: translatedNeighborhood, isTranslating: isNeighborhoodTranslating } = 
    useContentTranslation(shouldTranslate ? (property?.neighborhood || '') : '')
    
  const { translatedContent: translatedCompound, isTranslating: isCompoundTranslating } = 
    useContentTranslation(shouldTranslate ? (property?.compound || '') : '')

  // Array fields - only call hooks if property exists and has arrays
  const { translatedTexts: translatedFeatures, isTranslating: isFeaturesTranslating } = 
    useBatchTranslation(shouldTranslate ? (property?.features || []) : [])
    
  const { translatedTexts: translatedAmenities, isTranslating: isAmenitiesTranslating } = 
    useBatchTranslation(shouldTranslate ? (property?.amenities || []) : [])
    
  const { translatedTexts: translatedKeyFeatures, isTranslating: isKeyFeaturesTranslating } = 
    useBatchTranslation(shouldTranslate ? (property?.key_features || []) : [])

  React.useEffect(() => {
    if (!property) {
      setTranslatedProperty(null)
      return
    }

    const anyTranslating = isTitleTranslating || isDescTranslating || isHeadlineTranslating ||
                          isAddressTranslating || isNeighborhoodTranslating || isCompoundTranslating ||
                          isFeaturesTranslating || isAmenitiesTranslating || isKeyFeaturesTranslating

    setIsTranslating(anyTranslating)

    const translated: PropertyBase = {
      ...property,
      title: translatedTitle,
      description: translatedDescription,
      marketing_headline: translatedHeadline,
      address: translatedAddress,
      neighborhood: translatedNeighborhood,
      compound: translatedCompound,
      features: translatedFeatures,
      amenities: translatedAmenities,
      key_features: translatedKeyFeatures
    }

    setTranslatedProperty(translated)
  }, [
    property, 
    translatedTitle, translatedDescription, translatedHeadline,
    translatedAddress, translatedNeighborhood, translatedCompound,
    translatedFeatures, translatedAmenities, translatedKeyFeatures,
    isTitleTranslating, isDescTranslating, isHeadlineTranslating,
    isAddressTranslating, isNeighborhoodTranslating, isCompoundTranslating,
    isFeaturesTranslating, isAmenitiesTranslating, isKeyFeaturesTranslating
  ])

  return {
    translatedProperty,
    isTranslating
  }
}

/**
 * Optimized hook for translating arrays of properties with aggressive caching
 * Minimizes API calls by caching translations in memory and localStorage
 */
export function usePropertiesTranslation(properties: PropertyBase[]) {
  const [translatedProperties, setTranslatedProperties] = React.useState<PropertyBase[]>(properties || [])
  const [isTranslating, setIsTranslating] = React.useState(false)
  const [currentLang, setCurrentLang] = React.useState('en')
  
  // In-memory cache for translations
  const cacheRef = React.useRef<Map<string, string>>(new Map())
  
  // Cache key generation
  const getCacheKey = (text: string, lang: string) => `${lang}:${text.trim()}`
  
  // Load cache from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cachedData = localStorage.getItem('property-translations-cache')
        if (cachedData) {
          const parsed = JSON.parse(cachedData)
          cacheRef.current = new Map(Object.entries(parsed))
        }
      } catch (error) {
        console.warn('Failed to load translation cache:', error)
      }
    }
  }, [])
  
  // Save cache to localStorage
  const saveCache = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const cacheObj = Object.fromEntries(cacheRef.current)
        localStorage.setItem('property-translations-cache', JSON.stringify(cacheObj))
      } catch (error) {
        console.warn('Failed to save translation cache:', error)
      }
    }
  }, [])

  // Listen for language changes
  React.useEffect(() => {
    const handleLanguageChange = (event: CustomEvent<string>) => {
      setCurrentLang(event.detail)
    }

    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('i18nextLng') || localStorage.getItem('preferred-language') || 'en'
      setCurrentLang(savedLang)
      
      window.addEventListener('languageChange', handleLanguageChange as EventListener)
      return () => {
        window.removeEventListener('languageChange', handleLanguageChange as EventListener)
      }
    }
  }, [])

  // Main translation logic with caching
  React.useEffect(() => {
    if (!properties || properties.length === 0) {
      setTranslatedProperties([])
      setIsTranslating(false)
      return
    }

    if (currentLang === 'en') {
      setTranslatedProperties(properties)
      setIsTranslating(false)
      return
    }

    const translateProperties = async () => {
      setIsTranslating(true)
      
      try {
        // Collect texts and check cache first
        const textsToTranslate: string[] = []
        const textMap: { propertyIndex: number, fieldType: string, text: string }[] = []
        const translated = properties.map(prop => ({ ...prop }))

        properties.forEach((property, propIndex) => {
          // Check each field and apply cached translations immediately
          const fields = [
            { value: property.title, type: 'title' },
            { value: property.description, type: 'description' },
            { value: property.address, type: 'address' },
            { value: property.neighborhood, type: 'neighborhood' },
            { value: property.compound, type: 'compound' }
          ]

          fields.forEach(({ value, type }) => {
            if (value) {
              const cacheKey = getCacheKey(value, currentLang)
              const cached = cacheRef.current.get(cacheKey)
              
              if (cached) {
                // Use cached translation immediately
                ;(translated[propIndex] as any)[type] = cached
              } else {
                // Mark for API translation
                textsToTranslate.push(value)
                textMap.push({ propertyIndex: propIndex, fieldType: type, text: value })
              }
            }
          })
        })

        // Apply cached translations immediately (instant update)
        setTranslatedProperties([...translated])

        // If all translations were cached, we're done!
        if (textsToTranslate.length === 0) {
          setIsTranslating(false)
          return
        }

        // Only translate uncached texts
        const response = await fetch('/api/translate-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            texts: textsToTranslate,
            targetLang: currentLang,
            sourceLang: 'en'
          })
        })

        if (response.ok) {
          const { translations } = await response.json()
          const translatedTexts = translations || []
          
          // Update cache and properties with new translations
          translatedTexts.forEach((translatedText: string, index: number) => {
            const mapping = textMap[index]
            if (mapping && translatedText) {
              const { propertyIndex, fieldType, text } = mapping
              
              // Cache the new translation
              const cacheKey = getCacheKey(text, currentLang)
              cacheRef.current.set(cacheKey, translatedText)
              
              // Update the property
              if (translated[propertyIndex]) {
                ;(translated[propertyIndex] as any)[fieldType] = translatedText
              }
            }
          })

          // Save cache and update state
          saveCache()
          setTranslatedProperties([...translated])
        }
      } catch (error) {
        console.error('Properties translation failed:', error)
        setTranslatedProperties(properties) // Fallback to original
      } finally {
        setIsTranslating(false)
      }
    }

    translateProperties()
  }, [properties, currentLang, saveCache])

  return {
    translatedProperties,
    isTranslating
  }
}

/**
 * Utility functions for managing translation cache
 */
export const TranslationCacheUtils = {
  // Clear all cached translations
  clearCache: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('property-translations-cache')
    }
  },
  
  // Get cache statistics
  getCacheStats: () => {
    if (typeof window === 'undefined') return { size: 0, items: [] }
    
    try {
      const cachedData = localStorage.getItem('property-translations-cache')
      if (!cachedData) return { size: 0, items: [] }
      
      const parsed = JSON.parse(cachedData)
      const items = Object.entries(parsed)
      
      return {
        size: items.length,
        items: items.slice(0, 10), // Show first 10 items
        sizeInKB: Math.round(new Blob([cachedData]).size / 1024)
      }
    } catch {
      return { size: 0, items: [] }
    }
  },
  
  // Pre-warm cache with common translations (call this on app start)
  preWarmCache: async (commonTexts: string[], targetLang = 'ar') => {
    if (typeof window === 'undefined' || targetLang === 'en') return
    
    try {
      const response = await fetch('/api/translate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: commonTexts,
          targetLang,
          sourceLang: 'en'
        })
      })
      
      if (response.ok) {
        const { translations } = await response.json()
        const cache = new Map()
        
        // Load existing cache
        const existing = localStorage.getItem('property-translations-cache')
        if (existing) {
          const parsed = JSON.parse(existing)
          Object.entries(parsed).forEach(([key, value]) => {
            cache.set(key, value)
          })
        }
        
        // Add new translations
        commonTexts.forEach((text, index) => {
          if (translations[index]) {
            const key = `${targetLang}:${text.trim()}`
            cache.set(key, translations[index])
          }
        })
        
        // Save updated cache
        const cacheObj = Object.fromEntries(cache)
        localStorage.setItem('property-translations-cache', JSON.stringify(cacheObj))
        
        console.log(`Pre-warmed cache with ${translations.length} translations`)
      }
    } catch (error) {
      console.warn('Failed to pre-warm translation cache:', error)
    }
  }
} 