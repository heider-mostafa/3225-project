/**
 * Location Picker Section for SmartAppraisal Form
 * Interactive Google Maps component for selecting property location
 * Auto-geocodes from address fields and allows manual pin adjustment
 */

"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { MapPin, Search, Save, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LocationData {
  latitude: number
  longitude: number
  formatted_address: string
  place_id?: string
  confidence_score: number
  address_components: {
    street_number?: string
    route?: string
    neighborhood?: string
    locality?: string
    administrative_area_level_1?: string
    country?: string
    postal_code?: string
  }
  location_type: 'ROOFTOP' | 'RANGE_INTERPOLATED' | 'GEOMETRIC_CENTER' | 'APPROXIMATE'
  last_updated: string
  source: 'auto_geocoded' | 'manual_pin' | 'search_result'
}

interface LocationPickerSectionProps {
  // Form data for auto-geocoding
  propertyAddressArabic?: string
  propertyAddressEnglish?: string
  districtName?: string
  cityName?: string
  governorate?: string
  buildingNumber?: string
  
  // Current location data
  locationData?: LocationData | null
  
  // Callbacks
  onLocationUpdate: (locationData: LocationData) => void
  onLocationError?: (error: string) => void
  
  // Configuration
  readonly?: boolean
  showSearchBox?: boolean
  mapHeight?: string
}

const mapContainerStyle = {
  width: '100%',
  height: '400px'
}

const defaultCenter = {
  lat: 30.0444, // Cairo center
  lng: 31.2357
}

// Google Maps libraries to load
const libraries: ('places' | 'geometry')[] = ['places', 'geometry']

