/**
 * =============================================================================
 * USER DESTINATIONS API - CRUD OPERATIONS
 * =============================================================================
 * 
 * PURPOSE:
 * Manages user's personal destinations (work, gym, school, etc.) for lifestyle
 * compatibility analysis. Stores places users visit regularly with categories,
 * importance levels, and geographic coordinates.
 *
 * ENDPOINTS:
 * • GET /api/user-destinations - Fetch all destinations for authenticated user
 * • POST /api/user-destinations - Create new destination with address geocoding
 *
 * FEATURES:
 * • User authentication and data isolation via RLS
 * • Automatic coordinate conversion for geographic storage
 * • Category-based organization (work, education, health, etc.)
 * • Importance and frequency tracking for scoring algorithms
 *
 * INTEGRATES WITH:
 * • user_destinations table in Supabase
 * • Google Maps Geocoding API (for address to coordinates conversion)
 * • LifestyleCompatibilityTool component (frontend consumer)
 * • Commute analysis system (uses destinations for calculations)
 *
 * SECURITY:
 * • Requires user authentication
 * • Row Level Security enforced at database level
 * • Input validation for required fields
 *
 * DATA FLOW:
 * User adds destination → Geocode address → Store in database → 
 * Used by commute analysis → Displayed in lifestyle tool
 * =============================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: destinations, error } = await supabase
      .from('user_destinations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching destinations:', error)
      return NextResponse.json({ error: 'Failed to fetch destinations' }, { status: 500 })
    }

    return NextResponse.json({ destinations })
  } catch (error) {
    console.error('Error in GET /api/user-destinations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { label, address, category, coordinates, frequency, importance } = body

    // Validate required fields
    if (!label || !address || !category || !coordinates) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create geography point from coordinates
    const { data: destination, error } = await supabase
      .from('user_destinations')
      .insert({
        user_id: user.id,
        label,
        address,
        category,
        coordinates: `POINT(${coordinates.lng} ${coordinates.lat})`,
        frequency: frequency || 'weekly',
        importance: importance || 3
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating destination:', error)
      return NextResponse.json({ error: 'Failed to create destination' }, { status: 500 })
    }

    return NextResponse.json({ destination })
  } catch (error) {
    console.error('Error in POST /api/user-destinations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 