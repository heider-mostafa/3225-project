import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/config'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Get user session (basic implementation - enhance in production)
    const userAgent = request.headers.get('user-agent') || ''
    const forwardedFor = request.headers.get('x-forwarded-for') || ''
    const realIp = request.headers.get('x-real-ip') || ''
    const ipAddress = forwardedFor?.split(',')[0] || realIp || '127.0.0.1'
    const userId = request.headers.get('x-user-id') || crypto.randomUUID()

    // Get auction details
    const { data: auction, error: auctionError } = await supabase
      .from('auction_properties')
      .select('*')
      .eq('id', id)
      .single()

    if (auctionError || !auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    // Check if buy now is available
    if (!auction.buy_now_price) {
      return NextResponse.json(
        { error: 'Buy now option not available for this auction' },
        { status: 400 }
      )
    }

    // Check auction status
    const now = new Date()
    const previewStart = new Date(auction.preview_start)
    const endTime = new Date(auction.end_time)

    if (now < previewStart) {
      return NextResponse.json(
        { error: 'Auction preview has not started yet' },
        { status: 400 }
      )
    }

    if (now > endTime) {
      return NextResponse.json(
        { error: 'Auction has ended' },
        { status: 400 }
      )
    }

    if (!['preview', 'live'].includes(auction.status)) {
      return NextResponse.json(
        { error: 'Auction is not accepting purchases' },
        { status: 400 }
      )
    }

    // TODO: Add user verification and payment processing here
    // For now, we'll simulate immediate purchase

    // Create winning bid at buy now price
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .insert({
        auction_property_id: id,
        user_id: userId,
        amount: auction.buy_now_price,
        ip_address: ipAddress,
        user_agent: userAgent,
        is_winning: true,
        status: 'winning'
      })
      .select()
      .single()

    if (bidError) {
      console.error('Error creating buy now bid:', bidError)
      return NextResponse.json({ error: 'Failed to process purchase' }, { status: 500 })
    }

    // Update previous bids to outbid
    await supabase
      .from('bids')
      .update({ is_winning: false, status: 'outbid' })
      .eq('auction_property_id', id)
      .neq('id', bid.id)

    // Calculate commission
    const overprice = Math.max(0, auction.buy_now_price - auction.reserve_price)
    const platformCommission = overprice * auction.commission_rate
    const developerShare = overprice * 0.07 // 7% to developer
    const totalCommission = platformCommission + developerShare

    // End auction and mark as sold
    const { error: updateError } = await supabase
      .from('auction_properties')
      .update({
        status: 'sold',
        current_bid: auction.buy_now_price,
        bid_count: auction.bid_count + 1,
        end_time: new Date().toISOString(), // End auction immediately
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error ending auction:', updateError)
      return NextResponse.json({ error: 'Failed to complete purchase' }, { status: 500 })
    }

    // Create auction winner record
    const { error: winnerError } = await supabase
      .from('auction_winners')
      .insert({
        auction_property_id: id,
        user_id: userId,
        winning_bid: auction.buy_now_price,
        final_price: auction.buy_now_price + (auction.buy_now_price * 0.01), // 1% buy now fee
        commission_amount: totalCommission,
        developer_share: developerShare,
        platform_share: platformCommission,
        payment_status: 'pending'
      })

    if (winnerError) {
      console.error('Error creating winner record:', winnerError)
    }

    // Log buy now event
    await supabase
      .from('auction_events')
      .insert({
        auction_property_id: id,
        event_type: 'buy_now_purchase',
        event_data: {
          bid_id: bid.id,
          purchase_price: auction.buy_now_price,
          user_id: userId,
          commission: totalCommission,
          platform_share: platformCommission,
          developer_share: developerShare
        }
      })

    // TODO: Trigger payment processing and notifications here
    // TODO: Broadcast auction end to WebSocket clients

    return NextResponse.json({
      success: true,
      purchase: {
        id: bid.id,
        amount: auction.buy_now_price,
        purchaseTime: bid.bid_time,
        commission: totalCommission,
        platformFee: auction.buy_now_price * 0.01 // 1% buy now premium
      },
      auction: {
        status: 'sold',
        finalPrice: auction.buy_now_price,
        winner: userId
      }
    })

  } catch (error) {
    console.error('Error in buy now purchase:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}