export default function LocationPickerSection({
  propertyAddressArabic,
  propertyAddressEnglish,
  districtName,
  cityName,
  governorate,
  buildingNumber,
  locationData,
  onLocationUpdate,
  onLocationError,
  readonly = false,
  showSearchBox = true,
  mapHeight = '400px'
}: LocationPickerSectionProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [marker, setMarker] = useState<google.maps.LatLng | null>(null)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastAutoGeocode, setLastAutoGeocode] = useState<string>('')
  const [geocodingError, setGeocodingError] = useState<string | null>(null)
  
  const searchBoxRef = useRef<HTMLInputElement>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)

  // Use useJsApiLoader instead of LoadScript to prevent conflicts
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries
  })

  // Initialize map marker from existing location data
  useEffect(() => {
    if (isLoaded && locationData && locationData.latitude && locationData.longitude) {
      const position = new google.maps.LatLng(locationData.latitude, locationData.longitude)
      setMarker(position)
      
      // Center map on existing location
      if (map) {
        map.setCenter(position)
        map.setZoom(16)
      }
    }
  }, [isLoaded, locationData, map])

  // Auto-geocode when address fields change
  const autoGeocodeAddress = useCallback(async () => {
    if (!geocoderRef.current || isGeocoding) return

    // Build address combinations for geocoding
    const addresses = []
    
    // Add simplified address combinations for better geocoding success
    if (cityName && governorate) {
      addresses.push(`${cityName}, ${governorate}, Egypt`)
    }
    
    if (districtName && cityName) {
      addresses.push(`${districtName}, ${cityName}, Egypt`)
    }
    
    if (propertyAddressArabic) {
      addresses.push(`${propertyAddressArabic}, ${cityName || ''}, ${governorate || 'القاهرة'}, مصر`)
    }
    
    if (propertyAddressEnglish) {
      addresses.push(`${propertyAddressEnglish}, ${cityName || ''}, ${governorate || 'Cairo'}, Egypt`)
    }
    
    if (buildingNumber && districtName) {
      addresses.push(`${buildingNumber}, ${districtName}, ${cityName || 'Cairo'}, Egypt`)
    }

    if (addresses.length === 0) return

    const addressKey = addresses.join('|')
    if (addressKey === lastAutoGeocode) return // Avoid repeated geocoding

    setIsGeocoding(true)
    setGeocodingError(null) // Clear previous errors
    console.log('🔍 Auto-geocoding addresses:', addresses)

    try {
      let bestResult: google.maps.GeocoderResult | null = null
      let bestScore = 0

      for (const address of addresses) {
        try {
          const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
            geocoderRef.current!.geocode(
              { 
                address,
                region: 'EG',
                componentRestrictions: { country: 'EG' }
              },
              (results, status) => {
                if (status === 'OK' && results) {
                  resolve(results)
                } else {
                  reject(new Error(`Geocoding failed: ${status}`))
                }
              }
            )
          })

          if (results.length > 0) {
            const result = results[0]
            const score = calculateGeocodingConfidence(result, address)
            
            if (score > bestScore) {
              bestResult = result
              bestScore = score
            }
          }
        } catch (error) {
          console.warn(`Geocoding failed for address: ${address}`, error)
        }
      }

      if (bestResult && bestScore > 50) {
        const location = bestResult.geometry.location
        const newLocationData = createLocationDataFromGeocoderResult(bestResult, bestScore, 'auto_geocoded')
        
        const position = new google.maps.LatLng(location.lat(), location.lng())
        setMarker(position)
        
        if (map) {
          map.setCenter(position)
          map.setZoom(16)
        }

        // Auto-save if confidence is high
        if (bestScore >= 80) {
          onLocationUpdate(newLocationData)
          setHasUnsavedChanges(false)
          console.log('✅ Auto-saved high-confidence location')
        } else {
          setHasUnsavedChanges(true)
          console.log('📍 Location found but requires manual confirmation')
        }
        
        setLastAutoGeocode(addressKey)
      } else {
        console.warn('⚠️ No reliable geocoding results found')
        // Set the failed address key to prevent retrying
        setLastAutoGeocode(addressKey)
        setGeocodingError('Could not find precise location for the provided address')
        onLocationError?.('Could not find precise location for the provided address')
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      // Set the failed address key to prevent retrying
      setLastAutoGeocode(addressKey)
      setGeocodingError('Error occurred while locating the address')
      onLocationError?.('Error occurred while locating the address')
    } finally {
      setIsGeocoding(false)
    }
  }, [
    propertyAddressArabic,
    propertyAddressEnglish,
    districtName,
    cityName,
    governorate,
    buildingNumber,
    lastAutoGeocode,
    isGeocoding,
    map,
    onLocationUpdate,
    onLocationError
  ])

  // Auto-geocode when address fields change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (propertyAddressArabic || propertyAddressEnglish) {
        autoGeocodeAddress()
      }
    }, 1000) // Debounce address changes

    return () => clearTimeout(timer)
  }, [autoGeocodeAddress])

  // Initialize Google Maps services when map loads
  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
    geocoderRef.current = new google.maps.Geocoder()
    placesServiceRef.current = new google.maps.places.PlacesService(map)
  }, [])

  // Handle map click to place/move marker
  const onMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (readonly || !event.latLng) return

    const position = event.latLng
    setMarker(position)
    setHasUnsavedChanges(true)
    
    console.log('📍 Marker placed at:', position.lat(), position.lng())
  }, [readonly])

  // Handle marker drag
  const onMarkerDragEnd = useCallback((event: google.maps.MapMouseEvent) => {
    if (readonly || !event.latLng) return

    const position = event.latLng
    setMarker(position)
    setHasUnsavedChanges(true)
    
    console.log('🎯 Marker moved to:', position.lat(), position.lng())
  }, [readonly])

  // Search for location using search box
  const searchLocation = useCallback(async () => {
    if (!geocoderRef.current || !searchQuery.trim()) return

    setIsGeocoding(true)
    
    try {
      const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoderRef.current!.geocode(
          { 
            address: `${searchQuery}, Egypt`,
            region: 'EG',
            componentRestrictions: { country: 'EG' }
          },
          (results, status) => {
            if (status === 'OK' && results) {
              resolve(results)
            } else {
              reject(new Error(`Search failed: ${status}`))
            }
          }
        )
      })

      if (results.length > 0) {
        const result = results[0]
        const location = result.geometry.location
        const position = new google.maps.LatLng(location.lat(), location.lng())
        
        setMarker(position)
        setHasUnsavedChanges(true)
        
        if (map) {
          map.setCenter(position)
          map.setZoom(16)
        }
        
        console.log('🔍 Search result:', result.formatted_address)
      }
    } catch (error) {
      console.error('Search error:', error)
      onLocationError?.('Search failed. Please try a different query.')
    } finally {
      setIsGeocoding(false)
    }
  }, [searchQuery, map, onLocationError])

  // Save current marker position
  const saveLocation = useCallback(async () => {
    if (!marker || !geocoderRef.current) return

    setIsGeocoding(true)

    try {
      // Reverse geocode to get address details
      const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoderRef.current!.geocode(
          { location: marker },
          (results, status) => {
            if (status === 'OK' && results) {
              resolve(results)
            } else {
              reject(new Error(`Reverse geocoding failed: ${status}`))
            }
          }
        )
      })

      if (results.length > 0) {
        const result = results[0]
        const confidence = calculateGeocodingConfidence(result, '')
        const newLocationData = createLocationDataFromGeocoderResult(
          result, 
          Math.max(confidence, 90), // Manual placement gets high confidence
          'manual_pin'
        )
        
        onLocationUpdate(newLocationData)
        setHasUnsavedChanges(false)
        
        console.log('💾 Location saved:', newLocationData.formatted_address)
      }
    } catch (error) {
      console.error('Save location error:', error)
      onLocationError?.('Failed to save location. Please try again.')
    } finally {
      setIsGeocoding(false)
    }
  }, [marker, onLocationUpdate, onLocationError])

  // Reset to auto-geocoded location
  const resetLocation = useCallback(() => {
    autoGeocodeAddress()
    setHasUnsavedChanges(false)
  }, [autoGeocodeAddress])

  // Helper function to calculate geocoding confidence
  const calculateGeocodingConfidence = (result: google.maps.GeocoderResult, originalAddress: string): number => {
    let score = 0

    // Location type scoring
    switch (result.geometry.location_type) {
      case 'ROOFTOP': score += 40; break
      case 'RANGE_INTERPOLATED': score += 30; break
      case 'GEOMETRIC_CENTER': score += 20; break
      case 'APPROXIMATE': score += 10; break
    }

    // Address matching
    if (originalAddress) {
      const originalLower = originalAddress.toLowerCase()
      const formattedLower = result.formatted_address.toLowerCase()
      const originalWords = originalLower.split(/[\s,]+/).filter(word => word.length > 2)
      
      let matchScore = 0
      originalWords.forEach(word => {
        if (formattedLower.includes(word)) {
          matchScore += 3
        }
      })
      score += Math.min(matchScore, 40)
    }

    // Country verification
    if (result.formatted_address.toLowerCase().includes('egypt') || result.formatted_address.includes('مصر')) {
      score += 20
    }

    return Math.min(score, 100)
  }

  // Helper function to create LocationData from geocoder result
  const createLocationDataFromGeocoderResult = (
    result: google.maps.GeocoderResult,
    confidence: number,
    source: LocationData['source']
  ): LocationData => {
    const addressComponents: LocationData['address_components'] = {}
    
    result.address_components.forEach((component) => {
      const types = component.types
      if (types.includes('street_number')) {
        addressComponents.street_number = component.long_name
      } else if (types.includes('route')) {
        addressComponents.route = component.long_name
      } else if (types.includes('neighborhood') || types.includes('sublocality')) {
        addressComponents.neighborhood = component.long_name
      } else if (types.includes('locality')) {
        addressComponents.locality = component.long_name
      } else if (types.includes('administrative_area_level_1')) {
        addressComponents.administrative_area_level_1 = component.long_name
      } else if (types.includes('country')) {
        addressComponents.country = component.long_name
      } else if (types.includes('postal_code')) {
        addressComponents.postal_code = component.long_name
      }
    })

    return {
      latitude: result.geometry.location.lat(),
      longitude: result.geometry.location.lng(),
      formatted_address: result.formatted_address,
      place_id: result.place_id,
      confidence_score: confidence,
      address_components: addressComponents,
      location_type: result.geometry.location_type as LocationData['location_type'],
      last_updated: new Date().toISOString(),
      source
    }
  }

  // Get confidence badge color
  const getConfidenceBadgeVariant = (score: number) => {
    if (score >= 80) return 'default' // Green
    if (score >= 60) return 'secondary' // Yellow
    return 'destructive' // Red
  }

  // Get confidence text
  const getConfidenceText = (score: number) => {
    if (score >= 80) return 'High Accuracy'
    if (score >= 60) return 'Medium Accuracy'
    return 'Low Accuracy'
  }

  const customMapContainerStyle = {
    ...mapContainerStyle,
    height: mapHeight
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Property Location
          {locationData && (
            <Badge variant={getConfidenceBadgeVariant(locationData.confidence_score)}>
              {getConfidenceText(locationData.confidence_score)}
            </Badge>
          )}
        </CardTitle>
        <div className="text-sm text-slate-600">
          {readonly ? (
            'View property location on map'
          ) : (
            'Click on the map to place a marker or search for the location'
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search Box */}
        {showSearchBox && !readonly && (
          <div className="flex gap-2">
            <Input
              ref={searchBoxRef}
              placeholder="Search for location (e.g., New Cairo, Cairo, Egypt)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
              disabled={isGeocoding}
            />
            <Button 
              onClick={searchLocation}
              disabled={isGeocoding || !searchQuery.trim()}
              size="icon"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Map */}
        <div className="relative rounded-lg overflow-hidden border">
          {loadError && (
            <div className="flex items-center justify-center h-96 bg-red-50 text-red-600">
              Error loading maps
            </div>
          )}
          {!isLoaded && (
            <div className="flex items-center justify-center h-96 bg-slate-100">
              <div className="text-slate-500">Loading map...</div>
            </div>
          )}
          {isLoaded && (
            <GoogleMap
              mapContainerStyle={customMapContainerStyle}
              center={marker ? { lat: marker.lat(), lng: marker.lng() } : defaultCenter}
              zoom={marker ? 16 : 10}
              onLoad={onMapLoad}
              onClick={onMapClick}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
                zoomControl: true,
                gestureHandling: 'cooperative'
              }}
            >
              {marker && (
                <Marker
                  position={marker}
                  draggable={!readonly}
                  onDragEnd={onMarkerDragEnd}
                  icon={{
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ef4444"/>
                        <circle cx="12" cy="9" r="2.5" fill="white"/>
                      </svg>
                    `),
                    scaledSize: new google.maps.Size(24, 24),
                    anchor: new google.maps.Point(12, 24)
                  }}
                />
              )}
            </GoogleMap>
          )}
          
          {/* Loading overlay */}
          {isGeocoding && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <div className="flex items-center gap-2 text-slate-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
                Processing location...
              </div>
            </div>
          )}
        </div>

        {/* Location Info */}
        {locationData && (
          <div className="p-3 bg-slate-50 rounded-lg space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-800">
                  {locationData.formatted_address}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Lat: {locationData.latitude.toFixed(6)}, Lng: {locationData.longitude.toFixed(6)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Source: {locationData.source.replace('_', ' ')} • 
                  Updated: {new Date(locationData.last_updated).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs">
                {locationData.confidence_score >= 80 ? (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-yellow-600" />
                )}
                {locationData.confidence_score}%
              </div>
            </div>
          </div>
        )}

        {/* Geocoding Error */}
        {geocodingError && !locationData && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-medium">Location Not Found</p>
                <p className="text-red-600 mt-1">{geocodingError}</p>
                <p className="text-xs text-red-500 mt-2">
                  Try using the search box above or click on the map to manually place a marker.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!readonly && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={saveLocation}
              disabled={!marker || !hasUnsavedChanges || isGeocoding}
              className={cn(
                hasUnsavedChanges && marker ? 'bg-blue-600 hover:bg-blue-700' : ''
              )}
            >
              <Save className="h-4 w-4 mr-2" />
              {hasUnsavedChanges ? 'Save Location' : 'Saved'}
            </Button>
            
            <Button
              variant="outline"
              onClick={resetLocation}
              disabled={isGeocoding}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Address
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}