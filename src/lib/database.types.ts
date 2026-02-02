export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          actual_status: string | null
          created_at: string
          id: string
          profile_id: string
          recorded_at: string | null
          recorded_by: string | null
          rsvp_at: string | null
          rsvp_reason: string | null
          rsvp_status: string
          training_session_id: string
          updated_at: string
        }
        Insert: {
          actual_status?: string | null
          created_at?: string
          id?: string
          profile_id: string
          recorded_at?: string | null
          recorded_by?: string | null
          rsvp_at?: string | null
          rsvp_reason?: string | null
          rsvp_status?: string
          training_session_id: string
          updated_at?: string
        }
        Update: {
          actual_status?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          recorded_at?: string | null
          recorded_by?: string | null
          rsvp_at?: string | null
          rsvp_reason?: string | null
          rsvp_status?: string
          training_session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_training_session_id_fkey"
            columns: ["training_session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_audit_log: {
        Row: {
          attendance_id: string
          change_type: string
          changed_by: string
          created_at: string
          id: string
          new_actual_status: string | null
          new_rsvp_status: string | null
          old_actual_status: string | null
          old_rsvp_status: string | null
          profile_id: string
          training_session_id: string
        }
        Insert: {
          attendance_id: string
          change_type: string
          changed_by: string
          created_at?: string
          id?: string
          new_actual_status?: string | null
          new_rsvp_status?: string | null
          old_actual_status?: string | null
          old_rsvp_status?: string | null
          profile_id: string
          training_session_id: string
        }
        Update: {
          attendance_id?: string
          change_type?: string
          changed_by?: string
          created_at?: string
          id?: string
          new_actual_status?: string | null
          new_rsvp_status?: string | null
          old_actual_status?: string | null
          old_rsvp_status?: string | null
          profile_id?: string
          training_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_audit_log_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "attendance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_audit_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_audit_log_training_session_id_fkey"
            columns: ["training_session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      board_todos: {
        Row: {
          completed_at: string | null
          content: string
          created_at: string | null
          id: string
          is_completed: boolean | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      chat_rate_limits: {
        Row: {
          message_count: number
          profile_id: string
          window_start: string
        }
        Insert: {
          message_count?: number
          profile_id: string
          window_start?: string
        }
        Update: {
          message_count?: number
          profile_id?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rate_limits_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string | null
          id: string
          name: string
          primary_member_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          primary_member_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          primary_member_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "families_primary_member_id_fkey"
            columns: ["primary_member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_adjustments: {
        Row: {
          adjusted_by: string
          created_at: string | null
          fee_id: string
          id: string
          new_amount: number
          old_amount: number
          reason: string
        }
        Insert: {
          adjusted_by: string
          created_at?: string | null
          fee_id: string
          id?: string
          new_amount: number
          old_amount: number
          reason: string
        }
        Update: {
          adjusted_by?: string
          created_at?: string | null
          fee_id?: string
          id?: string
          new_amount?: number
          old_amount?: number
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_adjustments_adjusted_by_fkey"
            columns: ["adjusted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_adjustments_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "membership_fees"
            referencedColumns: ["id"]
          },
        ]
      }
      group_chat_reads: {
        Row: {
          group_id: string
          id: string
          last_read_at: string
          profile_id: string
        }
        Insert: {
          group_id: string
          id?: string
          last_read_at?: string
          profile_id: string
        }
        Update: {
          group_id?: string
          id?: string
          last_read_at?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_chat_reads_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_chat_reads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          profile_id: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          profile_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          sender_display_name: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          sender_display_name: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          sender_display_name?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_trainers: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          profile_id: string
          role: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          profile_id: string
          role?: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          profile_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_trainers_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_trainers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          chat_enabled: boolean
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_members: number | null
          name: string
          trainer_id: string | null
          training_day: string | null
          training_end_time: string | null
          training_location: string | null
          training_start_time: string | null
          updated_at: string | null
        }
        Insert: {
          chat_enabled?: boolean
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_members?: number | null
          name: string
          trainer_id?: string | null
          training_day?: string | null
          training_end_time?: string | null
          training_location?: string | null
          training_start_time?: string | null
          updated_at?: string | null
        }
        Update: {
          chat_enabled?: boolean
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_members?: number | null
          name?: string
          trainer_id?: string | null
          training_day?: string | null
          training_end_time?: string | null
          training_location?: string | null
          training_start_time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          first_name: string
          id: string
          invited_by: string
          last_name: string
          revoked_at: string | null
          role: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          first_name: string
          id?: string
          invited_by: string
          last_name: string
          revoked_at?: string | null
          role: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          first_name?: string
          id?: string
          invited_by?: string
          last_name?: string
          revoked_at?: string | null
          role?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: string
          ip_address: string
          success: boolean
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: string
          ip_address: string
          success?: boolean
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: string
          ip_address?: string
          success?: boolean
        }
        Relationships: []
      }
      membership_fees: {
        Row: {
          adjustment_reason: string | null
          amount_due: number
          amount_paid: number
          created_at: string | null
          family_id: string | null
          id: string
          membership_type_id: string | null
          profile_id: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          adjustment_reason?: string | null
          amount_due?: number
          amount_paid?: number
          created_at?: string | null
          family_id?: string | null
          id?: string
          membership_type_id?: string | null
          profile_id?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          adjustment_reason?: string | null
          amount_due?: number
          amount_paid?: number
          created_at?: string | null
          family_id?: string | null
          id?: string
          membership_type_id?: string | null
          profile_id?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "membership_fees_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_fees_membership_type_id_fkey"
            columns: ["membership_type_id"]
            isOneToOne: false
            referencedRelation: "membership_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_fees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_types: {
        Row: {
          annual_fee: number
          created_at: string | null
          description: string | null
          id: string
          is_family_flat: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          annual_fee?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_family_flat?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          annual_fee?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_family_flat?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      password_reset_attempts: {
        Row: {
          attempted_at: string | null
          email: string
          id: string
          ip_address: string
        }
        Insert: {
          attempted_at?: string | null
          email: string
          id?: string
          ip_address: string
        }
        Update: {
          attempted_at?: string | null
          email?: string
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string | null
          created_by: string
          fee_id: string
          id: string
          is_cancelled: boolean | null
          note: string | null
          payment_date: string
          payment_method: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          created_by: string
          fee_id: string
          id?: string
          is_cancelled?: boolean | null
          note?: string | null
          payment_date: string
          payment_method: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          created_by?: string
          fee_id?: string
          id?: string
          is_cancelled?: boolean | null
          note?: string | null
          payment_date?: string
          payment_method?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "membership_fees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_city: string | null
          address_street: string | null
          address_zip: string | null
          created_at: string
          date_of_birth: string
          family_id: string | null
          first_name: string
          functional_tags: string[] | null
          id: string
          is_active: boolean
          last_name: string
          membership_type_id: string | null
          notes: string | null
          phone: string | null
          role: string
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address_city?: string | null
          address_street?: string | null
          address_zip?: string | null
          created_at?: string
          date_of_birth: string
          family_id?: string | null
          first_name: string
          functional_tags?: string[] | null
          id?: string
          is_active?: boolean
          last_name: string
          membership_type_id?: string | null
          notes?: string | null
          phone?: string | null
          role?: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address_city?: string | null
          address_street?: string | null
          address_zip?: string | null
          created_at?: string
          date_of_birth?: string
          family_id?: string | null
          first_name?: string
          functional_tags?: string[] | null
          id?: string
          is_active?: boolean
          last_name?: string
          membership_type_id?: string | null
          notes?: string | null
          phone?: string | null
          role?: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_membership_type_id_fkey"
            columns: ["membership_type_id"]
            isOneToOne: false
            referencedRelation: "membership_types"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_notes: {
        Row: {
          content: string | null
          created_at: string | null
          group_id: string
          id: string
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          group_id: string
          id?: string
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          group_id?: string
          id?: string
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trainer_notes_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_notes_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_series: {
        Row: {
          created_at: string
          created_by: string
          day_of_week: number
          end_date: string | null
          end_time: string
          group_id: string
          id: string
          is_active: boolean
          location: string | null
          start_date: string
          start_time: string
        }
        Insert: {
          created_at?: string
          created_by: string
          day_of_week: number
          end_date?: string | null
          end_time: string
          group_id: string
          id?: string
          is_active?: boolean
          location?: string | null
          start_date: string
          start_time: string
        }
        Update: {
          created_at?: string
          created_by?: string
          day_of_week?: number
          end_date?: string | null
          end_time?: string
          group_id?: string
          id?: string
          is_active?: boolean
          location?: string | null
          start_date?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_series_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_series_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          cancellation_reason: string | null
          created_at: string
          created_by: string
          date: string
          description: string | null
          end_time: string
          group_id: string
          id: string
          is_cancelled: boolean
          location: string | null
          series_id: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          created_at?: string
          created_by: string
          date: string
          description?: string | null
          end_time: string
          group_id: string
          id?: string
          is_cancelled?: boolean
          location?: string | null
          series_id?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          created_at?: string
          created_by?: string
          date?: string
          description?: string | null
          end_time?: string
          group_id?: string
          id?: string
          is_cancelled?: boolean
          location?: string | null
          series_id?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "training_series"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_audit_log: {
        Row: {
          change_type: string
          changed_at: string
          changed_by: string
          changed_fields: string[]
          changes: Json
          id: string
          transaction_id: string
        }
        Insert: {
          change_type: string
          changed_at?: string
          changed_by: string
          changed_fields?: string[]
          changes?: Json
          id?: string
          transaction_id: string
        }
        Update: {
          change_type?: string
          changed_at?: string
          changed_by?: string
          changed_fields?: string[]
          changes?: Json
          id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_audit_log_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string
          id: string
          is_deleted: boolean | null
          note: string | null
          payment_id: string | null
          receipt_reference: string | null
          transaction_date: string
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description: string
          id?: string
          is_deleted?: boolean | null
          note?: string | null
          payment_id?: string | null
          receipt_reference?: string | null
          transaction_date: string
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string
          id?: string
          is_deleted?: boolean | null
          note?: string | null
          payment_id?: string | null
          receipt_reference?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_chat_rate_limit: {
        Args: {
          p_max_count?: number
          p_profile_id: string
          p_window_seconds?: number
        }
        Returns: boolean
      }
      check_is_group_co_trainer: {
        Args: { p_group_id: string; p_profile_id: string }
        Returns: boolean
      }
      check_is_group_member: {
        Args: { p_group_id: string; p_profile_id: string }
        Returns: boolean
      }
      check_is_group_trainer: {
        Args: { p_group_id: string; p_profile_id: string }
        Returns: boolean
      }
      check_reset_rate_limit: {
        Args: { check_email: string; check_ip: string }
        Returns: boolean
      }
      cleanup_old_reset_attempts: { Args: never; Returns: undefined }
      create_notification: {
        Args: {
          p_link?: string
          p_message: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "notifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_failed_login_count: {
        Args: { check_email: string; check_ip: string }
        Returns: number
      }
      get_group_age_range: { Args: { p_group_id: string }; Returns: string }
      get_group_member_count: { Args: { p_group_id: string }; Returns: number }
      get_group_member_counts: {
        Args: { group_ids: string[] }
        Returns: {
          group_id: string
          member_count: number
        }[]
      }
      get_membership_type_member_count: {
        Args: { type_id: string }
        Returns: number
      }
      get_my_profile: {
        Args: never
        Returns: {
          address_city: string | null
          address_street: string | null
          address_zip: string | null
          created_at: string
          date_of_birth: string
          family_id: string | null
          first_name: string
          functional_tags: string[] | null
          id: string
          is_active: boolean
          last_name: string
          membership_type_id: string | null
          notes: string | null
          phone: string | null
          role: string
          status: string | null
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_my_profile_id: { Args: never; Returns: string }
      get_my_role: { Args: never; Returns: string }
      get_treasury_balance: { Args: never; Returns: number }
      get_unread_message_counts: {
        Args: { p_profile_id: string }
        Returns: {
          group_id: string
          group_name: string
          unread_count: number
        }[]
      }
      get_unread_notification_count: { Args: never; Returns: number }
      is_group_participant: { Args: { p_group_id: string }; Returns: boolean }
      is_member_of_group: { Args: { p_group_id: string }; Returns: boolean }
      is_trainer_of_group: { Args: { p_group_id: string }; Returns: boolean }
      is_vorstand: { Args: never; Returns: boolean }
      mark_all_notifications_read: { Args: never; Returns: undefined }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: undefined
      }
      upsert_trainer_note: {
        Args: { p_content: string; p_group_id: string }
        Returns: {
          content: string | null
          created_at: string | null
          group_id: string
          id: string
          trainer_id: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "trainer_notes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      user_has_role: { Args: { required_role: string }; Returns: boolean }
      validate_invitation_token: {
        Args: { invite_token: string }
        Returns: {
          email: string
          error_message: string
          first_name: string
          id: string
          is_valid: boolean
          last_name: string
          role: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// Custom types for the application
export type UserRole = "vorstand" | "trainer" | "mitglied"

export type Profile = Tables<"profiles">
