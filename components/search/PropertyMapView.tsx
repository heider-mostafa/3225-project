'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Filter, X, RotateCcw, ZoomIn, ZoomOut, Layers, Navigation, Move } from 'lucide-react'
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

interface PropertyMapViewProps {
  properties: Property[]
  onPropertySelect?: (property: Property) => void
  onLocationSearch?: (lat: number, lng: number, radius: number) => void
  className?: string
  height?: string
}

// Egyptian area markers as full colored circles
const EgyptianArea = ({ 
  name, 
  coordinates, 
  mapBounds, 
  color = '#6B7280',
  zoom = 10
}: { 
  name: string
  coordinates: [number, number] // [lat, lng]
  mapBounds: { north: number, south: number, east: number, west: number }
  color?: string 
  zoom?: number
}) => {
  const latRange = mapBounds.north - mapBounds.south
  const lngRange = mapBounds.east - mapBounds.west
  
  const x = ((coordinates[1] - mapBounds.west) / lngRange) * 100
  const y = ((mapBounds.north - coordinates[0]) / latRange) * 100

  // Calculate area size based on zoom level
  const baseSize = Math.max(30, 80 - zoom * 3) // Larger at lower zoom
  const showLabel = zoom <= 12 // Only show labels at lower zoom levels

  // Show area if it's reasonably close to being visible (expanded bounds)
  if (x < -20 || x > 120 || y < -20 || y > 120) {
    return null
  }

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Colored area circle */}
      <div 
        className="rounded-full"
        style={{ 
          backgroundColor: color,
          opacity: 0.3,
          width: `${baseSize}px`,
          height: `${baseSize}px`,
        }}
      />
      
      {/* Area label */}
      {showLabel && (
        <div 
          className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white"
          style={{ 
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            fontSize: Math.max(8, 12 - zoom * 0.5) + 'px'
          }}
        >
          {name}
        </div>
      )}
    </div>
  )
}

// Simple marker component for properties
const PropertyMarker = ({ 
  property, 
  isSelected, 
  onClick,
  mapBounds
}: { 
  property: Property
  isSelected: boolean
  onClick: () => void 
  mapBounds: {
    north: number
    south: number
    east: number
    west: number
  }
}) => {
  const getMarkerColor = () => {
    switch (property.property_type) {
      case 'villa': return '#10B981' // green
      case 'apartment': return '#3B82F6' // blue
      case 'penthouse': return '#8B5CF6' // purple
      case 'townhouse': return '#F59E0B' // amber
      default: return '#6B7280' // gray
    }
  }

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`
    }
    return `$${(price / 1000).toFixed(0)}K`
  }

  // Check if property has valid coordinates
  if (!property.latitude || !property.longitude) {
    return null
  }

  // Calculate position based on map bounds with more lenient bounds checking
  const latRange = mapBounds.north - mapBounds.south
  const lngRange = mapBounds.east - mapBounds.west
  
  const x = ((property.longitude - mapBounds.west) / lngRange) * 100
  const y = ((mapBounds.north - property.latitude) / latRange) * 100

  // More lenient bounds - show markers even if slightly outside visible area
  if (x < -10 || x > 110 || y < -10 || y > 110) {
    return null
  }

  return (
    <div
      className={`absolute transform -translate-x-1/2 -translate-y-full cursor-pointer transition-all duration-200 ${
        isSelected ? 'scale-110 z-20' : 'hover:scale-105 z-10'
      }`}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      style={{
        left: `${Math.max(0, Math.min(100, x))}%`, // Clamp to visible area
        top: `${Math.max(0, Math.min(100, y))}%`
      }}
    >
      {/* Property marker */}
      <div
        className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${
          isSelected ? 'ring-4 ring-blue-500 ring-opacity-50' : ''
        }`}
        style={{ backgroundColor: getMarkerColor() }}
      >
        <MapPin className="w-4 h-4 text-white" />
      </div>
      
      {/* Price tooltip */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-md text-xs font-medium whitespace-nowrap">
        {formatPrice(property.price)}
      </div>
    </div>
  )
}

