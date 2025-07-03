"use client"

import { useState, useEffect } from 'react'
import { Globe, ChevronDown, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAutoTranslate, translationService } from '@/lib/translation-service'

export function AutoLanguageSwitcher() {
  const { currentLang, translatePage, isTranslating, isAvailable } = useAutoTranslate()
  const [isOpen, setIsOpen] = useState(false)
  const [showError, setShowError] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  const languages = translationService.getSupportedLanguages()
  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0]

  useEffect(() => {
    // Check if API key is available and show helpful message
    if (!isAvailable) {
      console.warn('Translation service not available. Make sure you have Google Translate API enabled and NEXT_PUBLIC_GOOGLE_MAPS_API_KEY configured.')
    }
  }, [isAvailable])

  const handleLanguageChange = async (langCode: string) => {
    if (langCode === currentLang) {
      setIsOpen(false)
      return
    }

    setIsOpen(false)
    setShowError(false)
    setShowSuccess(false)

    try {
      await translatePage(langCode)
      
      // Show success message briefly
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
      
    } catch (error) {
      console.error('Translation failed:', error)
      setErrorMessage('Translation failed. Please check your internet connection and try again.')
      setShowError(true)
      setTimeout(() => setShowError(false), 5000)
    }
  }

  // Always render the component, but show different states
  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex items-center space-x-2 px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors relative",
              !isAvailable && "opacity-60 cursor-not-allowed",
              currentLang !== 'en' && "bg-blue-50 border-blue-200"
            )}
            disabled={isTranslating}
          >
            {isTranslating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : !isAvailable ? (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            ) : showSuccess ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {currentLanguage.flag} {currentLanguage.name}
            </span>
            {currentLang !== 'en' && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          {!isAvailable ? (
            <div className="p-3 text-sm text-amber-600 bg-amber-50 rounded-md m-2">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Translation Not Available</div>
                  <div className="text-xs text-amber-500 mt-1">
                    Configure Google Translate API to enable auto-translation
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Language Options */}
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 cursor-pointer",
                    currentLang === lang.code && "bg-blue-50 text-blue-700"
                  )}
                  disabled={isTranslating}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <div className="flex-1">
                    <div className="font-medium">{lang.name}</div>
                    {lang.code === currentLang && (
                      <div className="text-xs text-slate-500">Current</div>
                    )}
                    {lang.code === 'en' && currentLang !== 'en' && (
                      <div className="text-xs text-blue-600">Original</div>
                    )}
                  </div>
                  {isTranslating && currentLang === lang.code && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  {currentLang === lang.code && !isTranslating && (
                    <CheckCircle className="h-3 w-3 text-blue-600" />
                  )}
                </DropdownMenuItem>
              ))}
              
              {/* Translation Status Info */}
              {currentLang !== 'en' && (
                <div className="border-t border-slate-200 mt-2 pt-2">
                  <div className="px-3 py-2">
                    <div className="text-xs text-slate-600 mb-1">
                      <div className="flex items-center justify-between">
                        <span>Translation Active</span>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className="text-xs text-blue-600 hover:text-blue-700 underline"
                      disabled={isTranslating}
                    >
                      Return to Original English
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Translation Status Notifications */}
      {isTranslating && (
        <div className="fixed top-20 right-4 z-50 bg-white border border-slate-200 rounded-lg shadow-lg p-3 flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span className="text-sm text-slate-700">
            {currentLang === 'en' ? 'Resetting to English...' : 'Translating page...'}
          </span>
        </div>
      )}

      {/* Error Message */}
      {showError && (
        <div className="fixed top-20 right-4 z-50 bg-red-50 border border-red-200 rounded-lg shadow-lg p-3 flex items-start space-x-2 max-w-sm">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium text-red-800 text-sm">Translation Failed</div>
            <div className="text-xs text-red-600 mt-1">{errorMessage}</div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-20 right-4 z-50 bg-green-50 border border-green-200 rounded-lg shadow-lg p-3 flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-700">
            {currentLang === 'en' ? 'Restored to English' : `Translated to ${currentLanguage.name}`}
          </span>
        </div>
      )}
    </>
  )
} 