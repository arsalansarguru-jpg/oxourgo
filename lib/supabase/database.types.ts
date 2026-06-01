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
          deleted_at?: string | null
          archived_at?: string | null
          archived_by?: string | null
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
          deleted_at?: string | null
          archived_at?: string | null
          archived_by?: string | null
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
          deleted_at?: string | null
          archived_at?: string | null
          archived_by?: string | null
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
          /** Booking gallery: [{ path, label }] in fleet bucket. */
          gallery_images: Json
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
          fleet_ops_note?: string | null
          model?: string | null
          chassis_number?: string | null
          vehicle_location?: string | null
          odometer_km?: number | null
          insurance_expiry?: string | null
          puc_expiry?: string | null
          rc_expiry?: string | null
          rc_storage_path?: string | null
          insurance_storage_path?: string | null
          puc_storage_path?: string | null
          fastag_id?: string | null
          gps_tracker_id?: string | null
          gps_status?: string | null
          fuel_level_pct?: number | null
          last_gps_ping_at?: string | null
          deleted_at?: string | null
          archived_at?: string | null
          archived_by?: string | null
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
          gallery_images?: Json
          featured?: boolean
          available?: boolean
          availability_status?: string
          year?: number
          registration_number?: string
          security_deposit?: number
          catalog_category?: string | null
          fleet_ops_note?: string | null
          model?: string | null
          chassis_number?: string | null
          vehicle_location?: string | null
          odometer_km?: number | null
          insurance_expiry?: string | null
          puc_expiry?: string | null
          rc_expiry?: string | null
          rc_storage_path?: string | null
          insurance_storage_path?: string | null
          puc_storage_path?: string | null
          fastag_id?: string | null
          gps_tracker_id?: string | null
          gps_status?: string | null
          fuel_level_pct?: number | null
          last_gps_ping_at?: string | null
          deleted_at?: string | null
          archived_at?: string | null
          archived_by?: string | null
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
          gallery_images?: Json
          featured?: boolean
          available?: boolean
          availability_status?: string
          year?: number
          registration_number?: string
          security_deposit?: number
          catalog_category?: string | null
          fleet_ops_note?: string | null
          model?: string | null
          chassis_number?: string | null
          vehicle_location?: string | null
          odometer_km?: number | null
          insurance_expiry?: string | null
          puc_expiry?: string | null
          rc_expiry?: string | null
          rc_storage_path?: string | null
          insurance_storage_path?: string | null
          puc_storage_path?: string | null
          fastag_id?: string | null
          gps_tracker_id?: string | null
          gps_status?: string | null
          fuel_level_pct?: number | null
          last_gps_ping_at?: string | null
          deleted_at?: string | null
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      booking_vehicle_assignments: {
        Row: {
          id: string
          booking_id: string
          from_vehicle_id: string | null
          to_vehicle_id: string
          changed_by: string | null
          reason: string | null
          recalculate_pricing: boolean
          previous_total_rupees: number | null
          new_total_rupees: number | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          from_vehicle_id?: string | null
          to_vehicle_id: string
          changed_by?: string | null
          reason?: string | null
          recalculate_pricing?: boolean
          previous_total_rupees?: number | null
          new_total_rupees?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          from_vehicle_id?: string | null
          to_vehicle_id?: string
          changed_by?: string | null
          reason?: string | null
          recalculate_pricing?: boolean
          previous_total_rupees?: number | null
          new_total_rupees?: number | null
          created_at?: string
        }
        Relationships: []
      }
      booking_ops_activity: {
        Row: {
          id: string
          booking_id: string
          actor_user_id: string | null
          activity_type: string
          summary: string
          payload: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          actor_user_id?: string | null
          activity_type: string
          summary: string
          payload?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          actor_user_id?: string | null
          activity_type?: string
          summary?: string
          payload?: Json | null
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
          payment_method: string
          payment_status: string
          payment_gateway: string | null
          payment_gateway_order_id: string | null
          payment_gateway_payment_id: string | null
          payment_checkout_status: string
          amount_due: number
          amount_paid: number
          payment_received_at: string | null
          payment_received_by: string | null
          payment_notes: string | null
          ops_note: string | null
          admin_internal_notes: string | null
          approved_at: string | null
          handed_over_at: string | null
          returned_at: string | null
          completed_at: string | null
          approved_by: string | null
          handed_over_by: string | null
          completed_by: string | null
          deposit_held_rupees: number | null
          deposit_refunded_at: string | null
          deposit_refunded_rupees: number | null
          deposit_amount: number | null
          deposit_status: string
          refund_amount: number
          penalty_total: number
          deductions: Json
          refund_processed_at: string | null
          penalty_fuel_rupees: number
          penalty_cleaning_rupees: number
          penalty_traffic_rupees: number
          penalty_notes: Json
          financial_manual_override: boolean
          deposit_received_at: string | null
          pickup_checklist: Json
          return_checklist: Json
          pickup_fuel_level: number | null
          return_fuel_level: number | null
          pickup_odometer_km: number | null
          return_odometer_km: number | null
          pickup_condition_notes: Json
          return_condition_notes: Json
          penalty_damage_rupees: number
          penalty_late_rupees: number
          penalty_extra_km_rupees: number
          deposit_penalty_total_rupees: number
          customer_handover_signature_path: string | null
          customer_handover_signed_at: string | null
          pickup_inspection_completed_at: string | null
          return_inspection_completed_at: string | null
          outstanding_fines_rupees: number
          booking_source: string
          customer_contact_id: string | null
          whatsapp_conversation_id: string | null
          ops_hold_at: string | null
          ops_hold_reason: string | null
          vip_flag: boolean
          customer_flags: Json
          restrictions_bypass: boolean
          custom_discount_rupees: number
          deleted_at?: string | null
          archived_at?: string | null
          archived_by?: string | null
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
          payment_method?: string
          payment_status?: string
          payment_gateway?: string | null
          payment_gateway_order_id?: string | null
          payment_gateway_payment_id?: string | null
          payment_checkout_status?: string
          amount_due?: number
          amount_paid?: number
          payment_received_at?: string | null
          payment_received_by?: string | null
          payment_notes?: string | null
          ops_note?: string | null
          admin_internal_notes?: string | null
          approved_at?: string | null
          handed_over_at?: string | null
          returned_at?: string | null
          completed_at?: string | null
          approved_by?: string | null
          handed_over_by?: string | null
          completed_by?: string | null
          deposit_held_rupees?: number | null
          deposit_refunded_at?: string | null
          deposit_refunded_rupees?: number | null
          deposit_amount?: number | null
          deposit_status?: string
          refund_amount?: number
          penalty_total?: number
          deductions?: Json
          refund_processed_at?: string | null
          penalty_fuel_rupees?: number
          penalty_cleaning_rupees?: number
          penalty_traffic_rupees?: number
          penalty_notes?: Json
          financial_manual_override?: boolean
          deposit_received_at?: string | null
          pickup_checklist?: Json
          return_checklist?: Json
          pickup_fuel_level?: number | null
          return_fuel_level?: number | null
          pickup_odometer_km?: number | null
          return_odometer_km?: number | null
          pickup_condition_notes?: Json
          return_condition_notes?: Json
          penalty_damage_rupees?: number | null
          penalty_late_rupees?: number | null
          penalty_extra_km_rupees?: number | null
          deposit_penalty_total_rupees?: number | null
          customer_handover_signature_path?: string | null
          customer_handover_signed_at?: string | null
          pickup_inspection_completed_at?: string | null
          return_inspection_completed_at?: string | null
          outstanding_fines_rupees?: number
          booking_source?: string
          customer_contact_id?: string | null
          whatsapp_conversation_id?: string | null
          ops_hold_at?: string | null
          ops_hold_reason?: string | null
          vip_flag?: boolean
          customer_flags?: Json
          restrictions_bypass?: boolean
          custom_discount_rupees?: number
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
          payment_method?: string
          payment_status?: string
          payment_gateway?: string | null
          payment_gateway_order_id?: string | null
          payment_gateway_payment_id?: string | null
          payment_checkout_status?: string
          amount_due?: number
          amount_paid?: number
          payment_received_at?: string | null
          payment_received_by?: string | null
          payment_notes?: string | null
          ops_note?: string | null
          admin_internal_notes?: string | null
          approved_at?: string | null
          handed_over_at?: string | null
          returned_at?: string | null
          completed_at?: string | null
          approved_by?: string | null
          handed_over_by?: string | null
          completed_by?: string | null
          deposit_held_rupees?: number | null
          deposit_refunded_at?: string | null
          deposit_refunded_rupees?: number | null
          deposit_amount?: number | null
          deposit_status?: string
          refund_amount?: number
          penalty_total?: number
          deductions?: Json
          refund_processed_at?: string | null
          penalty_fuel_rupees?: number
          penalty_cleaning_rupees?: number
          penalty_traffic_rupees?: number
          penalty_notes?: Json
          financial_manual_override?: boolean
          deposit_received_at?: string | null
          pickup_checklist?: Json
          return_checklist?: Json
          pickup_fuel_level?: number | null
          return_fuel_level?: number | null
          pickup_odometer_km?: number | null
          return_odometer_km?: number | null
          pickup_condition_notes?: Json
          return_condition_notes?: Json
          penalty_damage_rupees?: number
          penalty_late_rupees?: number
          penalty_extra_km_rupees?: number
          deposit_penalty_total_rupees?: number
          customer_handover_signature_path?: string | null
          customer_handover_signed_at?: string | null
          pickup_inspection_completed_at?: string | null
          return_inspection_completed_at?: string | null
          outstanding_fines_rupees?: number
          booking_source?: string
          customer_contact_id?: string | null
          whatsapp_conversation_id?: string | null
          ops_hold_at?: string | null
          ops_hold_reason?: string | null
          vip_flag?: boolean
          customer_flags?: Json
          restrictions_bypass?: boolean
          custom_discount_rupees?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_contacts: {
        Row: {
          id: string
          e164: string
          user_id: string | null
          full_name: string | null
          email: string | null
          whatsapp_opt_in: boolean
          preferred_channel: string
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          e164: string
          user_id?: string | null
          full_name?: string | null
          email?: string | null
          whatsapp_opt_in?: boolean
          preferred_channel?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          e164?: string
          user_id?: string | null
          full_name?: string | null
          email?: string | null
          whatsapp_opt_in?: boolean
          preferred_channel?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          id: string
          customer_contact_id: string
          external_wa_id: string | null
          status: string
          flow_state: string
          context: Json
          active_booking_id: string | null
          assigned_ops_user_id: string | null
          last_inbound_at: string | null
          last_outbound_at: string | null
          escalated_at: string | null
          escalation_reason: string | null
          ai_enabled: boolean
          last_ai_turn_at: string | null
          last_ai_model: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_contact_id: string
          external_wa_id?: string | null
          status?: string
          flow_state?: string
          context?: Json
          active_booking_id?: string | null
          assigned_ops_user_id?: string | null
          last_inbound_at?: string | null
          last_outbound_at?: string | null
          escalated_at?: string | null
          escalation_reason?: string | null
          ai_enabled?: boolean
          last_ai_turn_at?: string | null
          last_ai_model?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_contact_id?: string
          external_wa_id?: string | null
          status?: string
          flow_state?: string
          context?: Json
          active_booking_id?: string | null
          assigned_ops_user_id?: string | null
          last_inbound_at?: string | null
          last_outbound_at?: string | null
          escalated_at?: string | null
          escalation_reason?: string | null
          ai_enabled?: boolean
          last_ai_turn_at?: string | null
          last_ai_model?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_conversation_messages: {
        Row: {
          id: string
          conversation_id: string
          direction: string
          message_type: string
          body: string | null
          payload: Json
          provider_message_id: string | null
          idempotency_key: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          direction: string
          message_type?: string
          body?: string | null
          payload?: Json
          provider_message_id?: string | null
          idempotency_key?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          direction?: string
          message_type?: string
          body?: string | null
          payload?: Json
          provider_message_id?: string | null
          idempotency_key?: string | null
          created_at?: string
        }
        Relationships: []
      }
      booking_violations: {
        Row: {
          id: string
          booking_id: string
          user_id: string
          violation_type: string
          amount_rupees: number
          reason: string
          violation_date: string
          authority_source: string | null
          notes: string | null
          status: string
          challan_storage_path: string | null
          challan_mime: string | null
          challan_file_name: string | null
          amount_paid_rupees: number
          amount_deducted_rupees: number
          customer_notified_at: string | null
          paid_at: string | null
          deducted_at: string | null
          resolved_at: string | null
          created_by: string | null
          deleted_at: string | null
          archived_at: string | null
          archived_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          user_id: string
          violation_type: string
          amount_rupees: number
          reason: string
          violation_date: string
          authority_source?: string | null
          notes?: string | null
          status?: string
          challan_storage_path?: string | null
          challan_mime?: string | null
          challan_file_name?: string | null
          amount_paid_rupees?: number
          amount_deducted_rupees?: number
          customer_notified_at?: string | null
          paid_at?: string | null
          deducted_at?: string | null
          resolved_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          user_id?: string
          violation_type?: string
          amount_rupees?: number
          reason?: string
          violation_date?: string
          authority_source?: string | null
          notes?: string | null
          status?: string
          challan_storage_path?: string | null
          challan_mime?: string | null
          challan_file_name?: string | null
          amount_paid_rupees?: number
          amount_deducted_rupees?: number
          customer_notified_at?: string | null
          paid_at?: string | null
          deducted_at?: string | null
          resolved_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      booking_violation_events: {
        Row: {
          id: string
          violation_id: string
          booking_id: string
          event_type: string
          payload: Json
          actor_user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          violation_id: string
          booking_id: string
          event_type: string
          payload?: Json
          actor_user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          violation_id?: string
          booking_id?: string
          event_type?: string
          payload?: Json
          actor_user_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      booking_inspection_events: {
        Row: {
          id: string
          booking_id: string
          event_type: string
          payload: Json
          actor_user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          event_type: string
          payload?: Json
          actor_user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          event_type?: string
          payload?: Json
          actor_user_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      booking_inspection_photos: {
        Row: {
          id: string
          booking_id: string
          phase: string
          slot: string
          storage_path: string
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          phase: string
          slot: string
          storage_path: string
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          phase?: string
          slot?: string
          storage_path?: string
          created_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          user_id: string
          full_name: string | null
          display_name: string | null
          avatar_url: string | null
          phone: string | null
          preferences: Json
          verification_tier: string
          kyc_status: string
          kyc_submitted_at: string | null
          kyc_approved_at: string | null
          admin_notes: string | null
          risk_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          full_name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          preferences?: Json
          verification_tier?: string
          kyc_status?: string
          kyc_submitted_at?: string | null
          kyc_approved_at?: string | null
          admin_notes?: string | null
          risk_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          full_name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          preferences?: Json
          verification_tier?: string
          kyc_status?: string
          kyc_submitted_at?: string | null
          kyc_approved_at?: string | null
          admin_notes?: string | null
          risk_score?: number
          created_at?: string
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
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          byte_size: number | null
          content_type: string | null
          original_filename: string | null
          deleted_at: string | null
          archived_at: string | null
          archived_by: string | null
          storage_retention_until: string | null
          storage_pinned: boolean
          recovery_metadata: Json
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
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          byte_size?: number | null
          content_type?: string | null
          original_filename?: string | null
          deleted_at?: string | null
          archived_at?: string | null
          archived_by?: string | null
          storage_retention_until?: string | null
          storage_pinned?: boolean
          recovery_metadata?: Json
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
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          byte_size?: number | null
          content_type?: string | null
          original_filename?: string | null
          deleted_at?: string | null
          archived_at?: string | null
          archived_by?: string | null
          storage_retention_until?: string | null
          storage_pinned?: boolean
          recovery_metadata?: Json
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
      audit_logs: {
        Row: {
          id: string
          actor_id: string | null
          actor_role: string | null
          entity_type: string
          entity_id: string | null
          action: string
          old_value: Json | null
          new_value: Json | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          actor_role?: string | null
          entity_type: string
          entity_id?: string | null
          action: string
          old_value?: Json | null
          new_value?: Json | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string | null
          actor_role?: string | null
          entity_type?: string
          entity_id?: string | null
          action?: string
          old_value?: Json | null
          new_value?: Json | null
          metadata?: Json | null
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
      outbound_jobs: {
        Row: {
          id: string
          channel: string
          template_key: string
          idempotency_key: string
          payload: Json
          to_email: string | null
          to_e164: string | null
          status: string
          attempts: number
          next_run_at: string
          last_error: string | null
          correlation_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          channel?: string
          template_key: string
          idempotency_key: string
          payload?: Json
          to_email?: string | null
          to_e164?: string | null
          status?: string
          attempts?: number
          next_run_at?: string
          last_error?: string | null
          correlation_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          channel?: string
          template_key?: string
          idempotency_key?: string
          payload?: Json
          to_email?: string | null
          to_e164?: string | null
          status?: string
          attempts?: number
          next_run_at?: string
          last_error?: string | null
          correlation_id?: string | null
          created_at?: string
          updated_at?: string
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
      deleted_entity_snapshots: {
        Row: {
          id: string
          entity_type: string
          entity_id: string
          snapshot: Json
          deleted_at: string
          deleted_by: string | null
          restored_at: string | null
          restored_by: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          entity_type: string
          entity_id: string
          snapshot: Json
          deleted_at?: string
          deleted_by?: string | null
          restored_at?: string | null
          restored_by?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          entity_type?: string
          entity_id?: string
          snapshot?: Json
          deleted_at?: string
          deleted_by?: string | null
          restored_at?: string | null
          restored_by?: string | null
          metadata?: Json
        }
        Relationships: []
      }
      launch_checklist_completions: {
        Row: {
          item_key: string
          completed: boolean
          notes: string | null
          completed_at: string | null
          completed_by: string | null
          updated_at: string
        }
        Insert: {
          item_key: string
          completed?: boolean
          notes?: string | null
          completed_at?: string | null
          completed_by?: string | null
          updated_at?: string
        }
        Update: {
          item_key?: string
          completed?: boolean
          notes?: string | null
          completed_at?: string | null
          completed_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      launch_qa_signoffs: {
        Row: {
          test_key: string
          status: string
          notes: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          test_key: string
          status?: string
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          test_key?: string
          status?: string
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      backup_operation_logs: {
        Row: {
          id: string
          operation_type: string
          status: string
          summary: string | null
          metadata: Json
          performed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          operation_type: string
          status?: string
          summary?: string | null
          metadata?: Json
          performed_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          operation_type?: string
          status?: string
          summary?: string | null
          metadata?: Json
          performed_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      support_conversations: {
        Row: {
          id: string
          user_id: string
          status: string
          last_message_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: string
          last_message_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: string
          last_message_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          id: string
          conversation_id: string
          sender_role: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_role: string
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_role?: string
          body?: string
          created_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          id: string
          user_id: string | null
          booking_id: string | null
          subject: string
          body: string
          category: string
          priority: string
          status: string
          assigned_to: string | null
          resolution_notes: string | null
          created_at: string
          updated_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          booking_id?: string | null
          subject: string
          body: string
          category?: string
          priority?: string
          status?: string
          assigned_to?: string | null
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          booking_id?: string | null
          subject?: string
          body?: string
          category?: string
          priority?: string
          status?: string
          assigned_to?: string | null
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
        }
        Relationships: []
      }
      damage_reports: {
        Row: {
          id: string
          booking_id: string | null
          vehicle_id: string | null
          user_id: string | null
          status: string
          description: string
          estimated_cost_rupees: number
          approved_cost_rupees: number | null
          customer_liable_rupees: number
          before_photo_paths: string[]
          after_photo_paths: string[]
          repair_notes: string | null
          reported_at: string
          resolved_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id?: string | null
          vehicle_id?: string | null
          user_id?: string | null
          status?: string
          description: string
          estimated_cost_rupees?: number
          approved_cost_rupees?: number | null
          customer_liable_rupees?: number
          before_photo_paths?: string[]
          after_photo_paths?: string[]
          repair_notes?: string | null
          reported_at?: string
          resolved_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string | null
          vehicle_id?: string | null
          user_id?: string | null
          status?: string
          description?: string
          estimated_cost_rupees?: number
          approved_cost_rupees?: number | null
          customer_liable_rupees?: number
          before_photo_paths?: string[]
          after_photo_paths?: string[]
          repair_notes?: string | null
          reported_at?: string
          resolved_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      vehicle_maintenance_logs: {
        Row: {
          id: string
          vehicle_id: string
          maintenance_type: string
          status: string
          title: string
          description: string | null
          scheduled_at: string | null
          completed_at: string | null
          odometer_km: number | null
          cost_rupees: number | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          maintenance_type?: string
          status?: string
          title: string
          description?: string | null
          scheduled_at?: string | null
          completed_at?: string | null
          odometer_km?: number | null
          cost_rupees?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          maintenance_type?: string
          status?: string
          title?: string
          description?: string | null
          scheduled_at?: string | null
          completed_at?: string | null
          odometer_km?: number | null
          cost_rupees?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          id: string
          booking_id: string
          user_id: string
          invoice_number: string
          invoice_type: string
          subtotal_rupees: number
          gst_rupees: number
          total_rupees: number
          status: string
          issued_at: string | null
          pdf_storage_path: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          user_id: string
          invoice_number: string
          invoice_type?: string
          subtotal_rupees?: number
          gst_rupees?: number
          total_rupees?: number
          status?: string
          issued_at?: string | null
          pdf_storage_path?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          user_id?: string
          invoice_number?: string
          invoice_type?: string
          subtotal_rupees?: number
          gst_rupees?: number
          total_rupees?: number
          status?: string
          issued_at?: string | null
          pdf_storage_path?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: {
      claim_outbound_jobs_batch: {
        Args: { p_batch_size?: number }
        Returns: Database['public']['Tables']['outbound_jobs']['Row'][]
      }
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
