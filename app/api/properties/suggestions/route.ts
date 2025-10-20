import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase() || ''
    
    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const supabase = await createServerSupabaseClient()
    
    // Get property suggestions (titles, addresses, cities)
    const { data: properties } = await supabase
      .from('properties')
      .select('id, title, address, city, property_type')
      .or(`title.ilike.%${query}%,address.ilike.%${query}%,city.ilike.%${query}%`)
      .eq('status', 'available')
      .limit(5)

    // Get popular cities that match
    const { data: cities } = await supabase
      .from('properties')
      .select('city')
      .ilike('city', `%${query}%`)
      .eq('status', 'available')
      .limit(5)

    // Get recent search queries (if user is logged in)
    const { data: { user } } = await supabase.auth.getUser()
    let recentSearches: any[] = []
    
    if (user) {
      const { data: searches } = await supabase
        .from('search_history')
        .select('search_query')
        .eq('user_id', user.id)
        .ilike('search_query', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(3)
      
      recentSearches = searches || []
    }

    // Format suggestions
    const suggestions = [
      // Recent searches
      ...recentSearches.map(search => ({
        type: 'recent',
        text: search.search_query,
        icon: '🕒',
        label: 'Recent search'
      })),
      
      // Property matches
      ...properties?.map(property => ({
        type: 'property',
        text: property.title,
        subtitle: `${property.address}, ${property.city}`,
        icon: property.property_type === 'villa' ? '🏘️' : 
              property.property_type === 'apartment' ? '🏢' : '🏠',
        label: property.property_type,
        id: property.id
      })) || [],
      
      // City matches
      ...cities?.map(city => ({
        type: 'location',
        text: city.city,
        icon: '📍',
        label: 'City'
      })) || []
    ]

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.text === suggestion.text && s.type === suggestion.type)
      )
      .slice(0, 8)

    return NextResponse.json({ 
      suggestions: uniqueSuggestions,
      total: uniqueSuggestions.length
    })

  } catch (error) {
    console.error('Search suggestions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    )
  }
}