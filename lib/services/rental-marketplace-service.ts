import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/supabase';
import { rentalLTVOptimizer } from './rental-ltv-optimizer';

type RentalListing = Database['public']['Tables']['rental_listings']['Row'];
type RentalBooking = Database['public']['Tables']['rental_bookings']['Row'];
type RentalReview = Database['public']['Tables']['rental_reviews']['Row'];

export interface CreateRentalListingParams {
  property_id: string;
  owner_user_id: string;
  rental_type: 'short_term' | 'long_term' | 'both';
  rates: {
    nightly_rate?: number;
    monthly_rate?: number;
    yearly_rate?: number;
  };
  rules: {
    minimum_stay_nights: number;
    maximum_stay_nights?: number;
    check_in_time?: string;
    check_out_time?: string;
    house_rules?: any;
    cancellation_policy?: string;
    instant_book?: boolean;
  };
  fees: {
    cleaning_fee?: number;
    security_deposit?: number;
    extra_guest_fee?: number;
  };
  qr_integration?: {
    developer_qr_code?: string;
    developer_name?: string;
    tourism_permit_number?: string;
  };
  amenities?: {
    [key: string]: boolean;
  };
}

export interface BookRentalParams {
  rental_listing_id: string;
  guest_user_id: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  guest_phone: string;
  guest_email: string;
  special_requests?: string;
  tracking_params?: {
    fbclid?: string;
    fbc?: string;
  };
}

export interface RentalSearchParams {
  location?: string;
  check_in_date?: string;
  check_out_date?: string;
  guests?: number;
  min_price?: number;
  max_price?: number;
  property_type?: string;
  amenities?: string[];
  rental_type?: 'short_term' | 'long_term' | 'both';
}

class RentalMarketplaceService {
  private supabase = createClient();

  // ===============================================
  // RENTAL LISTING MANAGEMENT
  // ===============================================

