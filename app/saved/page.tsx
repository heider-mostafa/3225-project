import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PropertyCard } from '@/components/property-card'

export default async function SavedPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div className="p-8 text-center">Please <a href="/auth" className="text-blue-600 underline">sign in</a> to view your saved properties.</div>
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
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    
  if (savedError) {
    console.error('Error fetching saved properties:', savedError)
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Saved Properties</h1>
        <p className="text-red-500">Failed to load saved properties. Please try again later.</p>
      </div>
    )
  }

  const properties = (savedProperties?.map(sp => sp.properties) || []).flat()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Saved Properties</h1>
      
      {properties.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">You haven't saved any properties yet.</p>
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