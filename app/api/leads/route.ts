import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { triggerLeadCaptureWorkflow } from '@/lib/n8n/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      whatsapp_number,
      location,
      price_range,
      property_type,
      timeline,
      utm_source,
      utm_medium,
      utm_campaign
    } = body

    // Validate required fields
    if (!name || !whatsapp_number || !location || !price_range || !property_type || !timeline) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get client IP and user agent
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Create Supabase client
    const supabase = await createServerSupabaseClient()

    // Generate unique lead ID
    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Calculate initial score based on the workflow logic
    const priceScores: Record<string, number> = {
      "1.5M-3M EGP": 10,
      "3M-5M EGP": 15,
      "5M-8M EGP": 20,
      "8M-15M EGP": 25,
      "15M+ EGP": 30
    }

    const timelineScores: Record<string, number> = {
      "Immediately (0-2 months)": 20,
      "Soon (2-4 months)": 15,
      "Later this year (4-8 months)": 10,
      "Just exploring options": 5
    }

    const locationScores: Record<string, number> = {
      "Zamalek": 10,
      "New Cairo": 10,
      "Maadi": 8,
      "Heliopolis": 8,
      "6th October": 6,
      "Giza": 5
    }

    const initialScore = 
      (priceScores[price_range] || 0) +
      (timelineScores[timeline] || 0) +
      (locationScores[location] || 0)

    // Clean and format phone number
    let cleanPhone = whatsapp_number.replace(/\s+/g, '').replace(/[^\d+]/g, '')
    if (!cleanPhone.startsWith('+20')) {
      if (cleanPhone.startsWith('20')) {
        cleanPhone = '+' + cleanPhone
      } else if (cleanPhone.startsWith('0')) {
        cleanPhone = '+2' + cleanPhone
      } else {
        cleanPhone = '+20' + cleanPhone
      }
    }

    // Prepare lead data
    const leadData = {
      lead_id: leadId,
      name,
      email: email || null,
      whatsapp_number: cleanPhone,
      location,
      price_range,
      property_type,
      timeline,
      initial_score: initialScore,
      status: 'new_lead',
      source: 'website',
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      ip_address: ip,
      user_agent: userAgent,
      metadata: {
        form_version: '1.0',
        submission_timestamp: new Date().toISOString()
      }
    }

    // Insert lead into database
    const { data: insertedLead, error: dbError } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save lead data' },
        { status: 500 }
      )
    }

    // Trigger N8N workflow asynchronously
    try {
      const workflowResult = await triggerLeadCaptureWorkflow({
        whatsapp_number: cleanPhone,
        location,
        price_range,
        property_type,
        timeline,
        name,
        email,
        utm_source,
        utm_medium,
        utm_campaign
      })

      console.log('N8N workflow triggered:', workflowResult)
    } catch (workflowError) {
      console.error('N8N workflow error:', workflowError)
      // Don't fail the API call if N8N fails - lead is still saved
    }

    // Return success response
    return NextResponse.json({
      success: true,
      lead_id: leadId,
      initial_score: initialScore,
      message: 'Lead captured successfully'
    })

  } catch (error) {
    console.error('Lead capture error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('lead_id')

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('lead_id', leadId)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ lead })

  } catch (error) {
    console.error('Lead fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 