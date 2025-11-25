import { Alert } from 'react-native';
import { supabase } from '../config/supabase';
import { apiClient, ApiResponse } from '../config/api';

// Community Types
export interface Compound {
  id: string;
  name: string;
  description?: string;
  location_address: string;
  location_lat: number;
  location_lng: number;
  developer_id: string;
  total_units: number;
  available_units: number;
  compound_manager_user_id?: string;
  security_level: 'basic' | 'standard' | 'premium';
  operating_hours: {
    open_time: string;
    close_time: string;
    is_24_7: boolean;
  };
  contact_phone?: string;
  contact_email?: string;
  amenities_available: string[];
  created_at: string;
  updated_at: string;
}

export interface Amenity {
  id: string;
  compound_id: string;
  name: string;
  type: string;
  description?: string;
  capacity: number;
  booking_required: boolean;
  price_per_hour?: number;
  operating_hours: {
    open_time: string;
    close_time: string;
    days_available: string[];
  };
  advance_booking_days: number;
  max_booking_hours: number;
  is_active: boolean;
  created_at: string;
}

export interface AmenityBooking {
  id: string;
  amenity_id: string;
  resident_user_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  total_cost: number;
  guest_count: number;
  booking_notes?: string;
  booking_status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  qr_code?: string;
  payment_status: 'pending' | 'paid' | 'refunded';
  created_at: string;
}

export interface VisitorPass {
  id: string;
  unit_id: string;
  resident_user_id: string;
  visitor_name: string;
  visitor_phone: string;
  visitor_id_number?: string;
  visit_purpose: string;
  expected_arrival: string;
  expected_departure?: string;
  qr_code: string;
  access_status: 'pending' | 'active' | 'used' | 'expired' | 'cancelled';
  entry_time?: string;
  exit_time?: string;
  security_notes?: string;
  created_at: string;
}

export interface ServiceRequest {
  id: string;
  unit_id: string;
  resident_user_id: string;
  category: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'submitted' | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled';
  estimated_cost?: number;
  actual_cost?: number;
  scheduled_date?: string;
  completion_date?: string;
  service_provider_id?: string;
  resident_rating?: number;
  resident_review?: string;
  created_at: string;
}

export interface CommunityAnnouncement {
  id: string;
  compound_id: string;
  title: string;
  content: string;
  announcement_type: 'general' | 'maintenance' | 'event' | 'emergency' | 'billing';
  priority: 'low' | 'medium' | 'high';
  target_audience: 'all' | 'owners' | 'tenants' | 'specific_buildings';
  target_buildings?: string[];
  is_push_notification: boolean;
  is_sms: boolean;
  is_email: boolean;
  expiry_date?: string;
  created_by_user_id: string;
  created_at: string;
}

export interface CommunityFee {
  id: string;
  unit_id: string;
  resident_user_id: string;
  fee_type: 'maintenance' | 'security' | 'utilities' | 'parking' | 'amenities';
  amount: number;
  due_date: string;
  billing_period_start: string;
  billing_period_end: string;
  payment_status: 'pending' | 'paid' | 'overdue' | 'partial' | 'waived';
  payment_date?: string;
  payment_method?: string;
  late_fee?: number;
  discount_applied?: number;
  payment_reference?: string;
  created_at: string;
}

export interface ResidentProfile {
  id: string;
  user_id: string;
  unit_id: string;
  resident_type: 'owner' | 'tenant' | 'family_member';
  move_in_date: string;
  move_out_date?: string;
  is_primary_contact: boolean;
  emergency_contact: {
    name: string;
    phone: string;
    relationship: string;
  };
  family_members: Array<{
    name: string;
    age: number;
    relationship: string;
  }>;
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_documents?: string[];
  created_at: string;
  community_units?: {
    id: string;
    unit_number: string;
    compound_id: string;
    compounds?: {
      name: string;
      location_address: string;
    };
  };
}

class CommunityService {
  private static instance: CommunityService;

  private constructor() {}

  static getInstance(): CommunityService {
    if (!CommunityService.instance) {
      CommunityService.instance = new CommunityService();
    }
    return CommunityService.instance;
  }

  // Compound Management
  async getResidentCompounds(userId: string): Promise<ApiResponse<Compound[]>> {
    try {
      const { data, error } = await supabase
        .from('compound_residents')
        .select(`
          *,
          community_units!inner(
            *,
            compounds!inner(*)
          )
        `)
        .eq('user_id', userId)
        .is('move_out_date', null);

      if (error) throw error;

      const compounds = data?.map((resident: any) => resident.community_units.compounds) || [];
      return { success: true, data: compounds };
    } catch (error: any) {
      console.error('❌ Get resident compounds error:', error);
      return { success: false, error: error.message };
    }
  }

