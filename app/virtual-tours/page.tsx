"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Play, Clock, Eye, Star, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useTranslation } from "react-i18next"

// Dynamic import for TourViewer - MASSIVE bundle size savings
const TourViewer = dynamic(() => import("@/components/tour-viewer").then(mod => ({ default: mod.TourViewer })), {
  loading: () => (
    <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg overflow-hidden flex items-center justify-center min-h-[400px]">
      <div className="text-center text-white">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold mb-2">Loading Virtual Tour</h3>
        <p className="text-slate-300">Preparing 3D experience...</p>
      </div>
    </div>
  ),
  ssr: false
})
import { usePropertiesTranslation } from '@/components/PropertyTranslationWrapper'

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
  zip_code: string
  property_type: string
  status: string
  created_at: string
  updated_at: string
  view_count?: number
  features?: string[]
  amenities?: string[]
  latitude?: number
  longitude?: number
  property_photos?: Array<{
    id: string
    url: string
    is_primary: boolean
  }>
  virtual_tour_url?: string
}

// Helper function to translate room names
const translateRoomName = (roomName: string, t: any) => {
  const roomMap: { [key: string]: string } = {
    'Living Room': t('common.livingRoom', 'Living Room'),
    'Kitchen': t('common.kitchen', 'Kitchen'),
    'Master Bedroom': t('common.masterBedroom', 'Master Bedroom'),
    'Guest Bedroom': t('common.guestBedroom', 'Guest Bedroom'),
    'Bathroom': t('common.bathroom', 'Bathroom'),
    '2 Bathrooms': `2 ${t('common.bathrooms', 'Bathrooms')}`,
    '3 Bathrooms': `3 ${t('common.bathrooms', 'Bathrooms')}`,
    'Garden': t('common.garden', 'Garden'),
    'Open Living Space': t('common.openLivingSpace', 'Open Living Space'),
    'Master Suite': t('common.masterSuite', 'Master Suite'),
    'Pool Area': t('common.poolArea', 'Pool Area'),
    'Terrace': t('common.terrace', 'Terrace')
  }
  
  // Handle dynamic bedroom/bathroom counts
  if (roomName.includes('Bedrooms')) {
    const count = roomName.split(' ')[0]
    return `${count} ${t('common.bedrooms', 'Bedrooms')}`
  }
  
  return roomMap[roomName] || roomName
}

// Helper function to translate highlights
const translateHighlight = (highlight: string, t: any) => {
  const highlightMap: { [key: string]: string } = {
    'City Views': t('common.cityViews', 'City Views'),
    'Modern Kitchen': t('common.modernKitchen', 'Modern Kitchen'),
    'Spacious Rooms': t('common.spaciousRooms', 'Spacious Rooms'),
    'Private Garden': t('common.privateGarden', 'Private Garden'),
    'Family Friendly': t('common.familyFriendly', 'Family Friendly'),
    'Parking Space': t('common.parkingSpace', 'Parking Space'),
    'Building Amenities': t('common.buildingAmenities', 'Building Amenities'),
    'Security': t('common.security', 'Security'),
    'Modern Design': t('common.modernDesign', 'Modern Design'),
    'Multi-level Living': t('common.multiLevelLiving', 'Multi-level Living'),
    'Private Entrance': t('common.privateEntrance', 'Private Entrance'),
    'Community Features': t('common.communityFeatures', 'Community Features'),
    'Efficient Layout': t('common.efficientLayout', 'Efficient Layout'),
    'Prime Location': t('common.primeLocation', 'Prime Location'),
    'Swimming Pool': t('common.swimmingPool', 'Swimming Pool'),
    'Luxury Features': t('common.luxuryFeatures', 'Luxury Features'),
    'Rooftop Terrace': t('common.rooftopTerrace', 'Rooftop Terrace'),
    'Panoramic Views': t('common.panoramicViews', 'Panoramic Views'),
    'Luxury Finishes': t('common.luxuryFinishes', 'Luxury Finishes'),
    'Modern Features': t('common.modernFeatures', 'Modern Features'),
    'Great Location': t('common.greatLocation', 'Great Location'),
    'Well Maintained': t('common.wellMaintained', 'Well Maintained')
  }
  
  return highlightMap[highlight] || highlight
}