// Realistic map background with Egyptian geography
const MapBackground = ({ 
  zoom, 
  center, 
  mapBounds,
  offset = { x: 0, y: 0 }
}: { 
  zoom: number
  center: [number, number]
  mapBounds: { north: number, south: number, east: number, west: number }
  offset?: { x: number, y: number }
}) => {
  // Background map style representing Egypt
  const mapStyle = {
    background: `
      radial-gradient(circle at 30% 25%, #d97706 0%, rgba(217, 119, 6, 0.3) 15%, transparent 25%),
      radial-gradient(circle at 70% 60%, #059669 0%, rgba(5, 150, 105, 0.2) 20%, transparent 30%),
      radial-gradient(circle at 85% 20%, #0369a1 0%, rgba(3, 105, 161, 0.2) 12%, transparent 20%),
      linear-gradient(180deg, #fef3c7 0%, #fde68a 30%, #f59e0b 70%, #d97706 100%)
    `,
    backgroundSize: '100% 100%',
    position: 'relative' as const
  }

  // Egypt's major cities and landmarks with correct coordinates
  const egyptianCities = [
    // Major Cities
    { name: 'Cairo', coordinates: [30.0444, 31.2357], color: '#DC2626' },
    { name: 'Alexandria', coordinates: [31.2001, 29.9187], color: '#2563EB' },
    { name: 'Giza', coordinates: [30.0131, 31.2089], color: '#7C2D12' },
    { name: 'Luxor', coordinates: [25.6872, 32.6396], color: '#059669' },
    { name: 'Aswan', coordinates: [24.0889, 32.8998], color: '#7C3AED' },
    { name: 'Port Said', coordinates: [31.2653, 32.3018], color: '#0891B2' },
    { name: 'Hurghada', coordinates: [27.2574, 33.8129], color: '#EA580C' },
    { name: 'Sharm El Sheikh', coordinates: [27.9158, 34.3300], color: '#DB2777' },
    
    // New Administrative Capital and New Cities
    { name: 'New Cairo', coordinates: [30.0330, 31.4913], color: '#16A34A' },
    { name: 'New Capital', coordinates: [30.1000, 31.7000], color: '#DC2626' },
    { name: '6th October', coordinates: [29.8167, 30.9333], color: '#0D9488' },
    
    // Coastal Cities
    { name: 'El Alamein', coordinates: [30.8333, 28.9500], color: '#0EA5E9' },
    { name: 'Marina', coordinates: [30.9000, 28.8000], color: '#06B6D4' },
    { name: 'Ain Sokhna', coordinates: [29.6000, 32.3000], color: '#F59E0B' },
    
    // Delta Cities
    { name: 'Mansoura', coordinates: [31.0364, 31.3807], color: '#10B981' },
    { name: 'Tanta', coordinates: [30.7865, 31.0004], color: '#84CC16' },
    { name: 'Zagazig', coordinates: [30.5965, 31.5115], color: '#22C55E' },
  ]

  return (
    <div 
      className="absolute inset-0 overflow-hidden"
      style={mapStyle}
    >
      {/* Render Egyptian cities */}
      {egyptianCities.map((city) => (
        <EgyptianArea
          key={city.name}
          name={city.name}
          coordinates={city.coordinates as [number, number]}
          mapBounds={mapBounds}
          color={city.color}
          zoom={zoom}
        />
      ))}

      {/* Map grid overlay for reference */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          transform: `translate(${offset.x}px, ${offset.y}px)`
        }}
      />
      
      {/* Compass indicator */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-80 rounded-full p-2 shadow-md">
        <Navigation className="w-4 h-4 text-gray-600" style={{ transform: 'rotate(0deg)' }} />
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 px-3 py-1 rounded text-xs font-medium text-gray-700">
        Zoom: {zoom}x
      </div>
    </div>
  )
}

