import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET /api/properties/view-stats - Get view count statistics for troubleshooting
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get all properties with their view counts
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, title, view_count, created_at')
      .order('view_count', { ascending: false })

    if (error) {
      console.error('Error fetching view stats:', error)
      return NextResponse.json({ error: 'Failed to fetch view stats' }, { status: 500 })
    }

    // Get total view count from property_views table
    const { count: totalViews } = await supabase
      .from('property_views')
      .select('*', { count: 'exact', head: true })

    // Calculate statistics
    const stats = {
      totalProperties: properties?.length || 0,
      totalViewsFromTable: totalViews || 0,
      totalViewsFromCount: properties?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0,
      propertiesWithViews: properties?.filter(p => (p.view_count || 0) > 0).length || 0,
      averageViews: properties?.length ? 
        (properties.reduce((sum, p) => sum + (p.view_count || 0), 0) / properties.length).toFixed(2) : 0,
      maxViews: Math.max(...(properties?.map(p => p.view_count || 0) || [0])),
      minViews: Math.min(...(properties?.map(p => p.view_count || 0) || [0]))
    }

    // Get top 10 most viewed properties
    const topProperties = properties?.slice(0, 10).map(p => ({
      id: p.id,
      title: p.title,
      view_count: p.view_count || 0,
      created_at: p.created_at
    })) || []

    // Get properties with no views
    const noViewsProperties = properties?.filter(p => (p.view_count || 0) === 0).map(p => ({
      id: p.id,
      title: p.title,
      created_at: p.created_at
    })) || []

    return NextResponse.json({
      success: true,
      stats,
      topProperties,
      noViewsProperties: noViewsProperties.slice(0, 10), // Limit to 10
      sampleProperties: properties?.slice(0, 5).map(p => ({
        id: p.id,
        title: p.title,
        view_count: p.view_count
      })) || []
    })

  } catch (error) {
    console.error('Error generating view stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 