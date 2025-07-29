'use client'

interface StructuredDataProps {
  type: 'organization' | 'property' | 'website'
  data?: any
}

export function StructuredData({ type, data }: StructuredDataProps) {
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
        return {
          '@context': 'https://schema.org',
          '@type': 'RealEstateListing',
          name: data?.title || 'Property Listing',
          description: data?.description,
          url: `https://openbeit.com/property/${data?.id}`,
          image: data?.images?.[0],
          datePosted: data?.created_at,
          validThrough: data?.valid_until,
          price: {
            '@type': 'PriceSpecification',
            price: data?.price,
            priceCurrency: 'EGP'
          },
          address: {
            '@type': 'PostalAddress',
            streetAddress: data?.address,
            addressLocality: data?.city,
            addressRegion: data?.region,
            addressCountry: 'EG'
          },
          geo: data?.latitude && data?.longitude ? {
            '@type': 'GeoCoordinates',
            latitude: data.latitude,
            longitude: data.longitude
          } : undefined,
          floorSize: {
            '@type': 'QuantitativeValue',
            value: data?.area,
            unitCode: 'MTK'
          },
          numberOfRooms: data?.bedrooms,
          numberOfBathroomsTotal: data?.bathrooms,
          yearBuilt: data?.year_built,
          propertyID: data?.id,
          category: data?.property_type,
          offers: {
            '@type': 'Offer',
            price: data?.price,
            priceCurrency: 'EGP',
            availability: 'https://schema.org/InStock',
            seller: {
              '@type': 'RealEstateAgent',
              name: 'OpenBeit'
            }
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