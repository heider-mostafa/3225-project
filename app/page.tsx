"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { useTranslation } from 'react-i18next'
import { usePropertiesTranslation } from '@/components/PropertyTranslationWrapper'
import { useNumberTranslation } from '@/lib/useNumberTranslation'
import { translationService } from '@/lib/translation-service'
import { AnimatedCounter } from '@/components/ui/animated-counter'
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
  Camera,
  Zap,
  Globe
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { TourViewer } from "@/components/tour-viewer"
import { ChatBot } from "@/components/ChatBot"
import { LeadCaptureForm } from "@/components/LeadCaptureForm"
import { ServicesSection } from "@/components/ServicesSection"



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
  view_count?: number  // Add database field
  views?: number  // UI display field (mapped from view_count)
  daysOnMarket?: number
  virtual_tour_url?: string  // Add this field for 3D tours
  
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

// Get testimonials from translations
const getTestimonials = (t: any) => [
  {
    id: 1,
    name: t('testimonials.client1.name'),
    role: t('testimonials.client1.role'),
    avatar: "/placeholder.svg?height=60&width=60",
    rating: 5,
    text: t('testimonials.client1.text'),
    property: t('testimonials.client1.property'),
  },
  {
    id: 2,
    name: t('testimonials.client2.name'),
    role: t('testimonials.client2.role'),
    avatar: "/placeholder.svg?height=60&width=60",
    rating: 5,
    text: t('testimonials.client2.text'),
    property: t('testimonials.client2.property'),
  },
  {
    id: 3,
    name: t('testimonials.client3.name'),
    role: t('testimonials.client3.role'),
    avatar: "/placeholder.svg?height=60&width=60",
    rating: 5,
    text: t('testimonials.client3.text'),
    property: t('testimonials.client3.property'),
  },
  {
    id: 4,
    name: t('testimonials.client4.name'),
    role: t('testimonials.client4.role'),
    avatar: "/placeholder.svg?height=60&width=60",
    rating: 5,
    text: t('testimonials.client4.text'),
    property: t('testimonials.client4.property'),
  },
  {
    id: 5,
    name: t('testimonials.client5.name'),
    role: t('testimonials.client5.role'),
    avatar: "/placeholder.svg?height=60&width=60",
    rating: 5,
    text: t('testimonials.client5.text'),
    property: t('testimonials.client5.property'),
  },
]

const getStatsData = (t: any) => [
  { 
    label: t('stats.propertieslisted', 'Properties Listed'),
    value: 10000, 
    suffix: "+",
    icon: Building2,
    color: "from-blue-600 to-blue-700",
    description: t('stats.activeListings', 'Active listings')
  },
  { 
    label: t('stats.virtualTourscreated', 'Virtual Tours Created'),
    value: 25000, 
    suffix: "+",
    icon: Play,
    color: "from-amber-500 to-orange-600", 
    description: t('stats.experiences3d', '3D experiences')
  },
  { 
    label: t('stats.happyclients', 'Happy Clients'),
    value: 5000, 
    suffix: "+",
    icon: Users,
    color: "from-emerald-500 to-green-600",
    description: t('stats.satisfiedCustomers', 'Satisfied customers')
  },
  { 
    label: t('stats.citiescovered', 'Cities Covered'),
    value: 15, 
    suffix: "+",
    icon: Globe,
    color: "from-purple-600 to-indigo-700",
    description: t('stats.acrossEgypt', 'Across Egypt')
  },
]

const quickFilters = [
  { label: "Under $150K", value: "under-150k", count: 245 },
  { label: "New Listings", value: "new", count: 89 },
  { label: "With Pool", value: "pool", count: 156 },
  { label: "City Views", value: "views", count: 203 },
  { label: "Parking", value: "parking", count: 412 },
  { label: "Furnished", value: "furnished", count: 178 },
]

// Top Compounds Data (Mock)
const mockTopCompounds = [
  {
    name: "Palm Hills",
    area: "6th of October",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
    properties: 120,
  },
  {
    name: "Mivida",
    area: "New Cairo",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    properties: 95,
  },
  {
    name: "Mountain View",
    area: "New Cairo",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
    properties: 80,
  },
  {
    name: "Katameya Heights",
    area: "New Cairo",
    image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80",
    properties: 65,
  },
]

// Top Areas Data
const topAreasData = [
  { name: "New Cairo", image: "/areas/new-cairo.jpg" },
  { name: "Sheikh Zayed", image: "/areas/sheikh-zayed.jpg" },
  { name: "Zamalek", image: "/areas/zamalek.jpg" },
  { name: "Maadi", image: "/areas/maadi.jpg" },
  { name: "Heliopolis", image: "/areas/heliopolis.jpg" },
  { name: "Alexandria", image: "/areas/alexandria.jpg" },
  { name: "Giza", image: "/areas/giza.jpg" },
  { name: "6th of October", image: "/areas/6th-of-october.jpg" },
]

// Categories Data
const categories = [
  { label: "Apartments", icon: Home },
  { label: "Villas", icon: Building2 },
  { label: "Penthouses", icon: Landmark },
  { label: "Townhouses", icon: BedDouble },
  { label: "Studios", icon: LayoutGrid },
]

// Market Insights Data - static translations to prevent re-renders
const getMarketInsights = (t: any, i18n: any) => [
  { 
    label: i18n.language === 'ar' ? 'متوسط السعر في القاهرة الجديدة' : 'Avg. Price in New Cairo', 
    value: "$320,000", 
    icon: TrendingUp 
  },
  { 
    label: i18n.language === 'ar' ? 'المنطقة الأكثر شعبية' : 'Trending Area', 
    value: i18n.language === 'ar' ? 'الشيخ زايد' : "Sheikh Zayed", // Static Arabic translation
    icon: MapPin 
  },
  { 
    label: i18n.language === 'ar' ? 'الأكثر مشاهدة' : 'Most Viewed', 
    value: i18n.language === 'ar' ? 'بالم هيلز' : 'Palm Hills', 
    icon: Eye 
  },
  { 
    label: i18n.language === 'ar' ? 'إعلانات جديدة هذا الأسبوع' : 'New Listings This Week', 
    value: "120+", 
    icon: Star 
  },
]

// Trust Badges Data
const trustBadges = [
  { label: "Verified Listings", icon: ShieldCheck },
  { label: "Secure Payments", icon: CheckCircle },
  { label: "24/7 Support", icon: Users },
  { label: "Trusted by 10k+", icon: HeartHandshake },
]

// Location translations to prevent API calls in render
const locationTranslations: { [key: string]: string } = {
  'Zamalek': 'الزمالك',
  'Maadi': 'المعادي',
  'Heliopolis': 'مصر الجديدة',
  'New Cairo': 'القاهرة الجديدة',
  'Fifth Settlement': 'التجمع الخامس',
  'Sheikh Zayed': 'الشيخ زايد',
  'October City': 'مدينة أكتوبر',
  '6th October': 'السادس من أكتوبر',
  'Mohandessin': 'المهندسين',
  'Dokki': 'الدقي',
  'Agouza': 'العجوزة',
  'Giza': 'الجيزة',
  'Downtown Cairo': 'وسط القاهرة',
  'Garden City': 'جاردن سيتي',
  'New Administrative Capital': 'العاصمة الإدارية الجديدة',
  'Alexandria': 'الإسكندرية',
  'North Coast': 'الساحل الشمالي',
  'New Alamein': 'العلمين الجديدة',
  'Cairo': 'القاهرة'
}

// Efficient location translation function
const translateLocation = (location: string | undefined, isArabic: boolean): string => {
  if (!location) return ''
  if (!isArabic) return location
  return locationTranslations[location] || location
}



