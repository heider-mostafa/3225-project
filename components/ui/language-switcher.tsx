"use client"

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { changeLanguage, getCurrentLanguage, isRTL } from '@/lib/i18n/config'

const languages = [
  {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    dir: 'ltr'
  },
  {
    code: 'ar',
    name: 'العربية',
    flag: '🇪🇬',
    dir: 'rtl'
  }
]

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const [currentLang, setCurrentLang] = useState('en')
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    setCurrentLang(getCurrentLanguage())
    
    // Update document direction and lang attribute
    const updateDocumentSettings = () => {
      const lang = getCurrentLanguage()
      const isRtl = isRTL()
      
      document.documentElement.setAttribute('lang', lang)
      document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr')
      
      // Add RTL class to body for Tailwind RTL support
      if (isRtl) {
        document.body.classList.add('rtl')
      } else {
        document.body.classList.remove('rtl')
      }
    }

    updateDocumentSettings()
    
    // Listen for language changes
    const handleLanguageChange = () => {
      setCurrentLang(getCurrentLanguage())
      updateDocumentSettings()
    }

    i18n.on('languageChanged', handleLanguageChange)
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [i18n])

  const handleLanguageChange = async (langCode: string) => {
    try {
      console.log('🌐 Starting language change to:', langCode)
      setIsOpen(false)
      
      // Show loading state briefly
      const originalLang = currentLang
      setCurrentLang(langCode + '-loading')
      
      await changeLanguage(langCode)
      console.log('✅ Language change completed')
      
      // Update state after successful change
      setCurrentLang(langCode)
      
      // Don't reload - let React handle the state changes
      // The useEffect in this component will handle DOM updates
    } catch (error) {
      console.error('❌ Language change failed:', error)
      // Revert to original language on error
      setCurrentLang(originalLang)
      
      // Show user-friendly error
      alert('Translation system is temporarily unavailable. Please try again.')
    }
  }

  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0]

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 px-3 gap-2 hover:bg-slate-100 dark:hover:bg-slate-800",
            "border border-slate-200 dark:border-slate-700",
            "transition-all duration-200 ease-in-out",
            "hover:shadow-sm"
          )}
          aria-label={isMounted ? t('language.switch') : 'Switch Language'}
        >
          <Globe className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          <span className="text-lg leading-none">{currentLanguage.flag}</span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:inline">
            {currentLanguage.name}
          </span>
          <ChevronDown 
            className={cn(
              "h-3 w-3 text-slate-500 transition-transform duration-200",
              isOpen && "rotate-180"
            )} 
          />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className={cn(
          "w-48 p-1",
          "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md",
          "border border-slate-200 dark:border-slate-700",
          "shadow-lg",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
      >
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 cursor-pointer",
              "hover:bg-slate-100 dark:hover:bg-slate-800",
              "transition-colors duration-150",
              "rounded-md",
              currentLang === language.code && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
            )}
          >
            <span className="text-lg leading-none">{language.flag}</span>
            <span className="flex-1 text-sm font-medium">{language.name}</span>
            {currentLang === language.code && (
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 