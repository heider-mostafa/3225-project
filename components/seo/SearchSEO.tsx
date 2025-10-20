'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import EnhancedSEO from './EnhancedSEO'

interface SearchSEOProps {
  resultsCount: number
  properties?: any[]
}

export default function SearchSEO({ resultsCount, properties = [] }: SearchSEOProps) {
  const searchParams = useSearchParams()
  const [seoData, setSeoData] = useState<any>(null)

  useEffect(() => {
    const generateSearchSEO = () => {
      // Extract search parameters
      const searchQuery = searchParams.get('search_query') || searchParams.get('q')
      const city = searchParams.get('city')
      const propertyType = searchParams.get('propertyType')
      const minPrice = searchParams.get('minPrice')
      const maxPrice = searchParams.get('maxPrice')
      const bedrooms = searchParams.getAll('bedrooms[]')
      const compound = searchParams.get('compound')
      
      // Amenity filters
      const hasPool = searchParams.get('has_pool') === 'true'
      const hasGarden = searchParams.get('has_garden') === 'true'
      const hasParking = searchParams.get('has_parking') === 'true'
      const hasSecurity = searchParams.get('has_security') === 'true'
      const hasGym = searchParams.get('has_gym') === 'true'

      // Build location string
      let location = ''
      if (compound) {
        location = compound.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      } else if (city) {
        location = decodeURIComponent(city)
      }

      // Build amenities array
      const amenities: string[] = []
      if (hasPool) amenities.push('Pool')
      if (hasGarden) amenities.push('Garden') 
      if (hasParking) amenities.push('Parking')
      if (hasSecurity) amenities.push('Security')
      if (hasGym) amenities.push('Gym')

      // Generate dynamic title
      let title = ''
      
      if (searchQuery) {
        title = `${searchQuery} Properties`
      } else {
        const parts: string[] = []
        
        if (bedrooms.length > 0) {
          parts.push(`${bedrooms.join(' & ')}-Bedroom`)
        }
        
        if (propertyType) {
          const typeMap: Record<string, string> = {
            'apartment': 'Apartments',
            'villa': 'Villas', 
            'penthouse': 'Penthouses',
            'townhouse': 'Townhouses',
            'studio': 'Studios'
          }
          parts.push(typeMap[propertyType] || propertyType)
        } else {
          parts.push('Properties')
        }
        
        title = parts.join(' ')
      }
      
      if (location) {
        title += ` in ${location}`
      }
      
      if (minPrice || maxPrice) {
        const priceRange = []
        if (minPrice) priceRange.push(`$${parseInt(minPrice).toLocaleString()}`)
        if (maxPrice) priceRange.push(`$${parseInt(maxPrice).toLocaleString()}`)
        title += ` - ${priceRange.join(' to ')}`
      }
      
      title += ` | ${resultsCount} Results | OpenBeit`

      // Generate dynamic description
      let description = `Discover ${resultsCount} premium `
      
      if (propertyType) {
        const typeMap: Record<string, string> = {
          'apartment': 'apartments',
          'villa': 'villas',
          'penthouse': 'penthouses', 
          'townhouse': 'townhouses',
          'studio': 'studios'
        }
        description += typeMap[propertyType] || 'properties'
      } else {
        description += 'properties'
      }
      
      if (location) {
        description += ` in ${location}`
      }
      
      if (bedrooms.length > 0) {
        description += ` with ${bedrooms.join(' or ')} bedrooms`
      }
      
      if (amenities.length > 0) {
        description += `. Features include ${amenities.slice(0, 3).join(', ')}`
      }
      
      if (minPrice || maxPrice) {
        description += `. Price range: `
        if (minPrice && maxPrice) {
          description += `$${parseInt(minPrice).toLocaleString()} to $${parseInt(maxPrice).toLocaleString()}`
        } else if (minPrice) {
          description += `from $${parseInt(minPrice).toLocaleString()}`
        } else if (maxPrice) {
          description += `up to $${parseInt(maxPrice).toLocaleString()}`
        }
      }
      
      description += '. Virtual tours available. Expert guidance from OpenBeit real estate professionals.'

      // Generate keywords
      const keywords: string[] = [
        'real estate Egypt',
        'properties for sale',
        'OpenBeit'
      ]
      
      if (location) {
        keywords.push(
          `real estate ${location}`,
          `properties ${location}`,
          `homes for sale ${location}`
        )
      }
      
      if (propertyType) {
        keywords.push(
          `${propertyType} for sale`,
          `${propertyType} Egypt`,
          propertyType === 'apartment' ? 'apartments for sale' : `${propertyType}s for sale`
        )
      }
      
      if (bedrooms.length > 0) {
        bedrooms.forEach(bedroom => {
          keywords.push(`${bedroom} bedroom property`)
          if (location) {
            keywords.push(`${bedroom} bedroom ${location}`)
          }
        })
      }
      
      amenities.forEach(amenity => {
        keywords.push(`property with ${amenity.toLowerCase()}`)
      })

      // Build price range for structured data
      let priceRange: [number, number] | undefined
      if (minPrice || maxPrice) {
        priceRange = [
          minPrice ? parseInt(minPrice) : 0,
          maxPrice ? parseInt(maxPrice) : 10000000
        ]
      }

      // Create canonical URL
      const baseUrl = 'https://openbeit.com/properties'
      const params = new URLSearchParams()
      
      if (searchQuery) params.append('search_query', searchQuery)
      if (city) params.append('city', city)
      if (propertyType) params.append('propertyType', propertyType)
      if (minPrice) params.append('minPrice', minPrice)
      if (maxPrice) params.append('maxPrice', maxPrice)
      bedrooms.forEach(bedroom => params.append('bedrooms[]', bedroom))
      if (compound) params.append('compound', compound)
      
      const canonicalUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl

      return {
        type: 'search' as const,
        customTitle: title,
        customDescription: description,
        customKeywords: keywords,
        canonicalUrl,
        search: {
          searchQuery: searchQuery || undefined,
          location,
          propertyType,
          priceRange,
          resultsCount,
          filters: {
            bedrooms,
            amenities,
            compound
          }
        }
      }
    }

    setSeoData(generateSearchSEO())
  }, [searchParams, resultsCount])

  if (!seoData) {
    return null
  }

  return <EnhancedSEO {...seoData} />
}

// Hook for generating breadcrumb navigation
export const useSearchBreadcrumbs = () => {
  const searchParams = useSearchParams()
  
  const generateBreadcrumbs = () => {
    const breadcrumbs = [
      { name: 'Home', href: '/' },
      { name: 'Properties', href: '/properties' }
    ]
    
    const city = searchParams.get('city')
    const compound = searchParams.get('compound')
    const propertyType = searchParams.get('propertyType')
    
    if (compound) {
      const compoundName = compound.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      breadcrumbs.push({
        name: compoundName,
        href: `/properties?compound=${compound}`
      })
    } else if (city) {
      breadcrumbs.push({
        name: decodeURIComponent(city),
        href: `/properties?city=${city}`
      })
    }
    
    if (propertyType) {
      const typeMap: Record<string, string> = {
        'apartment': 'Apartments',
        'villa': 'Villas',
        'penthouse': 'Penthouses',
        'townhouse': 'Townhouses',
        'studio': 'Studios'
      }
      breadcrumbs.push({
        name: typeMap[propertyType] || propertyType,
        href: `/properties?propertyType=${propertyType}`
      })
    }
    
    return breadcrumbs
  }
  
  return generateBreadcrumbs()
}