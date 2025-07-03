"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { useTranslation } from 'react-i18next'
import { usePropertiesTranslation } from '@/components/PropertyTranslationWrapper'
import { useNumberTranslation } from '@/lib/useNumberTranslation'
import { translationService } from '@/lib/translation-service'
import {
  Search,
  MapPin,
  Bed,
  Bath,
  Square,
  Play,
  ChevronLeft,
  ChevronRight,
  Star,
  TrendingUp,
  Award,
  Users,
  ArrowRight,
  Quote,
  Phone,
  Mail,
  Calendar,
  Heart,
  Share2,
  Eye,
  Filter,
  MessageCircle,
  Home,
  Building2,
  Landmark,
  BedDouble,
  LayoutGrid,
  ShieldCheck,
  CheckCircle,
  HeartHandshake,
  Loader2,
  X,
  Gift,
  ArrowLeft,
  Clock,
  Sparkles,
  Camera
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { TourViewer } from "@/components/tour-viewer"
import { LazySection } from "@/components/homepage/LazySection"

import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"

// 🚀 LAZY LOADED COMPONENTS - Only load when needed
const TopCompoundsSection = lazy(() => import('@/components/homepage/TopCompoundsSection').then(m => ({ default: m.TopCompoundsSection })))
const FeaturedPropertiesSection = lazy(() => import('@/components/homepage/FeaturedPropertiesSection').then(m => ({ default: m.FeaturedPropertiesSection })))
const TestimonialsSection = lazy(() => import('@/components/homepage/TestimonialsSection').then(m => ({ default: m.TestimonialsSection })))
const ChatBot = lazy(() => import('@/components/ChatBot').then(m => ({ default: m.ChatBot })))
const LeadCaptureForm = lazy(() => import('@/components/LeadCaptureForm').then(m => ({ default: m.LeadCaptureForm })))

// Real property interface matching our database schema
interface Property {
  id: string
  title: string
  description: string
  price: number
  bedrooms: number
  bathrooms: number
  square_meters: number
  address: string
  city: string
  state: string
  property_type: string
  status: string
  features: string[]
  amenities: string[]
  property_photos?: Array<{
    id: string
    url: string
    is_primary: boolean
    order_index: number
  }>
  view_count?: number
  views?: number
  daysOnMarket?: number
  virtual_tour_url?: string
  
  // Additional properties for UI display
  compound?: string
  location?: string
  beds?: number
  baths?: number
  sqm?: number
  isHot?: boolean
  image?: string
  priceChange?: string
  created_at?: string
}

// Loading component for better UX
const SectionLoader = ({ height = "h-64" }: { height?: string }) => (
  <div className={`w-full ${height} bg-gray-50 animate-pulse rounded-lg flex items-center justify-center`}>
    <div className="flex items-center gap-2 text-gray-400">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">Loading...</span>
    </div>
  </div>
)

export default function HomePage() {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const { translateText } = useNumberTranslation()

  // 🚀 CRITICAL STATE - Only load what's needed for above-the-fold
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPropertyIndex, setCurrentPropertyIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Only use translation hook when properties are loaded
  const { translatedProperties } = usePropertiesTranslation(featuredProperties)

  // Load only essential data on mount
  useEffect(() => {
    const loadEssentialData = async () => {
      try {
        // Only load data needed for hero section
        const response = await fetch('/api/properties?featured=true&limit=6')
        if (response.ok) {
          const data = await response.json()
          setFeaturedProperties(data.properties || [])
        }
      } catch (error) {
        console.error('Error loading essential data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadEssentialData()
  }, [])

  // Translation helpers
  const translateCompoundName = (name: string) => {
    if (i18n.language === 'ar') {
      return translationService.translateText(name, 'ar')
    }
    return name
  }

  const translateAreaName = (name: string) => {
    if (i18n.language === 'ar') {
      return translationService.translateText(name, 'ar')
    }
    return name
  }

  const translatedFeatured = translatedProperties

  // Hero section handlers
  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/properties?search=${encodeURIComponent(searchQuery)}`)
    } else {
      router.push('/properties')
    }
  }

  const nextProperty = () => {
    setCurrentPropertyIndex((prev) => (prev + 1) % featuredProperties.length)
  }

  const prevProperty = () => {
    setCurrentPropertyIndex((prev) => (prev - 1 + featuredProperties.length) % featuredProperties.length)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-lg text-slate-600">Loading...</span>
        </div>
      </div>
    )
  }

  const currentProperty = featuredProperties[currentPropertyIndex]

  return (
    <div className="min-h-screen bg-white">
      {/* 🎯 ABOVE-THE-FOLD: Hero Section with 3D Tour - Load Immediately */}
      <section className="relative h-screen w-full overflow-hidden">
        {currentProperty && (
          <div className="absolute inset-0">
            <TourViewer 
              key={currentProperty.id}
              tourUrl={currentProperty.virtual_tour_url}
              className="w-full h-full"
            />
            
            {/* Search Overlay */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
                <h1 className="text-3xl font-bold text-slate-800 mb-2 text-center">
                  {t('hero.title', 'Find Your Dream Home')}
                </h1>
                <p className="text-slate-600 mb-6 text-center">
                  {t('hero.subtitle', 'Experience properties like never before with our 3D virtual tours')}
                </p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder={t('hero.searchPlaceholder', 'Search properties...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Property Info Overlay */}
            {currentProperty && (
              <div className="absolute bottom-8 left-8 right-8 z-10">
                <Card className="bg-white/90 backdrop-blur-md">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-1">
                          {currentProperty.title}
                        </h3>
                        <p className="text-slate-600 flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {currentProperty.address}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          EGP {currentProperty.price.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span className="flex items-center">
                            <Bed className="h-4 w-4 mr-1" />
                            {currentProperty.bedrooms}
                          </span>
                          <span className="flex items-center">
                            <Bath className="h-4 w-4 mr-1" />
                            {currentProperty.bathrooms}
                          </span>
                          <span className="flex items-center">
                            <Square className="h-4 w-4 mr-1" />
                            {currentProperty.square_meters}m²
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation Controls */}
            <div className="absolute top-1/2 left-4 transform -translate-y-1/2 z-10">
              <Button
                variant="outline"
                size="icon"
                onClick={prevProperty}
                className="bg-white/80 backdrop-blur-md hover:bg-white/90"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10">
              <Button
                variant="outline"
                size="icon"
                onClick={nextProperty}
                className="bg-white/80 backdrop-blur-md hover:bg-white/90"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Property Indicators */}
            <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-10">
              <div className="flex gap-2">
                {featuredProperties.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPropertyIndex(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentPropertyIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 🚀 BELOW-THE-FOLD: Lazy Loaded Sections */}
      
      {/* Top Compounds Section */}
      <LazySection loadingHeight="h-96" className="w-full">
        <TopCompoundsSection 
          translateCompoundName={translateCompoundName}
          translateAreaName={translateAreaName}
        />
      </LazySection>

      {/* Featured Properties Section */}
      <LazySection loadingHeight="h-[600px]" className="w-full">
        <FeaturedPropertiesSection 
          translatedFeatured={translatedFeatured}
          translateText={translateText}
        />
      </LazySection>

      {/* Testimonials Section */}
      <LazySection loadingHeight="h-80" className="w-full">
        <TestimonialsSection />
      </LazySection>

      {/* Stats Section - Lightweight, can load immediately */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">2,500+</div>
              <div className="text-slate-600">{t('stats.properties', 'Properties')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">1,200+</div>
              <div className="text-slate-600">{t('stats.clients', 'Happy Clients')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">98%</div>
              <div className="text-slate-600">{t('stats.satisfaction', 'Satisfaction Rate')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-slate-600">{t('stats.support', 'Support')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 FLOATING ELEMENTS: Load on Interaction */}
      
      {/* ChatBot - Load when user shows intent to interact */}
      <LazySection>
        <Suspense fallback={null}>
          <ChatBot />
        </Suspense>
      </LazySection>

      {/* Lead Capture Form - Load when section is viewed */}
      <LazySection loadingHeight="h-32" className="w-full">
        <div className="fixed bottom-4 right-4 z-50">
          <Suspense fallback={<SectionLoader height="h-16" />}>
            <LeadCaptureForm />
          </Suspense>
        </div>
      </LazySection>
    </div>
  )
}