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
      users: {
        Row: {
          id: string
          email: string
          name: string
          headline: string | null
          location: string | null
          company: string | null
          skills: string[]
          experience: Json | null
          profile_image: string | null
          is_public: boolean
          linkedin_id: string | null
          linkedin_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          headline?: string | null
          location?: string | null
          company?: string | null
          skills?: string[]
          experience?: Json | null
          profile_image?: string | null
          is_public?: boolean
          linkedin_id?: string | null
          linkedin_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          headline?: string | null
          location?: string | null
          company?: string | null
          skills?: string[]
          experience?: Json | null
          profile_image?: string | null
          is_public?: boolean
          linkedin_id?: string | null
          linkedin_data?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      connections: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED'
          message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED'
          message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED'
          message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      repo_sessions: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          audio_url: string | null
          transcript: string | null
          ai_analysis: Json | null
          topics: string[]
          skills: string[]
          experiences: Json[]
          goals: Json[]
          challenges: Json[]
          duration: number
          is_private: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          audio_url?: string | null
          transcript?: string | null
          ai_analysis?: Json | null
          topics?: string[]
          skills?: string[]
          experiences?: Json[]
          goals?: Json[]
          challenges?: Json[]
          duration?: number
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          audio_url?: string | null
          transcript?: string | null
          ai_analysis?: Json | null
          topics?: string[]
          skills?: string[]
          experiences?: Json[]
          goals?: Json[]
          challenges?: Json[]
          duration?: number
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      repo_permissions: {
        Row: {
          id: string
          owner_id: string
          granted_to_id: string
          access_level: 'VIEW_ONLY' | 'VIEW_AUDIO' | 'COACHING' | 'FULL_ACCESS'
          can_add_notes: boolean
          can_view_audio: boolean
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          granted_to_id: string
          access_level: 'VIEW_ONLY' | 'VIEW_AUDIO' | 'COACHING' | 'FULL_ACCESS'
          can_add_notes?: boolean
          can_view_audio?: boolean
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          granted_to_id?: string
          access_level?: 'VIEW_ONLY' | 'VIEW_AUDIO' | 'COACHING' | 'FULL_ACCESS'
          can_add_notes?: boolean
          can_view_audio?: boolean
          expires_at?: string | null
          created_at?: string
        }
      }
      repo_access_requests: {
        Row: {
          id: string
          requester_id: string
          repo_owner_id: string
          purpose: string
          requested_level: 'VIEW_ONLY' | 'VIEW_AUDIO' | 'COACHING' | 'FULL_ACCESS'
          status: 'PENDING' | 'APPROVED' | 'DECLINED'
          message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          repo_owner_id: string
          purpose: string
          requested_level: 'VIEW_ONLY' | 'VIEW_AUDIO' | 'COACHING' | 'FULL_ACCESS'
          status?: 'PENDING' | 'APPROVED' | 'DECLINED'
          message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          repo_owner_id?: string
          purpose?: string
          requested_level?: 'VIEW_ONLY' | 'VIEW_AUDIO' | 'COACHING' | 'FULL_ACCESS'
          status?: 'PENDING' | 'APPROVED' | 'DECLINED'
          message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      coaching_sessions: {
        Row: {
          id: string
          client_id: string
          coach_id: string
          title: string
          audio_url: string | null
          transcript: string | null
          coaching_notes: string | null
          action_items: Json[]
          follow_up_date: string | null
          status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          coach_id: string
          title: string
          audio_url?: string | null
          transcript?: string | null
          coaching_notes?: string | null
          action_items?: Json[]
          follow_up_date?: string | null
          status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          coach_id?: string
          title?: string
          audio_url?: string | null
          transcript?: string | null
          coaching_notes?: string | null
          action_items?: Json[]
          follow_up_date?: string | null
          status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
          created_at?: string
          updated_at?: string
        }
      }
      coaching_notes: {
        Row: {
          id: string
          author_id: string
          repo_session_id: string | null
          coaching_session_id: string | null
          content: string
          is_private: boolean
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          repo_session_id?: string | null
          coaching_session_id?: string | null
          content: string
          is_private?: boolean
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          repo_session_id?: string | null
          coaching_session_id?: string | null
          content?: string
          is_private?: boolean
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          title: string
          company: string
          location: string
          description: string | null
          requirements: string | null
          salary: string | null
          is_remote: boolean
          url: string | null
          source: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          company: string
          location: string
          description?: string | null
          requirements?: string | null
          salary?: string | null
          is_remote?: boolean
          url?: string | null
          source?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          company?: string
          location?: string
          description?: string | null
          requirements?: string | null
          salary?: string | null
          is_remote?: boolean
          url?: string | null
          source?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      saved_jobs: {
        Row: {
          id: string
          user_id: string
          job_id: string
          notes: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_id: string
          notes?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_id?: string
          notes?: string | null
          status?: string
          created_at?: string
        }
      }
      job_searches: {
        Row: {
          id: string
          user_id: string
          query: string
          transcript: string | null
          results: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          query: string
          transcript?: string | null
          results?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          query?: string
          transcript?: string | null
          results?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      connection_status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED'
      repo_access_level: 'VIEW_ONLY' | 'VIEW_AUDIO' | 'COACHING' | 'FULL_ACCESS'
      request_status: 'PENDING' | 'APPROVED' | 'DECLINED'
      coaching_status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type User = Database['public']['Tables']['users']['Row']
export type Connection = Database['public']['Tables']['connections']['Row']
export type RepoSession = Database['public']['Tables']['repo_sessions']['Row']
export type RepoPermission = Database['public']['Tables']['repo_permissions']['Row']
export type RepoAccessRequest = Database['public']['Tables']['repo_access_requests']['Row']
export type CoachingSession = Database['public']['Tables']['coaching_sessions']['Row']
export type CoachingNote = Database['public']['Tables']['coaching_notes']['Row']
export type Job = Database['public']['Tables']['jobs']['Row']
export type SavedJob = Database['public']['Tables']['saved_jobs']['Row']
export type JobSearch = Database['public']['Tables']['job_searches']['Row']