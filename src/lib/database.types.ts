// Database types for Supabase
// This file can be auto-generated using: npx supabase gen types typescript

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Profile type
export interface Profile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  address: string | null
  address_street: string | null
  address_zip: string | null
  address_city: string | null
  city: string | null
  postal_code: string | null
  date_of_birth: string | null
  avatar_url: string | null
  is_vorstand: boolean
  is_active: boolean
  role: string | null
  membership_type_id: string | null
  created_at: string
  updated_at: string
}

// Club Settings type
export interface ClubSettings {
  id: string
  club_name: string
  club_short_name: string | null
  logo_url: string | null
  logo_path: string | null
  address: string | null
  address_street: string | null
  address_zip: string | null
  address_city: string | null
  city: string | null
  postal_code: string | null
  phone: string | null
  email: string | null
  website: string | null
  website_url: string | null
  founded_year: number | null
  registration_number: string | null
  tax_id: string | null
  bank_name: string | null
  bank_iban: string | null
  bank_bic: string | null
  created_at: string
  updated_at: string
}

// Database type for Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & Pick<Profile, 'user_id' | 'first_name' | 'last_name' | 'email'>
        Update: Partial<Profile>
      }
      club_settings: {
        Row: ClubSettings
        Insert: Partial<ClubSettings> & Pick<ClubSettings, 'club_name'>
        Update: Partial<ClubSettings>
      }
      // Add other tables as needed
    }
    Views: Record<string, never>
    Functions: {
      is_vorstand: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: Record<string, never>
  }
}
