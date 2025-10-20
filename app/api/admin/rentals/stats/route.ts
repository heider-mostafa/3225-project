import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .is('revoked_at', null)
      .single();

    if (!userRole || !['admin', 'super_admin'].includes(userRole.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Gather statistics in parallel
    const [
      totalListingsResult,
      activeListingsResult,
      pendingApprovalResult,
      totalBookingsResult,
      totalRevenueResult,
      recentBookingsResult
    ] = await Promise.all([
      // Total listings
      supabase
        .from('rental_listings')
        .select('id', { count: 'exact', head: true }),
      
      // Active listings (approved and active)
      supabase
        .from('rental_listings')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('compliance_status', 'approved'),
      
      // Pending approval
      supabase
        .from('rental_listings')
        .select('id', { count: 'exact', head: true })
        .eq('compliance_status', 'pending'),
      
      // Total bookings
      supabase
        .from('rental_bookings')
        .select('id', { count: 'exact', head: true }),
      
      // Total revenue (confirmed bookings only)
      supabase
        .from('rental_bookings')
        .select('total_amount')
        .in('booking_status', ['confirmed', 'checked_in', 'checked_out', 'completed'])
        .eq('payment_status', 'paid'),
      
      // Recent bookings for trend analysis
      supabase
        .from('rental_bookings')
        .select('created_at, total_amount')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .in('booking_status', ['confirmed', 'checked_in', 'checked_out', 'completed'])
    ]);

    // Calculate total revenue
    const totalRevenue = totalRevenueResult.data?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;

    // Calculate average occupancy (simplified - based on bookings vs listings)
    const averageOccupancy = activeListingsResult.count && totalBookingsResult.count 
      ? Math.min((totalBookingsResult.count / activeListingsResult.count) * 10, 100) // Simplified calculation
      : 0;

    // Additional metrics
    const [
      qrIntegrationsResult,
      tourismPermitsResult,
      featuredListingsResult,
      monthlyRevenueResult
    ] = await Promise.all([
      // QR integrations count
      supabase
        .from('rental_listings')
        .select('id', { count: 'exact', head: true })
        .not('developer_qr_code', 'is', null),
      
      // Tourism permits count
      supabase
        .from('rental_listings')
        .select('id', { count: 'exact', head: true })
        .not('tourism_permit_number', 'is', null),
      
      // Featured listings count
      supabase
        .from('rental_listings')
        .select('id', { count: 'exact', head: true })
        .eq('featured', true),
      
      // Monthly revenue (last 30 days)
      supabase
        .from('rental_bookings')
        .select('total_amount')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .in('booking_status', ['confirmed', 'checked_in', 'checked_out', 'completed'])
        .eq('payment_status', 'paid')
    ]);

    const monthlyRevenue = monthlyRevenueResult.data?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;

    const stats = {
      total_listings: totalListingsResult.count || 0,
      active_listings: activeListingsResult.count || 0,
      pending_approval: pendingApprovalResult.count || 0,
      total_bookings: totalBookingsResult.count || 0,
      total_revenue: totalRevenue,
      average_occupancy: Math.round(averageOccupancy * 10) / 10,
      monthly_revenue: monthlyRevenue,
      qr_integrations: qrIntegrationsResult.count || 0,
      tourism_permits: tourismPermitsResult.count || 0,
      featured_listings: featuredListingsResult.count || 0,
      // Growth metrics (simplified - would need historical data for real calculation)
      listings_growth: 12, // Placeholder
      revenue_growth: 23, // Placeholder
      bookings_growth: 15, // Placeholder
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Admin rental stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}