  async createRentalListing(params: CreateRentalListingParams): Promise<{
    success: boolean;
    listing?: RentalListing;
    error?: string;
  }> {
    try {
      const { data: listing, error } = await this.supabase
        .from('rental_listings')
        .insert({
          property_id: params.property_id,
          owner_user_id: params.owner_user_id,
          rental_type: params.rental_type,
          nightly_rate: params.rates.nightly_rate,
          monthly_rate: params.rates.monthly_rate,
          yearly_rate: params.rates.yearly_rate,
          minimum_stay_nights: params.rules.minimum_stay_nights,
          maximum_stay_nights: params.rules.maximum_stay_nights || 365,
          check_in_time: params.rules.check_in_time || '15:00',
          check_out_time: params.rules.check_out_time || '11:00',
          house_rules: params.rules.house_rules,
          cancellation_policy: params.rules.cancellation_policy || 'moderate',
          instant_book: params.rules.instant_book || false,
          cleaning_fee: params.fees.cleaning_fee || 0,
          security_deposit: params.fees.security_deposit || 0,
          extra_guest_fee: params.fees.extra_guest_fee || 0,
          developer_qr_code: params.qr_integration?.developer_qr_code,
          tourism_permit_number: params.qr_integration?.tourism_permit_number,
          compliance_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Create amenities record if provided
      if (params.amenities && listing) {
        await this.supabase
          .from('rental_amenities')
          .insert({
            rental_listing_id: listing.id,
            ...params.amenities
          });
      }

      // Create QR integration record if developer info provided
      if (params.qr_integration?.developer_name && listing) {
        await this.supabase
          .from('developer_qr_integrations')
          .insert({
            rental_listing_id: listing.id,
            developer_name: params.qr_integration.developer_name,
            qr_code_data: params.qr_integration.developer_qr_code || '',
            integration_status: 'active'
          });
      }

      return { success: true, listing };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateRentalListing(listingId: string, updates: Partial<RentalListing>): Promise<{
    success: boolean;
    listing?: RentalListing;
    error?: string;
  }> {
    try {
      const { data: listing, error } = await this.supabase
        .from('rental_listings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', listingId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, listing };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getRentalListing(listingId: string): Promise<{
    success: boolean;
    listing?: any;
    error?: string;
  }> {
    try {
      const { data: listing, error } = await this.supabase
        .from('rental_listings')
        .select(`
          *,
          properties (*),
          rental_amenities (*),
          rental_reviews (
            id,
            overall_rating,
            review_text,
            created_at,
            reviewer_user_id
          ),
          developer_qr_integrations (*)
        `)
        .eq('id', listingId)
        .single();

      if (error) throw error;

      return { success: true, listing };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ===============================================
  // RENTAL SEARCH AND DISCOVERY
  // ===============================================

  async searchRentals(params: RentalSearchParams): Promise<{
    success: boolean;
    listings?: any[];
    total_count?: number;
    error?: string;
  }> {
    try {
      let query = this.supabase
        .from('rental_listings')
        .select(`
          *,
          properties (*),
          rental_amenities (*)
        `, { count: 'exact' })
        .eq('is_active', true)
        .eq('compliance_status', 'approved');

      // Apply filters
      if (params.rental_type) {
        query = query.in('rental_type', [params.rental_type, 'both']);
      }

      if (params.min_price) {
        query = query.gte('nightly_rate', params.min_price);
      }

      if (params.max_price) {
        query = query.lte('nightly_rate', params.max_price);
      }

      if (params.location) {
        query = query.ilike('properties.city', `%${params.location}%`);
      }

      // Check availability if dates provided
      if (params.check_in_date && params.check_out_date) {
        const { data: unavailableListings } = await this.supabase
          .from('rental_calendar')
          .select('rental_listing_id')
          .eq('is_available', false)
          .gte('date', params.check_in_date)
          .lte('date', params.check_out_date);

        const unavailableIds = unavailableListings?.map(item => item.rental_listing_id) || [];
        if (unavailableIds.length > 0) {
          query = query.not('id', 'in', `(${unavailableIds.join(',')})`);
        }
      }

      const { data: listings, error, count } = await query
        .order('featured', { ascending: false })
        .order('average_rating', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, listings, total_count: count || 0 };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ===============================================
  // BOOKING MANAGEMENT
  // ===============================================

  async checkAvailability(listingId: string, checkIn: string, checkOut: string): Promise<{
    success: boolean;
    available?: boolean;
    blocked_dates?: string[];
    error?: string;
  }> {
    try {
      const { data: blockedDates, error } = await this.supabase
        .from('rental_calendar')
        .select('date')
        .eq('rental_listing_id', listingId)
        .eq('is_available', false)
        .gte('date', checkIn)
        .lte('date', checkOut);

      if (error) throw error;

      const blocked = blockedDates?.map(item => item.date) || [];
      const available = blocked.length === 0;

      return { success: true, available, blocked_dates: blocked };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async createBooking(params: BookRentalParams): Promise<{
    success: boolean;
    booking?: RentalBooking;
    payment_url?: string;
    error?: string;
  }> {
    try {
      // First check availability
      const availability = await this.checkAvailability(
        params.rental_listing_id,
        params.check_in_date,
        params.check_out_date
      );

      if (!availability.success || !availability.available) {
        return { success: false, error: 'Selected dates are not available' };
      }

      // Get listing details for pricing
      const { data: listing, error: listingError } = await this.supabase
        .from('rental_listings')
        .select('*')
        .eq('id', params.rental_listing_id)
        .single();

      if (listingError || !listing) {
        return { success: false, error: 'Rental listing not found' };
      }

      // Calculate pricing
      const checkInDate = new Date(params.check_in_date);
      const checkOutDate = new Date(params.check_out_date);
      const numberOfNights = Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const nightlyRate = listing.nightly_rate || 0;
      const totalNightsCost = nightlyRate * numberOfNights;
      const cleaningFee = listing.cleaning_fee || 0;
      const securityDeposit = listing.security_deposit || 0;
      const platformFee = totalNightsCost * 0.12; // 12% platform commission
      const totalAmount = totalNightsCost + cleaningFee + platformFee;

      // Create booking record
      const { data: booking, error: bookingError } = await this.supabase
        .from('rental_bookings')
        .insert({
          rental_listing_id: params.rental_listing_id,
          guest_user_id: params.guest_user_id,
          check_in_date: params.check_in_date,
          check_out_date: params.check_out_date,
          number_of_guests: params.number_of_guests,
          number_of_nights: numberOfNights,
          nightly_rate: nightlyRate,
          total_nights_cost: totalNightsCost,
          cleaning_fee: cleaningFee,
          security_deposit: securityDeposit,
          platform_fee: platformFee,
          total_amount: totalAmount,
          guest_phone: params.guest_phone,
          guest_email: params.guest_email,
          special_requests: params.special_requests,
          booking_status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Track booking initiation for Meta (non-blocking)
      try {
        await rentalLTVOptimizer.trackRentalBookingEvent({
          eventType: 'booking_initiated',
          customerId: params.guest_user_id,
          bookingId: booking.id,
          rentalListingId: params.rental_listing_id,
          bookingValue: totalAmount,
          userInfo: { email: params.guest_email, phone: params.guest_phone },
          trackingParams: params.tracking_params
        });
      } catch (trackingError) {
        console.error('⚠️ Meta booking tracking error (non-blocking):', trackingError);
      }

      // Here you would integrate with Paymob to create payment URL
      // For now, returning a placeholder
      const paymentUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/payment/rental/${booking.id}`;

      return { success: true, booking, payment_url: paymentUrl };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async confirmBooking(bookingId: string, paymobTransactionId: string): Promise<{
    success: boolean;
    booking?: RentalBooking;
    error?: string;
  }> {
    try {
      const { data: booking, error } = await this.supabase
        .from('rental_bookings')
        .update({
          booking_status: 'confirmed',
          payment_status: 'paid',
          paymob_transaction_id: paymobTransactionId,
          paid_amount: this.supabase.rpc('get_booking_total_amount', { booking_id: bookingId })
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      // Track booking confirmation for Meta (non-blocking)
      try {
        await rentalLTVOptimizer.trackRentalBookingEvent({
          eventType: 'booking_confirmed',
          customerId: booking.guest_user_id,
          bookingId: booking.id,
          rentalListingId: booking.rental_listing_id,
          bookingValue: booking.total_amount,
          userInfo: { email: booking.guest_email, phone: booking.guest_phone }
        });
      } catch (trackingError) {
        console.error('⚠️ Meta booking confirmation tracking error (non-blocking):', trackingError);
      }

      return { success: true, booking };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ===============================================
  // REVIEWS AND RATINGS
  // ===============================================

  async createReview(params: {
    rental_listing_id: string;
    booking_id: string;
    reviewer_user_id: string;
    overall_rating: number;
    cleanliness_rating?: number;
    accuracy_rating?: number;
    location_rating?: number;
    value_rating?: number;
    review_text?: string;
    review_language?: string;
  }): Promise<{
    success: boolean;
    review?: RentalReview;
    error?: string;
  }> {
    try {
      const { data: review, error } = await this.supabase
        .from('rental_reviews')
        .insert({
          ...params,
          is_verified: true,
          moderation_status: 'approved'
        })
        .select()
        .single();

      if (error) throw error;

      // Track review creation for Meta (non-blocking)
      try {
        await rentalLTVOptimizer.trackRentalBookingEvent({
          eventType: 'review_left',
          customerId: params.reviewer_user_id,
          bookingId: params.booking_id,
          rentalListingId: params.rental_listing_id
        });
      } catch (trackingError) {
        console.error('⚠️ Meta review tracking error (non-blocking):', trackingError);
      }

      return { success: true, review };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getListingReviews(listingId: string): Promise<{
    success: boolean;
    reviews?: any[];
    stats?: {
      total_reviews: number;
      average_rating: number;
      rating_breakdown: { [key: number]: number };
    };
    error?: string;
  }> {
    try {
      const { data: reviews, error } = await this.supabase
        .from('rental_reviews')
        .select(`
          *,
          reviewer:reviewer_user_id (
            full_name,
            id
          )
        `)
        .eq('rental_listing_id', listingId)
        .eq('is_public', true)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate statistics
      const totalReviews = reviews?.length || 0;
      const averageRating = totalReviews > 0 
        ? reviews!.reduce((sum, review) => sum + review.overall_rating, 0) / totalReviews 
        : 0;

      const ratingBreakdown: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews?.forEach(review => {
        ratingBreakdown[review.overall_rating] = (ratingBreakdown[review.overall_rating] || 0) + 1;
      });

      return {
        success: true,
        reviews,
        stats: {
          total_reviews: totalReviews,
          average_rating: Math.round(averageRating * 100) / 100,
          rating_breakdown: ratingBreakdown
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ===============================================
  // CALENDAR MANAGEMENT
  // ===============================================

  async updateCalendar(listingId: string, updates: {
    date: string;
    is_available: boolean;
    nightly_rate?: number;
    minimum_stay?: number;
    special_pricing_reason?: string;
  }[]): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const calendarData = updates.map(update => ({
        rental_listing_id: listingId,
        date: update.date,
        is_available: update.is_available,
        nightly_rate: update.nightly_rate,
        minimum_stay: update.minimum_stay,
        is_special_pricing: !!update.special_pricing_reason,
        special_pricing_reason: update.special_pricing_reason
      }));

      const { error } = await this.supabase
        .from('rental_calendar')
        .upsert(calendarData, {
          onConflict: 'rental_listing_id,date'
        });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getCalendar(listingId: string, startDate: string, endDate: string): Promise<{
    success: boolean;
    calendar?: any[];
    error?: string;
  }> {
    try {
      const { data: calendar, error } = await this.supabase
        .from('rental_calendar')
        .select('*')
        .eq('rental_listing_id', listingId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date');

      if (error) throw error;

      return { success: true, calendar };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ===============================================
  // ANALYTICS AND REPORTING
  // ===============================================

  async getOwnerAnalytics(ownerId: string): Promise<{
    success: boolean;
    analytics?: {
      total_listings: number;
      active_listings: number;
      total_bookings: number;
      total_revenue: number;
      average_rating: number;
      occupancy_rate: number;
    };
    error?: string;
  }> {
    try {
      const { data: listings, error: listingsError } = await this.supabase
        .from('rental_listings')
        .select(`
          *,
          rental_bookings!inner (
            total_amount,
            booking_status,
            payment_status
          )
        `)
        .eq('owner_user_id', ownerId);

      if (listingsError) throw listingsError;

      const totalListings = listings?.length || 0;
      const activeListings = listings?.filter(l => l.is_active).length || 0;
      
      const bookings = listings?.flatMap(l => l.rental_bookings) || [];
      const completedBookings = bookings.filter(b => b.booking_status === 'completed');
      
      const totalBookings = completedBookings.length;
      const totalRevenue = completedBookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
      
      const averageRating = totalListings > 0 
        ? listings!.reduce((sum, listing) => sum + (listing.average_rating || 0), 0) / totalListings 
        : 0;

      // Calculate occupancy rate (simplified)
      const occupancyRate = 75; // Placeholder - would calculate based on calendar data

      return {
        success: true,
        analytics: {
          total_listings: totalListings,
          active_listings: activeListings,
          total_bookings: totalBookings,
          total_revenue: totalRevenue,
          average_rating: Math.round(averageRating * 100) / 100,
          occupancy_rate: occupancyRate
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ===============================================
  // QR INTEGRATION
  // ===============================================

  async syncWithDeveloperQR(listingId: string, developerName: string): Promise<{
    success: boolean;
    sync_result?: any;
    error?: string;
  }> {
    try {
      // This would integrate with specific developer APIs
      // For now, returning a placeholder response
      const { data: integration, error } = await this.supabase
        .from('developer_qr_integrations')
        .update({
          last_sync_at: new Date().toISOString(),
          sync_status: 'success'
        })
        .eq('rental_listing_id', listingId)
        .eq('developer_name', developerName)
        .select()
        .single();

      if (error) throw error;

      return { success: true, sync_result: integration };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export default new RentalMarketplaceService();