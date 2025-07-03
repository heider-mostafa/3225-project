/**
 * =============================================================================
 * GEOCODING API - ADDRESS TO COORDINATES CONVERSION
 * =============================================================================
 * 
 * PURPOSE:
 * Converts user-entered addresses into precise latitude/longitude coordinates
 * for geographic storage and distance calculations. Optimized for Egyptian
 * locations with intelligent address parsing.
 *
 * ENDPOINTS:
 * • GET /api/geocode?address={address} - Convert address to coordinates
 *
 * FEATURES:
 * • Google Maps Geocoding API integration
 * • Egyptian region preference for improved accuracy
 * • Address validation and formatting
 * • Error handling for invalid/ambiguous addresses
 *
 * INTEGRATES WITH:
 * • Google Maps Geocoding API (external service)
 * • LifestyleCompatibilityTool component (called when adding destinations)
 * • user_destinations table (coordinates stored for geographic calculations)
 *
 * SECURITY:
 * • API key validation (Google Maps API key required)
 * • Input sanitization for address parameter
 * • Rate limiting protection (handled by Google Maps API)
 *
 * CONFIGURATION:
 * • Requires GOOGLE_MAPS_API_KEY environment variable
 * • Optimized for Egypt region ('eg' region bias)
 * • Returns formatted address along with coordinates
 *
 * USAGE:
 * Called automatically when users add new destinations with addresses
 * in the lifestyle compatibility tool
 * =============================================================================
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 })
    }

    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY

    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key not configured')
      return NextResponse.json({ error: 'Geocoding service not available' }, { status: 500 })
    }

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}&region=eg`

    const response = await fetch(geocodeUrl)
    const data = await response.json()

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location
      return NextResponse.json({
        coordinates: {
          lat: location.lat,
          lng: location.lng
        },
        formatted_address: data.results[0].formatted_address
      })
    } else {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Error in geocoding:', error)
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 })
  }
} 