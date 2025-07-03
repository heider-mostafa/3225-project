import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isServerUserAdmin } from '@/lib/auth/admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since') // ISO timestamp
    const types = searchParams.get('types')?.split(',') || ['leads', 'calls', 'messages']

    // Validate admin access
    const supabase = await createServerSupabaseClient()
    const isAdmin = await isServerUserAdmin()
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const sinceDate = since ? new Date(since) : new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
    const updates: any = {
      timestamp: new Date().toISOString(),
      updates: {}
    }

    // Get recent lead updates
    if (types.includes('leads')) {
      const { data: recentLeads } = await supabase
        .from('leads')
        .select('*')
        .gte('updated_at', sinceDate.toISOString())
        .order('updated_at', { ascending: false })
        .limit(50)

      updates.updates.leads = {
        count: recentLeads?.length || 0,
        recent: recentLeads || [],
        status_summary: await getLeadStatusSummary(supabase)
      }
    }

    // Get recent call schedules
    if (types.includes('calls')) {
      const { data: recentCalls } = await supabase
        .from('call_schedules')
        .select(`
          *,
          leads:lead_id (name, property_type, location)
        `)
        .gte('updated_at', sinceDate.toISOString())
        .order('updated_at', { ascending: false })
        .limit(20)

      const { data: dueCalls } = await supabase
        .from('call_schedules')
        .select(`
          *,
          leads:lead_id (name, whatsapp_number, property_type)
        `)
        .eq('status', 'scheduled')
        .lte('scheduled_time', new Date().toISOString())
        .order('scheduled_time', { ascending: true })

      updates.updates.calls = {
        recent_count: recentCalls?.length || 0,
        recent: recentCalls || [],
        due_now: dueCalls || [],
        due_count: dueCalls?.length || 0
      }
    }

    // Get recent WhatsApp messages
    if (types.includes('messages')) {
      const { data: recentMessages } = await supabase
        .from('whatsapp_messages')
        .select(`
          *,
          leads:lead_id (name, status)
        `)
        .gte('timestamp', sinceDate.toISOString())
        .order('timestamp', { ascending: false })
        .limit(30)

      updates.updates.messages = {
        count: recentMessages?.length || 0,
        recent: recentMessages || [],
        incoming_count: recentMessages?.filter(m => m.direction === 'incoming').length || 0
      }
    }

    return NextResponse.json(updates)

  } catch (error) {
    console.error('Realtime updates error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getLeadStatusSummary(supabase: any) {
  const { data: statusCounts } = await supabase
    .from('leads')
    .select('status')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

  const summary: Record<string, number> = {}
  
  statusCounts?.forEach((lead: any) => {
    summary[lead.status] = (summary[lead.status] || 0) + 1
  })

  return {
    total_24h: statusCounts?.length || 0,
    by_status: summary,
    active_leads: summary['whatsapp_sent'] + summary['time_selected'] + summary['call_scheduled'] || 0
  }
}