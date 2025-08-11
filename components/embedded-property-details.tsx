"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useTranslation } from 'react-i18next'
import { heygenManager } from '@/lib/heygen/HeygenAgentManager'
import {
  ArrowLeft,
  Bed,
  Bath,
  Square,
  MapPin,
  Phone,
  Mail,
  Share2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Calendar,
  User,
  MessageSquare,
  Clock,
  Heart,
  Car,
  PlayCircle,
  Building2,
  Globe
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { TourViewer } from "@/components/tour-viewer"
import { AIAssistant } from "@/components/ai-assistant"
import { useTourState } from "@/hooks/use-tour-state"
import { ChatBot } from "@/components/ChatBot"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import BrokerAvailabilityCalendar from '@/components/calendar/BrokerAvailabilityCalendar'
import ViewingBookingModal from '@/components/calendar/ViewingBookingModal'
import type { Broker, BookingFormData, ViewingBookingRequest } from '@/types/broker'
import { SavePropertyButton } from '@/components/save-property-button'
import { usePropertyTranslation } from '@/components/PropertyTranslationWrapper'
import MortgageCalculator from '@/components/mortgage-calculator'
import SimilarProperties from '@/components/SimilarProperties'
import LifestyleCompatibilityTool from '@/components/lifestyle/LifestyleCompatibilityTool'

// Property interface matching our database schema
interface Property {
  id: string
  title: string
  description: string
  marketing_headline?: string
  price: number
  bedrooms: number
  bathrooms: number
  square_meters: number
  lot_size?: number
  year_built?: number
  address: string
  city: string
  state: string
  zip_code: string
  neighborhood?: string
  compound?: string
  property_type: string
  property_condition?: string
  status: string
  created_at: string
  updated_at: string
  view_count?: number
  features?: string[]
  amenities?: string[]
  key_features?: string[]
  latitude?: number
  longitude?: number
  virtual_tour_url?: string
  video_tour_url?: string
  
  // Property specifications
  floor_level?: number
  total_floors?: number
  balconies?: number
  parking_spaces?: number
  
  // Financial information
  monthly_hoa_fee?: number
  annual_property_tax?: number
  insurance_cost?: number
  
  // Distances (km)
  distance_to_metro?: number
  distance_to_airport?: number
  distance_to_mall?: number
  distance_to_hospital?: number
  
  // Infrastructure
  heating_type?: string
  cooling_type?: string
  water_source?: string
  sewer_type?: string
  internet_speed?: string
  
  // Availability
  available_date?: string
  lease_terms?: string[]
  pet_policy?: string
  
  // Amenity Booleans
  furnished?: boolean
  has_pool?: boolean
  has_garden?: boolean
  has_security?: boolean
  has_parking?: boolean
  has_gym?: boolean
  has_playground?: boolean
  has_community_center?: boolean
  has_elevator?: boolean
  has_balcony?: boolean
  has_terrace?: boolean
  has_storage?: boolean
  has_maid_room?: boolean
  has_driver_room?: boolean
  
  property_photos?: Array<{
    id: string
    url: string
    is_primary: boolean
    order_index: number
  }>
  // Additional fields for compatibility
  nearbyServices?: Array<{
    name: string
    type: string
    distance: string
  }>
  yearBuilt?: string
  agent?: {
    name: string
    email: string
    image: string
  }
  tourId?: string
  location?: string
  images?: string[]
}

interface EmbeddedPropertyDetailsProps {
  propertyId: string
  onClose: () => void
}

export function EmbeddedPropertyDetails({ propertyId, onClose }: EmbeddedPropertyDetailsProps) {
  const { t } = useTranslation()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFullscreenTour, setIsFullscreenTour] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)

  // Broker data state
  const [propertyBrokers, setPropertyBrokers] = useState<Broker[]>([])
  const [primaryBroker, setPrimaryBroker] = useState<Broker | null>(null)
  const [brokersLoading, setBrokersLoading] = useState(true)

  // Broker calendar system state
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [bookingLoading, setBookingLoading] = useState(false)

  const { currentRoom, visitedRooms, timeInRoom, updateRoom } = useTourState()

  // Use enhanced property translation system
  const { translatedProperty, isTranslating } = usePropertyTranslation(property)

  // Fetch property data from API
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true)
        console.log('🔍 Fetching property with ID:', propertyId)
        
        const response = await fetch(`/api/properties/${propertyId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError(t('propertyDetails.propertyNotFound'))
          } else {
            setError(t('propertyDetails.failedToLoadProperty'))
          }
          return
        }
        
        const data = await response.json()
        console.log('✅ Property loaded:', data)
        setProperty(data.property)
        
        // Track property view
        await fetch(`/api/properties/${propertyId}/view`, {
          method: 'POST'
        })
        
      } catch (error) {
        console.error('❌ Error fetching property:', error)
        setError(t('propertyDetails.failedToLoadProperty'))
      } finally {
        setLoading(false)
      }
    }

    const fetchPropertyBrokers = async () => {
      try {
        setBrokersLoading(true)
        console.log('🏢 Fetching brokers for property:', propertyId)
        
        const response = await fetch(`/api/properties/${propertyId}/brokers`)
        
        if (!response.ok) {
          console.warn('No brokers found for this property')
          setPropertyBrokers([])
          setPrimaryBroker(null)
          return
        }
        
        const data = await response.json()
        
        if (data.success && data.brokers) {
          console.log('✅ Brokers loaded:', data.brokers)
          setPropertyBrokers(data.brokers)
          
          // Find primary broker
          const primary = data.brokers.find((broker: Broker) => (broker as any).is_primary)
          setPrimaryBroker(primary || data.brokers[0] || null)
        } else {
          setPropertyBrokers([])
          setPrimaryBroker(null)
        }
        
      } catch (error) {
        console.error('❌ Error fetching brokers:', error)
        setPropertyBrokers([])
        setPrimaryBroker(null)
      } finally {
        setBrokersLoading(false)
      }
    }

    fetchProperty()
    fetchPropertyBrokers()
  }, [propertyId])

  useEffect(() => {
    // Load property knowledge for HeyGen agent
    if (property?.id) {
      heygenManager.loadPropertyKnowledge(property.id).then(() => {
        console.log('Property knowledge loaded for HeyGen agent');
      }).catch((error) => {
        console.error('Failed to load property knowledge:', error);
      });
    }
  }, [property?.id]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold text-slate-800">Loading property...</h1>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">
            {error || 'Property Not Found'}
          </h1>
          <p className="text-slate-600 mb-6">
            {error === 'Property not found' 
              ? 'The property you\'re looking for doesn\'t exist or has been removed.'
              : 'There was an error loading the property. Please try again.'}
          </p>
          <Button onClick={onClose}>
            Back to Coming Soon
          </Button>
        </div>
      </div>
    )
  }

  // Helper functions to format data
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatPropertyType = (type: string) => {
    const key = type.toLowerCase()
    return t(`properties.${key}`, { defaultValue: type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') })
  }

  // Get property images (with fallback) - sorted by order_index
  const propertyImages = property.property_photos?.length 
    ? property.property_photos
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        .map(photo => photo.url)
    : ["/placeholder.svg?height=400&width=600"]

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % propertyImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + propertyImages.length) % propertyImages.length)
  }

  // Broker calendar handlers
  const handleTimeSelected = (broker: Broker, date: string, time: string) => {
    setSelectedBroker(broker)
    setSelectedDate(date)
    setSelectedTime(time)
    setShowBookingModal(true)
  }

  const handleBookingConfirm = async (bookingData: BookingFormData) => {
    if (!selectedBroker || !selectedDate || !selectedTime) {
      toast({
        title: t('propertyDetails.bookingError'),
        description: t('propertyDetails.missingBookingInfo'),
        variant: "destructive"
      })
      return
    }

    setBookingLoading(true)
    
    try {
      const requestData: ViewingBookingRequest = {
        property_id: property.id,
        broker_id: selectedBroker.id,
        viewing_date: selectedDate,
        viewing_time: selectedTime,
        duration_minutes: 60,
        ...bookingData,
        booking_source: 'website',
        metadata: {
          property_title: property.title,
          booking_timestamp: new Date().toISOString()
        }
      }

      const response = await fetch(`/api/properties/${property.id}/book-viewing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to book viewing')
      }

      // Success!
      toast({
        title: t('propertyDetails.bookingConfirmed'),
        description: `${t('propertyDetails.viewingScheduled')} ${new Date(selectedDate).toLocaleDateString()} ${t('common.at')} ${selectedTime}. ${t('propertyDetails.checkEmailForDetails')}`
      })

      setShowBookingModal(false)
      
      // Show success state or redirect
      setTimeout(() => {
        toast({
          title: t('propertyDetails.confirmationCode') + " " + result.viewing.confirmation_code,
          description: t('propertyDetails.saveCodeForRecords')
        })
      }, 2000)

    } catch (error) {
      console.error('Booking error:', error)
      toast({
        title: t('propertyDetails.bookingFailed'),
        description: error instanceof Error ? error.message : t('propertyDetails.somethingWentWrong'),
        variant: "destructive"
      })
    } finally {
      setBookingLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-50 z-50 overflow-y-auto"
    >
      {/* Header with close button */}
      <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Button 
              onClick={onClose}
              variant="outline"
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-800"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Coming Soon</span>
            </Button>
            
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              {translatedProperty?.marketing_headline && (
                <Badge className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full animate-pulse">
                  {translatedProperty.marketing_headline}
                </Badge>
              )}
              <SavePropertyButton propertyId={property.id} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator
                    .share?.({
                      title: property.title,
                      text: property.description,
                      url: window.location.href,
                    })
                    .catch(() => {
                      navigator.clipboard.writeText(window.location.href)
                      alert(t('propertyDetails.linkCopiedToClipboard'))
                    })
                }}
              >
                <Share2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">
                  {t('propertyDetails.share')}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Exact copy from property page */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8">
          {/* Left Column - Images and Tour (3/4 width) */}
          <div className="lg:col-span-3">
            {/* Property Header */}
            <div className="mb-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-slate-800 mb-2 rtl:text-right ltr:text-left property-title">
                    {translatedProperty?.title}
                  </h1>
                  <div className="flex items-center text-slate-600 mb-4">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{translatedProperty?.address}</span>
                    {translatedProperty?.neighborhood && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{translatedProperty.neighborhood}</span>
                      </>
                    )}
                    {translatedProperty?.compound && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="font-medium">{translatedProperty.compound}</span>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Tour Info - Aligned with 3D Tour column */}
                <div className="hidden lg:block w-64 p-3 bg-slate-50 rounded-lg ml-4">
                  <h4 className="font-medium text-slate-800 mb-2">{t('propertyDetails.virtualTour')}</h4>
                  <p className="text-sm text-slate-600 mb-2">{t('propertyDetails.exploreEveryRoom')}</p>
                  <div className="text-xs text-slate-500">{t('propertyDetails.current')}: {currentRoom.replace("-", " ")}</div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-slate-600 mb-4">
                <div className="flex items-center">
                  <Bed className="h-5 w-5 mr-2" />
                  {property.bedrooms} {t('propertyDetails.bedrooms')}
                </div>
                <div className="flex items-center">
                  <Bath className="h-5 w-5 mr-2" />
                  {property.bathrooms} {t('propertyDetails.bathrooms')}
                </div>
                <div className="flex items-center">
                  <Square className="h-5 w-5 mr-2" />
                  {property.square_meters} {t('propertyDetails.sqm')}
                </div>
                {(property.parking_spaces ?? 0) > 0 && (
                  <div className="flex items-center">
                    <Car className="h-5 w-5 mr-2" />
                    {property.parking_spaces} {t('propertyDetails.parking')}
              </div>
                )}
              </div>
              {property.property_condition && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-slate-600">{t('propertyDetails.condition')}:</span>
                  <Badge variant="outline" className={`text-xs ${
                    property.property_condition === 'excellent' ? 'border-green-500 text-green-700' :
                    property.property_condition === 'very_good' ? 'border-blue-500 text-blue-700' :
                    property.property_condition === 'good' ? 'border-yellow-500 text-yellow-700' :
                    property.property_condition === 'fair' ? 'border-orange-500 text-orange-700' :
                    'border-red-500 text-red-700'
                  }`}>
                    {t(`propertyDetails.${property.property_condition.replace('_', '')}`, { 
                      defaultValue: property.property_condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) 
                    })}
                  </Badge>
                </div>
              )}
            </div>

            {/* Image Gallery (3/4) and 3D Tour Preview (1/4) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
              {/* Main Image Gallery - 3/4 width */}
              <div className="col-span-1 lg:col-span-3">
                {/* Main Image */}
                <div className="relative mb-4">
                  <img
                    src={propertyImages[currentImageIndex] || "/placeholder.svg"}
                    alt={`${property.title} - Image ${currentImageIndex + 1}`}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 flex items-center justify-between p-4">
                    <Button variant="outline" size="icon" onClick={prevImage} className="bg-white/80 backdrop-blur-sm">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextImage} className="bg-white/80 backdrop-blur-sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <Badge className="bg-black/50 text-white">
                      {currentImageIndex + 1} {t('propertyDetails.of')} {propertyImages.length}
                    </Badge>
                  </div>
                </div>

                {/* Image Thumbnails */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {propertyImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative rounded-lg overflow-hidden ${
                        index === currentImageIndex ? "ring-2 ring-blue-600" : ""
                      }`}
                    >
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-16 object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* 3D Tour Preview - 1/4 width */}
              <div className="col-span-1 lg:col-span-1">
                <div className="relative group cursor-pointer" onClick={() => setIsFullscreenTour(true)}>
                  <TourViewer 
                    tourId={property.tourId || property.id}
                    propertyId={property.id}
                    tourUrl={property.virtual_tour_url}
                    className="w-full h-96 rounded-lg"
                    onRoomChange={updateRoom}
                    hideConversationalAI={true}
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-lg flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
                      <div className="flex items-center space-x-2 text-slate-800">
                        <Maximize2 className="h-4 w-4" />
                        <span className="text-sm font-medium">{t('propertyDetails.clickToExpand')}</span>
                      </div>
                    </div>
                  </div>

                  {/* 3D Tour Label */}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-purple-600 text-white">{t('propertyDetails.virtualTour3D')}</Badge>
                  </div>
                </div>

                {/* Fullscreen Button */}
                <button
                  onClick={() => setIsFullscreenTour(true)}
                  className="w-full mt-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-700 rounded-lg transition-all duration-200 border border-gray-200 hover:border-gray-300 text-sm font-medium flex items-center justify-center space-x-2 group"
                >
                  <Maximize2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>{t('propertyDetails.viewInFullscreen')}</span>
                </button>
              </div>
            </div>

            {/* Property Description */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{t('propertyDetails.aboutThisProperty')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {isTranslating ? (
                    <div className="flex items-center space-x-2 text-slate-500 mb-6">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">Translating...</span>
                    </div>
                  ) : (
                    <p className="text-slate-600 leading-relaxed mb-6 rtl:text-right ltr:text-left property-description" dir="auto">{translatedProperty?.description}</p>
                  )}
                </div>
                
                {/* Key Features */}
                {translatedProperty?.key_features && translatedProperty.key_features.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-slate-800 mb-3">{t('propertyDetails.keyHighlights')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {translatedProperty.key_features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Property Specifications Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-6">
                  <div>
                    <span className="font-medium text-slate-800">{t('propertyDetails.propertyType')}</span>
                    <p className="text-slate-600">{formatPropertyType(property.property_type)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-800">{t('propertyDetails.yearBuilt')}</span>
                    <p className="text-slate-600">{property.year_built || property.yearBuilt || t('propertyDetails.na')}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-800">{t('propertyDetails.bedrooms')}</span>
                    <p className="text-slate-600">{property.bedrooms}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-800">{t('propertyDetails.bathrooms')}</span>
                    <p className="text-slate-600">{property.bathrooms}</p>
                  </div>
                  {property.lot_size && (
                    <div>
                      <span className="font-medium text-slate-800">{t('propertyDetails.lotSize')}</span>
                      <p className="text-slate-600">{property.lot_size.toLocaleString()} {t('propertyDetails.sqm')}</p>
                </div>
                  )}
                  {property.floor_level && (
                    <div>
                      <span className="font-medium text-slate-800">{t('propertyDetails.floor')}</span>
                      <p className="text-slate-600">{property.floor_level}{property.total_floors ? ` ${t('propertyDetails.of')} ${property.total_floors}` : ''}</p>
                    </div>
                  )}
                  {(property.balconies ?? 0) > 0 && (
                    <div>
                      <span className="font-medium text-slate-800">{t('propertyDetails.balconies')}</span>
                      <p className="text-slate-600">{property.balconies}</p>
                    </div>
                  )}
                  {property.available_date && (
                    <div>
                      <span className="font-medium text-slate-800">{t('propertyDetails.availableDate')}</span>
                      <p className="text-slate-600">{new Date(property.available_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {/* Financial Information */}
                {((property.monthly_hoa_fee ?? 0) > 0 || (property.annual_property_tax ?? 0) > 0 || (property.insurance_cost ?? 0) > 0) && (
                  <div className="border-t pt-4 mb-6">
                    <h4 className="font-semibold text-slate-800 mb-3">{t('propertyDetails.financialInformation')}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      {(property.monthly_hoa_fee ?? 0) > 0 && (
                        <div>
                          <span className="font-medium text-slate-800">{t('propertyDetails.monthlyHOA')}</span>
                          <p className="text-slate-600">EGP {(property.monthly_hoa_fee ?? 0).toLocaleString()}</p>
                        </div>
                      )}
                      {(property.annual_property_tax ?? 0) > 0 && (
                        <div>
                          <span className="font-medium text-slate-800">{t('propertyDetails.annualPropertyTax')}</span>
                          <p className="text-slate-600">EGP {(property.annual_property_tax ?? 0).toLocaleString()}</p>
                        </div>
                      )}
                      {(property.insurance_cost ?? 0) > 0 && (
                        <div>
                          <span className="font-medium text-slate-800">{t('propertyDetails.annualInsurance')}</span>
                          <p className="text-slate-600">EGP {(property.insurance_cost ?? 0).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Amenities & Features */}
                {(property.furnished || property.has_pool || property.has_garden || property.has_security || property.has_gym || property.has_elevator) && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-slate-800 mb-3">{t('propertyDetails.premiumAmenities')}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {property.furnished && (
                        <div className="flex items-center text-sm text-slate-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          {t('propertyDetails.furnished')}
                        </div>
                      )}
                      {property.has_pool && (
                        <div className="flex items-center text-sm text-slate-600">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          {t('propertyDetails.swimmingPool')}
                        </div>
                      )}
                      {property.has_garden && (
                        <div className="flex items-center text-sm text-slate-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          {t('propertyDetails.garden')}
                        </div>
                      )}
                      {property.has_security && (
                        <div className="flex items-center text-sm text-slate-600">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          {t('propertyDetails.security247')}
                        </div>
                      )}
                      {property.has_gym && (
                        <div className="flex items-center text-sm text-slate-600">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                          {t('propertyDetails.fitnessCenter')}
                        </div>
                      )}
                      {property.has_elevator && (
                        <div className="flex items-center text-sm text-slate-600">
                          <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                          {t('propertyDetails.elevatorAccess')}
                        </div>
                      )}
                      {property.has_balcony && (
                        <div className="flex items-center text-sm text-slate-600">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                          {t('propertyDetails.balcony')}
                        </div>
                      )}
                      {property.has_terrace && (
                        <div className="flex items-center text-sm text-slate-600">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                          {t('propertyDetails.terrace')}
                        </div>
                      )}
                      {property.has_storage && (
                        <div className="flex items-center text-sm text-slate-600">
                          <div className="w-2 h-2 bg-gray-600 rounded-full mr-2"></div>
                          {t('propertyDetails.storageSpace')}
                        </div>
                      )}
                      {property.has_maid_room && (
                        <div className="flex items-center text-sm text-slate-600">
                          <div className="w-2 h-2 bg-pink-500 rounded-full mr-2"></div>
                          {t('propertyDetails.maidsRoom')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Features */}
            {translatedProperty?.features && translatedProperty.features.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                  <CardTitle>{t('propertyDetails.features')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {translatedProperty.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      <span className="text-slate-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            )}

            {/* Broker Calendar - Schedule a Viewing */}
            <div id="broker-calendar" className="mb-8">
              <BrokerAvailabilityCalendar
                propertyId={property.id}
                onTimeSelected={handleTimeSelected}
                minDate={new Date().toISOString().split('T')[0]}
                maxDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              />
            </div>

            {/* Nearby Services */}
            {property.nearbyServices && property.nearbyServices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('propertyDetails.nearbyServices')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {property.nearbyServices.map((service, index) => (
                    <button
                      key={index}
                      className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                      onClick={() => {
                        // In a real app, this would open maps with directions
                        const query = encodeURIComponent(`${service.name} near ${property.location || property.address}`)
                        window.open(`https://www.google.com/maps/search/${query}`, "_blank")
                      }}
                    >
                      <div>
                        <span className="font-medium text-slate-800">{service.name}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {service.type}
                        </Badge>
                      </div>
                      <span className="text-slate-600 text-sm">{service.distance}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
            )}

            {/* Location & Infrastructure Details */}
            {(property.distance_to_metro || property.distance_to_airport || property.distance_to_mall || property.distance_to_hospital || 
              property.heating_type || property.cooling_type || property.water_source || property.internet_speed || property.pet_policy) && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>{t('propertyDetails.locationInfrastructure')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Distance Information */}
                  {(property.distance_to_metro || property.distance_to_airport || property.distance_to_mall || property.distance_to_hospital) && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-slate-800 mb-3">{t('propertyDetails.distanceToKeyLocations')}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        {property.distance_to_metro && (
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-blue-600 text-xs font-bold">M</span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{t('propertyDetails.metroStation')}</p>
                              <p className="text-slate-600">{property.distance_to_metro} {t('propertyDetails.km')}</p>
                            </div>
                          </div>
                        )}
                        {property.distance_to_airport && (
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-green-600 text-xs font-bold">✈</span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{t('propertyDetails.airport')}</p>
                              <p className="text-slate-600">{property.distance_to_airport} {t('propertyDetails.km')}</p>
                            </div>
                          </div>
                        )}
                        {property.distance_to_mall && (
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-purple-600 text-xs font-bold">🛍</span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{t('propertyDetails.shoppingMall')}</p>
                              <p className="text-slate-600">{property.distance_to_mall} {t('propertyDetails.km')}</p>
                            </div>
                          </div>
                        )}
                        {property.distance_to_hospital && (
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-red-600 text-xs font-bold">+</span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{t('propertyDetails.hospital')}</p>
                              <p className="text-slate-600">{property.distance_to_hospital} {t('propertyDetails.km')}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Infrastructure Details */}
                  {(property.heating_type || property.cooling_type || property.water_source || property.internet_speed) && (
                    <div className="border-t pt-4 mb-4">
                      <h4 className="font-semibold text-slate-800 mb-3">{t('propertyDetails.infrastructure')}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        {property.heating_type && (
                          <div>
                            <span className="font-medium text-slate-800">{t('propertyDetails.heating')}</span>
                            <p className="text-slate-600">{property.heating_type}</p>
                          </div>
                        )}
                        {property.cooling_type && (
                          <div>
                            <span className="font-medium text-slate-800">{t('propertyDetails.cooling')}</span>
                            <p className="text-slate-600">{property.cooling_type}</p>
                          </div>
                        )}
                        {property.water_source && (
                          <div>
                            <span className="font-medium text-slate-800">{t('propertyDetails.waterSource')}</span>
                            <p className="text-slate-600">{property.water_source}</p>
                          </div>
                        )}
                        {property.internet_speed && (
                          <div>
                            <span className="font-medium text-slate-800">{t('propertyDetails.internet')}</span>
                            <p className="text-slate-600">{property.internet_speed}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Policies */}
                  {property.pet_policy && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-slate-800 mb-3">{t('propertyDetails.policies')}</h4>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{t('propertyDetails.petPolicy')}:</span>
                        <Badge variant="outline" className={`text-xs ${
                          property.pet_policy === 'allowed' ? 'border-green-500 text-green-700' :
                          property.pet_policy === 'deposit_required' ? 'border-yellow-500 text-yellow-700' :
                          'border-red-500 text-red-700'
                        }`}>
                          {t(`propertyDetails.${property.pet_policy.replace('_', '')}`, { 
                            defaultValue: property.pet_policy.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) 
                          })}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Lifestyle Compatibility Tool - Interactive Map with Commute Analysis */}
            {property.latitude && property.longitude && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {t('propertyDetails.commuteAnalysis')}
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-2">
                    {t('propertyDetails.commuteDescription')}
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  <LifestyleCompatibilityTool
                    propertyId={property.id}
                    propertyLocation={{
                      latitude: property.latitude,
                      longitude: property.longitude,
                      address: property.address
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Tour Section */}
            {(property.virtual_tour_url || property.video_tour_url) && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <PlayCircle className="w-6 h-6 mr-3 text-blue-600" />
                  Virtual Tours
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {property.virtual_tour_url && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">3D Virtual Tour</h3>
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <iframe
                          src={property.virtual_tour_url}
                          className="w-full h-full"
                          allowFullScreen
                          title="Virtual Tour"
                        />
                      </div>
                    </div>
                  )}
                  {property.video_tour_url && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Video Tour</h3>
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <iframe
                          src={property.video_tour_url}
                          className="w-full h-full"
                          allowFullScreen
                          title="Video Tour"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mortgage Calculator */}
            <div id="mortgage-calculator">
              <MortgageCalculator 
                initialPropertyPrice={property.price}
                className="mb-8"
              />
            </div>

            {/* Similar Properties */}
            <SimilarProperties 
              currentProperty={property}
              className="mb-8"
            />
          </div>

          {/* Right Column - Property Info and Contact (1/4 width) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Price and Contact */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-slate-800 mb-6">{formatPrice(property.price)}</div>

                  <div className="space-y-4">
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base" 
                      size="lg"
                      onClick={() => {
                        const calendarElement = document.getElementById('broker-calendar')
                        if (calendarElement) {
                          calendarElement.scrollIntoView({ 
                            behavior: 'smooth',
                            block: 'start' 
                          })
                        }
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {t('propertyDetails.scheduleShowing')}
                    </Button>
                    <a href={`mailto:${primaryBroker?.email || 'info@openbeit.com'}?subject=Inquiry about ${property.title}`}>
                      <Button variant="outline" className="w-full h-12 text-base" size="lg">
                        <Mail className="h-4 w-4 mr-2" />
                        {t('propertyDetails.sendMessage')}
                      </Button>
                    </a>
                  </div>

                  <Separator className="my-6" />

                  {/* Broker Info */}
                  {brokersLoading ? (
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-slate-200 animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded animate-pulse w-24"></div>
                        <div className="h-3 bg-slate-200 rounded animate-pulse w-20"></div>
                      </div>
                    </div>
                  ) : primaryBroker ? (
                    <div>
                      <div className="flex items-center space-x-3 mb-4">
                        <img
                          src={primaryBroker.photo_url || "/placeholder.svg"}
                          alt={primaryBroker.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-800">{primaryBroker.full_name}</p>
                            {(primaryBroker as any).is_primary && (
                              <Badge variant="secondary" className="text-xs">{t('propertyDetails.primary')}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">{t('propertyDetails.licensedRealEstateBroker')}</p>
                          {primaryBroker.rating && (
                            <div className="flex items-center mt-1">
                              <Heart className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-slate-600 ml-1">
                                {primaryBroker.rating.toFixed(1)} ({primaryBroker.total_reviews} {t('propertyDetails.reviews')})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Broker Details */}
                      <div className="space-y-2 text-sm">
                        {primaryBroker.years_experience && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">{t('propertyDetails.experience')}:</span>
                            <span className="font-medium">{primaryBroker.years_experience}+ {t('propertyDetails.years')}</span>
                          </div>
                        )}
                        {primaryBroker.specialties && primaryBroker.specialties.length > 0 && (
                          <div>
                            <span className="text-slate-600">{t('propertyDetails.specialties')}:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {primaryBroker.specialties.slice(0, 2).map((specialty) => (
                                <Badge key={specialty} variant="outline" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                              {primaryBroker.specialties.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{primaryBroker.specialties.length - 2} {t('propertyDetails.more')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        {primaryBroker.languages && primaryBroker.languages.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">{t('propertyDetails.languages')}:</span>
                            <span className="font-medium">{primaryBroker.languages.join(', ')}</span>
                          </div>
                        )}
                      </div>

                      {/* Additional Brokers */}
                      {propertyBrokers.length > 1 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-sm font-medium text-slate-700 mb-2">
                            {t('propertyDetails.additionalBrokers')} ({propertyBrokers.length - 1})
                          </p>
                          <div className="space-y-2">
                            {propertyBrokers
                              .filter(broker => broker.id !== primaryBroker.id)
                              .slice(0, 2)
                              .map((broker) => (
                                <div key={broker.id} className="flex items-center space-x-2">
                                  <img
                                    src={broker.photo_url || "/placeholder.svg"}
                                    alt={broker.full_name}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-700 truncate">
                                      {broker.full_name}
                                    </p>
                                    {broker.rating && (
                                      <div className="flex items-center">
                                        <Heart className="h-3 w-3 text-yellow-400 fill-current" />
                                        <span className="text-xs text-slate-500 ml-1">
                                          {broker.rating.toFixed(1)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            {propertyBrokers.length > 3 && (
                              <p className="text-xs text-slate-500">
                                +{propertyBrokers.length - 3} {t('propertyDetails.moreBrokersAvailable')}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <User className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">{t('propertyDetails.noBrokersAssigned')}</p>
                      <p className="text-xs text-slate-500">{t('propertyDetails.contactUsForAssistance')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tour Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('propertyDetails.tourProgress')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">{t('propertyDetails.currentRoom')}:</span>
                      <span className="font-medium text-slate-800 capitalize">{currentRoom.replace("-", " ")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">{t('propertyDetails.timeInRoom')}:</span>
                      <span className="font-medium text-slate-800">
                        {Math.floor(timeInRoom / 60)}m {timeInRoom % 60}s
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">{t('propertyDetails.roomsVisited')}:</span>
                      <span className="font-medium text-slate-800">{visitedRooms.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Assistant Button */}
              <Card>
                <CardContent className="p-6">
                  <Button
                    onClick={() => setShowAIAssistant(true)}
                    className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-base"
                    size="lg"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {t('propertyDetails.askAIAssistant')}
                  </Button>
                  <p className="text-xs text-slate-500 mt-2 text-center">{t('propertyDetails.getInstantAnswers')}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Tour Modal - Mobile Safari optimized */}
      {isFullscreenTour && (
        <div className="fixed inset-0 bg-black z-50">
          <div className="absolute top-4 right-4 z-10 flex gap-4">
            <Button
              onClick={() => setIsFullscreenTour(false)}
              variant="outline"
              size="icon"
              className="bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/30"
            >
              <Clock className="h-4 w-4" />
            </Button>
          </div>
          {(() => {
            const isMobileSafari = typeof window !== 'undefined' && 
              /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent);
            
            if (isMobileSafari && property?.virtual_tour_url) {
              // For mobile Safari, provide a launch screen instead of problematic iframe
              return (
                <div className="flex items-center justify-center w-full h-full p-8">
                  <div className="text-center text-white max-w-md">
                    <div className="text-8xl mb-8">🏠</div>
                    <h2 className="text-3xl font-bold mb-4">
                      {property.title}
                    </h2>
                    <p className="text-slate-300 mb-8 text-lg">
                      Experience this property in full interactive 3D. Opens in a new tab optimized for mobile viewing.
                    </p>
                    <Button
                      onClick={() => {
                        window.open(property.virtual_tour_url, '_blank', 'noopener,noreferrer');
                        setIsFullscreenTour(false); // Close modal after opening
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl text-xl mb-4"
                    >
                      <Globe className="w-6 h-6 mr-3" />
                      Launch Virtual Tour
                    </Button>
                    <p className="text-xs text-slate-400">
                      Optimized for mobile • Full interactive features
                    </p>
                  </div>
                </div>
              );
            }
            
            // For desktop, use the iframe as normal
            return (
              <TourViewer 
                tourId={property.tourId || property.id}
                propertyId={property.id}
                tourUrl={property.virtual_tour_url}
                className="w-full h-full"
                onRoomChange={updateRoom}
                fullscreen={true}
                hideConversationalAI={true}
              />
            );
          })()}
        </div>
      )}

      {/* AI Assistant */}
      <AIAssistant
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        propertyData={property}
        currentRoom={currentRoom}
        tourContext={{
          visitedRooms,
          timeInRoom,
          totalTimeSpent: visitedRooms.length * 120, // Mock calculation
        }}
      />

      {/* Viewing Booking Modal */}
      {showBookingModal && selectedBroker && (
        <ViewingBookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          property={{
            id: property.id,
            title: property.title,
            address: property.location || property.address,
            price: typeof property.price === 'number' ? property.price : parseInt(String(property.price).replace(/[^0-9]/g, '') || '0'),
            property_photos: property.images ? [{ url: property.images[0], is_primary: true }] : property.property_photos || []
          }}
          broker={selectedBroker}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onConfirm={handleBookingConfirm}
          isLoading={bookingLoading}
        />
      )}
    </motion.div>
  )
}