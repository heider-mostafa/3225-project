import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/config'

export async function GET(request: NextRequest) {
  try {
    console.log('Auctions API called')
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    console.log('Query params:', { status, page, limit, offset })

    // Try to get real data from database first
    let query = supabase
      .from('auction_properties')
      .select(`
        *,
        properties (
          id,
          title,
          description,
          address,
          city,
          state,
          bedrooms,
          bathrooms,
          square_meters,
          property_type,
          amenities,
          price,
          property_photos (
            id,
            url,
            is_primary
          )
        )
      `)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    // Filter by status if specified
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: auctions, error, count } = await query

    console.log('Database query result:', { 
      error: error ? error.message : null, 
      dataLength: auctions ? auctions.length : 0,
      count,
      firstItem: auctions && auctions.length > 0 ? auctions[0] : null
    })

    if (error) {
      console.error('Database error:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json({ 
        error: 'Database error', 
        details: error.message,
        code: error.code 
      }, { status: 500 })
    }

    // Always return database data, even if empty
    const totalPages = Math.ceil((count || 0) / limit)
    const pagination = {
      page,
      limit,
      total: count || 0,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }

    console.log('Returning database auctions:', auctions?.length || 0)
    
    return NextResponse.json({
      auctions: auctions || [],
      pagination
    })

  } catch (error) {
    console.error('Error in auctions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      property_id,
      auction_type = 'live',
      start_time,
      end_time,
      preview_start,
      reserve_price,
      buy_now_price,
      commission_rate = 0.05
    } = body

    // Validate required fields
    if (!property_id || !start_time || !end_time || !preview_start || !reserve_price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate property exists
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, title, status')
      .eq('id', property_id)
      .single()

    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Check if property already has an active auction
    const { data: existingAuction } = await supabase
      .from('auction_properties')
      .select('id')
      .eq('property_id', property_id)
      .in('status', ['preview', 'live'])
      .single()

    if (existingAuction) {
      return NextResponse.json(
        { error: 'Property already has an active auction' },
        { status: 409 }
      )
    }

    // Create auction
    const { data: auction, error } = await supabase
      .from('auction_properties')
      .insert({
        property_id,
        auction_type,
        start_time,
        end_time,
        preview_start,
        reserve_price,
        buy_now_price,
        commission_rate,
        status: 'preview'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating auction:', error)
      return NextResponse.json({ error: 'Failed to create auction' }, { status: 500 })
    }

    // Log auction creation event
    await supabase
      .from('auction_events')
      .insert({
        auction_property_id: auction.id,
        event_type: 'auction_created',
        event_data: {
          property_id,
          reserve_price,
          buy_now_price,
          start_time,
          end_time
        }
      })

    return NextResponse.json({ auction }, { status: 201 })
  } catch (error) {
    console.error('Error in auction creation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}