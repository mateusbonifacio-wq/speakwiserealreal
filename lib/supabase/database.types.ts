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
      profiles: {
        Row: {
          id: string
          full_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          created_at?: string
        }
      }
      audio_sessions: {
        Row: {
          id: string
          user_id: string
          type: string
          audio_path: string
          transcript: string | null
          analysis_json: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          audio_path: string
          transcript?: string | null
          analysis_json?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          audio_path?: string
          transcript?: string | null
          analysis_json?: Json | null
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
      [_ in never]: never
    }
  }
}

