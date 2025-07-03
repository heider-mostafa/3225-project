import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isServerUserAdmin, logAdminActivity } from '@/lib/auth/admin'

import { createServerSupabaseClient } from '@/lib/supabase/server'
// GET /api/admin/inquiries - List and filter inquiries for admin
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    
    // Check admin permissions
    const isAdmin = await isServerUserAdmin(cookieStore)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabase = await createServerSupabaseClient()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const priority = searchParams.get('priority') || ''
    const property_id = searchParams.get('property_id') || ''
    const date_from = searchParams.get('date_from') || ''
    const date_to = searchParams.get('date_to') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const offset = (page - 1) * limit

    // Build comprehensive query with related data
    let query = supabase
      .from('inquiries')
      .select(`
        *,
        properties (
          id,
          title,
          address,
          city,
          price,
          property_photos (
            url,
            is_primary
          )
        ),
        auth.users:user_id (
          id,
          email,
          phone,
          raw_user_meta_data
        )
      `, { count: 'exact' })

    // Apply search filter (search in message, user email, property title)
    if (search) {
      query = query.or(`message.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (priority) {
      query = query.eq('priority', priority)
    }
    if (property_id) {
      query = query.eq('property_id', property_id)
    }
    if (date_from) {
      query = query.gte('created_at', date_from)
    }
    if (date_to) {
      query = query.lte('created_at', date_to + 'T23:59:59.999Z')
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: inquiries, error, count } = await query

    if (error) {
      console.error('Error fetching inquiries:', error)
      return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 })
    }

    // Get inquiry statistics
    const { data: stats } = await supabase
      .from('inquiries')
      .select('status, priority')

    const inquiryStats = {
      total: count || 0,
      pending: stats?.filter(s => s.status === 'pending').length || 0,
      responded: stats?.filter(s => s.status === 'responded').length || 0,
      closed: stats?.filter(s => s.status === 'closed').length || 0,
      high_priority: stats?.filter(s => s.priority === 'high').length || 0,
      medium_priority: stats?.filter(s => s.priority === 'medium').length || 0,
      low_priority: stats?.filter(s => s.priority === 'low').length || 0,
    }

    // Log admin activity
    await logAdminActivity(
      'inquiries_viewed',
      'inquiry',
      undefined,
      {
        page,
        limit,
        search,
        filters: { status, priority, property_id, date_from, date_to },
        totalResults: count
      },
      request
    )

    return NextResponse.json({
      inquiries: inquiries || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats: inquiryStats
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/inquiries - Bulk inquiry operations
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    
    // Check admin permissions
    const isAdmin = await isServerUserAdmin(cookieStore)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabase = await createServerSupabaseClient()

    const { action, inquiryIds, updateData } = await request.json()

    if (!action || !inquiryIds || !Array.isArray(inquiryIds)) {
      return NextResponse.json(
        { error: 'Action and inquiryIds array are required' },
        { status: 400 }
      )
    }

    let results = []
    let errors = []

    switch (action) {
      case 'bulk_update_status':
        if (!updateData?.status) {
          return NextResponse.json(
            { error: 'Status is required for bulk status update' },
            { status: 400 }
          )
        }
        
        const { data: updatedInquiries, error: updateError } = await supabase
          .from('inquiries')
          .update({ 
            status: updateData.status,
            updated_at: new Date().toISOString(),
            admin_notes: updateData.admin_notes || null
          })
          .in('id', inquiryIds)
          .select('id, status, properties(title)')

        if (updateError) {
          return NextResponse.json(
            { error: 'Failed to update inquiries: ' + updateError.message },
            { status: 500 }
          )
        }

        results = updatedInquiries || []
        break

      case 'bulk_update_priority':
        if (!updateData?.priority) {
          return NextResponse.json(
            { error: 'Priority is required for bulk priority update' },
            { status: 400 }
          )
        }
        
        const { data: priorityUpdated, error: priorityError } = await supabase
          .from('inquiries')
          .update({ 
            priority: updateData.priority,
            updated_at: new Date().toISOString()
          })
          .in('id', inquiryIds)
          .select('id, priority, properties(title)')

        if (priorityError) {
          return NextResponse.json(
            { error: 'Failed to update priorities: ' + priorityError.message },
            { status: 500 }
          )
        }

        results = priorityUpdated || []
        break

      case 'bulk_assign':
        if (!updateData?.assigned_to) {
          return NextResponse.json(
            { error: 'assigned_to is required for bulk assignment' },
            { status: 400 }
          )
        }
        
        const { data: assignedInquiries, error: assignError } = await supabase
          .from('inquiries')
          .update({ 
            assigned_to: updateData.assigned_to,
            updated_at: new Date().toISOString()
          })
          .in('id', inquiryIds)
          .select('id, assigned_to, properties(title)')

        if (assignError) {
          return NextResponse.json(
            { error: 'Failed to assign inquiries: ' + assignError.message },
            { status: 500 }
          )
        }

        results = assignedInquiries || []
        break

      case 'bulk_delete':
        for (const inquiryId of inquiryIds) {
          try {
            // Get inquiry data for logging
            const { data: inquiry } = await supabase
              .from('inquiries')
              .select('id, message, email, properties(title)')
              .eq('id', inquiryId)
              .single()

            const { error: deleteError } = await supabase
              .from('inquiries')
              .delete()
              .eq('id', inquiryId)

            if (deleteError) {
              errors.push({ inquiryId, error: deleteError.message })
            } else {
              results.push({ inquiryId, deleted: true })
              
              // Log individual deletion
              await logAdminActivity(
                'inquiry_bulk_delete',
                'inquiry',
                inquiryId,
                {
                  email: inquiry?.email,
                  propertyTitle: (inquiry?.properties as any)?.title
                },
                request
              )
            }
          } catch (error) {
            errors.push({ inquiryId, error: 'Unexpected error' })
          }
        }
        break

      default:
        return NextResponse.json(
          { error: 'Unknown action: ' + action },
          { status: 400 }
        )
    }

    // Log bulk admin activity
    await logAdminActivity(
      `inquiry_${action}`,
      'inquiry',
      undefined,
      {
        action,
        inquiryIds,
        updateData,
        successCount: results.length,
        errorCount: errors.length
      },
      request
    )

    return NextResponse.json({
      success: true,
      results,
      errors,
      summary: {
        total: inquiryIds.length,
        succeeded: results.length,
        failed: errors.length
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 