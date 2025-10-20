'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Clock, MapPin, Home, Loader2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

interface SearchSuggestion {
  type: 'recent' | 'property' | 'location'
  text: string
  subtitle?: string
  icon: string
  label: string
  id?: string
}

interface SmartSearchInputProps {
  value: string
  onChange: (value: string) => void
  onSearch: () => void
  placeholder?: string
  className?: string
}

export default function SmartSearchInput({
  value,
  onChange,
  onSearch,
  placeholder,
  className = ''
}: SmartSearchInputProps) {
  const { t } = useTranslation()
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Debounced search function
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/properties/suggestions?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    // Set new debounce
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue)
    }, 300)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        onSearch()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          selectSuggestion(suggestions[selectedIndex])
        } else {
          onSearch()
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Handle suggestion selection
  const selectSuggestion = (suggestion: SearchSuggestion) => {
    onChange(suggestion.text)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    
    // Small delay to ensure state is updated before search
    setTimeout(() => {
      onSearch()
    }, 100)
    
    // Track suggestion usage
    trackSuggestionClick(suggestion)
  }

  // Track suggestion analytics
  const trackSuggestionClick = async (suggestion: SearchSuggestion) => {
    try {
      await fetch('/api/analytics/search-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestion_type: suggestion.type,
          suggestion_text: suggestion.text,
          original_query: value
        })
      })
    } catch (error) {
      // Silent fail for analytics
      console.log('Analytics tracking failed:', error)
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Clear debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const getSuggestionIcon = (suggestion: SearchSuggestion) => {
    switch (suggestion.type) {
      case 'recent':
        return <Clock className="h-4 w-4 text-slate-400" />
      case 'property':
        return <Home className="h-4 w-4 text-blue-500" />
      case 'location':
        return <MapPin className="h-4 w-4 text-green-500" />
      default:
        return <Search className="h-4 w-4 text-slate-400" />
    }
  }

  return (
    <div className="relative flex-1 group">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-slate-600" />
        <Input
          ref={inputRef}
          placeholder={placeholder || t('properties.searchPlaceholder', 'Search by location, property type, or features...')}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          className={`pl-12 pr-12 h-12 text-base border-slate-200 focus:border-slate-400 focus:ring-slate-400/20 rounded-xl shadow-sm ${className}`}
        />
        
        {/* Loading indicator */}
        {loading && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          </div>
        )}
        
        {/* Clear button */}
        {value && !loading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange('')
              setSuggestions([])
              setShowSuggestions(false)
              inputRef.current?.focus()
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-slate-100 rounded-lg"
          >
            <X className="h-4 w-4 text-slate-400" />
          </Button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden"
        >
          <div className="max-h-80 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${suggestion.text}-${index}`}
                onClick={() => selectSuggestion(suggestion)}
                className={`w-full text-left px-4 py-3 flex items-center space-x-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${
                  index === selectedIndex ? 'bg-blue-50 border-blue-100' : ''
                }`}
              >
                <div className="flex-shrink-0">
                  {suggestion.icon ? (
                    <span className="text-lg">{suggestion.icon}</span>
                  ) : (
                    getSuggestionIcon(suggestion)
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">
                    {suggestion.text}
                  </div>
                  {suggestion.subtitle && (
                    <div className="text-xs text-slate-500 truncate">
                      {suggestion.subtitle}
                    </div>
                  )}
                </div>
                
                <div className="flex-shrink-0">
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                    {suggestion.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
          
          {/* Footer with tip */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>{t('search.useArrowKeys', 'Use ↑↓ to navigate, Enter to select')}</span>
              <span className="font-medium">{suggestions.length} {t('search.suggestions', 'suggestions')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}