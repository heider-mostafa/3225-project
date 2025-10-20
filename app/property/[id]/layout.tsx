import { Metadata } from 'next'
import { supabase } from '@/lib/supabase/config'
import { notFound } from 'next/navigation'
import { StructuredData } from '@/components/structured-data'

// Helper function to fetch property data for metadata
async function getPropertyForMetadata(id: string) {
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
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching property for metadata:', error)
      return null
    }

    return property
  } catch (error) {
    console.error('Error in getPropertyForMetadata:', error)
    return null
  }
}

// Generate metadata for individual property pages
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const property = await getPropertyForMetadata(params.id)
  
  if (!property) {
    return {
      title: 'Property Not Found | OpenBeit',
      description: 'The property you are looking for could not be found.',
    }
  }

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Get primary image
  const primaryImage = property.property_photos?.find((photo: any) => photo.is_primary)?.url || 
                      property.property_photos?.[0]?.url || 
                      '/placeholder-property.jpg'

  // Create SEO-optimized title
  const title = `${property.title} - ${formatPrice(property.price)} | ${property.city || 'Egypt'} | OpenBeit`
  
  // Create SEO-optimized description
  const bedrooms = property.bedrooms ? `${property.bedrooms} bed` : ''
  const bathrooms = property.bathrooms ? `${property.bathrooms} bath` : ''
  const area = property.square_meters ? `${property.square_meters} sqm` : ''
  const specs = [bedrooms, bathrooms, area].filter(Boolean).join(', ')
  
  const description = `${specs ? `${specs} ` : ''}${property.property_type || 'Property'} for ${property.status?.toLowerCase() || 'sale'} in ${property.city || property.neighborhood || 'Egypt'}. ${property.description ? property.description.substring(0, 120) + '...' : 'Premium real estate with virtual tours and professional appraisal services.'}`

  // Enhanced keywords for local SEO (English + Arabic)
  const locationKeywords = [
    property.city,
    property.neighborhood,
    property.compound,
    'Egypt',
    'Cairo',
    'real estate'
  ].filter(Boolean)

  const propertyKeywords = [
    property.property_type,
    property.status,
    'property',
    'real estate',
    'virtual tour',
    'for sale',
    'for rent'
  ].filter(Boolean)

  // Add Arabic keywords for Egyptian market
  const arabicKeywords = [
    'عقار',
    'عقارات',
    property.city === 'Cairo' ? 'القاهرة' : '',
    property.city === 'Alexandria' ? 'الإسكندرية' : '',
    property.neighborhood === 'Zamalek' ? 'الزمالك' : '',
    property.neighborhood === 'Maadi' ? 'المعادي' : '',
    property.property_type === 'Villa' ? 'فيلا' : '',
    property.property_type === 'Apartment' ? 'شقة' : '',
    property.property_type === 'Penthouse' ? 'بنتهاوس' : '',
    property.status === 'For Sale' ? 'للبيع' : '',
    property.status === 'For Rent' ? 'للإيجار' : '',
    'مصر'
  ].filter(Boolean)

  const keywords = [...locationKeywords, ...propertyKeywords, ...arabicKeywords].join(', ')

  return {
    title,
    description,
    keywords,
    openGraph: {
      title: property.title,
      description,
      type: 'article',
      url: `https://openbeit.com/property/${params.id}`,
      images: [
        {
          url: primaryImage,
          width: 1200,
          height: 630,
          alt: property.title,
        }
      ],
      locale: 'en_US',
      siteName: 'OpenBeit',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@openbeit',
      title: property.title,
      description,
      images: [primaryImage],
    },
    alternates: {
      canonical: `https://openbeit.com/property/${params.id}`,
      languages: {
        'en': `https://openbeit.com/property/${params.id}`,
        'ar': `https://openbeit.com/ar/property/${params.id}`,
      },
    },
    other: {
      'property:price': formatPrice(property.price),
      'property:currency': 'USD',
      'property:bedrooms': property.bedrooms?.toString() || '',
      'property:bathrooms': property.bathrooms?.toString() || '',
      'property:area': property.square_meters?.toString() || '',
      'property:type': property.property_type || '',
      'property:status': property.status || '',
      'property:location': `${property.city || ''}, ${property.neighborhood || ''}`.replace(/^,\s*|,\s*$/g, ''),
    }
  }
}

export default function PropertyLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  return (
    <>
      <StructuredData type="property" propertyId={params.id} />
      {children}
    </>
  )
}