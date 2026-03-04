export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface AnnotationSpan {
  text: string
  form: 'subjunctive' | 'indicative' | null
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          current_level: string
          computed_level: string
          daily_goal_minutes: number
          streak: number
          last_studied_date: string | null
          created_at: string
          onboarding_completed: boolean
          push_subscription: Json | null
        }
        Insert: {
          id: string
          display_name?: string | null
          current_level?: string
          computed_level?: string
          daily_goal_minutes?: number
          streak?: number
          last_studied_date?: string | null
          created_at?: string
          onboarding_completed?: boolean
          push_subscription?: Json | null
        }
        Update: {
          id?: string
          display_name?: string | null
          current_level?: string
          computed_level?: string
          daily_goal_minutes?: number
          streak?: number
          last_studied_date?: string | null
          created_at?: string
          onboarding_completed?: boolean
          push_subscription?: Json | null
        }
        Relationships: []
      }
      modules: {
        Row: {
          id: string
          title: string
          description: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          order_index?: number
          created_at?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          id: string
          module_id: string
          title: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          module_id: string
          title: string
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          title?: string
          order_index?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'units_module_id_fkey'
            columns: ['module_id']
            referencedRelation: 'modules'
            referencedColumns: ['id']
          }
        ]
      }
      concepts: {
        Row: {
          id: string
          unit_id: string
          type: string
          title: string
          explanation: string
          examples: Json
          difficulty: number
          level: string
          grammar_focus: string | null
          created_at: string
        }
        Insert: {
          id?: string
          unit_id: string
          type: string
          title: string
          explanation: string
          examples?: Json
          difficulty?: number
          level?: string
          grammar_focus?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          unit_id?: string
          type?: string
          title?: string
          explanation?: string
          examples?: Json
          difficulty?: number
          level?: string
          grammar_focus?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'concepts_unit_id_fkey'
            columns: ['unit_id']
            referencedRelation: 'units'
            referencedColumns: ['id']
          }
        ]
      }
      exercises: {
        Row: {
          id: string
          concept_id: string
          type: string
          prompt: string
          expected_answer: string | null
          answer_variants: Json | null
          hint_1: string | null
          hint_2: string | null
          annotations: AnnotationSpan[] | null
          created_at: string
        }
        Insert: {
          id?: string
          concept_id: string
          type: string
          prompt: string
          expected_answer?: string | null
          answer_variants?: Json | null
          hint_1?: string | null
          hint_2?: string | null
          annotations?: AnnotationSpan[] | null
          created_at?: string
        }
        Update: {
          id?: string
          concept_id?: string
          type?: string
          prompt?: string
          expected_answer?: string | null
          answer_variants?: Json | null
          hint_1?: string | null
          hint_2?: string | null
          annotations?: AnnotationSpan[] | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'exercises_concept_id_fkey'
            columns: ['concept_id']
            referencedRelation: 'concepts'
            referencedColumns: ['id']
          }
        ]
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          concept_id: string
          ease_factor: number
          interval_days: number
          due_date: string
          repetitions: number
          last_reviewed_at: string | null
          production_mastered: boolean
        }
        Insert: {
          id?: string
          user_id: string
          concept_id: string
          ease_factor?: number
          interval_days?: number
          due_date?: string
          repetitions?: number
          last_reviewed_at?: string | null
          production_mastered?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          concept_id?: string
          ease_factor?: number
          interval_days?: number
          due_date?: string
          repetitions?: number
          last_reviewed_at?: string | null
          production_mastered?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'user_progress_concept_id_fkey'
            columns: ['concept_id']
            referencedRelation: 'concepts'
            referencedColumns: ['id']
          }
        ]
      }
      exercise_attempts: {
        Row: {
          id: string
          user_id: string
          exercise_id: string | null
          user_answer: string
          is_correct: boolean | null
          ai_score: number | null
          ai_feedback: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exercise_id?: string | null
          user_answer: string
          is_correct?: boolean | null
          ai_score?: number | null
          ai_feedback?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exercise_id?: string | null
          user_answer?: string
          is_correct?: boolean | null
          ai_score?: number | null
          ai_feedback?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'exercise_attempts_exercise_id_fkey'
            columns: ['exercise_id']
            referencedRelation: 'exercises'
            referencedColumns: ['id']
          }
        ]
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          started_at: string
          ended_at: string | null
          concepts_reviewed: number
          accuracy: number | null
        }
        Insert: {
          id?: string
          user_id: string
          started_at?: string
          ended_at?: string | null
          concepts_reviewed?: number
          accuracy?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          started_at?: string
          ended_at?: string | null
          concepts_reviewed?: number
          accuracy?: number | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience row types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Module = Database['public']['Tables']['modules']['Row']
export type Unit = Database['public']['Tables']['units']['Row']
export type Concept = Database['public']['Tables']['concepts']['Row']
export type Exercise = Database['public']['Tables']['exercises']['Row']
export type UserProgress = Database['public']['Tables']['user_progress']['Row']
export type ExerciseAttempt = Database['public']['Tables']['exercise_attempts']['Row']
export type StudySession = Database['public']['Tables']['study_sessions']['Row']
