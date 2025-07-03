'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Filter, X, RotateCcw, ZoomIn, ZoomOut, Navigation, Move, Layers, Palette, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'

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
}

interface GoogleMapViewProps {
  properties: Property[]
  onPropertySelect?: (property: Property) => void
  onLocationSearch?: (lat: number, lng: number, radius: number) => void
  className?: string
  height?: string
}

// Declare Google Maps types
declare global {
  interface Window {
    google: typeof google
    initMap: () => void
  }
}

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
  }
}

// Enhanced Map Themes
const MAP_THEMES = {
  default: {
    name: 'Default',
    icon: '🗺️',
    styles: [
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#e3f2fd' }]
      },
      {
        featureType: 'landscape',
        elementType: 'geometry',
        stylers: [{ color: '#fafafa' }]
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }]
      },
      {
        featureType: 'poi',
        elementType: 'geometry',
        stylers: [{ color: '#f5f5f5' }]
      }
    ] as google.maps.MapTypeStyle[],
    mapTypeId: undefined as string | undefined
  },
  dark: {
    name: 'Dark Mode',
    icon: '🌙',
    styles: [
      { elementType: 'geometry', stylers: [{ color: '#212121' }] },
      { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
      { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
      { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
      { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
      { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
      { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
      { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
      { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
      { featureType: 'poi.park', elementType: 'labels.text.stroke', stylers: [{ color: '#1b1b1b' }] },
      { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
      { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
      { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
      { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#4e4e4e' }] },
      { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
      { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
      { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] }
    ] as google.maps.MapTypeStyle[],
    mapTypeId: undefined as string | undefined
  },
  luxury: {
    name: 'Luxury',
    icon: '✨',
    styles: [
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
      { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e2e8f0' }] },
      { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#f1f5f9' }] },
      { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#dcfce7' }] },
      { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#1e293b' }] },
      { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] }
    ] as google.maps.MapTypeStyle[],
    mapTypeId: undefined as string | undefined
  },
  vintage: {
    name: 'Vintage',
    icon: '📜',
    styles: [
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#7dd3c0' }] },
      { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f6f3d0' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e8ddd7' }] },
      { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#e8ddd7' }] },
      { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d0d0d0' }] },
      { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#726b58' }] },
      { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#625b4f' }] }
    ] as google.maps.MapTypeStyle[],
    mapTypeId: undefined as string | undefined
  },
  satellite: {
    name: 'Satellite',
    icon: '🛰️',
    styles: [] as google.maps.MapTypeStyle[], // Will use satellite map type
    mapTypeId: 'satellite' as string | undefined
  }
}

export default function GoogleMapView({ 
  properties, 
  onPropertySelect, 
  onLocationSearch,
  className = '',
  height = '600px'
}: GoogleMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const searchCircleRef = useRef<google.maps.Circle | null>(null)
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [searchRadius, setSearchRadius] = useState(5) // km
  const [searchCenter, setSearchCenter] = useState<[number, number] | null>(null)
  const [isDrawingRadius, setIsDrawingRadius] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState([0, 10000000])
  
  // New state for enhanced styling
  const [currentTheme, setCurrentTheme] = useState<keyof typeof MAP_THEMES>('default')
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  const [shouldFitBounds, setShouldFitBounds] = useState(true) // Only fit bounds on initial load
  const [markerStyle, setMarkerStyle] = useState<'standard' | 'enhanced' | 'luxury'>('luxury')
  const [error, setError] = useState<string | null>(null)

  // Egypt's major cities for reference
  const egyptianCities = [
    { name: 'Cairo', coordinates: { lat: 30.0444, lng: 31.2357 }, color: '#DC2626' },
    { name: 'Alexandria', coordinates: { lat: 31.2001, lng: 29.9187 }, color: '#2563EB' },
    { name: 'Giza', coordinates: { lat: 30.0131, lng: 31.2089 }, color: '#7C2D12' },
    { name: 'New Cairo', coordinates: { lat: 30.0330, lng: 31.4913 }, color: '#16A34A' },
    { name: 'New Capital', coordinates: { lat: 30.1000, lng: 31.7000 }, color: '#DC2626' },
    { name: '6th October', coordinates: { lat: 29.8167, lng: 30.9333 }, color: '#0D9488' },
  ]

  // Filter properties based on current filters
  const filteredProperties = properties.filter(property => {
    const matchesType = typeFilter.length === 0 || typeFilter.includes(property.property_type)
    const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1]
    const hasCoordinates = property.latitude !== undefined && property.longitude !== undefined
    return matchesType && matchesPrice && hasCoordinates
  })

  // Property type colors and labels (same as original)
  const propertyTypes = [
    { type: 'apartment', label: 'Apartments', color: '#3B82F6', count: filteredProperties.filter(p => p.property_type === 'apartment').length },
    { type: 'villa', label: 'Villas', color: '#10B981', count: filteredProperties.filter(p => p.property_type === 'villa').length },
    { type: 'penthouse', label: 'Penthouses', color: '#8B5CF6', count: filteredProperties.filter(p => p.property_type === 'penthouse').length },
    { type: 'townhouse', label: 'Townhouses', color: '#F59E0B', count: filteredProperties.filter(p => p.property_type === 'townhouse').length },
  ]

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = async () => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        setIsMapLoaded(true)
        return
      }

      // Get API key from environment
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      
      if (!apiKey) {
        console.warn('Google Maps API key not found. Map functionality will be disabled.')
        setError('Google Maps API key not configured')
        return
      }

      try {
        // Create script element
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places`
        script.async = true
        script.defer = true
        
        script.onload = () => {
          console.log('Google Maps API loaded successfully')
          setIsMapLoaded(true)
        }
        
        script.onerror = (e) => {
          console.error('Failed to load Google Maps API:', e)
          setError('Failed to load Google Maps')
        }

        // Add script to document
        document.head.appendChild(script)
        
        // Cleanup function
        return () => {
          if (document.head.contains(script)) {
            document.head.removeChild(script)
          }
        }
      } catch (err) {
        console.error('Error loading Google Maps:', err)
        setError('Error loading Google Maps')
      }
    }

    loadGoogleMaps()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return

    const theme = MAP_THEMES[currentTheme]
    
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 30.0444, lng: 31.2357 }, // Cairo
      zoom: 7,
      styles: theme.styles,
      mapTypeId: theme.mapTypeId || 'roadmap',
      gestureHandling: 'cooperative',
      zoomControl: false, // We'll use custom controls
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    })

    mapInstanceRef.current = map

    // Add click listener for area search
    map.addListener('click', (event: any) => {
      if (isDrawingRadius) {
        const lat = event.latLng.lat()
        const lng = event.latLng.lng()
        setSearchCenter([lat, lng])
        setIsDrawingRadius(false)
        onLocationSearch?.(lat, lng, searchRadius)
        
        // Add search circle
        if (searchCircleRef.current) {
          searchCircleRef.current.setMap(null)
        }
        
        const circle = new google.maps.Circle({
          center: { lat, lng },
          radius: searchRadius * 1000, // Convert km to meters
          strokeColor: '#3B82F6',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#3B82F6',
          fillOpacity: 0.15,
          map: map
        })
        
        searchCircleRef.current = circle
      }
    })

    return () => {
      // Cleanup
      if (infoWindowRef.current) {
        infoWindowRef.current.close()
      }
    }
  }, [isMapLoaded, isDrawingRadius, searchRadius, onLocationSearch, currentTheme])

  // Create property markers - FIXED: No automatic fitBounds
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapLoaded) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Create new markers for filtered properties
    filteredProperties.forEach(property => {
      if (!property.latitude || !property.longitude) return

      const markerColor = getMarkerColor(property.property_type)
      const markerIcon = createMarkerIcon(property, markerColor)

      const marker = new google.maps.Marker({
        position: { lat: property.latitude, lng: property.longitude },
        map: mapInstanceRef.current,
        title: property.title,
        icon: markerIcon
      })

      // Add click listener - FIXED: No map movement on click
      marker.addListener('click', () => {
        handlePropertyClick(property)
        
        // Create enhanced info window content
        const infoContent = createInfoWindowContent(property)
        
        if (infoWindowRef.current) {
          infoWindowRef.current.close()
        }
        
        const infoWindow = new google.maps.InfoWindow({
          content: infoContent,
          maxWidth: 320
        })
        
        // Open info window but DON'T change map view
        infoWindow.open(mapInstanceRef.current!, marker)
        infoWindowRef.current = infoWindow
      })

      markersRef.current.push(marker)
    })

    // FIXED: Only fit bounds on initial load or when explicitly requested
    if (shouldFitBounds && filteredProperties.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      filteredProperties.forEach(property => {
        if (property.latitude && property.longitude) {
          bounds.extend({ lat: property.latitude, lng: property.longitude })
        }
      })
      mapInstanceRef.current.fitBounds(bounds)
      
      // Ensure minimum zoom level for Egypt
      const listener = google.maps.event.addListener(mapInstanceRef.current, 'idle', () => {
        const zoom = mapInstanceRef.current!.getZoom()
        if (zoom && zoom > 12) {
          mapInstanceRef.current!.setZoom(12)
        }
        google.maps.event.removeListener(listener)
      })
      
      // Disable auto-fit after first load
      setShouldFitBounds(false)
    }
  }, [filteredProperties, isMapLoaded, shouldFitBounds, markerStyle])

  // Enhanced marker creation with different styles
  const createMarkerIcon = (property: Property, color: string) => {
    switch (markerStyle) {
      case 'luxury':
        return {
          path: 'M12 0C7.5 0 3.8 3.7 3.8 8.3c0 6.2 8.2 15.7 8.2 15.7s8.2-9.5 8.2-15.7C20.2 3.7 16.5 0 12 0zm0 11.3c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z',
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
          scale: 1.8,
          anchor: { x: 12, y: 24 } as google.maps.Point
        } as google.maps.Symbol
      
      case 'enhanced':
        return {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
          fillColor: color,
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2.5,
          scale: 1.6,
        } as google.maps.Symbol
      
      default: // standard
        return {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 1.4,
        } as google.maps.Symbol
    }
  }

  // Enhanced info window content
  const createInfoWindowContent = (property: Property): string => {
    const primaryImage = property.property_photos?.find(photo => photo.is_primary)?.url || 
                        property.property_photos?.[0]?.url
    
    return `
      <div style="max-width: 300px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; border-radius: 12px; overflow: hidden;">
        ${primaryImage ? `
          <img src="${primaryImage}" 
               style="width: 100%; height: 140px; object-fit: cover; margin: -16px -16px 12px -16px;" 
               alt="${property.title}" />
        ` : ''}
        <div style="padding: ${primaryImage ? '0' : '8px'} 4px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937; line-height: 1.3;">${property.title}</h3>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <p style="margin: 0; font-size: 18px; font-weight: 700; color: #059669;">${formatPrice(property.price)}</p>
            <span style="background: #f3f4f6; color: #6b7280; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">${property.property_type}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px; font-size: 13px; color: #6b7280;">
            <span>🛏️ ${property.bedrooms}</span>
            <span>🚿 ${property.bathrooms}</span>
            ${property.square_meters ? `<span>📐 ${property.square_meters}m²</span>` : ''}
          </div>
          <p style="margin: 0; font-size: 12px; color: #9ca3af; display: flex; align-items: center;">
            <span style="margin-right: 4px;">📍</span>
            ${property.address}
          </p>
          ${property.view_count ? `
            <div style="margin-top: 8px; font-size: 11px; color: #9ca3af; text-align: right;">
              👁️ ${property.view_count} views
            </div>
          ` : ''}
        </div>
      </div>
    `
  }

  const getMarkerColor = (propertyType: string): string => {
    switch (propertyType) {
      case 'villa': return '#10B981' // green
      case 'apartment': return '#3B82F6' // blue
      case 'penthouse': return '#8B5CF6' // purple
      case 'townhouse': return '#F59E0B' // amber
      default: return '#6B7280' // gray
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property)
    onPropertySelect?.(property)
    // Note: No map movement here - this was the issue!
  }

  const toggleTypeFilter = (type: string) => {
    setTypeFilter(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const zoomIn = () => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom()
      mapInstanceRef.current.setZoom((currentZoom || 7) + 1)
    }
  }

  const zoomOut = () => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom()
      mapInstanceRef.current.setZoom(Math.max((currentZoom || 7) - 1, 1))
    }
  }
  
  const resetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({ lat: 30.0444, lng: 31.2357 })
      mapInstanceRef.current.setZoom(7)
      setSearchCenter(null)
      setSelectedProperty(null)
      setShouldFitBounds(true) // Re-enable auto-fit for next filter change
      
      // Remove search circle
      if (searchCircleRef.current) {
        searchCircleRef.current.setMap(null)
        searchCircleRef.current = null
      }
    }
  }

  // Fit to Properties - New function for manual fitting
  const fitToProperties = () => {
    if (mapInstanceRef.current && filteredProperties.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      filteredProperties.forEach(property => {
        if (property.latitude && property.longitude) {
          bounds.extend({ lat: property.latitude, lng: property.longitude })
        }
      })
      mapInstanceRef.current.fitBounds(bounds)
      
      // Ensure reasonable zoom
      const listener = google.maps.event.addListener(mapInstanceRef.current, 'idle', () => {
        const zoom = mapInstanceRef.current!.getZoom()
        if (zoom && zoom > 14) {
          mapInstanceRef.current!.setZoom(14)
        }
        google.maps.event.removeListener(listener)
      })
    }
  }

  // Change map theme
  const changeTheme = (themeName: keyof typeof MAP_THEMES) => {
    setCurrentTheme(themeName)
    if (mapInstanceRef.current) {
      const theme = MAP_THEMES[themeName]
      mapInstanceRef.current.setOptions({
        styles: theme.styles,
        mapTypeId: theme.mapTypeId || 'roadmap'
      })
    }
    setShowThemeSelector(false)
  }

  return (
    <div className={`relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Google Maps Container */}
      <div 
        ref={mapRef}
        className="relative w-full"
        style={{ height }}
      />
      
      {/* Loading State */}
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">{error || 'Loading Google Maps...'}</p>
          </div>
        </div>
      )}

      {/* Enhanced Map Controls */}
      {isMapLoaded && (
        <>
          <div className="absolute top-4 right-4 space-y-2">
            {/* Primary Controls */}
            <div className="bg-white rounded-lg shadow-md p-1">
              <Button variant="ghost" size="sm" onClick={zoomIn} title="Zoom In">
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={zoomOut} title="Zoom Out">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={resetView} title="Reset View">
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={fitToProperties} title="Fit to Properties">
                <Eye className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Theme Selector */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowThemeSelector(!showThemeSelector)}
                className="bg-white"
                title="Map Theme"
              >
                <Palette className="w-4 h-4 mr-2" />
                {MAP_THEMES[currentTheme].icon}
              </Button>
              
              {showThemeSelector && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 w-40 z-50">
                  <div className="space-y-1">
                    {Object.entries(MAP_THEMES).map(([key, theme]) => (
                      <button
                        key={key}
                        onClick={() => changeTheme(key as keyof typeof MAP_THEMES)}
                        className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 flex items-center gap-2 ${
                          currentTheme === key ? 'bg-blue-50 text-blue-700' : ''
                        }`}
                      >
                        <span>{theme.icon}</span>
                        <span>{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white"
              title="Toggle Filters"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            
            <Button
              variant={isDrawingRadius ? "default" : "outline"}
              size="sm"
              onClick={() => setIsDrawingRadius(!isDrawingRadius)}
              className="bg-white"
              title="Area Search"
            >
              <Navigation className="w-4 h-4 mr-2" />
              {isDrawingRadius ? 'Click Map' : 'Area Search'}
            </Button>
          </div>

          {/* Map Info */}
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md px-3 py-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Move className="w-4 h-4" />
              <span>Click and drag to pan • Scroll to zoom</span>
            </div>
            <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
              <span>Powered by Google Maps • {filteredProperties.length} properties</span>
              <span className="ml-4 text-blue-600 font-medium">{MAP_THEMES[currentTheme].name}</span>
            </div>
          </div>
          
          {/* Enhanced Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center space-x-4 flex-wrap">
              <div className="text-sm font-medium text-gray-700">Property Types:</div>
              {propertyTypes.map(({ type, label, color, count }) => (
                <div
                  key={type}
                  className={`flex items-center space-x-1 cursor-pointer px-2 py-1 rounded transition-colors ${
                    typeFilter.includes(type) ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggleTypeFilter(type)}
                >
                  <div 
                    className="w-3 h-3 rounded-full ring-1 ring-white ring-offset-1"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-gray-600">{label} ({count})</span>
                </div>
              ))}
            </div>
            
            {/* Map Styling Options */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center space-x-3 flex-wrap gap-2">
                <span className="text-xs text-gray-600">Map Style:</span>
                {Object.entries(MAP_THEMES).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => changeTheme(key as keyof typeof MAP_THEMES)}
                    className={`text-xs px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                      currentTheme === key ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    title={`Switch to ${theme.name} theme`}
                  >
                    <span>{theme.icon}</span>
                    <span>{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Enhanced Filters Panel */}
      {showFilters && isMapLoaded && (
        <div className="absolute top-16 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-80 z-30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Map Filters</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Price Range */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
            </label>
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              max={10000000}
              min={0}
              step={100000}
              className="w-full"
            />
          </div>
          
          {/* Search Radius */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Radius: {searchRadius} km
            </label>
            <Slider
              value={[searchRadius]}
              onValueChange={(value) => setSearchRadius(value[0])}
              max={20}
              min={1}
              step={1}
              className="w-full"
            />
          </div>
          
          {/* Property Types */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Types
            </label>
            <div className="space-y-2">
              {propertyTypes.map(({ type, label, color, count }) => (
                <label key={type} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={typeFilter.includes(type)}
                    onChange={() => toggleTypeFilter(type)}
                    className="rounded"
                  />
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-gray-700">{label} ({count})</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fitToProperties}
                className="text-xs"
              >
                <Eye className="w-3 h-3 mr-1" />
                Fit View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTypeFilter([])
                  setPriceRange([0, 10000000])
                  setShouldFitBounds(true)
                }}
                className="text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 