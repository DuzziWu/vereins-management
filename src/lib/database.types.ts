export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
          id: string
          fee_id: string
          old_amount: number
          new_amount: number
          reason: string
          adjusted_by: string
          created_at: string | null
        }
        Insert: {
          id?: string
          fee_id: string
          old_amount: number
          new_amount: number
          reason: string
          adjusted_by: string
          created_at?: string | null
        }
        Update: {
          id?: string
          fee_id?: string
          old_amount?: number
          new_amount?: number
          reason?: string
          adjusted_by?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_adjustments_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "membership_fees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_adjustments_adjusted_by_fkey"
            columns: ["adjusted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          trainer_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          trainer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          trainer_id?: string | null
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
          id: string
          fee_id: string
          amount: number
          payment_date: string
          payment_method: string
          note: string | null
          is_cancelled: boolean
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_by: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          fee_id: string
          amount: number
          payment_date: string
          payment_method: string
          note?: string | null
          is_cancelled?: boolean
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_by: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          fee_id?: string
          amount?: number
          payment_date?: string
          payment_method?: string
          note?: string | null
          is_cancelled?: boolean
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_by?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "membership_fees"
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
            foreignKeyName: "payments_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_reset_rate_limit: {
        Args: { check_email: string; check_ip: string }
        Returns: boolean
      }
      cleanup_old_reset_attempts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_notification: {
        Args: {
          p_user_id: string
          p_type: string
          p_title: string
          p_message: string
          p_link?: string
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
      }
      get_failed_login_count: {
        Args: { check_email: string; check_ip: string }
        Returns: number
      }
      get_my_profile: {
        Args: Record<PropertyKey, never>
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
          notes: string | null
          phone: string | null
          role: string
          status: string | null
          updated_at: string
          user_id: string | null
        }
      }
      get_unread_notification_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_membership_type_member_count: {
        Args: { type_id: string }
        Returns: number
      }
      is_vorstand: { Args: Record<PropertyKey, never>; Returns: boolean }
      mark_all_notifications_read: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: undefined
      }
      upsert_trainer_note: {
        Args: { p_group_id: string; p_content: string }
        Returns: {
          content: string | null
          created_at: string | null
          group_id: string
          id: string
          trainer_id: string
          updated_at: string | null
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

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience types
export type Profile = Tables<'profiles'>
export type Invitation = Tables<'invitations'>
export type LoginAttempt = Tables<'login_attempts'>
export type PasswordResetAttempt = Tables<'password_reset_attempts'>
export type Group = Tables<'groups'>
export type TrainerNote = Tables<'trainer_notes'>
export type Notification = Tables<'notifications'>
export type Family = Tables<'families'>
export type MembershipType = Tables<'membership_types'>
export type MembershipFee = Tables<'membership_fees'>
export type FeeAdjustment = Tables<'fee_adjustments'>
export type Payment = Tables<'payments'>

export type UserRole = 'vorstand' | 'trainer' | 'mitglied'
export type MemberStatus = 'active' | 'inactive' | 'pending'
export type NotificationType = 'invitation' | 'document' | 'event' | 'group_change' | 'system'

// Extended types with relations
export type ProfileWithFamily = Profile & {
  families: Family | null
}

export type FamilyWithMembers = Family & {
  primary_member: Pick<Profile, 'id' | 'first_name' | 'last_name'> | null
  members: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'role' | 'status'>[]
  member_count?: number
}
