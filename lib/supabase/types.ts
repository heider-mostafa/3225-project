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
    }
  }
} 