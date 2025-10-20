import { MetadataRoute } from 'next'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

// Helper function to fetch all properties for sitemap
async function getPropertiesForSitemap() {
  try {
    // Check if environment variables are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('Supabase environment variables not available for sitemap generation')
      return []
    }
    
    const supabase = createServiceSupabaseClient()
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, updated_at, created_at, city, property_type, price, status')
      .order('updated_at', { ascending: false })
      .limit(2000) // Increased limit for better SEO coverage

    if (error) {
      console.error('Error fetching properties for sitemap:', error)
      return []
    }

    return properties || []
  } catch (error) {
    console.error('Error in getPropertiesForSitemap:', error)
    return []
  }
}

// Helper function to get popular search combinations
function getPopularSearchUrls(baseUrl: string) {
  const cities = ['Cairo', 'New Cairo', 'Alexandria', 'Zamalek', 'Maadi', 'Fifth Settlement', 'Heliopolis', 'Sheikh Zayed', 'Giza', 'Mohandessin']
  const propertyTypes = ['apartment', 'villa', 'penthouse', 'townhouse']
  const bedroomCounts = ['1', '2', '3', '4', '5+']
  
  const searchUrls: any[] = []
  
  // City-based searches
  cities.forEach(city => {
    searchUrls.push({
      url: `${baseUrl}/properties?city=${encodeURIComponent(city)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })
  })
  
  // Property type searches
  propertyTypes.forEach(type => {
    searchUrls.push({
      url: `${baseUrl}/properties?propertyType=${type}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })
  })
  
  // City + Property type combinations (most popular)
  const popularCombinations = [
    { city: 'New Cairo', type: 'villa' },
    { city: 'Zamalek', type: 'apartment' },
    { city: 'Maadi', type: 'villa' },
    { city: 'Heliopolis', type: 'apartment' },
    { city: 'Fifth Settlement', type: 'penthouse' },
    { city: 'Sheikh Zayed', type: 'villa' },
    { city: 'Alexandria', type: 'apartment' },
  ]
  
  popularCombinations.forEach(combo => {
    searchUrls.push({
      url: `${baseUrl}/properties?city=${encodeURIComponent(combo.city)}&propertyType=${combo.type}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })
  })
  
  // Price range searches
  const priceRanges = [
    { min: 100000, max: 300000, label: 'budget' },
    { min: 300000, max: 600000, label: 'mid-range' },
    { min: 600000, max: 1000000, label: 'luxury' },
    { min: 1000000, max: 5000000, label: 'premium' },
  ]
  
  priceRanges.forEach(range => {
    searchUrls.push({
      url: `${baseUrl}/properties?minPrice=${range.min}&maxPrice=${range.max}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })
  })
  
  return searchUrls
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://openbeit.com'
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/properties`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/auctions`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/virtual-tours`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/coming-soon`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    },
  ]

  // Fetch dynamic property pages
  const properties = await getPropertiesForSitemap()
  const propertyPages = properties.map(property => ({
    url: `${baseUrl}/property/${property.id}`,
    lastModified: new Date(property.updated_at || property.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Enhanced search URLs for better SEO
  const searchPages = getPopularSearchUrls(baseUrl)
  
  // Category pages
  const categoryPages = [
    {
      url: `${baseUrl}/appraisers`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/rentals`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/market-intelligence`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
  ]

  // Sort by priority for better SEO
  const allPages = [
    ...staticPages,
    ...propertyPages,
    ...searchPages,
    ...categoryPages,
  ].sort((a, b) => (b.priority || 0) - (a.priority || 0))
  
  console.log(`Generated sitemap with ${allPages.length} URLs`)
  
  return allPages
}