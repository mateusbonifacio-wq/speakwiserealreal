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
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          project_type: string | null
          default_audience: string | null
          default_goal: string | null
          default_duration: string | null
          default_scenario: string | null
          english_level: string | null
          tone_style: string | null
          constraints: string | null
          additional_notes: string | null
          context_transcript: string | null
          transcription_language: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          project_type?: string | null
          default_audience?: string | null
          default_goal?: string | null
          default_duration?: string | null
          default_scenario?: string | null
          english_level?: string | null
          tone_style?: string | null
          constraints?: string | null
          additional_notes?: string | null
          context_transcript?: string | null
          transcription_language?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          project_type?: string | null
          default_audience?: string | null
          default_goal?: string | null
          default_duration?: string | null
          default_scenario?: string | null
          english_level?: string | null
          tone_style?: string | null
          constraints?: string | null
          additional_notes?: string | null
          context_transcript?: string | null
          transcription_language?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      audio_sessions: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          type: string
          audio_path: string
          transcript: string | null
          analysis_json: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          type: string
          audio_path: string
          transcript?: string | null
          analysis_json?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
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

