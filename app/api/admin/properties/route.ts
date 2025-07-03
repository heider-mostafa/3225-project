import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isServerUserAdmin, logAdminActivity } from '@/lib/auth/admin'

import { createServerSupabaseClient } from '@/lib/supabase/server'
// GET /api/admin/properties - Admin property management with advanced filtering
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
    const property_type = searchParams.get('property_type') || ''
    const city = searchParams.get('city') || ''
    const min_price = searchParams.get('min_price')
    const max_price = searchParams.get('max_price')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const includeAnalytics = searchParams.get('includeAnalytics') === 'true'
    const offset = (page - 1) * limit

    // Build comprehensive query with analytics
    let query = supabase
      .from('properties')
      .select(`
        *,
        property_photos (
          id,
          url,
          is_primary,
          order_index
        ),
        property_financials (*),
        property_legal (*),
        property_scheduling (*),
        ${includeAnalytics ? `
        property_analytics (
          event_type,
          event_data,
          created_at
        ),
        saved_properties (count),
        inquiries (
          id,
          status,
          created_at
        ),
        ` : ''}
        _count: property_analytics(count)
      `, { count: 'exact' })

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,address.ilike.%${search}%,city.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (property_type) {
      query = query.eq('property_type', property_type)
    }
    if (city) {
      query = query.eq('city', city)
    }
    if (min_price) {
      query = query.gte('price', parseFloat(min_price))
    }
    if (max_price) {
      query = query.lte('price', parseFloat(max_price))
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: properties, error, count } = await query

    if (error) {
      console.error('Error fetching admin properties:', error)
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
    }

    // Get summary statistics for admin dashboard
    const { data: stats } = await supabase.rpc('get_property_stats')

    // Log admin activity
    await logAdminActivity(
      'admin_properties_viewed',
      'property',
      undefined,
      {
        page,
        limit,
        search,
        filters: { status, property_type, city, min_price, max_price },
        totalResults: count
      },
      request
    )

    return NextResponse.json({
      properties: properties || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats: stats || {
        totalProperties: count || 0,
        activeProperties: 0,
        draftProperties: 0,
        soldProperties: 0,
        totalViews: 0,
        totalInquiries: 0
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

// POST /api/admin/properties - Bulk property operations
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    
    // Check admin permissions
    const isAdmin = await isServerUserAdmin(cookieStore)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabase = await createServerSupabaseClient()

    const { action, propertyIds, updateData } = await request.json()

    if (!action || !propertyIds || !Array.isArray(propertyIds)) {
      return NextResponse.json(
        { error: 'Action and propertyIds array are required' },
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
        
        const { data: updatedProperties, error: updateError } = await supabase
          .from('properties')
          .update({ 
            status: updateData.status,
            updated_at: new Date().toISOString()
          })
          .in('id', propertyIds)
          .select('id, title, status')

        if (updateError) {
          return NextResponse.json(
            { error: 'Failed to update properties: ' + updateError.message },
            { status: 500 }
          )
        }

        results = updatedProperties || []
        break

      case 'bulk_delete':
        for (const propertyId of propertyIds) {
          try {
            // Get property data for logging
            const { data: property } = await supabase
              .from('properties')
              .select('title, address, city')
              .eq('id', propertyId)
              .single()

            const { error: deleteError } = await supabase
              .from('properties')
              .delete()
              .eq('id', propertyId)

            if (deleteError) {
              errors.push({ propertyId, error: deleteError.message })
            } else {
              results.push({ propertyId, deleted: true })
              
              // Log individual deletion
              await logAdminActivity(
                'property_bulk_delete',
                'property',
                propertyId,
                {
                  title: property?.title,
                  address: property?.address,
                  city: property?.city
                },
                request
              )
            }
          } catch (error) {
            errors.push({ propertyId, error: 'Unexpected error' })
          }
        }
        break

      case 'bulk_feature':
        const { data: featuredProperties, error: featureError } = await supabase
          .from('properties')
          .update({ 
            is_featured: updateData?.is_featured || true,
            updated_at: new Date().toISOString()
          })
          .in('id', propertyIds)
          .select('id, title, is_featured')

        if (featureError) {
          return NextResponse.json(
            { error: 'Failed to update featured status: ' + featureError.message },
            { status: 500 }
          )
        }

        results = featuredProperties || []
        break

      default:
        return NextResponse.json(
          { error: 'Unknown action: ' + action },
          { status: 400 }
        )
    }

    // Log bulk admin activity
    await logAdminActivity(
      `property_${action}`,
      'property',
      undefined,
      {
        action,
        propertyIds,
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
        total: propertyIds.length,
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