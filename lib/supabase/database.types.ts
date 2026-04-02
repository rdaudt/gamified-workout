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
      coach_applications: {
        Row: {
          created_at: string
          id: string
          payload: Json
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database['public']['Enums']['coach_application_status']
          submitted_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database['public']['Enums']['coach_application_status']
          submitted_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database['public']['Enums']['coach_application_status']
          submitted_at?: string
          user_id?: string
        }
      }
      coach_business_profiles: {
        Row: {
          business_email: string | null
          business_location: string | null
          business_logo_url: string | null
          business_motto: string | null
          business_name: string | null
          business_phone_number: string | null
          created_at: string
          facebook_url: string | null
          instagram_url: string | null
          linkedin_url: string | null
          updated_at: string
          user_id: string
          youtube_url: string | null
        }
        Insert: {
          business_email?: string | null
          business_location?: string | null
          business_logo_url?: string | null
          business_motto?: string | null
          business_name?: string | null
          business_phone_number?: string | null
          created_at?: string
          facebook_url?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          updated_at?: string
          user_id: string
          youtube_url?: string | null
        }
        Update: {
          business_email?: string | null
          business_location?: string | null
          business_logo_url?: string | null
          business_motto?: string | null
          business_name?: string | null
          business_phone_number?: string | null
          created_at?: string
          facebook_url?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          updated_at?: string
          user_id?: string
          youtube_url?: string | null
        }
      }
      coach_directory_settings: {
        Row: {
          application_status: Database['public']['Enums']['coach_application_status']
          created_at: string
          is_approved: boolean
          updated_at: string
          user_id: string
          visibility_enabled: boolean
        }
        Insert: {
          application_status?: Database['public']['Enums']['coach_application_status']
          created_at?: string
          updated_at?: string
          user_id: string
          visibility_enabled?: boolean
        }
        Update: {
          application_status?: Database['public']['Enums']['coach_application_status']
          created_at?: string
          updated_at?: string
          user_id?: string
          visibility_enabled?: boolean
        }
      }
      coach_profiles: {
        Row: {
          accent_color: string
          booking_url: string | null
          created_at: string
          nickname: string
          phone_number: string
          picture_url: string
          professional_credentials: string | null
          short_bio: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string
          booking_url?: string | null
          created_at?: string
          nickname: string
          phone_number: string
          picture_url: string
          professional_credentials?: string | null
          short_bio?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string
          booking_url?: string | null
          created_at?: string
          nickname?: string
          phone_number?: string
          picture_url?: string
          professional_credentials?: string | null
          short_bio?: string | null
          updated_at?: string
          user_id?: string
        }
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_age_confirmed: boolean
          last_name: string | null
          nationality: string | null
          region: string | null
          updated_at: string
          user_name: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          is_age_confirmed?: boolean
          last_name?: string | null
          nationality?: string | null
          region?: string | null
          updated_at?: string
          user_name: string
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_age_confirmed?: boolean
          last_name?: string | null
          nationality?: string | null
          region?: string | null
          updated_at?: string
          user_name?: string
        }
      }
      trainee_coach_relationships: {
        Row: {
          attached_via: Database['public']['Enums']['relationship_source']
          coach_user_id: string | null
          created_at: string
          trainee_user_id: string
          updated_at: string
        }
        Insert: {
          attached_via?: Database['public']['Enums']['relationship_source']
          coach_user_id?: string | null
          created_at?: string
          trainee_user_id: string
          updated_at?: string
        }
        Update: {
          attached_via?: Database['public']['Enums']['relationship_source']
          coach_user_id?: string | null
          created_at?: string
          trainee_user_id?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          created_at: string
          role: Database['public']['Enums']['user_role']
          user_id: string
        }
        Insert: {
          created_at?: string
          role: Database['public']['Enums']['user_role']
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database['public']['Enums']['user_role']
          user_id?: string
        }
      }
      workouts: {
        Row: {
          accent_color: string
          branding_source: Database['public']['Enums']['branding_source']
          coach_booking_url: string | null
          coach_display_name: string | null
          coach_id: string | null
          created_at: string
          duration_seconds: number | null
          effort_score: number
          exercise: Database['public']['Enums']['exercise_type']
          form_score: number
          good_form_reps: number
          id: string
          occurred_at: string
          session_classification: string | null
          total_reps: number
          user_id: string
        }
        Insert: {
          accent_color: string
          branding_source: Database['public']['Enums']['branding_source']
          coach_booking_url?: string | null
          coach_display_name?: string | null
          coach_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          effort_score: number
          exercise: Database['public']['Enums']['exercise_type']
          form_score: number
          good_form_reps: number
          id?: string
          occurred_at?: string
          session_classification?: string | null
          total_reps: number
          user_id: string
        }
        Update: {
          accent_color?: string
          branding_source?: Database['public']['Enums']['branding_source']
          coach_booking_url?: string | null
          coach_display_name?: string | null
          coach_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          effort_score?: number
          exercise?: Database['public']['Enums']['exercise_type']
          form_score?: number
          good_form_reps?: number
          id?: string
          occurred_at?: string
          session_classification?: string | null
          total_reps?: number
          user_id?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      branding_source: 'app' | 'coach'
      coach_application_status: 'pending' | 'approved' | 'rejected'
      exercise_type: 'push-ups' | 'squats' | 'crunches' | 'burpees' | 'lunges'
      relationship_source: 'invite' | 'directory' | 'none'
      user_role: 'trainee' | 'coach' | 'admin'
    }
    CompositeTypes: {}
  }
}

export type PublicSchema = Database['public']
export type Tables<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Row']
