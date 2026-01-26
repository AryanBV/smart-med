export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'
export type RelationshipType = 'parent' | 'child' | 'spouse' | 'sibling'
export type PermissionLevel = 'view' | 'edit' | 'admin'
export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type ReadingType = 'fasting' | 'pre_meal' | 'post_meal' | 'random' | 'bedtime'
export type MealContext = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'none'
export type InteractionSeverity = 'minor' | 'moderate' | 'major' | 'contraindicated'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          date_of_birth: string | null
          gender: Gender | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          gender?: Gender | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          gender?: Gender | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      family_members: {
        Row: {
          id: string
          created_by: string
          profile_id: string | null
          full_name: string
          date_of_birth: string | null
          gender: Gender | null
          is_registered: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by: string
          profile_id?: string | null
          full_name: string
          date_of_birth?: string | null
          gender?: Gender | null
          is_registered?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          profile_id?: string | null
          full_name?: string
          date_of_birth?: string | null
          gender?: Gender | null
          is_registered?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      family_relationships: {
        Row: {
          id: string
          member_id: string
          related_member_id: string
          relationship_type: RelationshipType
          created_at: string
        }
        Insert: {
          id?: string
          member_id: string
          related_member_id: string
          relationship_type: RelationshipType
          created_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          related_member_id?: string
          relationship_type?: RelationshipType
          created_at?: string
        }
      }
      access_permissions: {
        Row: {
          id: string
          owner_id: string
          viewer_id: string
          permission_level: PermissionLevel
          granted_at: string
          granted_by: string
        }
        Insert: {
          id?: string
          owner_id: string
          viewer_id: string
          permission_level?: PermissionLevel
          granted_at?: string
          granted_by: string
        }
        Update: {
          id?: string
          owner_id?: string
          viewer_id?: string
          permission_level?: PermissionLevel
          granted_at?: string
          granted_by?: string
        }
      }
      documents: {
        Row: {
          id: string
          owner_id: string
          file_path: string
          file_name: string
          file_type: string
          file_size: number
          ocr_status: DocumentStatus
          ocr_text: string | null
          ocr_error: string | null
          uploaded_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          owner_id: string
          file_path: string
          file_name: string
          file_type: string
          file_size: number
          ocr_status?: DocumentStatus
          ocr_text?: string | null
          ocr_error?: string | null
          uploaded_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          owner_id?: string
          file_path?: string
          file_name?: string
          file_type?: string
          file_size?: number
          ocr_status?: DocumentStatus
          ocr_text?: string | null
          ocr_error?: string | null
          uploaded_at?: string
          processed_at?: string | null
        }
      }
      medicines: {
        Row: {
          id: string
          document_id: string | null
          owner_id: string
          name: string
          generic_name: string | null
          dosage: string | null
          frequency: string | null
          duration: string | null
          instructions: string | null
          is_active: boolean
          start_date: string | null
          end_date: string | null
          fda_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          document_id?: string | null
          owner_id: string
          name: string
          generic_name?: string | null
          dosage?: string | null
          frequency?: string | null
          duration?: string | null
          instructions?: string | null
          is_active?: boolean
          start_date?: string | null
          end_date?: string | null
          fda_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          document_id?: string | null
          owner_id?: string
          name?: string
          generic_name?: string | null
          dosage?: string | null
          frequency?: string | null
          duration?: string | null
          instructions?: string | null
          is_active?: boolean
          start_date?: string | null
          end_date?: string | null
          fda_data?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      drug_interactions: {
        Row: {
          id: string
          medicine_1_id: string
          medicine_2_id: string
          severity: InteractionSeverity
          description: string
          source: string | null
          is_acknowledged: boolean
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          medicine_1_id: string
          medicine_2_id: string
          severity: InteractionSeverity
          description: string
          source?: string | null
          is_acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          medicine_1_id?: string
          medicine_2_id?: string
          severity?: InteractionSeverity
          description?: string
          source?: string | null
          is_acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
        }
      }
      glucose_readings: {
        Row: {
          id: string
          owner_id: string
          value: number
          unit: string
          reading_type: ReadingType
          meal_context: MealContext | null
          notes: string | null
          recorded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          value: number
          unit?: string
          reading_type: ReadingType
          meal_context?: MealContext | null
          notes?: string | null
          recorded_at: string
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          value?: number
          unit?: string
          reading_type?: ReadingType
          meal_context?: MealContext | null
          notes?: string | null
          recorded_at?: string
          created_at?: string
        }
      }
    }
  }
}

// Helper types for Supabase client
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
