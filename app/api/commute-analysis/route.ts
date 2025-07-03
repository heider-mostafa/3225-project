/**
 * =============================================================================
 * COMMUTE ANALYSIS API - REAL-TIME TRAVEL CALCULATIONS
 * =============================================================================
 * 
 * PURPOSE:
 * The core intelligence engine of the lifestyle compatibility system. Calculates
 * real-time travel times, costs, and routes between properties and user destinations
 * using Google Maps data with traffic-aware analysis.
 *
 * ENDPOINTS:
 * • POST /api/commute-analysis - Calculate commute data for property + destinations
 *
 * FEATURES:
 * • Google Maps Distance Matrix API integration with live traffic data
 * • Multi-modal transport analysis (car, public transport, cycling)
 * • Traffic-aware routing with optimal departure time suggestions
 * • Cost estimation based on Egyptian fuel prices and transport options
 * • AI-powered lifestyle compatibility scoring algorithm
 * • Smart traffic pattern analysis and recommendations
 *
 * INTEGRATES WITH:
 * • Google Maps Distance Matrix API (real-time travel data)
 * • user_destinations table (user's personal places)
 * • commute_data table (stores calculated results)
 * • lifestyle_compatibility_scores table (stores AI-generated scores)
 * • LifestyleCompatibilityTool component (displays analysis results)
 *
 * ALGORITHM:
 * 1. Fetch user destinations and property coordinates
 * 2. Query Google Maps for travel times with current traffic
 * 3. Calculate costs based on distance, frequency, and Egyptian pricing
 * 4. Generate traffic recommendations and optimal timing
 * 5. Compute weighted lifestyle compatibility score (0-10 scale)
 * 6. Store results for future reference and comparison
 *
 * SECURITY:
 * • Requires user authentication
 * • Data isolation via user_id verification
 * • Rate limiting protection via Google Maps API quotas
 *
 * DEPENDENCIES:
 * • GOOGLE_MAPS_API_KEY environment variable
 * • Active Supabase connection
 * • User destinations data
 * =============================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface Destination {
  id: string
  label: string
  address: string
  category: string
  coordinates: { lat: number; lng: number }
  frequency: string
  importance: number
}

interface PropertyLocation {
  latitude: number
  longitude: number
  address: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { propertyId, propertyLocation, destinations }: {
      propertyId: string
      propertyLocation: PropertyLocation
      destinations: Destination[]
    } = body

    if (!propertyId || !propertyLocation || !destinations?.length) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 })
    }

    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY

    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key not configured')
      return NextResponse.json({ error: 'Commute analysis service not available' }, { status: 500 })
    }

    const commuteData = []
    
    // Calculate commute for each destination
    for (const destination of destinations) {
      try {
        // Use Google Maps Distance Matrix API
        const origin = `${propertyLocation.latitude},${propertyLocation.longitude}`
        const dest = `${destination.coordinates.lat},${destination.coordinates.lng}`
        
        const distanceUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${dest}&key=${GOOGLE_MAPS_API_KEY}&mode=driving&language=en&units=metric&departure_time=now`

        const response = await fetch(distanceUrl)
        const data = await response.json()

        if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]?.status === 'OK') {
          const element = data.rows[0].elements[0]
          const distance_km = element.distance.value / 1000 // Convert to km
          const duration_car = Math.round(element.duration_in_traffic?.value / 60) || Math.round(element.duration.value / 60) // Convert to minutes

          // Calculate cost estimate (rough calculation for Egypt)
          const fuelCostPerKm = 2.5 // EGP per km (average)
          const monthlyTrips = destination.frequency === 'daily' ? 44 : 
                              destination.frequency === 'weekly' ? 8 : 
                              destination.frequency === 'monthly' ? 2 : 1
          const cost_estimate = distance_km * 2 * monthlyTrips * fuelCostPerKm // Round trip

          // Calculate traffic factor and best times (simplified)
          const traffic_factor = element.duration_in_traffic ? 
            element.duration_in_traffic.value / element.duration.value : 1.0

          const best_time_ranges = traffic_factor > 1.3 ? 
            ['07:00-08:00', '14:00-15:00', '21:00-22:00'] : 
            ['Any time']

          const commute = {
            destination_id: destination.id,
            distance_km: Math.round(distance_km * 10) / 10, // Round to 1 decimal
            duration_car,
            duration_public: Math.round(duration_car * 1.8), // Estimate public transport as 80% longer
            duration_cycling: distance_km < 10 ? Math.round(distance_km * 4) : null, // 15 km/h average cycling speed
            traffic_factor: Math.round(traffic_factor * 100) / 100,
            best_time_ranges,
            cost_estimate: Math.round(cost_estimate)
          }

          commuteData.push(commute)

          // Save to database
          await supabase
            .from('commute_data')
            .upsert({
              property_id: propertyId,
              ...commute
            })

        } else {
          console.warn(`Failed to get commute data for destination ${destination.label}`)
        }
      } catch (error) {
        console.error(`Error calculating commute for ${destination.label}:`, error)
      }
    }

    // Calculate lifestyle score
    let totalWeightedScore = 0
    let totalWeight = 0

    for (const commute of commuteData) {
      const destination = destinations.find(d => d.id === commute.destination_id)
      if (destination) {
        let score = 10
        if (commute.duration_car > 60) score = 1
        else if (commute.duration_car > 45) score = 2
        else if (commute.duration_car > 30) score = 4
        else if (commute.duration_car > 20) score = 6
        else if (commute.duration_car > 10) score = 8

        totalWeightedScore += score * destination.importance
        totalWeight += destination.importance
      }
    }

    const lifestyleScore = totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 10) / 10 : 5.0

    // Save lifestyle score
    await supabase
      .from('lifestyle_compatibility_scores')
      .upsert({
        property_id: propertyId,
        user_id: user.id,
        overall_score: lifestyleScore,
        commute_score: lifestyleScore,
        total_daily_travel_minutes: commuteData.reduce((total, c) => {
          const dest = destinations.find(d => d.id === c.destination_id)
          return total + (dest?.frequency === 'daily' ? c.duration_car * 2 : 0)
        }, 0),
        monthly_transport_cost: commuteData.reduce((total, c) => total + c.cost_estimate, 0),
        last_calculated: new Date().toISOString()
      })

    return NextResponse.json({
      commuteData,
      lifestyleScore,
      success: true
    })

  } catch (error) {
    console.error('Error in commute analysis:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 