export default function PropertyMapView({ 
  properties, 
  onPropertySelect, 
  onLocationSearch,
  className = '',
  height = '500px'
}: PropertyMapViewProps) {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([30.0444, 31.2357]) // Cairo
  const [mapZoom, setMapZoom] = useState(6) // Better initial zoom for overview
  const [searchRadius, setSearchRadius] = useState(5) // km
  const [searchCenter, setSearchCenter] = useState<[number, number] | null>(null)
  const [isDrawingRadius, setIsDrawingRadius] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState([0, 10000000])
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const mapRef = useRef<HTMLDivElement>(null)

  // Use refs to store current values without causing re-renders
  const mapCenterRef = useRef(mapCenter)
  const mapZoomRef = useRef(mapZoom)
  const isDraggingRef = useRef(isDragging)
  const dragStartRef = useRef(dragStart)

  // Update refs when state changes
  useEffect(() => {
    mapCenterRef.current = mapCenter
  }, [mapCenter])

  useEffect(() => {
    mapZoomRef.current = mapZoom
  }, [mapZoom])

  useEffect(() => {
    isDraggingRef.current = isDragging
  }, [isDragging])

  useEffect(() => {
    dragStartRef.current = dragStart
  }, [dragStart])

  // Filter properties based on current filters
  const filteredProperties = properties.filter(property => {
    const matchesType = typeFilter.length === 0 || typeFilter.includes(property.property_type)
    const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1]
    const hasCoordinates = property.latitude !== undefined && property.longitude !== undefined
    return matchesType && matchesPrice && hasCoordinates
  })

  // Calculate map bounds based on zoom and center
  const calculateMapBounds = useCallback(() => {
    // Better bounds calculation for Egypt's geography
    let baseLatRange: number
    let baseLngRange: number
    
    if (mapZoom <= 5) {
      // Wide view - show all of Egypt
      baseLatRange = 4.0
      baseLngRange = 6.0
    } else if (mapZoom <= 10) {
      // Regional view - show major cities
      baseLatRange = 2.0 / (mapZoom / 5)
      baseLngRange = 3.0 / (mapZoom / 5)
    } else {
      // City/neighborhood view - more focused
      baseLatRange = 1.0 / (mapZoom / 8)
      baseLngRange = 1.5 / (mapZoom / 8)
    }
    
    return {
      north: mapCenter[0] + baseLatRange / 2,
      south: mapCenter[0] - baseLatRange / 2,
      east: mapCenter[1] + baseLngRange / 2,
      west: mapCenter[1] - baseLngRange / 2
    }
  }, [mapCenter, mapZoom])

  const mapBounds = calculateMapBounds()

  // Update map center when properties change (but allow user control)
  useEffect(() => {
    if (filteredProperties.length > 0 && mapZoom === 6) { // Only auto-center at initial zoom
      const latitudes = filteredProperties.map(p => p.latitude!).filter(Boolean)
      const longitudes = filteredProperties.map(p => p.longitude!).filter(Boolean)
      
      if (latitudes.length > 0 && longitudes.length > 0) {
        const centerLat = latitudes.reduce((a, b) => a + b, 0) / latitudes.length
        const centerLng = longitudes.reduce((a, b) => a + b, 0) / longitudes.length
        setMapCenter([centerLat, centerLng])
      }
    }
  }, [filteredProperties, mapZoom])

  // Mouse event handlers for map interaction
  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDrawingRadius) return
    
    setDragStart({ x: event.clientX, y: event.clientY })
    event.preventDefault()
  }

  const handleMouseMove = useCallback((event: MouseEvent) => {
    const currentDragStart = dragStartRef.current
    const currentIsDragging = isDraggingRef.current
    const currentMapCenter = mapCenterRef.current
    const currentMapZoom = mapZoomRef.current

    if (!currentDragStart.x && !currentDragStart.y) return

    const deltaX = event.clientX - currentDragStart.x
    const deltaY = event.clientY - currentDragStart.y
    
    // Start dragging only if mouse moved more than 3 pixels (prevents accidental drags)
    if (!currentIsDragging && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
      setIsDragging(true)
    }
    
    if (!currentIsDragging) return
    
    // Calculate map bounds using current values
    let baseLatRange: number
    let baseLngRange: number
    
    if (currentMapZoom <= 5) {
      baseLatRange = 4.0
      baseLngRange = 6.0
    } else if (currentMapZoom <= 10) {
      baseLatRange = 2.0 / (currentMapZoom / 5)
      baseLngRange = 3.0 / (currentMapZoom / 5)
    } else {
      baseLatRange = 1.0 / (currentMapZoom / 8)
      baseLngRange = 1.5 / (currentMapZoom / 8)
    }

    const latRange = baseLatRange
    const lngRange = baseLngRange
    
    // Adjust sensitivity based on zoom level and reasonable speed
    const sensitivity = Math.max(0.2, 0.8 / currentMapZoom) // More precise at higher zoom
    const speedFactor = 1000 // Slower movement for better control
    
    // Natural drag behavior: 
    // - Drag right = map moves right = center moves left (negative lng)
    // - Drag left = map moves left = center moves right (positive lng)  
    // - Drag down = map moves down = center moves up (positive lat)
    // - Drag up = map moves up = center moves down (negative lat)
    const latDelta = (deltaY / speedFactor) * latRange * sensitivity
    const lngDelta = -(deltaX / speedFactor) * lngRange * sensitivity
    
    setMapCenter(prev => [
      Math.max(22, Math.min(32, prev[0] + latDelta)), // Keep within Egypt bounds
      Math.max(24, Math.min(36, prev[1] + lngDelta))
    ])
    
    setDragStart({ x: event.clientX, y: event.clientY })
  }, []) // No dependencies to prevent recreating

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragStart({ x: 0, y: 0 })
  }, [])

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (dragStart.x || dragStart.y) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      if (isDragging) {
        document.body.style.cursor = 'grabbing'
      }
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = 'default'
      }
    }
  }, [dragStart.x, dragStart.y, isDragging, handleMouseMove, handleMouseUp])

  // Wheel event handler for zooming
  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    
    const zoomDelta = event.deltaY > 0 ? -1 : 1
    const newZoom = Math.max(3, Math.min(16, mapZoom + zoomDelta)) // Limit zoom range
    setMapZoom(newZoom)
  }

  // Property type colors and labels
  const propertyTypes = [
    { type: 'apartment', label: 'Apartments', color: '#3B82F6', count: filteredProperties.filter(p => p.property_type === 'apartment').length },
    { type: 'villa', label: 'Villas', color: '#10B981', count: filteredProperties.filter(p => p.property_type === 'villa').length },
    { type: 'penthouse', label: 'Penthouses', color: '#8B5CF6', count: filteredProperties.filter(p => p.property_type === 'penthouse').length },
    { type: 'townhouse', label: 'Townhouses', color: '#F59E0B', count: filteredProperties.filter(p => p.property_type === 'townhouse').length },
  ]

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property)
    onPropertySelect?.(property)
  }

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingRadius || !mapRef.current || isDragging) return

    const rect = mapRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // Convert pixel coordinates to lat/lng using map bounds
    const lngRange = mapBounds.east - mapBounds.west
    const latRange = mapBounds.north - mapBounds.south
    
    const lng = mapBounds.west + (x / rect.width) * lngRange
    const lat = mapBounds.north - (y / rect.height) * latRange
    
    setSearchCenter([lat, lng])
    setIsDrawingRadius(false)
    onLocationSearch?.(lat, lng, searchRadius)
  }

  const toggleTypeFilter = (type: string) => {
    setTypeFilter(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const zoomIn = () => setMapZoom(prev => Math.min(prev + 1, 16))
  const zoomOut = () => setMapZoom(prev => Math.max(prev - 1, 3))
  
  const resetView = () => {
    // Reset to overview of Egypt showing major cities
    setMapCenter([30.0444, 31.2357]) // Cairo center
    setMapZoom(6) // Good overview zoom
    setSearchCenter(null)
    setSelectedProperty(null)
    setMapOffset({ x: 0, y: 0 })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className={`relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Map Container */}
      <div 
        ref={mapRef}
        className={`relative w-full select-none ${
          isDragging ? 'cursor-grabbing' : isDrawingRadius ? 'cursor-crosshair' : 'cursor-grab'
        }`}
        style={{ height }}
        onMouseDown={handleMouseDown}
        onClick={handleMapClick}
        onWheel={handleWheel}
      >
        {/* Map Background */}
        <MapBackground zoom={mapZoom} center={mapCenter} mapBounds={mapBounds} offset={mapOffset} />
        
        {/* Property Markers */}
        {filteredProperties.map(property => (
          <PropertyMarker
            key={property.id}
            property={property}
            isSelected={selectedProperty?.id === property.id}
            onClick={() => handlePropertyClick(property)}
            mapBounds={mapBounds}
          />
        ))}
        
        {/* Search Radius Circle */}
        {searchCenter && (
          <div
            className="absolute border-2 border-blue-500 border-dashed rounded-full bg-blue-500 bg-opacity-10 pointer-events-none"
            style={{
              left: `${((searchCenter[1] - mapBounds.west) / (mapBounds.east - mapBounds.west)) * 100}%`,
              top: `${((mapBounds.north - searchCenter[0]) / (mapBounds.north - mapBounds.south)) * 100}%`,
              width: `${Math.max(20, Math.min(200, (searchRadius * mapZoom) * 2))}px`,
              height: `${Math.max(20, Math.min(200, (searchRadius * mapZoom) * 2))}px`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        )}
        
        {/* Map Controls */}
        <div className="absolute top-4 right-4 space-y-2">
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
            <Move className={`w-4 h-4 ${isDragging ? 'text-blue-600' : ''}`} />
            <span className={isDragging ? 'text-blue-600 font-medium' : ''}>
              {isDragging ? 'Dragging...' : 'Drag to pan • Scroll to zoom'}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Zoom: {mapZoom}x • Center: {mapCenter[0].toFixed(3)}, {mapCenter[1].toFixed(3)}
            {isDragging && <span className="text-blue-600 ml-2">• Moving map</span>}
          </div>
        </div>
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center space-x-4">
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
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-600">{label} ({count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Filters Panel */}
      {showFilters && (
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
          <div>
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
                    <span className="text-sm">{label} ({count})</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Selected Property Details */}
      {selectedProperty && (
        <div className="absolute bottom-4 right-4 w-80 z-30">
          <Card className="overflow-hidden shadow-lg">
            <div className="relative">
              <img
                src={selectedProperty.property_photos?.[0]?.url || "/placeholder.svg"}
                alt={selectedProperty.title}
                className="w-full h-32 object-cover"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 bg-white bg-opacity-80"
                onClick={() => setSelectedProperty(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{selectedProperty.title}</h3>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary">{selectedProperty.property_type}</Badge>
                <span className="font-bold text-lg">{formatPrice(selectedProperty.price)}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                <span>{selectedProperty.bedrooms} beds</span>
                <span>{selectedProperty.bathrooms} baths</span>
                {selectedProperty.square_meters && (
                  <span>{selectedProperty.square_meters.toLocaleString()} sq m</span>
                )}
              </div>
              <div className="text-sm text-gray-600 mb-3">
                📍 {selectedProperty.address}, {selectedProperty.city}
              </div>
              <Button 
                className="w-full" 
                onClick={() => window.open(`/property/${selectedProperty.id}`, '_blank')}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Instructions */}
      {isDrawingRadius && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-4 border border-blue-200 z-40">
          <div className="text-center">
            <Navigation className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900 mb-1">Click on the map</p>
            <p className="text-xs text-gray-600">to search properties in that area</p>
          </div>
        </div>
      )}
    </div>
  )
} 