// Helper function to generate tour data from real property
const generateTourFromProperty = (property: Property, t: any) => {
  const roomsMap: { [key: string]: string[] } = {
    'apartment': ['Living Room', 'Kitchen', 'Master Bedroom', 'Bathroom'],
    'house': ['Living Room', 'Kitchen', 'Master Bedroom', 'Guest Bedroom', 'Bathroom', 'Garden'],
    'condo': ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom'],
    'townhouse': ['Living Room', 'Kitchen', 'Master Bedroom', 'Guest Bedroom', '2 Bathrooms'],
    'studio': ['Open Living Space', 'Kitchen', 'Bathroom'],
    'villa': ['Living Room', 'Kitchen', 'Master Suite', '3 Bedrooms', '3 Bathrooms', 'Garden', 'Pool Area'],
    'penthouse': ['Living Room', 'Kitchen', 'Master Suite', '2 Bedrooms', '2 Bathrooms', 'Terrace'],
  }
  
  const highlightsMap: { [key: string]: string[] } = {
    'apartment': ['City Views', 'Modern Kitchen', 'Spacious Rooms'],
    'house': ['Private Garden', 'Family Friendly', 'Parking Space'],
    'condo': ['Building Amenities', 'Security', 'Modern Design'],
    'townhouse': ['Multi-level Living', 'Private Entrance', 'Community Features'],
    'studio': ['Efficient Layout', 'Modern Design', 'Prime Location'],
    'villa': ['Private Garden', 'Swimming Pool', 'Luxury Features'],
    'penthouse': ['Rooftop Terrace', 'Panoramic Views', 'Luxury Finishes'],
  }

  const propertyTypeKey = property.property_type.toLowerCase().replace('_', '') || 'apartment'
  const rooms = roomsMap[propertyTypeKey] || [`${property.bedrooms} Bedrooms`, `${property.bathrooms} Bathrooms`, 'Living Room', 'Kitchen']
  const highlights = highlightsMap[propertyTypeKey] || ['Modern Features', 'Great Location', 'Well Maintained']

  // Estimate duration based on property size and rooms
  const baseDuration = Math.max(5, Math.min(25, Math.ceil(property.square_meters / 400)))
  const duration = `${baseDuration}-${baseDuration + 5} ${t('virtualTours.minutes', 'minutes')}`

  // Generate realistic view count based on property age and price
  const daysSinceCreated = Math.floor((Date.now() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24))
  const priceMultiplier = property.price > 1000000 ? 1.5 : property.price > 500000 ? 1.2 : 1.0
  const baseViews = Math.max(50, daysSinceCreated * 10 * priceMultiplier)
  const views = Math.floor(baseViews + (Math.random() * baseViews * 0.5))

  // Generate rating based on property features
  const featuresCount = (property.features?.length || 0) + (property.amenities?.length || 0)
  const baseRating = 4.2 + (featuresCount * 0.05) + (Math.random() * 0.6)
  const rating = Math.min(5.0, Math.round(baseRating * 10) / 10)

  return {
    id: property.id,
    title: property.title,
    location: `${property.city}, ${property.state}`,
    duration,
    views,
    rating,
    thumbnail: property.property_photos?.[0]?.url || "/placeholder.svg?height=300&width=400",
    tourId: `tour_${property.id}`,
    virtualTourUrl: property.virtual_tour_url, // Add the actual virtual tour URL
    type: property.property_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    rooms: rooms.map(room => translateRoomName(room, t)),
    highlights: highlights.map(highlight => translateHighlight(highlight, t)),
    description: property.description,
    price: property.price,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    square_meters: property.square_meters,
    address: property.address,
  }
}

