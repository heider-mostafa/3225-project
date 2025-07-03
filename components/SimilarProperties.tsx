'use client'
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { Building2, MapPin, Bed, Bath, Square, Heart, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Property {
  id: string
  title: string
  description?: string
  price: number
  bedrooms: number
  bathrooms: number
  square_meters: number
  address: string
  city: string
  state: string
  neighborhood?: string
  compound?: string
  property_type: string
  status: string
  features?: string[]
  property_photos?: Array<{
    id: string
    url: string
    is_primary: boolean
    order_index: number
  }>
  view_count?: number
}

interface SimilarPropertiesProps {
  currentProperty: Property
  className?: string
}

const SimilarProperties: React.FC<SimilarPropertiesProps> = ({ 
  currentProperty, 
  className = '' 
}) => {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  
  // State for similar properties
  const [areaProperties, setAreaProperties] = useState<Property[]>([])
  const [compoundProperties, setCompoundProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'area' | 'compound'>('area')

  useEffect(() => {
    fetchSimilarProperties()
  }, [currentProperty.id])

  useEffect(() => {
    // Set default tab based on whether property is in a compound
    if (currentProperty.compound && compoundProperties.length > 0) {
      setActiveTab('compound')
    } else {
      setActiveTab('area')
    }
  }, [currentProperty.compound, compoundProperties.length])

  const fetchSimilarProperties = async () => {
    try {
      setLoading(true)
      
      // Fetch properties in the same area
      const areaParams = new URLSearchParams({
        city: currentProperty.city,
        property_type: currentProperty.property_type,
        limit: '8',
        exclude: currentProperty.id,
        min_bedrooms: Math.max(1, currentProperty.bedrooms - 1).toString(),
        max_bedrooms: (currentProperty.bedrooms + 1).toString(),
        min_price: (currentProperty.price * 0.7).toString(),
        max_price: (currentProperty.price * 1.3).toString()
      })

      const areaResponse = await fetch(`/api/properties?${areaParams}`)
      if (areaResponse.ok) {
        const areaData = await areaResponse.json()
        setAreaProperties(areaData.properties || [])
      }

      // If property is in a compound, fetch compound-specific properties
      if (currentProperty.compound) {
        const compoundParams = new URLSearchParams({
          compound: currentProperty.compound,
          limit: '8',
          exclude: currentProperty.id
        })

        const compoundResponse = await fetch(`/api/properties?${compoundParams}`)
        if (compoundResponse.ok) {
          const compoundData = await compoundResponse.json()
          setCompoundProperties(compoundData.properties || [])
        }
      }
    } catch (error) {
      console.error('Error fetching similar properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number): string => {
    const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: price >= 1000000 ? 'compact' : 'standard',
    }).format(price)
  }

  const formatPropertyType = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      apartment: t('properties.apartment'),
      villa: t('properties.villa'),
      house: t('properties.house'),
      studio: t('properties.studio'),
      penthouse: t('properties.penthouse'),
      townhouse: t('properties.townhouse'),
      duplex: t('properties.duplex'),
    }
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1)
  }

  const PropertyCard: React.FC<{ property: Property }> = ({ property }) => (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
      <Link href={`/property/${property.id}`}>
        <div className="relative">
          <img
            src={property.property_photos?.[0]?.url || "/placeholder.svg"}
            alt={property.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-white/90 text-gray-800 text-xs">
              {formatPropertyType(property.property_type)}
            </Badge>
          </div>
          {property.view_count && (
            <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              {property.view_count}
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {property.title}
          </h3>
          
          <div className="flex items-center text-gray-600 mb-3">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="text-sm truncate">{property.address}, {property.city}</span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center">
              <Bed className="h-4 w-4 mr-1" />
              <span>{property.bedrooms}</span>
            </div>
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1" />
              <span>{property.bathrooms}</span>
            </div>
            <div className="flex items-center">
              <Square className="h-4 w-4 mr-1" />
              <span>{property.square_meters} {t('propertyDetails.sqm')}</span>
            </div>
          </div>
          
          {property.features && property.features.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {property.features.slice(0, 2).map((feature, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
              {property.features.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{property.features.length - 2} {t('propertyDetails.more')}
                </Badge>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-gray-800">{formatPrice(property.price)}</span>
            <Button size="sm" className="group-hover:bg-blue-600 group-hover:text-white transition-colors">
              {t('properties.viewDetails')}
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  )

  const renderPropertyGrid = (properties: Property[]) => {
    if (properties.length === 0) {
      return (
        <div className="col-span-full text-center text-gray-500 py-12">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg">{t('properties.noResults')}</p>
        </div>
      )
    }

    // Show 2 rows of 4 properties each (8 total)
    const displayProperties = properties.slice(0, 8)
    
    return (
      <>
        {displayProperties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </>
    )
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Building2 className="w-6 h-6 mr-3 text-blue-600" />
          {t('propertyDetails.similarProperties')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-300 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const hasCompoundProperties = currentProperty.compound && compoundProperties.length > 0
  const hasAreaProperties = areaProperties.length > 0

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Building2 className="w-6 h-6 mr-3 text-blue-600" />
          {t('propertyDetails.similarProperties')}
        </h2>
        
        {/* Tabs for Area vs Compound properties */}
        {hasCompoundProperties && hasAreaProperties && (
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('area')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'area'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {t('propertyDetails.location')}
            </button>
            <button
              onClick={() => setActiveTab('compound')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'compound'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {currentProperty.compound}
            </button>
          </div>
        )}
      </div>

      {/* Property Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {activeTab === 'compound' && hasCompoundProperties
          ? renderPropertyGrid(compoundProperties)
          : renderPropertyGrid(areaProperties)
        }
      </div>

      {/* Show more properties link */}
      {((activeTab === 'compound' && compoundProperties.length > 8) || 
        (activeTab === 'area' && areaProperties.length > 8)) && (
        <div className="text-center mt-6">
          <Link href={`/properties?${activeTab === 'compound' ? `compound=${currentProperty.compound}` : `city=${currentProperty.city}&property_type=${currentProperty.property_type}`}`}>
            <Button variant="outline" size="lg">
              {t('common.viewAll')} {activeTab === 'compound' ? currentProperty.compound : t('propertyDetails.location')} {t('properties.title')}
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

export default SimilarProperties 