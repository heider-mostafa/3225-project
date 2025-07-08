import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/config'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { amount, auto_bid_max } = body

    // Get user session (basic implementation - you may want to enhance this)
    const userAgent = request.headers.get('user-agent') || ''
    const forwardedFor = request.headers.get('x-forwarded-for') || ''
    const realIp = request.headers.get('x-real-ip') || ''
    const ipAddress = forwardedFor?.split(',')[0] || realIp || '127.0.0.1'

    // For now, generate a temporary user ID (in production, use actual auth)
    const userId = request.headers.get('x-user-id') || crypto.randomUUID()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid bid amount' },
        { status: 400 }
      )
    }

    // Get auction details
    const { data: auction, error: auctionError } = await supabase
      .from('auction_properties')
      .select('*')
      .eq('id', id)
      .single()

    if (auctionError || !auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    // Check auction status and timing
    const now = new Date()
    const startTime = new Date(auction.start_time)
    const endTime = new Date(auction.end_time)

    if (now < startTime) {
      return NextResponse.json(
        { error: 'Auction has not started yet' },
        { status: 400 }
      )
    }

    if (now > endTime) {
      return NextResponse.json(
        { error: 'Auction has ended' },
        { status: 400 }
      )
    }

    if (auction.status !== 'live') {
      return NextResponse.json(
        { error: 'Auction is not accepting bids' },
        { status: 400 }
      )
    }

    // Validate bid amount
    const minimumIncrement = calculateMinimumIncrement(auction.current_bid)
    const minimumBid = auction.current_bid + minimumIncrement

    if (amount < minimumBid) {
      return NextResponse.json(
        { 
          error: `Bid must be at least $${minimumBid.toLocaleString()}`,
          minimumBid,
          currentBid: auction.current_bid
        },
        { status: 400 }
      )
    }

    // Check if bid exceeds reserve price
    if (amount < auction.reserve_price) {
      return NextResponse.json(
        { 
          error: 'Bid does not meet reserve price',
          isReserveMet: false
        },
        { status: 400 }
      )
    }

    // TODO: Add user verification and deposit checks here
    // For now, we'll allow all bids

    // Start transaction to place bid
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .insert({
        auction_property_id: id,
        user_id: userId,
        amount,
        auto_bid_max,
        ip_address: ipAddress,
        user_agent: userAgent,
        is_winning: true
      })
      .select()
      .single()

    if (bidError) {
      console.error('Error placing bid:', bidError)
      return NextResponse.json({ error: 'Failed to place bid' }, { status: 500 })
    }

    // Update previous winning bids
    await supabase
      .from('bids')
      .update({ is_winning: false, status: 'outbid' })
      .eq('auction_property_id', id)
      .neq('id', bid.id)
      .eq('is_winning', true)

    // Update auction with new bid
    const { error: updateError } = await supabase
      .from('auction_properties')
      .update({
        current_bid: amount,
        bid_count: auction.bid_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating auction:', updateError)
      // Rollback bid if auction update fails
      await supabase.from('bids').delete().eq('id', bid.id)
      return NextResponse.json({ error: 'Failed to update auction' }, { status: 500 })
    }

    // Log bid event
    await supabase
      .from('auction_events')
      .insert({
        auction_property_id: id,
        event_type: 'bid_placed',
        event_data: {
          bid_id: bid.id,
          amount,
          user_id: userId,
          previous_bid: auction.current_bid,
          bid_count: auction.bid_count + 1
        }
      })

    // TODO: Broadcast to WebSocket clients here
    // broadcastBidUpdate(params.id, {
    //   newBid: amount,
    //   bidCount: auction.bid_count + 1,
    //   userId: userId,
    //   timestamp: bid.bid_time
    // })

    return NextResponse.json({
      success: true,
      bid: {
        id: bid.id,
        amount: bid.amount,
        bidTime: bid.bid_time,
        isWinning: true
      },
      auction: {
        currentBid: amount,
        bidCount: auction.bid_count + 1,
        isReserveMet: amount >= auction.reserve_price
      }
    })

  } catch (error) {
    console.error('Error in bid placement:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateMinimumIncrement(currentBid: number): number {
  if (currentBid < 100000) return 1000      // $1K for bids under $100K
  if (currentBid < 500000) return 5000      // $5K for bids under $500K
  if (currentBid < 1000000) return 10000    // $10K for bids under $1M
  return 25000                              // $25K for bids over $1M
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: bids, error } = await supabase
      .from('bids')
      .select('id, amount, bid_time, is_winning, status')
      .eq('auction_property_id', id)
      .order('bid_time', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching bids:', error)
      return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 })
    }

    return NextResponse.json({ bids: bids || [] })

  } catch (error) {
    console.error('Error in bid history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}