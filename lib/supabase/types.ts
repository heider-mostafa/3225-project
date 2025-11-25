export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string
          title: string
          description: string | null
          price: number
          bedrooms: number | null
          bathrooms: number | null
          square_meters: number | null
          address: string
          city: string
          state: string
          zip_code: string
          property_type: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          price: number
          bedrooms?: number | null
          bathrooms?: number | null
          square_meters?: number | null
          address: string
          city: string
          state: string
          zip_code: string
          property_type: string
          status: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          price?: number
          bedrooms?: number | null
          bathrooms?: number | null
          square_meters?: number | null
          address?: string
          city?: string
          state?: string
          zip_code?: string
          property_type?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      community_developers: {
        Row: {
          id: string
          company_name: string
          commercial_registration: string
          logo_url: string | null
          contact_person_name: string
          contact_phone: string
          contact_email: string
          company_address: string | null
          subscription_tier: string
          subscription_status: string
          monthly_fee: number
          whitelabel_config: Json
          api_credentials: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          commercial_registration: string
          logo_url?: string | null
          contact_person_name: string
          contact_phone: string
          contact_email: string
          company_address?: string | null
          subscription_tier?: string
          subscription_status?: string
          monthly_fee?: number
          whitelabel_config?: Json
          api_credentials?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          commercial_registration?: string
          logo_url?: string | null
          contact_person_name?: string
          contact_phone?: string
          contact_email?: string
          company_address?: string | null
          subscription_tier?: string
          subscription_status?: string
          monthly_fee?: number
          whitelabel_config?: Json
          api_credentials?: Json
          created_at?: string
          updated_at?: string
        }
      }
      compounds: {
        Row: {
          id: string
          developer_id: string
          name: string
          address: string
          city: string
          district: string | null
          location_lat: number | null
          location_lng: number | null
          total_units: number
          total_area_sqm: number | null
          handover_year: number | null
          compound_type: string
          compound_manager_user_id: string | null
          management_company: string | null
          emergency_phone: string | null
          operating_hours_start: string
          operating_hours_end: string
          security_level: string
          is_active: boolean
          branding_config: Json
          notification_settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          developer_id: string
          name: string
          address: string
          city?: string
          district?: string | null
          location_lat?: number | null
          location_lng?: number | null
          total_units: number
          total_area_sqm?: number | null
          handover_year?: number | null
          compound_type?: string
          compound_manager_user_id?: string | null
          management_company?: string | null
          emergency_phone?: string | null
          operating_hours_start?: string
          operating_hours_end?: string
          security_level?: string
          is_active?: boolean
          branding_config?: Json
          notification_settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          developer_id?: string
          name?: string
          address?: string
          city?: string
          district?: string | null
          location_lat?: number | null
          location_lng?: number | null
          total_units?: number
          total_area_sqm?: number | null
          handover_year?: number | null
          compound_type?: string
          compound_manager_user_id?: string | null
          management_company?: string | null
          emergency_phone?: string | null
          operating_hours_start?: string
          operating_hours_end?: string
          security_level?: string
          is_active?: boolean
          branding_config?: Json
          notification_settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      community_units: {
        Row: {
          id: string
          compound_id: string
          property_id: string | null
          unit_number: string
          building_name: string | null
          floor_number: number | null
          unit_type: string | null
          bedrooms: number | null
          bathrooms: number | null
          area_sqm: number | null
          orientation: string | null
          owner_user_id: string | null
          tenant_user_id: string | null
          purchase_date: string | null
          purchase_price: number | null
          market_value: number | null
          rental_status: string
          monthly_rent: number | null
          lease_start_date: string | null
          lease_end_date: string | null
          maintenance_fee: number | null
          unit_status: string
          accessibility_features: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          compound_id: string
          property_id?: string | null
          unit_number: string
          building_name?: string | null
          floor_number?: number | null
          unit_type?: string | null
          bedrooms?: number | null
          bathrooms?: number | null
          area_sqm?: number | null
          orientation?: string | null
          owner_user_id?: string | null
          tenant_user_id?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          market_value?: number | null
          rental_status?: string
          monthly_rent?: number | null
          lease_start_date?: string | null
          lease_end_date?: string | null
          maintenance_fee?: number | null
          unit_status?: string
          accessibility_features?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          compound_id?: string
          property_id?: string | null
          unit_number?: string
          building_name?: string | null
          floor_number?: number | null
          unit_type?: string | null
          bedrooms?: number | null
          bathrooms?: number | null
          area_sqm?: number | null
          orientation?: string | null
          owner_user_id?: string | null
          tenant_user_id?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          market_value?: number | null
          rental_status?: string
          monthly_rent?: number | null
          lease_start_date?: string | null
          lease_end_date?: string | null
          maintenance_fee?: number | null
          unit_status?: string
          accessibility_features?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      compound_residents: {
        Row: {
          id: string
          compound_id: string
          unit_id: string
          user_id: string
          resident_type: string
          move_in_date: string | null
          move_out_date: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          is_primary_resident: boolean
          notification_preferences: Json
          access_level: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          compound_id: string
          unit_id: string
          user_id: string
          resident_type: string
          move_in_date?: string | null
          move_out_date?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          is_primary_resident?: boolean
          notification_preferences?: Json
          access_level?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          compound_id?: string
          unit_id?: string
          user_id?: string
          resident_type?: string
          move_in_date?: string | null
          move_out_date?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          is_primary_resident?: boolean
          notification_preferences?: Json
          access_level?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      resident_vehicles: {
        Row: {
          id: string
          compound_resident_id: string
          vehicle_make: string
          vehicle_model: string
          vehicle_year: number | null
          license_plate: string
          vehicle_color: string | null
          vehicle_type: string
          is_primary_vehicle: boolean
          parking_spot_number: string | null
          registration_date: string
          insurance_expiry: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          compound_resident_id: string
          vehicle_make: string
          vehicle_model: string
          vehicle_year?: number | null
          license_plate: string
          vehicle_color?: string | null
          vehicle_type?: string
          is_primary_vehicle?: boolean
          parking_spot_number?: string | null
          registration_date?: string
          insurance_expiry?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          compound_resident_id?: string
          vehicle_make?: string
          vehicle_model?: string
          vehicle_year?: number | null
          license_plate?: string
          vehicle_color?: string | null
          vehicle_type?: string
          is_primary_vehicle?: boolean
          parking_spot_number?: string | null
          registration_date?: string
          insurance_expiry?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      compound_amenities: {
        Row: {
          id: string
          compound_id: string
          name: string
          amenity_type: string
          description: string | null
          location_details: string | null
          capacity: number | null
          operating_hours_start: string | null
          operating_hours_end: string | null
          booking_required: boolean
          booking_advance_days: number
          booking_duration_minutes: number
          fee_per_hour: number | null
          is_available: boolean
          maintenance_schedule: Json | null
          rules_and_regulations: Json | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          compound_id: string
          name: string
          amenity_type?: string
          description?: string | null
          location_details?: string | null
          capacity?: number | null
          operating_hours_start?: string | null
          operating_hours_end?: string | null
          booking_required?: boolean
          booking_advance_days?: number
          booking_duration_minutes?: number
          fee_per_hour?: number | null
          is_available?: boolean
          maintenance_schedule?: Json | null
          rules_and_regulations?: Json | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          compound_id?: string
          name?: string
          amenity_type?: string
          description?: string | null
          location_details?: string | null
          capacity?: number | null
          operating_hours_start?: string | null
          operating_hours_end?: string | null
          booking_required?: boolean
          booking_advance_days?: number
          booking_duration_minutes?: number
          fee_per_hour?: number | null
          is_available?: boolean
          maintenance_schedule?: Json | null
          rules_and_regulations?: Json | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      amenity_bookings: {
        Row: {
          id: string
          amenity_id: string
          resident_id: string
          booking_date: string
          start_time: string
          end_time: string
          number_of_guests: number
          special_requests: string | null
          booking_status: string
          total_fee: number | null
          payment_status: string
          approved_by: string | null
          approved_at: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          amenity_id: string
          resident_id: string
          booking_date: string
          start_time: string
          end_time: string
          number_of_guests?: number
          special_requests?: string | null
          booking_status?: string
          total_fee?: number | null
          payment_status?: string
          approved_by?: string | null
          approved_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          amenity_id?: string
          resident_id?: string
          booking_date?: string
          start_time?: string
          end_time?: string
          number_of_guests?: number
          special_requests?: string | null
          booking_status?: string
          total_fee?: number | null
          payment_status?: string
          approved_by?: string | null
          approved_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      visitor_passes: {
        Row: {
          id: string
          compound_id: string
          host_resident_id: string
          visitor_name: string
          visitor_phone: string | null
          visitor_email: string | null
          visit_purpose: string | null
          expected_arrival: string
          expected_departure: string | null
          actual_arrival: string | null
          actual_departure: string | null
          qr_code: string
          access_granted: boolean
          pass_status: string
          vehicle_license_plate: string | null
          security_notes: string | null
          approved_by: string | null
          checked_in_by: string | null
          checked_out_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          compound_id: string
          host_resident_id: string
          visitor_name: string
          visitor_phone?: string | null
          visitor_email?: string | null
          visit_purpose?: string | null
          expected_arrival: string
          expected_departure?: string | null
          actual_arrival?: string | null
          actual_departure?: string | null
          qr_code?: string
          access_granted?: boolean
          pass_status?: string
          vehicle_license_plate?: string | null
          security_notes?: string | null
          approved_by?: string | null
          checked_in_by?: string | null
          checked_out_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          compound_id?: string
          host_resident_id?: string
          visitor_name?: string
          visitor_phone?: string | null
          visitor_email?: string | null
          visit_purpose?: string | null
          expected_arrival?: string
          expected_departure?: string | null
          actual_arrival?: string | null
          actual_departure?: string | null
          qr_code?: string
          access_granted?: boolean
          pass_status?: string
          vehicle_license_plate?: string | null
          security_notes?: string | null
          approved_by?: string | null
          checked_in_by?: string | null
          checked_out_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      community_fees: {
        Row: {
          id: string
          unit_id: string
          fee_type: string
          amount: number
          currency: string
          billing_period: string
          due_date: string
          paid_amount: number
          payment_status: string
          payment_date: string | null
          payment_method: string | null
          payment_reference: string | null
          late_fee: number
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          unit_id: string
          fee_type?: string
          amount: number
          currency?: string
          billing_period?: string
          due_date: string
          paid_amount?: number
          payment_status?: string
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          late_fee?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          unit_id?: string
          fee_type?: string
          amount?: number
          currency?: string
          billing_period?: string
          due_date?: string
          paid_amount?: number
          payment_status?: string
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          late_fee?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      community_service_requests: {
        Row: {
          id: string
          compound_id: string
          unit_id: string | null
          requestor_resident_id: string
          service_type: string
          priority: string
          title: string
          description: string
          location_details: string | null
          requested_completion_date: string | null
          status: string
          assigned_provider_id: string | null
          estimated_cost: number | null
          actual_cost: number | null
          scheduled_date: string | null
          completed_date: string | null
          resident_rating: number | null
          resident_feedback: string | null
          provider_notes: string | null
          attachments: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          compound_id: string
          unit_id?: string | null
          requestor_resident_id: string
          service_type?: string
          priority?: string
          title: string
          description: string
          location_details?: string | null
          requested_completion_date?: string | null
          status?: string
          assigned_provider_id?: string | null
          estimated_cost?: number | null
          actual_cost?: number | null
          scheduled_date?: string | null
          completed_date?: string | null
          resident_rating?: number | null
          resident_feedback?: string | null
          provider_notes?: string | null
          attachments?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          compound_id?: string
          unit_id?: string | null
          requestor_resident_id?: string
          service_type?: string
          priority?: string
          title?: string
          description?: string
          location_details?: string | null
          requested_completion_date?: string | null
          status?: string
          assigned_provider_id?: string | null
          estimated_cost?: number | null
          actual_cost?: number | null
          scheduled_date?: string | null
          completed_date?: string | null
          resident_rating?: number | null
          resident_feedback?: string | null
          provider_notes?: string | null
          attachments?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      community_announcements: {
        Row: {
          id: string
          compound_id: string
          author_user_id: string
          title: string
          content: string
          announcement_type: string
          priority: string
          is_published: boolean
          publish_date: string | null
          expiry_date: string | null
          target_audience: string
          attachment_urls: Json | null
          read_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          compound_id: string
          author_user_id: string
          title: string
          content: string
          announcement_type?: string
          priority?: string
          is_published?: boolean
          publish_date?: string | null
          expiry_date?: string | null
          target_audience?: string
          attachment_urls?: Json | null
          read_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          compound_id?: string
          author_user_id?: string
          title?: string
          content?: string
          announcement_type?: string
          priority?: string
          is_published?: boolean
          publish_date?: string | null
          expiry_date?: string | null
          target_audience?: string
          attachment_urls?: Json | null
          read_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      property_photos: {
        Row: {
          id: string
          property_id: string
          url: string
          is_primary: boolean
          order_index: number | null
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          url: string
          is_primary?: boolean
          order_index?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          url?: string
          is_primary?: boolean
          order_index?: number | null
          created_at?: string
        }
      }
      inquiries: {
        Row: {
          id: string
          property_id: string
          user_id: string | null
          name: string
          email: string
          phone: string | null
          message: string
          status: string
          source: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          user_id?: string | null
          name: string
          email: string
          phone?: string | null
          message: string
          status?: string
          source?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          user_id?: string | null
          name?: string
          email?: string
          phone?: string | null
          message?: string
          status?: string
          source?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'admin' | 'super_admin' | 'broker' | 'appraiser' | 'photographer' | 'developer' | 'compound_manager' | 'resident_owner' | 'resident_tenant' | 'security_guard'
          compound_id: string | null
          developer_id: string | null
          is_active: boolean
          assigned_at: string
          assigned_by: string | null
          revoked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'admin' | 'super_admin' | 'broker' | 'appraiser' | 'photographer' | 'developer' | 'compound_manager' | 'resident_owner' | 'resident_tenant' | 'security_guard'
          compound_id?: string | null
          developer_id?: string | null
          is_active?: boolean
          assigned_at?: string
          assigned_by?: string | null
          revoked_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'admin' | 'super_admin' | 'broker' | 'appraiser' | 'photographer' | 'developer' | 'compound_manager' | 'resident_owner' | 'resident_tenant' | 'security_guard'
          compound_id?: string | null
          developer_id?: string | null
          is_active?: boolean
          assigned_at?: string
          assigned_by?: string | null
          revoked_at?: string | null
          created_at?: string
        }
      }
    }
  }
}

// Export commonly used types for convenience
export type UserRole = Database['public']['Tables']['user_roles']['Row']
export type UserRoleInsert = Database['public']['Tables']['user_roles']['Insert']
export type UserRoleUpdate = Database['public']['Tables']['user_roles']['Update']

export type ValidUserRole = UserRole['role'] 