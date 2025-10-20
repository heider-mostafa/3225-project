import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/config'
import { createClient } from '@supabase/supabase-js'

// Create service role client for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  console.log('=== PROMO LEADS API CALLED ===')
  try {
    const body = await request.json()
    console.log('Request body:', body)
    
    const { email, utm_source, utm_medium, utm_campaign } = body

    if (!email) {
      console.log('Error: No email provided')
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    console.log('Email to insert:', email)

    // Get client info
    const userAgent = request.headers.get('user-agent') || ''
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIP || 'unknown'
    const referer = request.headers.get('referer') || ''

    // Insert promo lead
    console.log('Attempting to insert into database...')
    const leadData = {
      email: email.toLowerCase().trim(),
      source: 'coming_soon_page',
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      user_agent: userAgent,
      ip_address: ipAddress,
      referrer_url: referer
    }
    console.log('Lead data to insert:', leadData)

    const { data, error } = await supabase
      .from('promo_leads')
      .insert([leadData])
      .select()
      .single()

    if (error) {
      console.error('=== DATABASE ERROR ===')
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      console.error('Error hint:', error.hint)
      
      // Handle duplicate email
      if (error.code === '23505') {
        console.log('Duplicate email, returning success')
        return NextResponse.json(
          { message: 'Email already subscribed', subscribed: true },
          { status: 200 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to save email', details: error.message },
        { status: 500 }
      )
    }

    console.log('=== SUCCESS ===')
    console.log('Inserted data:', data)

    return NextResponse.json(
      { 
        message: 'Successfully subscribed!', 
        subscribed: true,
        lead: data 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('promo_leads')
      .select('*')
      .order('subscribed_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch promo leads' },
        { status: 500 }
      )
    }

    return NextResponse.json({ leads: data })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}