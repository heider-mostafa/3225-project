'use client'

import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/navigation'

interface LocalBusinessData {
  name: string
  description: string
  address: {
    street: string
    city: string
    region: string
    postalCode: string
    country: string
  }
  geo: {
    latitude: number
    longitude: number
  }
  phone?: string
  email?: string
  openingHours?: string[]
  priceRange?: string
  servedAreas?: string[]
}

interface PropertySEOData {
  id: string
  title: string
  description: string
  price: number
  currency: string
  images: string[]
  location: {
    address: string
    city: string
    region: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  features: {
    bedrooms: number
    bathrooms: number
    area: number
    propertyType: string
    yearBuilt?: number
  }
  amenities?: string[]
  status: string
  datePosted: string
  lastModified?: string
}

interface SearchSEOData {
  searchQuery?: string
  location?: string
  propertyType?: string
  priceRange?: [number, number]
  resultsCount: number
  filters?: Record<string, any>
}

interface EnhancedSEOProps {
  type: 'homepage' | 'property' | 'search' | 'location' | 'localbusiness'
  property?: PropertySEOData
  search?: SearchSEOData
  localBusiness?: LocalBusinessData
  customTitle?: string
  customDescription?: string
  customKeywords?: string[]
  canonicalUrl?: string
  noIndex?: boolean
}

export default function EnhancedSEO({
  type,
  property,
  search,
  localBusiness,
  customTitle,
  customDescription,
  customKeywords = [],
  canonicalUrl,
  noIndex = false
}: EnhancedSEOProps) {
  const router = useRouter()
  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    setCurrentUrl(window.location.href)
  }, [])

  // Generate dynamic titles based on context
  const generateTitle = (): string => {
    if (customTitle) return customTitle

    switch (type) {
      case 'property':
        if (property) {
          const typeText = property.features.propertyType === 'apartment' ? 'Apartment' :
                          property.features.propertyType === 'villa' ? 'Villa' :
                          property.features.propertyType === 'penthouse' ? 'Penthouse' : 'Property'
          return `${property.features.bedrooms}-Bedroom ${typeText} for Sale in ${property.location.city} - $${property.price.toLocaleString()} | OpenBeit`
        }
        break

      case 'search':
        if (search) {
          let title = ''
          if (search.searchQuery) {
            title += `${search.searchQuery} Properties`
          } else {
            title += 'Properties'
          }
          
          if (search.location) {
            title += ` in ${search.location}`
          }
          
          if (search.propertyType) {
            title += ` - ${search.propertyType.charAt(0).toUpperCase() + search.propertyType.slice(1)}s`
          }
          
          if (search.priceRange) {
            title += ` $${search.priceRange[0].toLocaleString()} - $${search.priceRange[1].toLocaleString()}`
          }
          
          title += ` - ${search.resultsCount} Results | OpenBeit`
          return title
        }
        break

      case 'location':
        if (search?.location) {
          return `Real Estate in ${search.location} - Properties, Apartments & Villas | OpenBeit`
        }
        break

      case 'localbusiness':
        if (localBusiness) {
          return `${localBusiness.name} - Real Estate Services in ${localBusiness.address.city} | OpenBeit`
        }
        break

      default:
        return 'OpenBeit - Premium Real Estate Platform in Egypt | Luxury Properties & Virtual Tours'
    }

    return 'OpenBeit - Premium Real Estate Platform in Egypt'
  }

  // Generate dynamic descriptions
  const generateDescription = (): string => {
    if (customDescription) return customDescription

    switch (type) {
      case 'property':
        if (property) {
          let desc = `Discover this ${property.features.bedrooms}-bedroom ${property.features.propertyType} in ${property.location.city}. `
          desc += `${property.features.area} sqm of luxury living space for $${property.price.toLocaleString()}. `
          if (property.amenities && property.amenities.length > 0) {
            desc += `Features include ${property.amenities.slice(0, 3).join(', ')}. `
          }
          desc += `Virtual tour available. Contact OpenBeit for viewing.`
          return desc
        }
        break

      case 'search':
        if (search) {
          let desc = `Find ${search.resultsCount} premium properties`
          if (search.location) desc += ` in ${search.location}`
          if (search.propertyType) desc += ` - ${search.propertyType}s`
          desc += `. Advanced search filters, virtual tours, and expert guidance. `
          if (search.priceRange) {
            desc += `Properties from $${search.priceRange[0].toLocaleString()} to $${search.priceRange[1].toLocaleString()}. `
          }
          desc += `Start your property journey with OpenBeit today.`
          return desc
        }
        break

      case 'location':
        if (search?.location) {
          return `Explore premium real estate opportunities in ${search.location}. Luxury apartments, villas, and penthouses with virtual tours. Expert local market insights and personalized property recommendations.`
        }
        break

      case 'localbusiness':
        if (localBusiness) {
          return `${localBusiness.description} Located in ${localBusiness.address.city}, we serve ${localBusiness.servedAreas?.join(', ') || 'Egypt'} with premium real estate services.`
        }
        break

      default:
        return 'Discover luxury properties in Egypt with OpenBeit. Advanced search, 3D virtual tours, expert guidance, and personalized recommendations. Find your perfect home today.'
    }

    return 'Premium real estate platform in Egypt offering luxury properties with advanced search and virtual tours.'
  }

  // Generate keywords
  const generateKeywords = (): string[] => {
    const baseKeywords = [
      'real estate Egypt',
      'properties Cairo',
      'luxury homes',
      'virtual tours',
      'OpenBeit',
      ...customKeywords
    ]

    if (property) {
      baseKeywords.push(
        `${property.features.propertyType} ${property.location.city}`,
        `${property.features.bedrooms} bedroom ${property.features.propertyType}`,
        `properties for sale ${property.location.city}`,
        `real estate ${property.location.region}`,
        `$${property.price.toLocaleString()} property`
      )
    }

    if (search) {
      if (search.location) {
        baseKeywords.push(
          `real estate ${search.location}`,
          `properties ${search.location}`,
          `homes ${search.location}`
        )
      }
      if (search.propertyType) {
        baseKeywords.push(
          `${search.propertyType} for sale`,
          `${search.propertyType} Egypt`
        )
      }
    }

    return [...new Set(baseKeywords)] // Remove duplicates
  }

  // Generate structured data for rich snippets
  const generateStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
      '@graph': []
    }

    // Website data
    baseData['@graph'].push({
      '@type': 'WebSite',
      '@id': 'https://openbeit.com/#website',
      url: 'https://openbeit.com',
      name: 'OpenBeit',
      description: 'Premium Real Estate Platform in Egypt',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://openbeit.com/properties?search={search_term_string}'
        },
        'query-input': 'required name=search_term_string'
      }
    })

    // Organization data
    baseData['@graph'].push({
      '@type': 'RealEstateAgent',
      '@id': 'https://openbeit.com/#organization',
      name: 'OpenBeit',
      url: 'https://openbeit.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://openbeit.com/logo.png',
        width: 300,
        height: 100
      },
      sameAs: [
        'https://facebook.com/openbeit',
        'https://twitter.com/openbeit',
        'https://linkedin.com/company/openbeit'
      ],
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'EG',
        addressLocality: 'Cairo',
        addressRegion: 'Cairo Governorate'
      },
      areaServed: {
        '@type': 'Country',
        name: 'Egypt'
      },
      knowsAbout: [
        'Real Estate',
        'Property Investment',
        'Luxury Homes',
        'Virtual Tours',
        'Property Valuation'
      ]
    })

    // Property-specific data
    if (type === 'property' && property) {
      baseData['@graph'].push({
        '@type': 'RealEstateListing',
        '@id': `https://openbeit.com/property/${property.id}#listing`,
        name: property.title,
        description: property.description,
        url: `https://openbeit.com/property/${property.id}`,
        image: property.images,
        datePosted: property.datePosted,
        dateModified: property.lastModified || property.datePosted,
        price: {
          '@type': 'PriceSpecification',
          price: property.price,
          priceCurrency: property.currency
        },
        address: {
          '@type': 'PostalAddress',
          streetAddress: property.location.address,
          addressLocality: property.location.city,
          addressRegion: property.location.region,
          addressCountry: 'EG'
        },
        geo: property.location.coordinates ? {
          '@type': 'GeoCoordinates',
          latitude: property.location.coordinates.lat,
          longitude: property.location.coordinates.lng
        } : undefined,
        floorSize: {
          '@type': 'QuantitativeValue',
          value: property.features.area,
          unitCode: 'MTK'
        },
        numberOfRooms: property.features.bedrooms,
        numberOfBathroomsTotal: property.features.bathrooms,
        category: property.features.propertyType,
        yearBuilt: property.features.yearBuilt,
        offers: {
          '@type': 'Offer',
          price: property.price,
          priceCurrency: property.currency,
          availability: property.status === 'available' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          seller: {
            '@id': 'https://openbeit.com/#organization'
          }
        }
      })
    }

    // Local Business data
    if (type === 'localbusiness' && localBusiness) {
      baseData['@graph'].push({
        '@type': 'RealEstateAgent',
        '@id': `https://openbeit.com/#localbusiness`,
        name: localBusiness.name,
        description: localBusiness.description,
        address: {
          '@type': 'PostalAddress',
          streetAddress: localBusiness.address.street,
          addressLocality: localBusiness.address.city,
          addressRegion: localBusiness.address.region,
          postalCode: localBusiness.address.postalCode,
          addressCountry: localBusiness.address.country
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: localBusiness.geo.latitude,
          longitude: localBusiness.geo.longitude
        },
        telephone: localBusiness.phone,
        email: localBusiness.email,
        openingHours: localBusiness.openingHours,
        priceRange: localBusiness.priceRange,
        areaServed: localBusiness.servedAreas?.map(area => ({
          '@type': 'City',
          name: area
        }))
      })
    }

    return baseData
  }

  const title = generateTitle()
  const description = generateDescription()
  const keywords = generateKeywords()
  const structuredData = generateStructuredData()

  return (
    <Head>
      {/* Basic SEO */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl || currentUrl} />
      
      {/* Robots directives */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content={type === 'property' ? 'product' : 'website'} />
      <meta property="og:site_name" content="OpenBeit" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:locale:alternate" content="ar_EG" />
      
      {property && property.images.length > 0 && (
        <>
          <meta property="og:image" content={property.images[0]} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content={property.title} />
        </>
      )}
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:site" content="@openbeit" />
      
      {property && property.images.length > 0 && (
        <meta name="twitter:image" content={property.images[0]} />
      )}
      
      {/* Additional meta tags for real estate */}
      {property && (
        <>
          <meta name="property:price" content={`${property.currency} ${property.price}`} />
          <meta name="property:bedrooms" content={property.features.bedrooms.toString()} />
          <meta name="property:bathrooms" content={property.features.bathrooms.toString()} />
          <meta name="property:area" content={`${property.features.area} sqm`} />
          <meta name="property:type" content={property.features.propertyType} />
          <meta name="property:location" content={`${property.location.city}, ${property.location.region}`} />
          <meta name="property:status" content={property.status} />
        </>
      )}
      
      {/* Geographic meta tags */}
      {(property?.location.coordinates || localBusiness?.geo) && (
        <>
          <meta name="geo.region" content="EG" />
          <meta name="geo.placename" content={property?.location.city || localBusiness?.address.city} />
          <meta name="geo.position" content={
            property ? `${property.location.coordinates?.lat};${property.location.coordinates?.lng}` :
            `${localBusiness?.geo.latitude};${localBusiness?.geo.longitude}`
          } />
          <meta name="ICBM" content={
            property ? `${property.location.coordinates?.lat}, ${property.location.coordinates?.lng}` :
            `${localBusiness?.geo.latitude}, ${localBusiness?.geo.longitude}`
          } />
        </>
      )}
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      
      {/* Additional SEO optimizations */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="theme-color" content="#3B82F6" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://images.unsplash.com" />
      <link rel="preconnect" href="https://api.mapbox.com" />
      
      {/* DNS prefetch for performance */}
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//connect.facebook.net" />
      <link rel="dns-prefetch" href="//www.googletagmanager.com" />
    </Head>
  )
}