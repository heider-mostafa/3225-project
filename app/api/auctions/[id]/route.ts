import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('Fetching auction details for ID:', id)

    // Try to get real data from database first
    const { data: auction, error } = await supabase
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
      .eq('id', id)
      .single()

    console.log('Database query result:', { 
      error: error ? error.message : null, 
      auction: auction ? { id: auction.id, property_title: auction.properties?.title } : null
    })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Database error', 
        details: error.message 
      }, { status: 500 })
    }

    if (!auction) {
      console.log('No auction found with ID:', params.id)
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    if (auction) {
      // Get bid history
      const { data: bids } = await supabase
        .from('bids')
        .select('id, amount, bid_time, is_winning, status')
        .eq('auction_property_id', id)
        .order('bid_time', { ascending: false })
        .limit(10)

      // Get auction events
      const { data: events } = await supabase
        .from('auction_events')
        .select('*')
        .eq('auction_property_id', id)
        .order('created_at', { ascending: false })
        .limit(20)

      // Calculate time remaining
      const now = new Date()
      const startTime = new Date(auction.start_time)
      const endTime = new Date(auction.end_time)
      const previewStart = new Date(auction.preview_start)

      let timeRemaining = 0
      let phase: 'preview' | 'live' | 'ended' = 'preview'

      if (now < previewStart) {
        timeRemaining = previewStart.getTime() - now.getTime()
        phase = 'preview'
      } else if (now >= previewStart && now < startTime) {
        timeRemaining = startTime.getTime() - now.getTime()
        phase = 'preview'
      } else if (now >= startTime && now < endTime) {
        timeRemaining = endTime.getTime() - now.getTime()
        phase = 'live'
      } else {
        timeRemaining = 0
        phase = 'ended'
      }

      return NextResponse.json({
        auction: {
          ...auction,
          bids: bids || [],
          events: events || [],
          timeRemaining,
          phase,
          secondsRemaining: Math.max(0, Math.floor(timeRemaining / 1000))
        }
      })
    }

    // Return mock data for development if auction not found in database
    const mockAuctions = {
      '1': {
        id: '1',
        property_id: 'prop_1',
        auction_type: 'live' as const,
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        preview_start: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        reserve_price: 750000,
        buy_now_price: 950000,
        current_bid: 780000,
        bid_count: 15,
        status: 'live' as const,
        commission_rate: 0.05,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        properties: {
          id: 'prop_1',
          title: 'Luxury Downtown Penthouse',
          description: 'Stunning penthouse with panoramic city views, featuring modern amenities and premium finishes throughout.',
          address: '123 Downtown Plaza',
          city: 'New York',
          state: 'NY',
          bedrooms: 3,
          bathrooms: 2,
          square_meters: 200,
          property_type: 'penthouse',
          features: ['City Views', 'Modern Kitchen', 'Hardwood Floors'],
          amenities: ['Gym', 'Pool', 'Concierge'],
          latitude: 40.7589,
          longitude: -73.9851,
          virtual_tour_url: 'https://example.com/tour1',
          property_photos: [
            { id: '1', url: '/placeholder.svg?height=400&width=600', is_primary: true }
          ]
        }
      },
      '2': {
        id: '2',
        property_id: 'prop_2',
        auction_type: 'live' as const,
        start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
        preview_start: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        reserve_price: 1200000,
        buy_now_price: null,
        current_bid: 0,
        bid_count: 0,
        status: 'preview' as const,
        commission_rate: 0.05,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        properties: {
          id: 'prop_2',
          title: 'Modern Family House',
          description: 'Beautiful 4-bedroom family home in prestigious neighborhood with large garden and garage.',
          address: '456 Maple Street',
          city: 'Beverly Hills',
          state: 'CA',
          bedrooms: 4,
          bathrooms: 3,
          square_meters: 350,
          property_type: 'house',
          features: ['Garden', 'Garage', 'Swimming Pool'],
          amenities: ['Security', 'Playground'],
          latitude: 34.0736,
          longitude: -118.4004,
          virtual_tour_url: 'https://example.com/tour2',
          property_photos: [
            { id: '2', url: '/placeholder.svg?height=400&width=600', is_primary: true }
          ]
        }
      },
      '3': {
        id: '3',
        property_id: 'prop_3',
        auction_type: 'live' as const,
        start_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        preview_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        reserve_price: 500000,
        buy_now_price: 650000,
        current_bid: 520000,
        bid_count: 8,
        status: 'live' as const,
        commission_rate: 0.05,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        properties: {
          id: 'prop_3',
          title: 'Cozy Apartment in Historic District',
          description: 'Charming 2-bedroom apartment with original features and modern updates in the heart of the historic district.',
          address: '789 Historic Lane',
          city: 'Boston',
          state: 'MA',
          bedrooms: 2,
          bathrooms: 1,
          square_meters: 120,
          property_type: 'apartment',
          features: ['Historic Features', 'Exposed Brick', 'High Ceilings'],
          amenities: ['Near Transit', 'Shopping'],
          latitude: 42.3601,
          longitude: -71.0589,
          virtual_tour_url: null,
          property_photos: [
            { id: '3', url: '/placeholder.svg?height=400&width=600', is_primary: true }
          ]
        }
      }
    }

    const mockAuction = mockAuctions[params.id as keyof typeof mockAuctions]
    if (!mockAuction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    // Add mock bid history
    const mockBids = params.id === '1' ? [
      {
        id: 'bid_1',
        auction_property_id: '1',
        user_id: 'user_123',
        amount: 780000,
        bid_time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        is_winning: true,
        status: 'winning' as const
      },
      {
        id: 'bid_2',
        auction_property_id: '1',
        user_id: 'user_456',
        amount: 775000,
        bid_time: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        is_winning: false,
        status: 'outbid' as const
      },
      {
        id: 'bid_3',
        auction_property_id: '1',
        user_id: 'user_789',
        amount: 770000,
        bid_time: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        is_winning: false,
        status: 'outbid' as const
      }
    ] : []

    const mockEvents = [
      {
        id: 'event_1',
        auction_property_id: params.id,
        event_type: 'auction_created' as const,
        event_data: { message: 'Auction created' },
        created_at: new Date().toISOString()
      }
    ]

    // Calculate time remaining
    const now = new Date()
    const startTime = new Date(mockAuction.start_time)
    const endTime = new Date(mockAuction.end_time)
    const previewStart = new Date(mockAuction.preview_start)

    let timeRemaining = 0
    let phase: 'preview' | 'live' | 'ended' = 'preview'

    if (now < previewStart) {
      timeRemaining = previewStart.getTime() - now.getTime()
      phase = 'preview'
    } else if (now >= previewStart && now < startTime) {
      timeRemaining = startTime.getTime() - now.getTime()
      phase = 'preview'
    } else if (now >= startTime && now < endTime) {
      timeRemaining = endTime.getTime() - now.getTime()
      phase = 'live'
    } else {
      timeRemaining = 0
      phase = 'ended'
    }

    return NextResponse.json({
      auction: {
        ...mockAuction,
        bids: mockBids,
        events: mockEvents,
        timeRemaining,
        phase,
        secondsRemaining: Math.max(0, Math.floor(timeRemaining / 1000))
      }
    })

  } catch (error) {
    console.error('Error fetching auction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const updates = body

    // Remove read-only fields
    delete updates.id
    delete updates.created_at
    delete updates.current_bid
    delete updates.bid_count

    const { data: auction, error } = await supabase
      .from('auction_properties')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating auction:', error)
      return NextResponse.json({ error: 'Failed to update auction' }, { status: 500 })
    }

    // Log update event
    await supabase
      .from('auction_events')
      .insert({
        auction_property_id: params.id,
        event_type: 'auction_updated',
        event_data: { updates }
      })

    return NextResponse.json({ auction })

  } catch (error) {
    console.error('Error updating auction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if auction can be deleted (not live)
    const { data: auction } = await supabase
      .from('auction_properties')
      .select('status')
      .eq('id', id)
      .single()

    if (!auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    if (auction.status === 'live') {
      return NextResponse.json(
        { error: 'Cannot delete live auction' },
        { status: 400 }
      )
    }

    // Delete auction (cascading will handle related records)
    const { error } = await supabase
      .from('auction_properties')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting auction:', error)
      return NextResponse.json({ error: 'Failed to delete auction' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting auction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}