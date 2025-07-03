import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    console.log('👁️ Tracking view for property:', id)
    
    // Use service role for reliable access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get current view count before incrementing
    const { data: propertyBefore } = await supabase
      .from('properties')
      .select('view_count, title')
      .eq('id', id)
      .single()

    const currentCount = propertyBefore?.view_count || 0
    console.log(`📊 Current view count for "${propertyBefore?.title}": ${currentCount}`)

    // Try to increment view count using RPC function
    try {
      await supabase.rpc('increment_property_views', { property_id: id })
      console.log('✅ View count incremented using RPC function')
    } catch (rpcError) {
      console.log('ℹ️ RPC function not available, using direct update')
      
      // Fallback: Direct update
      const newCount = currentCount + 1
      
      const { error: updateError } = await supabase
        .from('properties')
        .update({ 
          view_count: newCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateError) {
        console.error('❌ Error updating view count:', updateError)
        throw updateError
      }
      
      console.log(`✅ View count updated directly: ${currentCount} → ${newCount}`)
    }

    // Log view in analytics table
    try {
      const clientInfo = {
        user_agent: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
      }

      await supabase
        .from('property_views')
        .insert({
          property_id: id,
          viewed_at: new Date().toISOString(),
          user_agent: clientInfo.user_agent,
          ip_address: clientInfo.ip_address
        })
      
      console.log('📈 View logged in analytics table')
    } catch (analyticsError) {
      console.log('ℹ️ Analytics logging failed (non-critical):', analyticsError)
    }

    // Get updated view count to confirm
    const { data: propertyAfter } = await supabase
      .from('properties')
      .select('view_count')
      .eq('id', id)
      .single()

    const newCount = propertyAfter?.view_count || 0
    console.log(`🎯 Final view count: ${newCount}`)

    return NextResponse.json({
      success: true,
      message: 'View tracked successfully',
      data: {
        property_id: id,
        previous_count: currentCount,
        new_count: newCount
      }
    })

  } catch (error) {
    console.error('💥 View tracking error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'View tracking failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 