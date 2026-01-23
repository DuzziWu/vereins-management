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
      profiles: {
        Row: {
          created_at: string
          date_of_birth: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          phone: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_of_birth: string
          first_name: string
          id?: string
          is_active?: boolean
          last_name: string
          phone?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      get_failed_login_count: {
        Args: { check_email: string; check_ip: string }
        Returns: number
      }
      get_my_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          date_of_birth: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          phone: string | null
          role: string
          updated_at: string
          user_id: string
        }
      }
      is_vorstand: { Args: Record<PropertyKey, never>; Returns: boolean }
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

export type UserRole = 'vorstand' | 'trainer' | 'mitglied'
