/**
 * =============================================================================
 * LIFESTYLE COMPATIBILITY TOOL - INTERACTIVE MAP COMPONENT
 * =============================================================================
 * 
 * PURPOSE:
 * Interactive lifestyle compatibility analyzer with Google Maps integration.
 * Users can search and save locations directly on the map, with real-time
 * commute analysis displayed alongside.
 *
 * FEATURES:
 * • Split-screen layout: Interactive map | Analysis & saved locations
 * • Google Maps with search functionality and custom markers
 * • Click-to-save locations directly on the map
 * • Real-time commute analysis with visual feedback
 * • Saved locations management with category organization
 * • AI-powered lifestyle compatibility scoring with visual indicators
 *
 * INTEGRATES WITH:
 * • Google Maps JavaScript API (interactive map and search)
 * • /api/user-destinations - Manages user's personal places
 * • /api/geocode - Converts addresses to coordinates
 * • /api/commute-analysis - Calculates travel times and costs
 * • Property details page - Embedded within Location & Infrastructure section
 * • i18n translation system - Supports English/Arabic
 *
 * LAYOUT:
 * [Interactive Google Map] | [Analysis Panel]
 *                          | [Saved Locations]
 *                          | [Compatibility Score]
 * =============================================================================
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MapPin,
  Search,
  Plus,
  Trash2,
  Clock,
  Car,
  DollarSign,
  TrendingUp,
  Navigation,
  Home,
  Building,
  Dumbbell,
  ShoppingBag,
  Coffee,
  GraduationCap,
  Stethoscope,
  Briefcase,
  Star,
  Loader2,
  Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { toast } from '@/components/ui/use-toast'

// Declare Google Maps types for this module
declare namespace google {
  namespace maps {
    class Map {
      constructor(element: HTMLElement, options: MapOptions)
      setCenter(latLng: LatLng | LatLngLiteral): void
      setZoom(zoom: number): void
      getZoom(): number
      getCenter(): LatLng
      addListener(eventName: string, handler: Function): void
      panTo(latLng: LatLng | LatLngLiteral): void
      fitBounds(bounds: LatLngBounds): void
      setOptions(options: MapOptionsUpdate): void
      setMapTypeId(mapTypeId: string): void
      controls: MVCArray<HTMLElement>[]
      getBounds(): LatLngBounds | undefined
    }
    
    class LatLngBounds {
      constructor()
      extend(point: LatLng | LatLngLiteral): void
    }
    
    class Marker {
      constructor(options: MarkerOptions)
      setMap(map: Map | null): void
      addListener(eventName: string, handler: Function): void
      setPosition(latLng: LatLng | LatLngLiteral): void
      setIcon(icon: string | Icon | Symbol): void
    }
    
    class InfoWindow {
      constructor(options?: InfoWindowOptions)
      open(map: Map, anchor?: Marker): void
      close(): void
      setContent(content: string | HTMLElement): void
    }
    
    class Circle {
      constructor(options: CircleOptions)
      setMap(map: Map | null): void
      setCenter(latLng: LatLng | LatLngLiteral): void
      setRadius(radius: number): void
    }

    class Size {
      constructor(width: number, height: number)
    }

    class Point {
      constructor(x: number, y: number)
    }

    class Geocoder {
      constructor()
      geocode(request: GeocoderRequest, callback: (results: GeocoderResult[], status: GeocoderStatus) => void): void
    }
    
    interface MapOptions {
      center: LatLngLiteral
      zoom: number
      mapTypeId?: string
      styles?: MapTypeStyle[]
      gestureHandling?: string
      zoomControl?: boolean
      mapTypeControl?: boolean
      scaleControl?: boolean
      streetViewControl?: boolean
      rotateControl?: boolean
      fullscreenControl?: boolean
    }
    
    interface MarkerOptions {
      position: LatLngLiteral
      map?: Map | null
      title?: string
      icon?: string | Icon | Symbol
      clickable?: boolean
    }
    
    namespace event {
      function addListener(instance: any, eventName: string, handler: Function): any
      function removeListener(listener: any): void
    }
    
    interface MapOptionsUpdate {
      styles?: MapTypeStyle[]
      mapTypeId?: string
    }
    
    interface InfoWindowOptions {
      content?: string | HTMLElement
      maxWidth?: number
    }
    
    interface CircleOptions {
      center: LatLngLiteral
      radius: number
      strokeColor?: string
      strokeOpacity?: number
      strokeWeight?: number
      fillColor?: string
      fillOpacity?: number
      map?: Map
    }
    
    interface LatLngLiteral {
      lat: number
      lng: number
    }
    
    interface LatLng {
      lat(): number
      lng(): number
    }
    
    interface Icon {
      url: string
      scaledSize?: Size
      origin?: Point
      anchor?: Point
    }
    
    interface Symbol {
      path: string
      fillColor?: string
      fillOpacity?: number
      strokeColor?: string
      strokeOpacity?: number
      strokeWeight?: number
      scale?: number
      anchor?: Point
    }
    
    interface Size {
      width: number
      height: number
    }
    
    interface Point {
      x: number
      y: number
    }
    
    interface MapTypeStyle {
      featureType?: string
      elementType?: string
      stylers?: Array<{[key: string]: any}>
    }

    interface GeocoderRequest {
      location?: LatLngLiteral
      address?: string
    }

    interface GeocoderResult {
      formatted_address: string
      geometry: {
        location: LatLng
      }
    }

    type GeocoderStatus = string

    interface MVCArray<T> {
      push(elem: T): number
    }

    enum ControlPosition {
      TOP_CENTER
    }

    namespace places {
      class SearchBox {
        constructor(inputField: HTMLInputElement)
        setBounds(bounds: LatLngBounds): void
        getPlaces(): PlaceResult[]
        addListener(eventName: string, handler: Function): void
      }

      class Autocomplete {
        constructor(inputField: HTMLInputElement, options?: AutocompleteOptions)
        getPlace(): PlaceResult
        addListener(eventName: string, handler: Function): void
        bindTo(key: string, target: Map): void
        setBounds(bounds: LatLngBounds): void
      }

      interface AutocompleteOptions {
        bounds?: LatLngBounds
        componentRestrictions?: ComponentRestrictions
        fields?: string[]
        types?: string[]
      }

      interface ComponentRestrictions {
        country?: string | string[]
      }

      interface PlaceResult {
        formatted_address?: string
        name?: string
        place_id?: string
        geometry?: {
          location?: LatLng
        }
      }
    }
  }
}

// Load Google Maps script using centralized loader
const loadGoogleMapsScript = async () => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    throw new Error('Google Maps API key not configured')
  }

  try {
    const { loadGoogleMaps } = await import('@/lib/google-maps-loader')
    
    await loadGoogleMaps({
      apiKey,
      libraries: ['places'],
      language: 'en',
      region: 'EG'
    })
  } catch (error) {
    throw new Error(`Failed to load Google Maps: ${error}`)
  }
}

interface UserDestination {
  id: string
  label: string  // Changed from 'name' to match API
  address: string
  category: string
  importance: number
  frequency: string  // Changed from number to string to match API
  coordinates: string  // The API stores as POINT geometry
  lat?: number  // We'll derive this from coordinates
  lng?: number  // We'll derive this from coordinates
  created_at: string
}

interface CommuteData {
  destination_id: string
  travel_time_minutes: number
  distance_km: number
  travel_cost: number
  optimal_departure_time: string
  traffic_factor: number
}

interface LifestyleCompatibilityToolProps {
  propertyId: string
  propertyLocation: {
    latitude: number
    longitude: number
    address: string
  }
  className?: string
}

const categoryIcons = {
  work: Briefcase,
  education: GraduationCap,
  health: Stethoscope,
  shopping: ShoppingBag,
  fitness: Dumbbell,
  dining: Coffee,
  entertainment: Star,
  other: MapPin
}

const categoryColors = {
  work: '#ef4444', // red
  education: '#3b82f6', // blue
  health: '#10b981', // green
  shopping: '#f59e0b', // amber
  fitness: '#8b5cf6', // violet
  dining: '#f97316', // orange
  entertainment: '#ec4899', // pink
  other: '#6b7280' // gray
}

export default function LifestyleCompatibilityTool({
  propertyId,
  propertyLocation,
  className = ''
}: LifestyleCompatibilityToolProps) {
  const { t } = useTranslation()

  // State management
  const [destinations, setDestinations] = useState<UserDestination[]>([])
  const [commuteData, setCommuteData] = useState<CommuteData[]>([])
  const [compatibilityScore, setCompatibilityScore] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)

  // Map state
  const mapRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const [propertyMarker, setPropertyMarker] = useState<google.maps.Marker | null>(null)

  // Form state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('work')
  const [importance, setImportance] = useState([8])
  const [frequency, setFrequency] = useState([5])
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number, address: string} | null>(null)

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        await loadGoogleMapsScript()
        
        if (!mapRef.current) return

        // Validate and convert coordinates to numbers
        const lat = typeof propertyLocation.latitude === 'number' 
          ? propertyLocation.latitude 
          : parseFloat(String(propertyLocation.latitude))
        const lng = typeof propertyLocation.longitude === 'number'
          ? propertyLocation.longitude
          : parseFloat(String(propertyLocation.longitude))

        // Check if coordinates are valid numbers
        if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
          console.error('Invalid property coordinates:', { lat: propertyLocation.latitude, lng: propertyLocation.longitude })
          return
        }

        const propertyLatLng = { lat, lng }
        const mapInstance = new (window as any).google.maps.Map(mapRef.current, {
          center: propertyLatLng,
          zoom: 12,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        })

        // Add property marker
        const propMarker = new (window as any).google.maps.Marker({
          position: propertyLatLng,
          map: mapInstance,
          title: 'Property Location',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#1f2937" stroke="white" stroke-width="4"/>
                <path d="M20 12L24 16H22V24H18V16H16L20 12Z" fill="white"/>
              </svg>
            `),
            scaledSize: new (window as any).google.maps.Size(40, 40),
            anchor: new (window as any).google.maps.Point(20, 40)
          }
        })

        // Click to add location
        mapInstance.addListener('click', (event: any) => {
          if (event.latLng) {
            const lat = event.latLng.lat()
            const lng = event.latLng.lng()
            
            // Reverse geocode to get address
            const geocoder = new (window as any).google.maps.Geocoder()
            geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
              if (status === 'OK' && results && results[0]) {
                setSelectedLocation({
                  lat,
                  lng,
                  address: results[0].formatted_address
                })
                setShowAddForm(true)
                setSearchQuery(results[0].formatted_address)
              }
            })
          }
        })

        // Initialize search autocomplete
        if (searchInputRef.current) {
          const autocompleteInstance = new (window as any).google.maps.places.Autocomplete(
            searchInputRef.current,
            {
              fields: ['formatted_address', 'name', 'geometry', 'place_id'],
              types: ['establishment', 'geocode']
            }
          )

          // Bias to map viewport
          autocompleteInstance.bindTo('bounds', mapInstance)

          // Handle place selection
          autocompleteInstance.addListener('place_changed', () => {
            const place = autocompleteInstance.getPlace()
            
            if (!place.geometry || !place.geometry.location) {
              console.log('No geometry found for selected place')
              return
            }

            // Validate coordinates
            const searchLat = place.geometry.location.lat()
            const searchLng = place.geometry.location.lng()
            
            if (isNaN(searchLat) || isNaN(searchLng) || !isFinite(searchLat) || !isFinite(searchLng)) {
              console.error('Invalid search result coordinates:', { lat: searchLat, lng: searchLng })
              return
            }

            // Set selected location
            setSelectedLocation({
              lat: searchLat,
              lng: searchLng,
              address: place.formatted_address || place.name || ''
            })

            // Center map on selected place
            mapInstance.setCenter(place.geometry.location)
            mapInstance.setZoom(16)

            // Show add form with the place name
            setShowAddForm(true)
            setSearchQuery(place.name || place.formatted_address || '')
          })

          setAutocomplete(autocompleteInstance)
        }

        setMap(mapInstance)
        setPropertyMarker(propMarker)
      } catch (error) {
        console.error('Failed to initialize map:', error)
      }
    }

    initMap()
  }, [propertyLocation.latitude, propertyLocation.longitude])

  // Parse coordinates from POINT geometry string
  const parseCoordinates = (coordinates: string): { lat: number, lng: number } | null => {
    try {
      // Extract coordinates from POINT(lng lat) format
      const match = coordinates.match(/POINT\(([^)]+)\)/)
      if (match) {
        const [lng, lat] = match[1].split(' ').map(Number)
        return { lat, lng }
      }
      return null
    } catch (error) {
      console.error('Error parsing coordinates:', error)
      return null
    }
  }

  // Load user destinations
  const loadDestinations = useCallback(async () => {
    try {
      const response = await fetch('/api/user-destinations')
      if (response.ok) {
        const data = await response.json()
        // Parse coordinates and add lat/lng to each destination
        const destinationsWithCoords = (data.destinations || []).map((dest: UserDestination) => {
          const coords = parseCoordinates(dest.coordinates)
          return {
            ...dest,
            lat: coords?.lat || 0,
            lng: coords?.lng || 0
          }
        })
        setDestinations(destinationsWithCoords)
      } else if (response.status === 401) {
        console.log('User not authenticated, skipping destinations load')
        // User not authenticated - this is okay, just skip loading destinations
        setDestinations([])
      } else {
        console.error('Failed to load destinations:', response.status, response.statusText)
        setDestinations([])
      }
    } catch (error) {
      console.error('Failed to load destinations:', error)
      setDestinations([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Update map markers when destinations change
  useEffect(() => {
    if (!map) return

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null))
    
    // Add destination markers
    const newMarkers = destinations.map(dest => {
      // Validate destination coordinates
      const destLat = typeof dest.lat === 'number' ? dest.lat : parseFloat(String(dest.lat))
      const destLng = typeof dest.lng === 'number' ? dest.lng : parseFloat(String(dest.lng))
      
      // Skip invalid coordinates
      if (isNaN(destLat) || isNaN(destLng) || !isFinite(destLat) || !isFinite(destLng)) {
        console.warn('Invalid destination coordinates for:', dest.label, { lat: dest.lat, lng: dest.lng })
        return null
      }

      const IconComponent = categoryIcons[dest.category as keyof typeof categoryIcons]
      const color = categoryColors[dest.category as keyof typeof categoryColors]
      
      const marker = new (window as any).google.maps.Marker({
        position: { lat: destLat, lng: destLng },
        map: map,
        title: dest.label,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
              <circle cx="16" cy="16" r="6" fill="white"/>
            </svg>
          `),
          scaledSize: new (window as any).google.maps.Size(32, 32),
          anchor: new (window as any).google.maps.Point(16, 32)
        }
      })

      // Add info window
      const infoWindow = new (window as any).google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold">${dest.label}</h3>
            <p class="text-sm text-gray-600">${dest.address}</p>
            <p class="text-xs text-gray-500 mt-1">${t(`lifestyle.categories.${dest.category}`)}</p>
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindow.open(map, marker)
      })

      return marker
    }).filter(marker => marker !== null) // Filter out null markers from invalid coordinates

    setMarkers(newMarkers)
  }, [destinations, map, t])

  // Load initial data
  useEffect(() => {
    loadDestinations()
  }, [loadDestinations])

  // Add new destination
  const handleAddDestination = async () => {
    console.log('handleAddDestination called')
    console.log('selectedLocation:', selectedLocation)
    console.log('searchQuery:', searchQuery)
    
    if (!selectedLocation || !searchQuery.trim()) {
      console.log('Missing required data - selectedLocation or searchQuery')
      return
    }

    setLoading(true)
    try {
      const requestBody = {
        label: searchQuery.trim(),
        address: selectedLocation.address,
        category: selectedCategory,
        importance: importance[0],
        frequency: frequency[0] === 1 ? 'daily' : 
                   frequency[0] === 2 ? 'weekly' : 
                   frequency[0] === 3 ? 'bi-weekly' : 
                   frequency[0] === 4 ? 'monthly' : 'weekly',
        coordinates: {
          lat: selectedLocation.lat,
          lng: selectedLocation.lng
        }
      }
      
      console.log('Sending request to /api/user-destinations with body:', requestBody)
      
      let response = await fetch('/api/user-destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      // If 401, try alternative approach - store locally for demo purposes
      if (response.status === 401) {
        console.log('Authentication failed, storing destination locally for demo')
        
        // Create a mock destination with local storage
        const mockDestination = {
          id: `local_${Date.now()}`,
          label: requestBody.label,
          address: requestBody.address,
          category: requestBody.category,
          importance: requestBody.importance,
          frequency: requestBody.frequency,
          coordinates: `POINT(${requestBody.coordinates.lng} ${requestBody.coordinates.lat})`,
          lat: requestBody.coordinates.lat,
          lng: requestBody.coordinates.lng,
          created_at: new Date().toISOString()
        }
        
        setDestinations(prev => [...prev, mockDestination])
        setShowAddForm(false)
        setSearchQuery('')
        setSelectedLocation(null)
        toast({
          title: 'Success',
          description: 'Location added locally (demo mode - authentication required for permanent storage)'
        })
        
        // Skip commute analysis for local storage
        console.log('Skipping commute analysis for local destination')
        return
      }

      if (response.ok) {
        const data = await response.json()
        console.log('Successfully added destination:', data)
        
        // Parse coordinates for the new destination
        const newDestination = data.destination
        const coords = parseCoordinates(newDestination.coordinates)
        const destinationWithCoords = {
          ...newDestination,
          lat: coords?.lat || 0,
          lng: coords?.lng || 0
        }
        
        setDestinations(prev => [...prev, destinationWithCoords])
        setShowAddForm(false)
        setSearchQuery('')
        setSelectedLocation(null)
        toast({
          title: 'Success',
          description: 'Location added successfully'
        })
        
        // Trigger commute analysis
        console.log('Triggering commute analysis...')
        await analyzeCommutes()
      } else {
        const errorText = await response.text()
        console.error('Failed to add destination. Status:', response.status, 'Error:', errorText)
        throw new Error(`Failed to add destination: ${response.status} ${errorText}`)
      }
    } catch (error) {
      console.error('Error adding destination:', error)
      toast({
        title: 'Error',
        description: 'Failed to add location. ' + (error instanceof Error ? error.message : String(error)),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Remove destination
  const handleRemoveDestination = async (destinationId: string) => {
    try {
      const response = await fetch(`/api/user-destinations/${destinationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDestinations(prev => prev.filter(d => d.id !== destinationId))
        setCommuteData(prev => prev.filter(c => c.destination_id !== destinationId))
        toast({
          title: t('lifestyle.success'),
          description: t('lifestyle.destinationRemoved')
        })
      }
    } catch (error) {
      console.error('Error removing destination:', error)
      toast({
        title: t('lifestyle.error'),
        description: t('lifestyle.removeDestinationError'),
        variant: 'destructive'
      })
    }
  }

  // Analyze commutes
  const analyzeCommutes = async () => {
    console.log('analyzeCommutes called, destinations count:', destinations.length)
    
    if (destinations.length === 0) {
      console.log('No destinations to analyze, skipping')
      return
    }

    // Check if we have any local (non-persisted) destinations
    const hasLocalDestinations = destinations.some(d => d.id.startsWith('local_'))
    if (hasLocalDestinations) {
      console.log('Local destinations detected, generating mock commute data')
      
      // Generate mock commute data for demo purposes
      const mockCommuteData = destinations.map(dest => ({
        destination_id: dest.id,
        travel_time_minutes: Math.floor(Math.random() * 30) + 15, // 15-45 minutes
        distance_km: Math.floor(Math.random() * 20) + 5, // 5-25 km
        travel_cost: Math.floor(Math.random() * 30) + 10, // 10-40 EGP
        optimal_departure_time: '08:00',
        traffic_factor: Math.random() * 0.5 + 1 // 1.0-1.5x
      }))
      
      const averageScore = 7 + Math.random() * 2 // 7-9 score
      
      setCommuteData(mockCommuteData)
      setCompatibilityScore(averageScore)
      
      toast({
        title: 'Analysis Complete',
        description: 'Mock commute analysis generated (demo mode)'
      })
      return
    }

    setAnalyzing(true)
    try {
      const requestBody = {
        property_id: propertyId,
        property_location: propertyLocation
      }
      
      console.log('Sending commute analysis request with body:', requestBody)
      
      const response = await fetch('/api/commute-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      console.log('Commute analysis response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Commute analysis data received:', data)
        setCommuteData(data.commute_data || [])
        setCompatibilityScore(data.compatibility_score || 0)
      } else {
        const errorText = await response.text()
        console.error('Commute analysis failed. Status:', response.status, 'Error:', errorText)
        throw new Error(`Commute analysis failed: ${response.status} ${errorText}`)
      }
    } catch (error) {
      console.error('Error analyzing commutes:', error)
      toast({
        title: 'Error',
        description: 'Failed to analyze commutes. ' + (error instanceof Error ? error.message : String(error)),
        variant: 'destructive'
      })
    } finally {
      setAnalyzing(false)
    }
  }

  // Auto-analyze when destinations change
  useEffect(() => {
    if (destinations.length > 0) {
      analyzeCommutes()
    }
  }, [destinations.length])

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 8) return t('lifestyle.excellent')
    if (score >= 6) return t('lifestyle.good')
    if (score >= 4) return t('lifestyle.fair')
    return t('lifestyle.poor')
  }

  // Remove the loading gate - let the map display even if destinations are still loading
  // if (loading && destinations.length === 0) {
  //   return (
  //     <Card className={className}>
  //       <CardContent className="p-6">
  //         <div className="flex items-center justify-center h-64">
  //           <Loader2 className="h-8 w-8 animate-spin" />
  //         </div>
  //       </CardContent>
  //     </Card>
  //   )
  // }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {t('lifestyle.yourLifeFromHere')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-[600px]">
          {/* Interactive Map */}
          <div className="relative">
            <div ref={mapRef} className="w-full h-full" />
            
            {/* Search Bar Overlay */}
            <div className="absolute top-3 left-3 right-3 z-10">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search for places..."
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg shadow-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => {
                    const mapDiv = mapRef.current;
                    if (mapDiv) {
                      if (document.fullscreenElement) {
                        document.exitFullscreen();
                      } else {
                        mapDiv.requestFullscreen();
                      }
                    }
                  }}
                  className="p-2 bg-white rounded-lg shadow-md border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Toggle Fullscreen"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Add Location Form Overlay */}
            {showAddForm && (
              <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 z-10">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">{t('lifestyle.locationName')}</label>
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('lifestyle.enterLocationName')}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">{t('lifestyle.category')}</label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(categoryIcons).map(category => (
                            <SelectItem key={category} value={category}>
                              {t(`lifestyle.categories.${category}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">{t('lifestyle.importance')}</label>
                      <div className="px-2">
                        <Slider
                          value={importance}
                          onValueChange={setImportance}
                          max={10}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                        <div className="text-xs text-center text-gray-500 mt-1">
                          {importance[0]}/10
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleAddDestination} size="sm" className="flex-1">
                      <Plus className="h-4 w-4 mr-1" />
                      {t('lifestyle.addLocation')}
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddForm(false)} size="sm">
                      {t('lifestyle.cancel')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Analysis Panel */}
          <div className="bg-gray-50 p-6 overflow-y-auto">
            {/* Compatibility Score */}
            {destinations.length > 0 && (
              <div className="mb-6">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(compatibilityScore)}`}>
                    {compatibilityScore.toFixed(1)}/10
                  </div>
                  <div className="text-sm text-gray-600">
                    {getScoreLabel(compatibilityScore)}
                  </div>
                  {analyzing && (
                    <div className="flex items-center justify-center mt-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-xs text-gray-500">{t('lifestyle.analyzing')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Instructions */}
            {destinations.length === 0 && (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {t('lifestyle.getStarted')}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {t('lifestyle.instructions')}
                </p>
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    {t('lifestyle.searchToAdd')}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {t('lifestyle.clickToAdd')}
                  </div>
                </div>
              </div>
            )}

            {/* Saved Locations */}
            {destinations.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t('lifestyle.savedLocations')} ({destinations.length})
                </h3>
                
                <div className="space-y-3">
                  {destinations.map((dest) => {
                    const IconComponent = categoryIcons[dest.category as keyof typeof categoryIcons]
                    const commute = commuteData.find(c => c.destination_id === dest.id)
                    
                    return (
                      <div key={dest.id} className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <IconComponent className="h-4 w-4" style={{ color: categoryColors[dest.category as keyof typeof categoryColors] }} />
                              <span className="font-medium text-sm">{dest.label}</span>
                              <Badge variant="secondary" className="text-xs">
                                {t(`lifestyle.categories.${dest.category}`)}
                              </Badge>
                            </div>
                            
                            <div className="text-xs text-gray-600 mb-2">
                              {dest.address}
                            </div>
                            
                            {commute && (
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {commute.travel_time_minutes}min
                                </div>
                                <div className="flex items-center gap-1">
                                  <Car className="h-3 w-3" />
                                  {commute.distance_km.toFixed(1)}km
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {commute.travel_cost.toFixed(0)} EGP
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDestination(dest.id)}
                            className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Quick Stats */}
                {commuteData.length > 0 && (
                  <div className="mt-6 p-4 bg-white rounded-lg shadow-sm">
                    <h4 className="font-medium text-sm text-gray-700 mb-3">{t('lifestyle.quickStats')}</h4>
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div>
                        <div className="text-lg font-semibold text-blue-600">
                          {Math.round(commuteData.reduce((acc, c) => acc + c.travel_time_minutes, 0) / commuteData.length)}min
                        </div>
                        <div className="text-xs text-gray-500">{t('lifestyle.avgCommute')}</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-green-600">
                          {Math.round(commuteData.reduce((acc, c) => acc + c.travel_cost, 0))} EGP
                        </div>
                        <div className="text-xs text-gray-500">{t('lifestyle.dailyCost')}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 