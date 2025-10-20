'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/config'

interface StructuredDataProps {
  type: 'organization' | 'property' | 'website'
  data?: any
  propertyId?: string
}

export function StructuredData({ type, data, propertyId }: StructuredDataProps) {
  const [propertyData, setPropertyData] = useState(null)

  // Fetch property data if propertyId is provided and type is 'property'
  useEffect(() => {
    if (type === 'property' && propertyId && !data) {
      const fetchPropertyData = async () => {
        try {
          const { data: property, error } = await supabase
            .from('properties')
            .select(`
              *,
              property_photos (
                url,
                is_primary
              ),
              property_appraisals (
                market_value_estimate,
                appraisal_date
              )
            `)
            .eq('id', propertyId)
            .single()

          if (!error && property) {
            setPropertyData(property)
          }
        } catch (error) {
          console.error('Error fetching property data for structured data:', error)
        }
      }

      fetchPropertyData()
    }
  }, [type, propertyId, data])

  // Use provided data or fetched propertyData
  const currentData = data || propertyData
  const getStructuredData = () => {
    switch (type) {
      case 'organization':
        return {
          '@context': 'https://schema.org',
          '@type': 'RealEstateAgent',
          name: 'OpenBeit',
          description: 'Premium Real Estate Platform in Egypt',
          url: 'https://openbeit.com',
          logo: 'https://openbeit.com/logo.png',
          sameAs: [
            'https://facebook.com/openbeit',
            'https://twitter.com/openbeit',
            'https://linkedin.com/company/openbeit'
          ],
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'EG',
            addressLocality: 'Cairo',
          },
          serviceArea: {
            '@type': 'Country',
            name: 'Egypt'
          }
        }

      case 'property':
        if (!currentData) return null
        
        const primaryImage = currentData.property_photos?.find((photo: any) => photo.is_primary)?.url || 
                            currentData.property_photos?.[0]?.url ||
                            currentData.images?.[0] ||
                            '/placeholder-property.jpg'
        
        return {
          '@context': 'https://schema.org',
          '@type': 'RealEstateListing',
          name: currentData.title || 'Property Listing',
          description: currentData.description,
          url: `https://openbeit.com/property/${currentData.id}`,
          image: [primaryImage],
          datePosted: currentData.created_at,
          validThrough: currentData.valid_until,
          price: {
            '@type': 'PriceSpecification',
            price: currentData.price,
            priceCurrency: 'USD'
          },
          address: {
            '@type': 'PostalAddress',
            streetAddress: currentData.address,
            addressLocality: currentData.city || currentData.neighborhood,
            addressRegion: currentData.region || currentData.state,
            addressCountry: 'EG'
          },
          geo: currentData.latitude && currentData.longitude ? {
            '@type': 'GeoCoordinates',
            latitude: currentData.latitude,
            longitude: currentData.longitude
          } : undefined,
          floorSize: {
            '@type': 'QuantitativeValue',
            value: currentData.square_meters || currentData.area,
            unitCode: 'MTK'
          },
          numberOfRooms: currentData.bedrooms,
          numberOfBathroomsTotal: currentData.bathrooms,
          yearBuilt: currentData.year_built,
          propertyID: currentData.id,
          category: currentData.property_type,
          amenityFeature: currentData.features ? currentData.features.map((feature: string) => ({
            '@type': 'LocationFeatureSpecification',
            name: feature
          })) : undefined,
          additionalProperty: [
            ...(currentData.amenities ? currentData.amenities.map((amenity: string) => ({
              '@type': 'PropertyValue',
              name: 'amenity',
              value: amenity
            })) : []),
            ...(currentData.property_type ? [{
              '@type': 'PropertyValue',
              name: 'propertyType',
              value: currentData.property_type
            }] : []),
            ...(currentData.status ? [{
              '@type': 'PropertyValue',
              name: 'listingStatus',
              value: currentData.status
            }] : [])
          ],
          offers: {
            '@type': 'Offer',
            price: currentData.price,
            priceCurrency: 'USD',
            availability: currentData.status === 'Available' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            priceValidUntil: currentData.valid_until,
            seller: {
              '@type': 'RealEstateAgent',
              name: 'OpenBeit',
              url: 'https://openbeit.com'
            }
          },
          potentialAction: {
            '@type': 'ViewAction',
            target: `https://openbeit.com/property/${currentData.id}`,
            name: 'View Property Details'
          }
        }

      case 'website':
        return {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'OpenBeit - Premium Real Estate Platform',
          url: 'https://openbeit.com',
          description: 'Discover luxury properties, apartments, and villas in Egypt with OpenBeit.',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: 'https://openbeit.com/properties?search={search_term_string}'
            },
            'query-input': 'required name=search_term_string'
          },
          publisher: {
            '@type': 'RealEstateAgent',
            name: 'OpenBeit',
            logo: 'https://openbeit.com/logo.png'
          }
        }

      default:
        return null
    }
  }

  const structuredData = getStructuredData()
  
  if (!structuredData) return null

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData)
      }}
    />
  )
}