  async getCompoundDetails(compoundId: string): Promise<ApiResponse<Compound>> {
    try {
      const response = await apiClient.communityRequest('GET', `/compounds/${compoundId}`);
      if (!response.success) throw new Error(response.error);
      return { success: true, data: response.data.compound };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Amenities Management
  async getCompoundAmenities(compoundId: string): Promise<ApiResponse<Amenity[]>> {
    try {
      const response = await apiClient.communityRequest('GET', '/amenities', { compound_id: compoundId });
      if (!response.success) throw new Error(response.error);
      return { success: true, data: response.data.amenities || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getAmenityBookings(userId: string, filters?: {
    amenity_id?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ApiResponse<AmenityBooking[]>> {
    try {
      const response = await apiClient.communityRequest('GET', '/amenities/bookings', { 
        resident_user_id: userId, 
        ...filters 
      });
      if (!response.success) throw new Error(response.error);
      return { success: true, data: response.data.bookings || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async createAmenityBooking(bookingData: {
    amenity_id: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    guest_count: number;
    booking_notes?: string;
  }): Promise<ApiResponse<AmenityBooking>> {
    try {
      const response = await apiClient.communityRequest('POST', '/amenities/bookings', bookingData);
      if (!response.success) throw new Error(response.error);
      return { success: true, data: response.data.booking };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async cancelAmenityBooking(bookingId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.communityRequest('PUT', `/amenities/bookings/${bookingId}`, {
        booking_status: 'cancelled'
      });
      if (!response.success) throw new Error(response.error);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Visitor Management
  async getVisitorPasses(userId: string, filters?: {
    status?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ApiResponse<VisitorPass[]>> {
    try {
      const response = await apiClient.communityRequest('GET', '/visitor-passes', {
        resident_user_id: userId, 
        ...filters
      });
      if (!response.success) throw new Error(response.error);
      return { success: true, data: response.data.visitorPasses || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async createVisitorPass(visitorData: {
    visitor_name: string;
    visitor_phone: string;
    visitor_id_number?: string;
    visit_purpose: string;
    expected_arrival: string;
    expected_departure?: string;
  }): Promise<ApiResponse<VisitorPass>> {
    try {
      const response = await apiClient.communityRequest('POST', '/visitor-passes', visitorData);
      if (!response.success) throw new Error(response.error);
      return { success: true, data: response.data.visitorPass };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async cancelVisitorPass(passId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.communityRequest('PUT', `/visitor-passes/${passId}`, {
        access_status: 'cancelled'
      });
      if (!response.success) throw new Error(response.error);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async checkInVisitor(passId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.communityRequest('POST', `/visitor-passes/${passId}/check-in`);
      if (!response.success) throw new Error(response.error);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  generateVisitorQRCode(visitorPass: VisitorPass): string {
    const qrData = {
      id: visitorPass.id,
      visitor_name: visitorPass.visitor_name,
      visitor_phone: visitorPass.visitor_phone,
      unit_number: (visitorPass as any).unit_number || 'N/A',
      compound_name: (visitorPass as any).compound_name || 'N/A',
      visit_date: visitorPass.expected_arrival.split('T')[0],
      visit_time: visitorPass.expected_arrival.split('T')[1]?.substring(0, 5) || 'N/A',
      created_by: visitorPass.resident_user_id,
      status: visitorPass.access_status
    };
    return JSON.stringify(qrData);
  }

  // Service Requests
  async getServiceRequests(userId: string, filters?: {
    status?: string;
    category?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ApiResponse<ServiceRequest[]>> {
    try {
      const response = await apiClient.communityRequest('GET', '/service-requests', {
        resident_user_id: userId, 
        ...filters
      });
      if (!response.success) throw new Error(response.error);
      return { success: true, data: response.data.serviceRequests || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async createServiceRequest(requestData: {
    category: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }): Promise<ApiResponse<ServiceRequest>> {
    try {
      const response = await apiClient.communityRequest('POST', '/service-requests', requestData);
      if (!response.success) throw new Error(response.error);
      return { success: true, data: response.data.serviceRequest };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async rateServiceRequest(requestId: string, rating: number, review?: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.communityRequest('PUT', `/service-requests/${requestId}`, {
        resident_rating: rating,
        resident_review: review
      });
      if (!response.success) throw new Error(response.error);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Community Announcements
  async getCommunityAnnouncements(compoundId: string, filters?: {
    type?: string;
    priority?: string;
  }): Promise<ApiResponse<CommunityAnnouncement[]>> {
    try {
      const response = await apiClient.communityRequest('GET', '/announcements', {
        compound_id: compoundId, 
        ...filters
      });
      if (!response.success) throw new Error(response.error);
      return { success: true, data: response.data.announcements || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async markAnnouncementRead(announcementId: string): Promise<ApiResponse<void>> {
    try {
      // Track read status locally or via API if endpoint exists
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Community Fees
  async getCommunityFees(userId: string, filters?: {
    status?: string;
    fee_type?: string;
    year?: number;
    month?: number;
  }): Promise<ApiResponse<CommunityFee[]>> {
    try {
      const response = await apiClient.communityRequest('GET', '/fees', {
        resident_user_id: userId, 
        ...filters
      });
      if (!response.success) throw new Error(response.error);
      return { success: true, data: response.data.fees || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async payFee(feeId: string, paymentMethod: string, paymentDetails?: {
    amount?: number;
    payment_reference?: string;
    paymob_transaction_id?: string;
    notes?: string;
  }): Promise<ApiResponse<{ payment_reference: string; fully_paid: boolean; remaining_amount: number }>> {
    try {
      // First get fee details to determine payment amount
      const { data: fees } = await this.getCommunityFees('current_user', { });
      const fee = fees?.find(f => f.id === feeId);
      
      if (!fee) {
        throw new Error('Fee not found');
      }

      const paymentAmount = paymentDetails?.amount || fee.amount;
      
      const response = await apiClient.communityRequest('POST', `/fees/${feeId}/pay`, {
        payment_amount: paymentAmount,
        payment_method: paymentMethod,
        payment_reference: paymentDetails?.payment_reference || `mobile_${Date.now()}`,
        paymob_transaction_id: paymentDetails?.paymob_transaction_id,
        notes: paymentDetails?.notes || `Mobile payment via ${paymentMethod}`
      });
      
      if (!response.success) throw new Error(response.error);
      
      return { 
        success: true, 
        data: {
          payment_reference: response.data.payment.reference,
          fully_paid: response.data.payment.fully_paid,
          remaining_amount: response.data.payment.remaining_amount
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Resident Profile Management
  async getResidentProfile(userId: string): Promise<ApiResponse<ResidentProfile>> {
    try {
      const { data, error } = await supabase
        .from('compound_residents')
        .select(`
          *,
          community_units (
            *,
            compounds (name, location_address)
          )
        `)
        .eq('user_id', userId)
        .is('move_out_date', null)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Get resident profile error:', error);
      return { success: false, error: error.message };
    }
  }

  async updateResidentProfile(userId: string, profileData: Partial<ResidentProfile>): Promise<ApiResponse<ResidentProfile>> {
    try {
      const { data, error } = await supabase
        .from('compound_residents')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Update resident profile error:', error);
      return { success: false, error: error.message };
    }
  }

  // Utility Methods
  async checkResidentAccess(userId: string): Promise<{ isResident: boolean; compoundIds: string[] }> {
    try {
      const { data, error } = await supabase
        .from('compound_residents')
        .select('community_units(compound_id)')
        .eq('user_id', userId)
        .is('move_out_date', null);

      if (error) throw error;

      const compoundIds = data?.map((resident: any) => resident.community_units.compound_id) || [];
      return { isResident: compoundIds.length > 0, compoundIds };
    } catch (error: any) {
      console.error('❌ Check resident access error:', error);
      return { isResident: false, compoundIds: [] };
    }
  }

  async getUserRoles(userId: string): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) throw error;

      const roles = data?.map(r => r.role) || [];
      return { success: true, data: roles };
    } catch (error: any) {
      console.error('❌ Get user roles error:', error);
      return { success: false, error: error.message };
    }
  }

  // Error handling helper
  private handleError(error: any, operation: string): ApiResponse<never> {
    console.error(`❌ CommunityService ${operation} error:`, error);
    
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        `Failed to ${operation.toLowerCase()}`;
    
    return { success: false, error: errorMessage };
  }

  // Analytics and logging
  logCommunityAction(action: string, details?: any): void {
    console.log(`📊 Community Action: ${action}`, details);
    // Could integrate with analytics service here
  }
}

export default CommunityService.getInstance();