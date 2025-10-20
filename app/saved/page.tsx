'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/config'
import { PropertyCard } from '@/components/property-card'
import { Loader2 } from 'lucide-react'

export default function SavedPage() {
  const { t } = useTranslation()
  const [user, setUser] = useState(null)
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadSavedProperties()
  }, [])

  const loadSavedProperties = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
      
      if (!currentUser) {
        setLoading(false)
        return
      }

      // Get saved properties
      const { data: savedProperties, error: savedError } = await supabase
        .from('saved_properties')
        .select(`
          property_id,
          created_at,
          properties (
            id,
            title,
            description,
            price,
            bedrooms,
            bathrooms,
            square_meters,
            address,
            city,
            state,
            zip_code,
            property_type,
            status,
            created_at,
            updated_at,
            property_photos (
              id,
              url,
              is_primary,
              order_index
            )
          )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        
      if (savedError) {
        console.error('Error fetching saved properties:', savedError)
        setError(savedError.message)
      } else {
        const flattenedProperties = (savedProperties?.map(sp => sp.properties) || []).flat()
        setProperties(flattenedProperties)
      }
    } catch (err) {
      console.error('Error loading saved properties:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">{t('common.loading')}</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        {t('saved.pleaseSignIn')} <a href="/auth" className="text-blue-600 underline">{t('auth.signIn')}</a> {t('saved.toViewSavedProperties')}.
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">{t('saved.savedProperties')}</h1>
        <p className="text-red-500">{t('saved.failedToLoad')}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">{t('saved.savedProperties')}</h1>
      
      {properties.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">{t('saved.noSavedProperties')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={{
                ...property,
                property_photos: property.property_photos?.map(photo => ({
                  ...photo,
                  property_id: property.id,
                  category: 'exterior',
                  created_at: new Date().toISOString()
                })) || []
              }}
              initialSaved={true}
            />
          ))}
        </div>
      )}
    </div>
  )
} 