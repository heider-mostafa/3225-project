'use client'

import { useEffect, useState } from 'react'
import EnhancedSEO from './EnhancedSEO'

interface LocationData {
  city: string
  region: string
  coordinates?: {
    lat: number
    lng: number
  }
  popularAreas?: string[]
  averagePrice?: number
  propertyCount?: number
  marketTrends?: {
    trend: 'up' | 'down' | 'stable'
    percentage: number
  }
}

interface LocalBusinessSEOProps {
  location: LocationData
  propertyTypes?: string[]
  recentSales?: number
  expertAgents?: number
}

export default function LocalBusinessSEO({ 
  location, 
  propertyTypes = [],
  recentSales = 0,
  expertAgents = 0
}: LocalBusinessSEOProps) {
  const [businessData, setBusinessData] = useState<any>(null)

  useEffect(() => {
    const generateLocalBusinessData = () => {
      // Main business locations in Egypt
      const businessLocations = {
        'Cairo': {
          address: {
            street: 'Tahrir Square',
            city: 'Cairo',
            region: 'Cairo Governorate',
            postalCode: '11511',
            country: 'EG'
          },
          geo: { latitude: 30.0444, longitude: 31.2357 },
          servedAreas: ['Downtown Cairo', 'Zamalek', 'Maadi', 'Heliopolis', 'New Cairo'],
          phone: '+20-2-1234-5678'
        },
        'Alexandria': {
          address: {
            street: 'Corniche Road',
            city: 'Alexandria', 
            region: 'Alexandria Governorate',
            postalCode: '21526',
            country: 'EG'
          },
          geo: { latitude: 31.2001, longitude: 29.9187 },
          servedAreas: ['Sidi Bishr', 'Stanley', 'Miami', 'Montaza', 'Downtown Alexandria'],
          phone: '+20-3-1234-5678'
        },
        'New Cairo': {
          address: {
            street: 'First Settlement',
            city: 'New Cairo',
            region: 'Cairo Governorate', 
            postalCode: '11835',
            country: 'EG'
          },
          geo: { latitude: 30.0330, longitude: 31.4913 },
          servedAreas: ['First Settlement', 'Fifth Settlement', 'New Cairo City', 'Madinaty', 'Rehab City'],
          phone: '+20-2-1234-5679'
        }
      }

      const businessInfo = businessLocations[location.city as keyof typeof businessLocations] || 
                          businessLocations['Cairo']

      // Generate dynamic description
      let description = `OpenBeit Real Estate Services in ${location.city}. `
      
      if (location.propertyCount) {
        description += `Currently featuring ${location.propertyCount} premium properties. `
      }
      
      if (propertyTypes.length > 0) {
        description += `Specializing in ${propertyTypes.join(', ')}. `
      }
      
      if (location.averagePrice) {
        description += `Average property price: $${location.averagePrice.toLocaleString()}. `
      }
      
      if (location.marketTrends) {
        const trendText = location.marketTrends.trend === 'up' ? 'rising' : 
                         location.marketTrends.trend === 'down' ? 'declining' : 'stable'
        description += `Market trend: ${trendText} by ${location.marketTrends.percentage}%. `
      }
      
      if (recentSales > 0) {
        description += `${recentSales} recent successful sales. `
      }
      
      if (expertAgents > 0) {
        description += `${expertAgents} expert local agents ready to assist. `
      }
      
      description += `Virtual tours, market analysis, and personalized property recommendations available.`

      // Generate title
      const title = `Real Estate Services in ${location.city} | OpenBeit - Local Property Experts`

      // Generate keywords
      const keywords = [
        `real estate ${location.city}`,
        `properties ${location.city}`,
        `real estate agent ${location.city}`,
        `property services ${location.city}`,
        `homes for sale ${location.city}`,
        `${location.city} real estate market`,
        `property investment ${location.city}`,
        'OpenBeit',
        ...propertyTypes.map(type => `${type} ${location.city}`),
        ...(location.popularAreas || []).map(area => `real estate ${area}`)
      ]

      return {
        type: 'localbusiness' as const,
        customTitle: title,
        customDescription: description,
        customKeywords: keywords,
        canonicalUrl: `https://openbeit.com/locations/${location.city.toLowerCase().replace(/\s+/g, '-')}`,
        localBusiness: {
          name: `OpenBeit Real Estate - ${location.city}`,
          description,
          address: businessInfo.address,
          geo: location.coordinates || businessInfo.geo,
          phone: businessInfo.phone,
          email: `${location.city.toLowerCase().replace(/\s+/g, '')}@openbeit.com`,
          openingHours: [
            'Mo-Th 09:00-18:00',
            'Fr 09:00-17:00', 
            'Sa 10:00-16:00'
          ],
          priceRange: location.averagePrice ? 
            `$${Math.round(location.averagePrice * 0.7).toLocaleString()}-$${Math.round(location.averagePrice * 1.5).toLocaleString()}` : 
            '$100,000-$2,000,000',
          servedAreas: businessInfo.servedAreas.concat(location.popularAreas || [])
        }
      }
    }

    setBusinessData(generateLocalBusinessData())
  }, [location, propertyTypes, recentSales, expertAgents])

  if (!businessData) {
    return null
  }

  return <EnhancedSEO {...businessData} />
}

// Generate FAQ schema for local SEO
export const generateLocalFAQSchema = (location: string) => {
  const faqs = [
    {
      question: `What types of properties are available in ${location}?`,
      answer: `${location} offers a diverse range of properties including luxury apartments, villas, penthouses, and townhouses. OpenBeit features properties across all price ranges with virtual tours and expert guidance.`
    },
    {
      question: `How is the real estate market in ${location}?`,
      answer: `The ${location} real estate market shows strong fundamentals with growing demand for premium properties. Our local experts provide detailed market analysis and investment guidance.`
    },
    {
      question: `What are the best areas to buy property in ${location}?`,
      answer: `Popular areas in ${location} include established neighborhoods with good infrastructure, schools, and amenities. Our local agents can provide detailed area recommendations based on your preferences.`
    },
    {
      question: `Does OpenBeit offer virtual tours for properties in ${location}?`,
      answer: `Yes, OpenBeit provides immersive 3D virtual tours for all properties in ${location}, allowing you to explore homes remotely before scheduling in-person visits.`
    }
  ]

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }
}