/**
 * Hand-maintained types for public schema + RPCs.
 * Regenerate when schema grows: `npx supabase gen types typescript --project-id <ref>`
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      cars: {
        Row: {
          id: string
          brand: string
          model: string
          year: number
          registration_number: string
          fuel_type: string
          transmission: string
          seats: number
          pricing_per_day: number
          security_deposit: number
          availability_status: string
          featured: boolean
          cover_image_path: string | null
          gallery_paths: string[]
          created_at: string
        }
        Insert: {
          id?: string
          brand: string
          model: string
          year: number
          registration_number: string
          fuel_type: string
          transmission: string
          seats: number
          pricing_per_day: number
          security_deposit: number
          availability_status?: string
          featured?: boolean
          cover_image_path?: string | null
          gallery_paths?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          brand?: string
          model?: string
          year?: number
          registration_number?: string
          fuel_type?: string
          transmission?: string
          seats?: number
          pricing_per_day?: number
          security_deposit?: number
          availability_status?: string
          featured?: boolean
          cover_image_path?: string | null
          gallery_paths?: string[]
          created_at?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          id: string
          name: string
          brand: string
          city: string | null
          transmission: string
          fuel_type: string
          seats: number
          price_per_day: number
          image: string | null
          featured: boolean
          /** When set, drives catalog + booking (matches Supabase `available`). */
          available?: boolean
          /** Legacy text status; optional if the table only uses `available`. */
          availability_status?: string
          year: number
          registration_number: string
          security_deposit: number
          /** Public fleet segment: SUV, Sedan, Hatchback, Luxury, Budget */
          catalog_category?: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          brand: string
          city?: string | null
          transmission: string
          fuel_type: string
          seats: number
          price_per_day: number
          image?: string | null
          featured?: boolean
          available?: boolean
          availability_status?: string
          year?: number
          registration_number?: string
          security_deposit?: number
          catalog_category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          brand?: string
          city?: string | null
          transmission?: string
          fuel_type?: string
          seats?: number
          price_per_day?: number
          image?: string | null
          featured?: boolean
          available?: boolean
          availability_status?: string
          year?: number
          registration_number?: string
          security_deposit?: number
          catalog_category?: string | null
          created_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          id: string
          vehicle_id: string | null
          user_id: string
          pickup_date: string
          return_date: string
          pickup_location: string
          return_location: string
          rental_days: number
          price_per_day_rupees_snapshot: number
          subtotal_rupees: number
          convenience_fee_rupees: number
          gst_rupees: number
          total_rupees: number
          booking_status: string
          payment_status: string
          ops_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id?: string | null
          user_id: string
          pickup_date: string
          return_date: string
          pickup_location: string
          return_location: string
          rental_days: number
          price_per_day_rupees_snapshot: number
          subtotal_rupees: number
          convenience_fee_rupees?: number
          gst_rupees?: number
          total_rupees: number
          booking_status?: string
          payment_status?: string
          ops_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string | null
          user_id?: string
          pickup_date?: string
          return_date?: string
          pickup_location?: string
          return_location?: string
          rental_days?: number
          price_per_day_rupees_snapshot?: number
          subtotal_rupees?: number
          convenience_fee_rupees?: number
          gst_rupees?: number
          total_rupees?: number
          booking_status?: string
          payment_status?: string
          ops_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          user_id: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          preferences: Json
          verification_tier: string
          admin_notes: string | null
          risk_score: number
          updated_at: string
        }
        Insert: {
          user_id: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          preferences?: Json
          verification_tier?: string
          admin_notes?: string | null
          risk_score?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          preferences?: Json
          verification_tier?: string
          admin_notes?: string | null
          risk_score?: number
          updated_at?: string
        }
        Relationships: []
      }
      kyc_documents: {
        Row: {
          id: string
          user_id: string
          document_type: string
          storage_path: string
          status: string
          reviewer_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          byte_size: number | null
          content_type: string | null
          original_filename: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          document_type: string
          storage_path: string
          status?: string
          reviewer_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          byte_size?: number | null
          content_type?: string | null
          original_filename?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          document_type?: string
          storage_path?: string
          status?: string
          reviewer_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          byte_size?: number | null
          content_type?: string | null
          original_filename?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_audit_events: {
        Row: {
          id: string
          actor_user_id: string
          action: string
          entity_type: string
          entity_id: string | null
          payload: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_user_id: string
          action: string
          entity_type: string
          entity_id?: string | null
          payload?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_user_id?: string
          action?: string
          entity_type?: string
          entity_id?: string | null
          payload?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string | null
          metadata: Json
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body?: string | null
          metadata?: Json
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          body?: string | null
          metadata?: Json
          read_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      ops_alerts: {
        Row: {
          id: string
          type: string
          title: string
          body: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          type: string
          title: string
          body?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          type?: string
          title?: string
          body?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      ops_alert_dismissals: {
        Row: {
          alert_id: string
          admin_user_id: string
          dismissed_at: string
        }
        Insert: {
          alert_id: string
          admin_user_id: string
          dismissed_at?: string
        }
        Update: {
          alert_id?: string
          admin_user_id?: string
          dismissed_at?: string
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          id: string
          user_id: string
          booking_id: string | null
          title: string
          amount_rupees: number
          direction: string
          status: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          booking_id?: string | null
          title: string
          amount_rupees: number
          direction: string
          status?: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          booking_id?: string | null
          title?: string
          amount_rupees?: number
          direction?: string
          status?: string
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: {
      has_booking_overlap: {
        Args: {
          p_car_id: string
          p_pickup: string
          p_return: string
          p_exclude_booking_id?: string | null
        }
        Returns: boolean
      }
      has_vehicle_booking_overlap: {
        Args: {
          p_vehicle_id: string
          p_pickup: string
          p_return: string
          p_exclude_booking_id?: string | null
        }
        Returns: boolean
      }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

export type BookingRow = Database['public']['Tables']['bookings']['Row']
export type CarRow = Database['public']['Tables']['cars']['Row']
export type VehicleSummaryRow = Pick<
  Database['public']['Tables']['vehicles']['Row'],
  | 'id'
  | 'name'
  | 'brand'
  | 'price_per_day'
  | 'image'
  | 'available'
  | 'transmission'
  | 'fuel_type'
  | 'seats'
  | 'year'
  | 'registration_number'
  | 'security_deposit'
>

export type BookingWithCar = BookingRow & {
  vehicles: VehicleSummaryRow | VehicleSummaryRow[] | null
}
export type NotificationRow = Database['public']['Tables']['notifications']['Row']