export default function VirtualToursPage() {
  const { t } = useTranslation()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMoreData, setHasMoreData] = useState(true)
  const [selectedType, setSelectedType] = useState("all")
  const [sortBy, setSortBy] = useState("popular")
  const [previewTour, setPreviewTour] = useState<string | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  
  // Add property translation
  const { translatedProperties, isTranslating } = usePropertiesTranslation(properties)

  // Fetch properties with virtual tours only
  useEffect(() => {
    loadProperties(true) // Load first page
  }, [])

  const loadProperties = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setCurrentPage(1)
        setProperties([])
        setHasMoreData(true)
      } else {
        setLoadingMore(true)
      }

      const page = reset ? 1 : currentPage + 1
      const response = await fetch(`/api/properties?page=${page}&limit=20&has_virtual_tour=true`)
      
      if (response.ok) {
        const data = await response.json()
        const newProperties = data.properties || []
        
        if (reset) {
          setProperties(newProperties)
        } else {
          setProperties(prev => [...prev, ...newProperties])
        }
        
        setCurrentPage(page)
        setHasMoreData(newProperties.length === 20) // If we got less than 20, no more data
      } else {
        console.error('Failed to load properties')
      }
    } catch (error) {
      console.error('Error loading properties:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    if (!loadMoreRef.current || !hasMoreData || loadingMore || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMoreData) {
          loadProperties(false) // Load next page
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before reaching the bottom
        threshold: 0.1
      }
    )

    const currentRef = loadMoreRef.current
    observer.observe(currentRef)

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [loadingMore, hasMoreData, loading])

  // Convert translated properties to tour format - only show properties with virtual tours
  const virtualTours = translatedProperties
    .filter(property => 
      (property.status === 'available' || property.status === 'active') && 
      property.virtual_tour_url && 
      property.virtual_tour_url.trim() !== ''
    )
    .map(property => generateTourFromProperty(property, t))

  const filteredTours = virtualTours.filter(
    (tour) => selectedType === "all" || tour.type.toLowerCase().includes(selectedType.toLowerCase()),
  )

  const sortedTours = [...filteredTours].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return b.views - a.views
      case "rating":
        return b.rating - a.rating
      case "duration":
        return Number.parseInt(a.duration) - Number.parseInt(b.duration)
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "newest":
        return new Date(b.id).getTime() - new Date(a.id).getTime() // Using ID as a proxy for creation time
      default:
        return 0
    }
  })

  // Format price helper
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (loading || isTranslating) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-800 mb-4">{t('nav.virtualTours', 'Virtual Property Tours')}</h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {t('virtualTours.pageDescription', 'Explore properties from anywhere in the world with our immersive 3D virtual tours.')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-64 bg-slate-200 animate-pulse"></div>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-6 bg-slate-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">{t('nav.virtualTours', 'Virtual Property Tours')}</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            {t('virtualTours.fullDescription', 'Explore properties from anywhere in the world with our immersive 3D virtual tours. Experience every room, every detail, as if you were there.')}
          </p>
          <div className="mt-4 text-slate-500">
            {sortedTours.length} {t('virtualTours.toursAvailable', 'virtual tours available')}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-slate-500" />
                <span className="font-medium text-slate-700">{t('common.filterBy', 'Filter by')}:</span>
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('search.allPropertyTypes', 'All Property Types')}</SelectItem>
                  <SelectItem value="apartment">{t('search.apartments', 'Apartments')}</SelectItem>
                  <SelectItem value="house">{t('search.houses', 'Houses')}</SelectItem>
                  <SelectItem value="villa">{t('search.villas', 'Villas')}</SelectItem>
                  <SelectItem value="penthouse">{t('search.penthouses', 'Penthouses')}</SelectItem>
                  <SelectItem value="studio">{t('search.studios', 'Studios')}</SelectItem>
                  <SelectItem value="condo">{t('search.condos', 'Condos')}</SelectItem>
                  <SelectItem value="townhouse">{t('search.townhouses', 'Townhouses')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-4">
              <span className="font-medium text-slate-700">{t('common.sortBy', 'Sort by')}:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">{t('search.mostPopular', 'Most Popular')}</SelectItem>
                  <SelectItem value="rating">{t('search.highestRated', 'Highest Rated')}</SelectItem>
                  <SelectItem value="duration">{t('search.shortestFirst', 'Shortest First')}</SelectItem>
                  <SelectItem value="price-low">{t('search.priceLowToHigh', 'Price: Low to High')}</SelectItem>
                  <SelectItem value="price-high">{t('search.priceHighToLow', 'Price: High to Low')}</SelectItem>
                  <SelectItem value="newest">{t('search.newestFirst', 'Newest First')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tours Grid */}
        {sortedTours.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-slate-800 mb-2">{t('virtualTours.noToursFound', 'No virtual tours found')}</h3>
            <p className="text-slate-600 mb-6">{t('virtualTours.tryAdjustingFilters', 'Try adjusting your filters or check back later for new tours.')}</p>
            <Link href="/properties">
              <Button>{t('common.browseAllProperties', 'Browse All Properties')}</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {sortedTours.map((tour) => (
              <Card key={tour.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => window.location.href = `/property/${tour.id}`}>
                  <div className="relative">
                    {previewTour === tour.id ? (
                      <div className="h-64">
                        <TourViewer tourId={tour.tourId} className="w-full h-full" />
                        <Button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setPreviewTour(null)
                          }}
                          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70"
                          size="sm"
                          aria-label="Close preview"
                        >
{t('common.closePreview', 'Close Preview')}
                        </Button>
                      </div>
                    ) : (
                      <>
                        <img
                          src={tour.thumbnail || "/placeholder.svg"}
                          alt={tour.title}
                          className="w-full h-64 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setPreviewTour(tour.id)
                            }}
                            className="bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/30"
                            aria-label={`Preview virtual tour of ${tour.title}`}
                          >
                            <Play className="h-4 w-4 mr-2" />
{t('common.previewTour', 'Preview Tour')}
                          </Button>
                        </div>
                      </>
                    )}
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-purple-600 text-white">{t('propertyDetails.threeDVirtualTour', '3D Virtual Tour')}</Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary">{tour.type}</Badge>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold text-slate-800">{tour.title}</h3>
                      <div className="text-lg font-bold text-blue-600">{formatPrice(tour.price)}</div>
                    </div>
                    <p className="text-slate-600 mb-2">{tour.location}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                      <span>{tour.bedrooms} {t('common.bed', 'bed')}</span>
                      <span>{tour.bathrooms} {t('common.bath', 'bath')}</span>
                      <span>{tour.square_meters.toLocaleString()} {t('common.sqm', 'sqm')}</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{tour.description}</p>

                    {/* Tour Stats */}
                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {tour.duration}
                      </div>
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {tour.views.toLocaleString()} {t('common.views', 'views')}
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                        {tour.rating}
                      </div>
                    </div>

                    {/* Rooms */}
                    <div className="mb-4">
                      <h4 className="font-medium text-slate-800 mb-2">{t('virtualTours.roomsToExplore', 'Rooms to Explore')}:</h4>
                      <div className="flex flex-wrap gap-2">
                        {tour.rooms.map((room) => (
                          <Link
                            key={room}
                            href={`/property/${tour.id}#${room.toLowerCase().replace(" ", "-")}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Badge
                              variant="outline"
                              className="text-xs cursor-pointer hover:bg-slate-100 transition-colors"
                            >
                              {room}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Highlights */}
                    <div className="mb-6">
                      <h4 className="font-medium text-slate-800 mb-2">{t('common.highlights', 'Highlights')}:</h4>
                      <div className="flex flex-wrap gap-2">
                        {tour.highlights.map((highlight) => (
                          <Badge key={highlight} className="bg-blue-100 text-blue-800 text-xs">
                            {highlight}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <a href={tour.virtualTourUrl} target="_blank" rel="noopener noreferrer" className="flex-1" onClick={(e) => e.stopPropagation()}>
                        <Button className="w-full">
                          <Play className="h-4 w-4 mr-2" />
                          {t('virtualTours.startVirtualTour', 'Start Virtual Tour')}
                        </Button>
                      </a>
                      <Link href={`/property/${tour.id}`} onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline">
                          {t('virtualTours.viewProperty', 'View Property')}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
            ))}
          </div>
        )}

        {/* Infinite Scroll Loading Indicator */}
        {sortedTours.length > 0 && (
          <div 
            ref={loadMoreRef}
            className="mt-8 text-center"
          >
            {loadingMore && (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-slate-600">{t('common.loadingMore', 'Loading more virtual tours...')}</span>
              </div>
            )}
            {!hasMoreData && sortedTours.length > 0 && (
              <p className="text-slate-500">{t('common.allToursLoaded', 'All virtual tours loaded')}</p>
            )}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">{t('virtualTours.ctaTitle', 'Ready to Find Your Dream Home?')}</h2>
          <p className="text-xl mb-8 opacity-90">
            {t('virtualTours.ctaDescription', 'Browse our complete property collection and schedule virtual tours with AI assistance.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/properties">
              <Button size="lg" variant="secondary">
                {t('common.browseAllProperties', 'Browse All Properties')}
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600"
              >
{t('common.contactAgent', 'Contact an Agent')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