export default function HomePage() {
  const { t, i18n } = useTranslation()
  const { translateNumber, translateText, safeT: hookSafeT } = useNumberTranslation()
  const router = useRouter()
  
  const [currentTourIndex, setCurrentTourIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  // 3D Model interaction state
  const [isInteracting, setIsInteracting] = useState(false)
  const [interactionTimeout, setInteractionTimeout] = useState<number | null>(null)
  
  // Real AI recommendations state
  const [recommendations, setRecommendations] = useState<Property[]>([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [recommendationError, setRecommendationError] = useState<string | null>(null)

  // Real data state management
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([])
  const [hotListings, setHotListings] = useState<Property[]>([])
  const [topCompounds, setTopCompounds] = useState<Array<{
    name: string
    area: string
    properties: number
    image: string
  }>>([])
  const [topAreas, setTopAreas] = useState<Array<{
    name: string
    image: string
    propertyCount: number
  }>>([])
  const [loadingData, setLoadingData] = useState(true)
  
  // Use translation for properties
  const { translatedProperties: translatedFeatured } = usePropertiesTranslation(featuredProperties)
  const { translatedProperties: translatedHot } = usePropertiesTranslation(hotListings)
  
  // Get translated testimonials and market insights
  const testimonials = getTestimonials(t)
  const marketInsights = getMarketInsights(t, i18n)

  // Add fullscreen tour state
  const [isFullscreenTour, setIsFullscreenTour] = useState(false)
  const [fullscreenTourUrl, setFullscreenTourUrl] = useState<string>('')
  const [fullscreenPropertyId, setFullscreenPropertyId] = useState<string>('')
  
  // Top Areas slider state
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0)
  
  // Add missing state declarations
  const [interactionCount, setInteractionCount] = useState(0)
  const [showFloatingCTA, setShowFloatingCTA] = useState(false)
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false)
  const [quickFilters] = useState([
    { label: "Under $500K", value: "price_under_500k", category: "price" },
    { label: "New Listing", value: "new_listing", category: "status" },
    { label: "Luxury", value: "luxury", category: "type" },
    { label: "Villa", value: "villa", category: "type" },
    { label: "Apartment", value: "apartment", category: "type" },
    { label: "Pet Friendly", value: "pet_friendly", category: "amenity" },
    { label: "Pool", value: "pool", category: "amenity" },
    { label: "Garden", value: "garden", category: "amenity" }
  ])
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Helper functions for translations
  const translateCompoundName = (compoundName: string) => {
    if (!isMounted || i18n.language !== 'ar') return compoundName
    
    const compoundKeyMap: { [key: string]: string } = {
      'Palm Hills': 'بالم هيلز',
      'Mivida': 'ميفيدا', 
      'Mountain View': 'ماونتن فيو',
      'Katameya Heights': 'قطامية هايتس'
    }
    return compoundKeyMap[compoundName] || compoundName
  }

  const translateAreaName = (areaName: string) => {
    if (!isMounted || i18n.language !== 'ar') return areaName
    
    const areaKeyMap: { [key: string]: string } = {
      'New Cairo': 'القاهرة الجديدة',
      'Sheikh Zayed': 'الشيخ زايد', 
      '6th of October': 'السادس من أكتوبر',
      'Zamalek': 'الزمالك',
      'Maadi': 'المعادي',
      'Heliopolis': 'مصر الجديدة',
      'Alexandria': 'الإسكندرية',
      'Giza': 'الجيزة'
    }
    return areaKeyMap[areaName] || areaName
  }

  const translatePropertyTitle = (title: string) => {
    if (!isMounted || i18n.language !== 'ar') return title
    
    // Extract property type and translate common patterns
    if (title.includes('Luxury Apartment')) {
      return title.replace('Luxury Apartment', 'شقة فاخرة')
    } else if (title.includes('Modern Villa')) {
      return title.replace('Modern Villa', 'فيلا عصرية')
    } else if (title.includes('Penthouse')) {
      return title.replace('Penthouse', 'بنتهاوس')
    } else if (title.includes('Villa')) {
      return title.replace('Villa', 'فيلا')
    } else if (title.includes('Apartment')) {
      return title.replace('Apartment', 'شقة')
    } else if (title.includes('Townhouse')) {
      return title.replace('Townhouse', 'تاون هاوس')
    }
    
    return title
  }

  // Auto-rotate tours every 8 seconds
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isAutoRotating || isInteracting) return

    const interval = setInterval(() => {
      setCurrentTourIndex((prev) => (prev + 1) % translatedFeatured.length)
    }, 12000)

    return () => clearInterval(interval)
  }, [isAutoRotating, isInteracting, translatedFeatured.length])

  // Auto-rotate testimonials every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % 5)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Fetch AI recommendations when filters change
  useEffect(() => {
    if (selectedQuickFilter && selectedCategory) {
      fetchAIRecommendations()
    } else {
      setRecommendations([])
      setRecommendationError(null)
    }
  }, [selectedQuickFilter, selectedCategory])

  // Show floating CTA after scrolling
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const shouldShow = scrollY > 800 // Show after scrolling 800px
      setShowFloatingCTA(shouldShow)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Load real homepage data
  useEffect(() => {
    const loadHomepageData = async () => {
      try {
        setLoadingData(true)
        
        // Fetch properties for featured and hot listings
        const response = await fetch('/api/properties?limit=20')
        if (response.ok) {
          const data = await response.json()
          const properties = data.properties || []
          
          console.log('🏠 Properties loaded from API:', properties.length)
          console.log('🎯 Sample property virtual tour URL:', properties[0]?.virtual_tour_url)
          
          // Featured Properties: Recently added properties with good photos
          const featured = properties
            .filter((p: any) => p.property_photos && p.property_photos.length > 0)
            .map((p: any) => ({
              ...p,
              location: `${p.city}, ${p.state}`,
              beds: p.bedrooms,
              baths: p.bathrooms,
              sqm: p.square_meters,
              image: p.property_photos?.[0]?.url || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
              isHot: Math.random() > 0.7,
              views: p.view_count || 0,  // Use real view count from database
              virtual_tour_url: p.virtual_tour_url // Explicitly map virtual tour URL
            }))
            .slice(0, 6)
            
          console.log('🎬 Featured properties with virtual tours:', featured.map((p: any) => ({ 
            title: p.title, 
            virtual_tour_url: p.virtual_tour_url 
          })))
          
          setFeaturedProperties(featured)
          
          // Hot Listings: Properties with recent activity
          const hot = properties
            .slice(0, 4)
            .map((p: any) => ({
              ...p,
              location: `${p.city}, ${p.state}`,
              beds: p.bedrooms,
              baths: p.bathrooms,
              sqm: p.square_meters,
              priceChange: '+2.5%',
              daysOnMarket: Math.floor(Math.random() * 30) + 1,
              views: p.view_count || 0,  // Use real view count from database
              image: p.property_photos?.[0]?.url || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
              virtual_tour_url: p.virtual_tour_url // Also add to hot listings
            }))
          setHotListings(hot)
          
          // Count properties per area from database
          const areaCounts = new Map()
          properties.forEach((p: any) => {
            const areaKey = p.city
            areaCounts.set(areaKey, (areaCounts.get(areaKey) || 0) + 1)
          })
          
          // Combine static area data with dynamic property counts
          const areasWithCounts = topAreasData.map(area => ({
            ...area,
            propertyCount: areaCounts.get(area.name) || 0
          }))
          
          setTopAreas(areasWithCounts)
          // Use mock data for top compounds
          setTopCompounds(mockTopCompounds)
        }
      } catch (error) {
        console.error('Error loading homepage data:', error)
        setFeaturedProperties([])
        setHotListings([])
        // Still show mock compounds even on error
        setTopCompounds(mockTopCompounds)
        // Use static areas data even on error
        setTopAreas(topAreasData.map(area => ({ ...area, propertyCount: 0 })))
      } finally {
        setLoadingData(false)
      }
    }

    loadHomepageData()
  }, [])

  const currentProperty = translatedFeatured.length > 0 ? translatedFeatured[currentTourIndex] : {
    id: 'demo',
    title: 'Welcome to OpenBeit',
    description: 'Discover amazing properties with our AI-powered platform',
    price: 250000,
    bedrooms: 2,
    bathrooms: 2,
    square_meters: 1000,
    address: 'Loading...',
    city: 'Cairo',
    state: 'Egypt',
    property_type: 'apartment',
    status: 'loading',
    features: ['Modern', 'Spacious'],
    amenities: [],
    location: 'Cairo, Egypt',
    beds: 2,
    baths: 2,
    sqm: 1000,
    views: 150,
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    virtual_tour_url: 'https://realsee.com/ve/DEMO_2024/fullscreen' // Demo virtual tour
  }

  // Debug logging for current property
  console.log('🎯 Current property for hero section:', {
    title: currentProperty?.title,
    virtual_tour_url: currentProperty?.virtual_tour_url,
    id: currentProperty?.id
  })

  const nextTour = () => {
    setIsAutoRotating(false)
    setCurrentTourIndex((prev) => (prev + 1) % translatedFeatured.length)
  }

  const prevTour = () => {
    setIsAutoRotating(false)
    setCurrentTourIndex((prev) => (prev - 1 + translatedFeatured.length) % translatedFeatured.length)
  }

  // Function to fetch real AI recommendations from the database
  const fetchAIRecommendations = async () => {
    if (!selectedQuickFilter || !selectedCategory) return
    
    setLoadingRecommendations(true)
    setRecommendationError(null)
    
    try {
      // Build search query based on selected filters
      const searchQuery = buildSearchQueryFromFilters(selectedQuickFilter, selectedCategory)
      
      console.log('Fetching AI recommendations with query:', searchQuery)
      
      const response = await fetch('/api/chat/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          maxResults: 3
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.recommendations && data.recommendations.length > 0) {
        // Transform API response to match our Property interface
        const transformedRecommendations: Property[] = data.recommendations.map((rec: any) => ({
          id: rec.id,
          title: rec.title,
          description: '',
          price: rec.price,
          bedrooms: rec.bedrooms,
          bathrooms: rec.bathrooms,
          square_meters: rec.sqm || rec.square_meters || 0,
          address: rec.address || '',
          city: rec.city || '',
          state: rec.state || '',
          property_type: rec.propertyType || rec.property_type || 'apartment',
          status: 'available',
          features: rec.features || [],
          amenities: [],
          property_photos: rec.image ? [{ 
            id: '1', 
            url: rec.image, 
            is_primary: true, 
            order_index: 0 
          }] : [],
          views: 0,
          daysOnMarket: 0
        }))
        
        setRecommendations(transformedRecommendations)
      } else {
        setRecommendations([])
      }
    } catch (error) {
      console.error('Error fetching AI recommendations:', error)
      setRecommendationError('Failed to load recommendations. Please try again.')
      setRecommendations([])
    } finally {
      setLoadingRecommendations(false)
    }
  }

  // Helper function to build search query from filter selections
  const buildSearchQueryFromFilters = (quickFilter: string, category: string): string => {
    const categoryMap: Record<string, string> = {
      'Apartments': 'apartment',
      'Villas': 'villa', 
      'Penthouses': 'penthouse',
      'Townhouses': 'townhouse',
      'Condos': 'condo'
    }
    
    const propertyType = categoryMap[category] || 'apartment'
    
    const filterMap: Record<string, string> = {
      'under-150k': `${propertyType} under $150000`,
      'new': `new ${propertyType} listings`,
      'pool': `${propertyType} with pool`,
      'views': `${propertyType} with views`,
      'parking': `${propertyType} with parking`, 
      'furnished': `furnished ${propertyType}`
    }
    
    return filterMap[quickFilter] || `${propertyType} for sale`
  }

  // Handle quick filter selection
  const handleQuickFilterSelect = (filterValue: string) => {
    if (selectedQuickFilter === filterValue) {
      setSelectedQuickFilter(null)
    } else {
      setSelectedQuickFilter(filterValue)
    }
  }

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category)
  }

  // 3D Model interaction handlers
  const handleModelInteractionStart = () => {
    setIsInteracting(true)
    // Clear any existing timeout
    if (interactionTimeout) {
      clearTimeout(interactionTimeout)
      setInteractionTimeout(null)
    }
  }

  const handleModelInteractionEnd = () => {
    // Set a 5-second delay before allowing auto-rotation to resume
    const timeout = setTimeout(() => {
      setIsInteracting(false)
      setInteractionTimeout(null)
    }, 5000)
    
    setInteractionTimeout(timeout as unknown as number)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (interactionTimeout) {
        clearTimeout(interactionTimeout)
      }
    }
  }, [interactionTimeout])

  // Helper function to format price with proper number translation
  const formatPrice = (price: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
    // Only translate numbers after hydration to avoid SSR mismatch
    return isMounted ? translateText(formatted) : formatted
  }

  // Use SSR-safe translation from hook
  const safeT = hookSafeT

  // Handle area navigation
  const handleAreaClick = (areaName: string) => {
    try {
      router.push(`/properties?city=${encodeURIComponent(areaName)}`)
    } catch (error) {
      console.error('Navigation error:', error)
      // Fallback navigation
      window.location.href = `/properties?city=${encodeURIComponent(areaName)}`
    }
  }

  // Top Areas slider navigation
  const nextArea = () => {
    setCurrentAreaIndex((prev) => (prev + 1) % topAreas.length)
  }

  const prevArea = () => {
    setCurrentAreaIndex((prev) => (prev - 1 + topAreas.length) % topAreas.length)
  }

  const goToArea = (index: number) => {
    setCurrentAreaIndex(index)
  }

  // Add fullscreen event listener
  useEffect(() => {
    const handleFullscreenTour = (event: CustomEvent) => {
      const { tourUrl, propertyId } = event.detail
      setFullscreenTourUrl(tourUrl)
      setFullscreenPropertyId(propertyId)
      setIsFullscreenTour(true)
    }

    window.addEventListener('openTourFullscreen', handleFullscreenTour as EventListener)
    
    return () => {
      window.removeEventListener('openTourFullscreen', handleFullscreenTour as EventListener)
    }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setMousePosition({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    };
    
    const section = document.getElementById('virtual-tour-cta');
    section?.addEventListener('mousemove', handleMouseMove);
    
    return () => section?.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Smart search handler using NLP
  const handleSmartSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      // Use the existing NLP endpoint to parse the query
      const response = await fetch('/api/chat/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: searchQuery,
          isPropertySearch: true
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Extract the parsed criteria from the response
        const criteria = data.searchCriteria || {};
        
        // Build query parameters for the properties page
        const searchParams = new URLSearchParams();
        
        // Add the original query
        searchParams.append('search_query', searchQuery);
        
        // Add parsed criteria if available
        if (criteria.bedrooms) searchParams.append('bedrooms[]', criteria.bedrooms.toString());
        if (criteria.propertyType) searchParams.append('propertyType[]', criteria.propertyType);
        if (criteria.city) searchParams.append('city[]', criteria.city);
        if (criteria.minPrice) searchParams.append('minPrice', criteria.minPrice.toString());
        if (criteria.maxPrice) searchParams.append('maxPrice', criteria.maxPrice.toString());
        if (criteria.hasPool) searchParams.append('has_pool', 'true');
        if (criteria.hasGarden) searchParams.append('has_garden', 'true');
        if (criteria.hasParking) searchParams.append('has_parking', 'true');
        if (criteria.hasSecurity) searchParams.append('has_security', 'true');
        if (criteria.hasGym) searchParams.append('has_gym', 'true');
        
        // Navigate to properties page with smart search parameters
        router.push(`/properties?${searchParams.toString()}`);
      } else {
        // Fallback to simple text search
        router.push(`/properties?search_query=${encodeURIComponent(searchQuery)}`);
      }
    } catch (error) {
      console.error('Smart search error:', error);
      // Fallback to simple text search
      router.push(`/properties?search_query=${encodeURIComponent(searchQuery)}`);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle Enter key press in search input
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSmartSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section with 3D Tour */}
      <section className="relative h-screen">
        {/* 3D Tour Background */}
        <div className="absolute inset-0 z-10">
          <div 
            className="relative h-full w-full"
            onMouseDown={handleModelInteractionStart}
            onMouseUp={handleModelInteractionEnd}
            onTouchStart={handleModelInteractionStart}
            onTouchEnd={handleModelInteractionEnd}
          >
            {/* Gradient overlays - with pointer-events: none to allow interaction with 3D tour */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none" />
            
            {/* 3D Tour Viewer - higher z-index to be interactive */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTourIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 z-20"
                style={{ pointerEvents: 'auto' }}
              >
                <TourViewer
                  propertyId={currentProperty?.id || 'demo'}
                  tourId={currentProperty?.id || 'demo'}
                  tourUrl={currentProperty?.virtual_tour_url || undefined}
                  className="w-full h-full"
                  autoRotate={true}
                  hideRoomMenu={true}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="absolute top-1/2 left-2 md:left-4 transform -translate-y-1/2 z-30">
          <Button
            variant="outline"
            size="icon"
            onClick={prevTour}
            className="bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/30 w-10 h-10 md:w-12 md:h-12"
          >
            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
        <div className="absolute top-1/2 right-2 md:right-4 transform -translate-y-1/2 z-30">
          <Button
            variant="outline"
            size="icon"
            onClick={nextTour}
            className="bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/30 w-10 h-10 md:w-12 md:h-12"
          >
            <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>

        {/* Property Information Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-8 z-30">
          <div className="container mx-auto">
            <motion.div
              key={`info-${currentTourIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/20"
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
                  <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">{translatePropertyTitle(currentProperty.title)}</h1>
                    {currentProperty.isHot && (
                      <Badge className="bg-red-500 text-white animate-pulse text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {safeT('properties.hot', 'HOT')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center text-white/80 mb-3">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-sm md:text-base">{translateLocation(currentProperty.location, i18n.language === 'ar')}</span>
                  </div>
                  <div className="hidden sm:flex sm:items-center gap-3 sm:gap-4 text-white/80">
                    <div className="flex items-center">
                      <Bed className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="text-sm md:text-base">
                        {isMounted ? translateText(currentProperty.beds?.toString() || '0') : (currentProperty.beds?.toString() || '0')} {safeT('common.bed', 'beds')}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Bath className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="text-sm md:text-base">
                        {isMounted ? translateText(currentProperty.baths?.toString() || '0') : (currentProperty.baths?.toString() || '0')} {safeT('common.bath', 'baths')}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Square className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="text-sm md:text-base">
                        {isMounted ? translateText(currentProperty.sqm?.toString() || '0') : (currentProperty.sqm?.toString() || '0')} {safeT('common.sqm', 'sqm')}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="text-sm md:text-base">
                        {isMounted ? translateText(currentProperty.views?.toString() || '0') : (currentProperty.views?.toString() || '0')} {isMounted && i18n.language === 'ar' ? 'مشาهدات' : 'views'}
                      </span>
                    </div>
                  </div>
                  </div>
                  <div className="flex flex-col md:items-end gap-3">
                    <div className="text-2xl sm:text-3xl font-bold text-white">{formatPrice(currentProperty.price)}</div>
                    <div className="flex flex-col sm:flex-row md:flex-col gap-3">
                      <div className="flex gap-2 justify-start md:justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Link href={`/property/${currentProperty.id}`} className="w-full sm:w-auto">
                        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                          <Play className="h-4 w-4 mr-2" />
                          <span className="text-sm md:text-base">{safeT('properties.startVirtualTour', 'Start Virtual Tour')}</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl px-4 z-30">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20"
          >
            <div className="flex items-center">
              <Search className="h-5 w-5 text-white/60 ml-4" />
              <Input
                placeholder={safeT('properties.searchPlaceholder', 'Try: "3bdr apartment in Sheikh Zayed with pool"')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                disabled={isSearching}
                className="border-0 bg-transparent text-white placeholder:text-white/60 focus-visible:ring-0 text-lg disabled:opacity-70"
              />
              <Button 
                onClick={handleSmartSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="bg-blue-600 hover:bg-blue-700 mr-2 disabled:opacity-50"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {safeT('search.searching', 'Searching...')}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {safeT('search.smartSearch', 'Smart Search')}
                  </>
                )}
              </Button>
            </div>
            {/* Smart Search Examples */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="mt-3 px-4"
            >
              <div className="text-white/50 text-sm text-center">
                {safeT('search.examples', 'Try: "3 bedroom villa in New Cairo" or "apartment under $500k with pool"')}
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Tour Indicators */}
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30">
          {featuredProperties.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsAutoRotating(false)
                setCurrentTourIndex(index)
              }}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentTourIndex ? "bg-white scale-125" : "bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Top Compounds */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-12">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 flex items-center">
                <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2 sm:mr-3" />
                {safeT('properties.topCompounds', 'Top Compounds')}
              </h2>
              <p className="text-sm sm:text-base text-slate-600">{safeT('properties.topCompoundsDescription', 'Discover the most sought-after residential communities in Egypt')}</p>
            </div>
            <Link href="/compounds" className="shrink-0">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                {safeT('properties.viewAllCompounds', 'View All Compounds')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {topCompounds.map((compound) => (
              <Link 
                key={compound.name} 
                href={`/properties?compound=${compound.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="block"
              >
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  <div className="relative">
                    <img 
                      src={compound.image} 
                      alt={compound.name} 
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-blue-600 text-white">
                        <Building2 className="h-3 w-3 mr-1" />
                        {compound.properties} Properties
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      {translateCompoundName(compound.name)}
                      <ShieldCheck className="h-5 w-5 text-blue-600" />
                    </h3>
                    <p className="text-slate-600 mb-4">{translateAreaName(compound.area)}</p>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full">
                      {t('properties.viewProperties', 'View Properties')}
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Free Virtual Tour CTA */}
        <section id="virtual-tour-cta" className="relative py-32 overflow-hidden bg-white">
        <div className="container mx-auto px-4 relative z-10">
          {/* Premium Card Container */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="relative max-w-5xl mx-auto"
          >
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 opacity-95" />
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59,130,246,0.5) 0%, transparent 50%)`,
                }}
              />
              {/* Subtle grid pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                  backgroundSize: '50px 50px'
                }} />
              </div>
              {/* Animated particles */}
              <div className="absolute inset-0">
                {[...Array(15)].map((_, i) => {
                  // Use index-based deterministic positioning to avoid hydration mismatch
                  const x = (i * 13.7 + 7) % 100;
                  const y = (i * 17.3 + 12) % 100;
                  const scale = 0.5 + (i % 5) * 0.1;
                  const duration = 15 + (i % 8) * 2;
                  const delay = (i % 10);
                  
                  return (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-50"
                      initial={{ 
                        x: x + "%",
                        y: y + "%",
                        scale: scale
                      }}
                      animate={{
                        y: [null, "-20%", "120%"],
                        opacity: [0, 0.8, 0]
                      }}
                      transition={{
                        duration: duration,
                        repeat: Infinity,
                        delay: delay,
                        ease: "linear"
                      }}
                    />
                  );
                }
                )}
              </div>
            </div>

            {/* Glass Morphism Content Container */}
            <div className="relative bg-white/5 backdrop-blur-xl rounded-[2rem] p-12 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
              {/* Premium Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="absolute -top-6 left-1/2 transform -translate-x-1/2"
              >
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-xl flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  {t('cta.exclusiveOffer', 'EXCLUSIVE OFFER')}
                  <Sparkles className="w-5 h-5" />
                </div>
              </motion.div>

              {/* Main Content */}
              <div className="text-center space-y-8 pt-8">
                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <h2 className="text-5xl md:text-6xl font-bold mb-6">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-white">
                      {t('cta.getYourFree', 'Get Your FREE')}
                    </span>
                    <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 animate-pulse">
                      {t('cta.virtualTour3D', '3D Virtual Tour')}
                    </span>
                  </h2>
                </motion.div>

                {/* Value Proposition */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="space-y-4"
                >
                  <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur px-6 py-3 rounded-full">
                    <Star className="w-6 h-6 text-blue-400 fill-current" />
                    <span className="text-2xl font-semibold text-white">
                      {t('cta.worth', 'Worth')} <span className="text-cyan-400">{t('cta.priceEGP', '5,000 EGP')}</span>
                    </span>
                    <div className="w-px h-6 bg-white/30" />
                    <span className="text-emerald-400 font-bold">{t('cta.hundredPercentFree', '100% FREE')}</span>
                  </div>
                  
                  <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                    {t('cta.sellFasterDescription', 'Sell your property 73% faster with immersive virtual tours that captivate serious buyers')}
                  </p>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10"
                >
                  {[
                    { icon: Camera, title: t('cta.professionalPhotography', 'Professional Photography'), desc: t('cta.hdrDroneShots', 'HDR & Drone shots'), color: "from-blue-500 to-cyan-500" },
                    { icon: TrendingUp, title: t('cta.interactive3DTour', 'Interactive 3D Tour'), desc: t('cta.dollhouseFloorPlans', 'Dollhouse & Floor plans'), color: "from-cyan-500 to-teal-500" },
                    { icon: Users, title: t('cta.brokerNetwork', 'Broker Network'), desc: t('cta.activeAgents', '1000+ active agents'), color: "from-teal-500 to-blue-500" }
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 group"
                    >
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} p-3 mb-4 group-hover:shadow-lg transition-shadow`}>
                        <feature.icon className="w-full h-full text-white" />
                      </div>
                      <h3 className="text-white font-semibold text-lg mb-1">{feature.title}</h3>
                      <p className="text-slate-400 text-sm">{feature.desc}</p>
                    </motion.div>
                  ))}
                </motion.div>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <LeadCaptureForm
                    trigger={
                      <Button 
                        size="lg" 
                        className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-lg sm:text-xl px-6 sm:px-12 py-8 sm:py-7 rounded-full shadow-2xl hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] transition-all duration-300 transform hover:scale-105 w-full sm:w-auto min-h-[64px] sm:min-h-auto"
                      >
                        <span className="relative z-10 flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                          <div className="flex items-center gap-2">
                            <Gift className="h-5 w-5 sm:h-7 sm:w-7 flex-shrink-0" />
                            <span className="block sm:hidden text-center leading-tight">
                              {t('cta.claimFreeVirtualTour', 'Claim My FREE Virtual Tour').split(' ').slice(0, 3).join(' ')}<br />{t('cta.claimFreeVirtualTour', 'Claim My FREE Virtual Tour').split(' ').slice(3).join(' ')}
                            </span>
                            <span className="hidden sm:block text-center">{t('cta.claimFreeVirtualTour', 'Claim My FREE Virtual Tour')}</span>
                          </div>
                          <ArrowRight className="h-4 w-4 sm:h-6 sm:w-6 group-hover:translate-x-1 transition-transform flex-shrink-0 block sm:inline-block" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </Button>
                    }
                    utm_source="homepage"
                    utm_medium="after_compounds"
                    utm_campaign="free_virtual_tour"
                  />
                </motion.div>

                {/* Urgency Indicators */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="h-4 w-4" />
                      <span>{t('cta.spotsLeft', 'Only 12 spots left')}</span>
                    </div>
                    <div className="w-px h-4 bg-white/30" />
                    <div className="flex items-center gap-2 text-slate-400">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <span>{t('cta.noCreditCard', 'No credit card required')}</span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="max-w-xs mx-auto">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: "0%" }}
                        whileInView={{ width: "76%" }}
                        transition={{ duration: 1, delay: 0.8 }}
                        className="h-full bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{t('cta.claimedThisMonth', '38 of 50 claimed this month')}</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
  

      {/* Hottest Listings This Week */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-12">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 flex items-center">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 mr-2 sm:mr-3" />
                {t('properties.hottestListings', 'Hottest Listings This Week')}
              </h2>
              <p className="text-sm sm:text-base text-slate-600">{t('properties.hottestListingsDescription', 'Properties with the highest interest and price growth')}</p>
            </div>
            <Link href="/properties?sort=trending" className="shrink-0">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                {t('properties.viewAllTrending', 'View All Trending')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {translatedHot.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link href={`/property/${property.id}`} className="block">
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group relative">
                    <div className="absolute top-4 left-4 z-10">
                      <Badge className="bg-red-500 text-white animate-pulse">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {property.priceChange}
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4 z-10">
                      <Badge variant="secondary" className="bg-black/50 text-white">
                        {property.daysOnMarket}d ago
                      </Badge>
                    </div>
                    <div className="relative">
                      <img
                        src={property.image || "/placeholder.svg"}
                        alt={property.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-xl font-semibold text-slate-800 mb-2">{translatePropertyTitle(property.title)}</h3>
                                              <div className="flex items-center text-slate-600 mb-3 text-sm">
                          <MapPin className="h-3 w-3 mr-1" />
                          {translateLocation(property.location, i18n.language === 'ar')}
                        </div>
                      <div className="flex items-center gap-3 text-xs text-slate-600 mb-3">
                        <div className="flex items-center">
                          <Bed className="h-3 w-3 mr-1" />
                          {isMounted ? translateText(property.beds?.toString() || '0') : (property.beds?.toString() || '0')} {isMounted && i18n.language === 'ar' ? 'غرف نوم' : 'beds'}
                        </div>
                        <div className="flex items-center">
                          <Bath className="h-3 w-3 mr-1" />
                          {isMounted ? translateText(property.baths?.toString() || '0') : (property.baths?.toString() || '0')} {isMounted && i18n.language === 'ar' ? 'حمامات' : 'baths'}
                        </div>
                        <div className="flex items-center">
                          <Square className="h-3 w-3 mr-1" />
                          {isMounted ? translateText(property.sqm?.toString() || '0') : (property.sqm?.toString() || '0')} {isMounted && i18n.language === 'ar' ? 'م²' : 'sqm'}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-slate-800">{formatPrice(property.price)}</span>
                        <div className="flex items-center text-xs text-slate-500">
                          <Eye className="h-3 w-3 mr-1" />
                          {property.views}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Stats Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Premium Background with Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center space-x-2 bg-amber-500/10 backdrop-blur-sm border border-amber-500/20 rounded-full px-6 py-2 mb-6"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-medium">{isMounted ? t('stats.headerBadge', "Egypt's #1 PropTech Platform") : "Egypt's #1 PropTech Platform"}</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl font-black text-white mb-4 font-montserrat"
            >
{isMounted ? t('stats.headerTitle', "Powering Egypt's Real Estate Future") : "Powering Egypt's Real Estate Future"}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
            >
{isMounted ? t('stats.headerDescription', "Join thousands of property owners and buyers who trust OpenBeit's AI-powered platform for seamless real estate experiences") : "Join thousands of property owners and buyers who trust OpenBeit's AI-powered platform for seamless real estate experiences"}
            </motion.p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {getStatsData(t).map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.7, 
                  delay: index * 0.15,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -5,
                  transition: { duration: 0.3 }
                }}
                className="group relative"
              >
                {/* Glass Card */}
                <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 h-full overflow-hidden transition-all duration-500 group-hover:bg-white/10 group-hover:border-white/20">
                  {/* Gradient Overlay on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl`}></div>
                  
                  {/* Icon Container */}
                  <div className="relative mb-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:scale-110`}>
                      <stat.icon className="w-8 h-8 text-white" />
                    </div>
                    {/* Glow Effect */}
                    <div className={`absolute inset-0 w-16 h-16 bg-gradient-to-br ${stat.color} rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500`}></div>
                  </div>

                  {/* Animated Counter */}
                  <div className="relative">
                    <AnimatedCounter
                      value={stat.value}
                      suffix={stat.suffix}
                      duration={2.5}
                      className="text-4xl md:text-5xl font-black text-white mb-2 font-montserrat group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-200 group-hover:bg-clip-text transition-all duration-500"
                    />
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-200 transition-colors duration-300">
                      {stat.label}
                    </h3>
                    <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
                      {stat.description}
                    </p>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-xl group-hover:from-white/10 transition-all duration-500"></div>
                  <div className="absolute top-4 right-4 w-2 h-2 bg-amber-400 rounded-full opacity-50 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500"></div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="text-center mt-16"
          >
            <div className="inline-flex items-center space-x-4 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl px-8 py-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-slate-300 font-medium">{isMounted ? t('stats.liveStatsLabel', 'Live Stats') : 'Live Stats'}</span>
              </div>
              <div className="w-px h-6 bg-white/20"></div>
              <span className="text-white font-semibold">{isMounted ? t('stats.updatedRealtime', 'Updated in real-time') : 'Updated in real-time'}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">{t('properties.featuredProperties', 'Explore Our Featured Properties')}</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              {t('properties.featuredDescription', 'Experience immersive virtual tours with AI-powered assistance. Get instant answers about properties while exploring in 3D.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {translatedFeatured.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link href={`/property/${property.id}`} className="block">
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                    <div className="relative">
                      <img
                        src={property.image || "/placeholder.svg"}
                        alt={property.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-blue-600 text-white">Virtual Tour</Badge>
                      </div>
                      {property.isHot && (
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-red-500 text-white animate-pulse">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            HOT
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold text-slate-800 mb-2">{translatePropertyTitle(property.title)}</h3>
                      <div className="flex items-center text-slate-600 mb-3">
                        <MapPin className="h-4 w-4 mr-2" />
                        {translateLocation(property.location, i18n.language === 'ar')}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                        <div className="flex items-center">
                          <Bed className="h-4 w-4 mr-1" />
                          {isMounted ? translateText(property.beds?.toString() || '0') : (property.beds?.toString() || '0')} {isMounted && i18n.language === 'ar' ? 'غرف نوم' : 'beds'}
                        </div>
                        <div className="flex items-center">
                          <Bath className="h-4 w-4 mr-1" />
                          {isMounted ? translateText(property.baths?.toString() || '0') : (property.baths?.toString() || '0')} {isMounted && i18n.language === 'ar' ? 'حمامات' : 'baths'}
                        </div>
                        <div className="flex items-center">
                          <Square className="h-4 w-4 mr-1" />
                          {isMounted ? translateText(property.sqm?.toString() || '0') : (property.sqm?.toString() || '0')} {isMounted && i18n.language === 'ar' ? 'م²' : 'sqm'}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {property.features && property.features.length > 0 && property.features.slice(0, 2).map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-slate-800">{formatPrice(property.price)}</span>
                          <Button
                            variant="outline"
                            className="group-hover:bg-blue-600 group-hover:text-white transition-colors"
                          >
                            {t('properties.viewDetails', 'View Details')}
                          </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Unified Filters & Categories Section */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left: Title, description, button, pills */}
            <div className="flex-1 flex flex-col justify-start">
              <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-center gap-3">
                  <LayoutGrid className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-slate-800">{t('filters.findIdealProperty', 'Find Your Ideal Property')}</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 ml-4"
                    onClick={() => setShowAdvancedFilters((prev) => !prev)}
                  >
                    <Filter className="h-4 w-4" />
                    {t('filters.advancedFilters', 'Advanced Filters')}
                  </Button>
                </div>
                <p className="text-slate-500">{t('filters.useFiltersDescription', 'Use filters and categories to get personalized recommendations')}</p>
              </div>
              {/* Quick Filters Row */}
              <div className="flex flex-wrap gap-3 mb-6">
                {quickFilters.map((filter) => (
                  <Button
                    key={filter.value}
                    variant="outline"
                    className={`rounded-full px-5 py-2 text-sm font-medium border border-blue-200 bg-white shadow-sm hover:border-blue-400 hover:bg-blue-50 transition ${selectedQuickFilter === filter.value ? "border-blue-600 text-blue-600 bg-blue-50" : "text-blue-700"}`}
                    onClick={() => handleQuickFilterSelect(filter.value)}
                  >
                    {t(`filters.${filter.value}`, filter.label)}
                  </Button>
                ))}
              </div>
              {/* Property Types Row */}
              <div className="flex flex-wrap gap-4 mb-6">
                {categories.map((cat) => (
                  <Button
                    key={cat.label}
                    className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base shadow ${selectedCategory === cat.label ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"} transition`}
                    onClick={() => handleCategorySelect(cat.label)}
                  >
                    <cat.icon className="h-5 w-5" />
                    {t(`properties.${cat.label.toLowerCase()}`, cat.label)}
                  </Button>
                ))}
              </div>
              {/* Advanced Filters Area (animated) */}
              <AnimatePresence>
                {showAdvancedFilters && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6 p-6 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner text-slate-700"
                  >
                    <div className="font-semibold mb-2">{t('filters.advancedFilters', 'Advanced Filters')}</div>
                    <div className="text-sm">{t('filters.advancedFiltersNote', '(Your advanced filter options go here. You can add more controls as needed.)')}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Right: AI note */}
            <div className="w-full md:w-[340px] flex items-center justify-center">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 flex flex-col items-center shadow-sm w-full">
                <span className="text-3xl mb-2">🤖</span>
                <div className="font-semibold text-blue-700 mb-1 text-center">{t('filters.aiRecommendations', 'AI Recommendations')}</div>
                <div className="text-slate-600 text-sm text-center">{t('filters.aiRecommendationsDescription', 'Select a filter and property type to get')} <span className='font-bold text-blue-600'>{t('filters.smartRecommendations', '3 smart recommendations')}</span> {t('filters.fromOurAI', 'from our AI!')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommendations Section (conditional) */}
      {selectedQuickFilter && selectedCategory && (
        <section className="py-12 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center flex flex-col items-center gap-2">
              AI Recommendations for <span className="text-blue-600">{selectedCategory}</span> with <span className="text-blue-600">{quickFilters.find(f => f.value === selectedQuickFilter)?.label}</span>
            </h2>
            
            {/* Loading State */}
            {loadingRecommendations && (
              <div className="flex justify-center items-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <p className="text-slate-600">Finding perfect matches for you...</p>
                </div>
              </div>
            )}
            
            {/* Error State */}
            {recommendationError && !loadingRecommendations && (
              <div className="flex justify-center items-center py-12">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
                  <p className="text-red-800 mb-4">{recommendationError}</p>
                  <Button onClick={fetchAIRecommendations} variant="outline">
                    Try Again
                  </Button>
                </div>
              </div>
            )}
            
            {/* Recommendations Display */}
            {!loadingRecommendations && !recommendationError && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-center">
                {recommendations.length > 0 ? recommendations.map((property) => {
                  const primaryImage = property.property_photos?.find(photo => photo.is_primary)?.url || 
                                       property.property_photos?.[0]?.url || 
                                       '/placeholder.svg?height=300&width=400'
                  
                  return (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                        <div className="relative">
                          <img 
                            src={primaryImage} 
                            alt={property.title} 
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                          <div className="absolute top-4 right-4">
                            <Badge className="bg-green-500 text-white">
                              AI Recommended
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-6">
                          <h3 className="text-xl font-semibold text-slate-800 mb-2">{translatePropertyTitle(property.title)}</h3>
                                                      <div className="flex items-center text-slate-600 mb-3">
                              <MapPin className="h-4 w-4 mr-2" />
                              {translateLocation(property.city, i18n.language === 'ar')}, {property.state}
                            </div>
                          <div className="text-2xl font-bold text-blue-600 mb-4">
                            {formatPrice(property.price)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                            <div className="flex items-center">
                              <Bed className="h-4 w-4 mr-1" />
                              {isMounted ? translateText(property.bedrooms?.toString() || '0') : (property.bedrooms?.toString() || '0')} {isMounted && i18n.language === 'ar' ? 'غرف نوم' : 'beds'}
                            </div>
                            <div className="flex items-center">
                              <Bath className="h-4 w-4 mr-1" />
                              {isMounted ? translateText(property.bathrooms?.toString() || '0') : (property.bathrooms?.toString() || '0')} {isMounted && i18n.language === 'ar' ? 'حمامات' : 'baths'}
                            </div>
                            <div className="flex items-center">
                              <Square className="h-4 w-4 mr-1" />
                              {isMounted ? translateText(property.sqm?.toString() || '0') : (property.sqm?.toString() || '0')} {isMounted && i18n.language === 'ar' ? 'م²' : 'sqm'}
                            </div>
                          </div>
                          {property.features && property.features.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {property.features.slice(0, 2).map((feature) => (
                                <Badge key={feature} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                              {property.features.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{property.features.length - 2} more
                                </Badge>
                              )}
                            </div>
                          )}
                          <div className="flex justify-center">
                            <Link href={`/property/${property.id}`}>
                              <Button className="w-full">{t('properties.viewDetails', 'View Details')}</Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                }) : (
                  <div className="col-span-3 text-center py-12">
                    <div className="bg-white rounded-lg p-8 shadow-sm border border-slate-200">
                      <div className="text-slate-400 mb-4">
                        <Search className="h-12 w-12 mx-auto" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">No Properties Found</h3>
                      <p className="text-slate-600 mb-4">
                        We couldn't find any properties matching your criteria. Try adjusting your filters or exploring different options.
                      </p>
                      <div className="flex justify-center space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSelectedQuickFilter(null)
                            setSelectedCategory(null)
                          }}
                        >
                          {t('searchFilters.clearFilters', 'Clear Filters')}
                        </Button>
                        <Link href="/properties">
                          <Button>{t('properties.browseAll', 'Browse All Properties')}</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">{t('testimonials.title', 'What Our Clients Say')}</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              {t('testimonials.description', 'Hear from satisfied customers who found their dream properties through OpenBeit')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-8 relative"
              >
                <Quote className="h-12 w-12 text-blue-600 mb-6" />
                <p className="text-lg text-slate-700 mb-6 leading-relaxed">"{testimonials[currentTestimonial].text}"</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={testimonials[currentTestimonial].avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {testimonials[currentTestimonial].name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-slate-800">{testimonials[currentTestimonial].name}</h4>
                      <p className="text-slate-600 text-sm">{testimonials[currentTestimonial].role}</p>
                      <p className="text-blue-600 text-sm">{testimonials[currentTestimonial].property}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Testimonial indicators */}
            <div className="flex justify-center space-x-2 mt-8">
              {[0, 1, 2, 3, 4].map((index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial ? "bg-blue-600 scale-125" : "bg-slate-300 hover:bg-slate-400"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <ServicesSection />

      {/* Top Areas */}
      <section className="py-12 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-12">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 flex items-center">
                <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2 sm:mr-3" />
                {t('areas.topAreas', 'Top Areas')}
              </h2>
              <p className="text-sm sm:text-base text-slate-600">{t('areas.topAreasDescription', 'Explore the most popular neighborhoods and districts')}</p>
            </div>
            <Link href="/areas" className="shrink-0">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                {t('areas.viewAllAreas', 'View All Areas')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
          {/* Desktop: Horizontal scrolling cards */}
          <div className="hidden sm:flex gap-6 overflow-x-auto pb-4 hide-scrollbar">
            {topAreas.map((area) => (
              <Card className="min-w-[380px] h-[480px] overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col" key={area.name}>
                <div className="relative">
                  <img 
                    src={area.image} 
                    alt={area.name} 
                    className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-blue-600 text-white">
                      <MapPin className="h-3 w-3 mr-1" />
                      {isMounted ? translateText(`${area.propertyCount || 0}`) : `${area.propertyCount || 0}`} {t('areas.properties', 'Properties')}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col flex-1 justify-end p-6 bg-gradient-to-t from-slate-100/90 to-transparent">
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">
                    {(() => {
                      // Create proper mapping for area names to translation keys
                      const areaKeyMap: { [key: string]: string } = {
                        'New Cairo': 'newCairo',
                        'Sheikh Zayed': 'sheikhZayed', 
                        '6th of October': 'october',
                        'Zamalek': 'zamalek',
                        'Maadi': 'maadi',
                        'Heliopolis': 'heliopolis',
                        'Alexandria': 'alexandria',
                        'Giza': 'giza'
                      }
                      const translationKey = areaKeyMap[area.name] || area.name.toLowerCase().replace(/\s+/g, '').replace(/'/g, '')
                      return t(`cities.${translationKey}`, area.name)
                    })()}
                  </h3>
                  <Button variant="outline" className="w-full bg-white text-blue-700 border-blue-200 hover:bg-blue-50" onClick={() => handleAreaClick(area.name)}>
                    {t('areas.exploreArea', 'Explore Area')}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Mobile: Single card slider */}
          <div className="sm:hidden relative">
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentAreaIndex * 100}%)` }}
              >
                {topAreas.map((area) => (
                  <div className="w-full flex-shrink-0 px-2" key={area.name}>
                    <Card className="h-[480px] overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col">
                      <div className="relative">
                        <img 
                          src={area.image} 
                          alt={area.name} 
                          className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-blue-600 text-white">
                            <MapPin className="h-3 w-3 mr-1" />
                            {isMounted ? translateText(`${area.propertyCount || 0}`) : `${area.propertyCount || 0}`} {t('areas.properties', 'Properties')}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col flex-1 justify-end p-6 bg-gradient-to-t from-slate-100/90 to-transparent">
                        <h3 className="text-xl font-semibold text-slate-800 mb-4">
                          {(() => {
                            // Create proper mapping for area names to translation keys
                            const areaKeyMap: { [key: string]: string } = {
                              'New Cairo': 'newCairo',
                              'Sheikh Zayed': 'sheikhZayed', 
                              '6th of October': 'october',
                              'Zamalek': 'zamalek',
                              'Maadi': 'maadi',
                              'Heliopolis': 'heliopolis',
                              'Alexandria': 'alexandria',
                              'Giza': 'giza'
                            }
                            const translationKey = areaKeyMap[area.name] || area.name.toLowerCase().replace(/\s+/g, '').replace(/'/g, '')
                            return t(`cities.${translationKey}`, area.name)
                          })()}
                        </h3>
                        <Button variant="outline" className="w-full bg-white text-blue-700 border-blue-200 hover:bg-blue-50" onClick={() => handleAreaClick(area.name)}>
                          {t('areas.exploreArea', 'Explore Area')}
                        </Button>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Navigation Controls */}
            <div className="flex items-center justify-between mt-6">
              {/* Previous Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={prevArea}
                className="flex items-center gap-2 bg-white border-slate-200 hover:bg-slate-50"
              >
                <ChevronLeft className="h-4 w-4" />
                {t('common.previous', 'Previous')}
              </Button>

              {/* Slider Indicators */}
              <div className="flex gap-2">
                {topAreas.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToArea(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentAreaIndex 
                        ? 'bg-slate-700 w-6' 
                        : 'bg-slate-400 hover:bg-slate-500 w-2'
                    }`}
                  />
                ))}
              </div>

              {/* Next Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={nextArea}
                className="flex items-center gap-2 bg-white border-slate-200 hover:bg-slate-50"
              >
                {t('common.next', 'Next')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Area Counter */}
            <div className="text-center mt-4 text-sm text-slate-500">
              {currentAreaIndex + 1} {t('common.of', 'of')} {topAreas.length} {t('areas.areas', 'areas')}
            </div>
          </div>
        </div>
      </section>


      {/* Lead Capture CTA Section */}
      <section className="relative z-0 mb-20 mt-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-blue-800 to-blue-900 rounded-3xl shadow-xl text-white p-10">
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Gift className="h-8 w-8 text-yellow-300" />
                  <Badge className="bg-yellow-500 text-black text-lg px-3 py-1 font-bold">
                    {t('cta.limitedTimeOffer', 'Limited Time Offer')}
                  </Badge>
              </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                  {t('cta.getYourFree', 'Get Your FREE')} {t('cta.virtualTour3D', '3D Virtual Tour')}
                </h2>
                <p className="text-xl mb-2 opacity-90">
                  {t('cta.professionalTourWorth', 'Professional 3D virtual tour worth')} <span className="font-bold text-yellow-300">{t('cta.priceEGP', '5,000 EGP')}</span> - {t('cta.completelyFree', 'Completely FREE!')}
                </p>
                <p className="text-lg mb-8 opacity-80">
                  {t('cta.sellFasterStunning', 'Sell your property faster with stunning virtual tours that attract serious buyers')}
                </p>
                
                {/* Benefits Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-300" />
                    <span>{t('cta.professionalPhotography', 'Professional Photography')}</span>
            </div>
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-300" />
                    <span>{t('cta.virtualTourCreation', '3D Virtual Tour Creation')}</span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-300" />
                    <span>{t('cta.brokerNetworkMarketing', 'Broker Network Marketing')}</span>
                  </div>
                </div>

                <LeadCaptureForm
                  trigger={
                    <Button 
                      size="lg" 
                      className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg sm:text-xl px-6 sm:px-8 py-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto min-h-[64px] sm:min-h-auto"
                    >
                      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2">
                          <Gift className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                          <span className="block sm:hidden text-center leading-tight">
                            {t('cta.claimFreeVirtualTour', 'Claim My FREE Virtual Tour').split(' ').slice(0, 3).join(' ')}<br />{t('cta.claimFreeVirtualTour', 'Claim My FREE Virtual Tour').split(' ').slice(3).join(' ')}
                          </span>
                          <span className="hidden sm:block text-center">{t('cta.claimFreeVirtualTour', 'Claim My FREE Virtual Tour')}</span>
                        </div>
                      </div>
                    </Button>
                  }
                  utm_source="homepage"
                  utm_medium="cta_button"
                  utm_campaign="free_virtual_tour"
                />
                
                <p className="text-sm opacity-70 mt-4">
                  ⏰ {t('cta.only50Applications', 'Only taking 50 applications this month')} • {t('cta.noCreditCard', 'No credit card required')} • {t('cta.hundredPercentFree', '100% Free')}
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white">
                  <rect x="12" y="8" width="28" height="48" stroke="currentColor" strokeWidth="4"/>
                  <polygon points="12,8 36,20 36,52 12,56" fill="currentColor"/>
                  <circle cx="28" cy="32" r="2.5" fill="black"/>
                </svg>
                <span className="text-2xl font-black font-montserrat tracking-tight">OpenBeit</span>
              </div>
              <p className="text-slate-400 mb-4">
                Revolutionizing real estate with immersive virtual tours and AI assistance.
              </p>
              <div className="flex space-x-4">
                <Button size="sm" variant="outline" className="border-slate-600 text-slate-400 hover:text-white">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="border-slate-600 text-slate-400 hover:text-white">
                  <Mail className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="border-slate-600 text-slate-400 hover:text-white">
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Properties</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link href="/properties?type=apartment" className="hover:text-white transition-colors">
                    Apartments
                  </Link>
                </li>
                <li>
                  <Link href="/properties?type=villa" className="hover:text-white transition-colors">
                    Villas
                  </Link>
                </li>
                <li>
                  <Link href="/properties?type=penthouse" className="hover:text-white transition-colors">
                    Penthouses
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link href="/virtual-tours" className="hover:text-white transition-colors">
                    Virtual Tours
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    AI Assistance
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Property Management
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <a href="tel:+201234567890" className="hover:text-white transition-colors">
                    +20 123 456 7890
                  </a>
                </li>
                <li>
                  <a href="mailto:info@virtualestate.com" className="hover:text-white transition-colors">
                    info@virtualestate.com
                  </a>
                </li>
                <li>Cairo, Egypt</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 OpenBeit. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating Lead Capture CTA */}
      <AnimatePresence>
        {showFloatingCTA && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-24 left-6 z-50"
          >
            <LeadCaptureForm
              isOpen={isLeadFormOpen}
              onOpenChange={setIsLeadFormOpen}
              trigger={
                <Button 
                  size="lg" 
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-full px-6"
                >
                  <Gift className="h-5 w-5 mr-2" />
                  {t('cta.freeVirtualTour', 'FREE Virtual Tour')}
                </Button>
              }
              utm_source="homepage"
              utm_medium="floating_cta"
              utm_campaign="free_virtual_tour"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ChatBot */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isChatOpen ? (
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="relative"
          >
            <Button
              size="lg"
              className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700"
              onClick={() => setIsChatOpen(true)}
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
            />
          </motion.div>
        ) : (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              // Close when clicking the overlay (but not the chatbot itself)
              if (e.target === e.currentTarget) {
                setIsChatOpen(false);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full max-w-2xl h-[700px]"
              onClick={(e) => e.stopPropagation()}
            >
              <ChatBot 
                propertyId={currentProperty.id} 
                agentType="general" 
                onClose={() => {
                  console.log('Close button clicked'); // Debug log
                  setIsChatOpen(false);
                }} 
              />
            </motion.div>
          </div>
        )}
      </div>

      {/* Fullscreen Tour Modal */}
      {isFullscreenTour && (
        <div className="fixed inset-0 bg-black z-50">
          <div className="absolute top-4 right-4 z-10 flex gap-4">
            <Button
              onClick={() => setIsFullscreenTour(false)}
              variant="outline"
              size="icon"
              className="bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/30"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <TourViewer 
            tourId={fullscreenPropertyId || 'demo'}
            propertyId={fullscreenPropertyId}
            tourUrl={fullscreenTourUrl}
            className="w-full h-full"
            fullscreen={true}
          />
        </div>
      )}
    </div>
  )
}
