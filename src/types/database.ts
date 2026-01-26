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
      access_permissions: {
        Row: {
          granted_at: string
          granted_by: string
          id: string
          owner_id: string
          permission_level: Database["public"]["Enums"]["permission_level"]
          viewer_id: string
        }
        Insert: {
          granted_at?: string
          granted_by: string
          id?: string
          owner_id: string
          permission_level?: Database["public"]["Enums"]["permission_level"]
          viewer_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string
          id?: string
          owner_id?: string
          permission_level?: Database["public"]["Enums"]["permission_level"]
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_permissions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_permissions_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          ocr_error: string | null
          ocr_status: Database["public"]["Enums"]["document_status"]
          ocr_text: string | null
          owner_id: string
          processed_at: string | null
          uploaded_at: string
        }
        Insert: {
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          ocr_error?: string | null
          ocr_status?: Database["public"]["Enums"]["document_status"]
          ocr_text?: string | null
          owner_id: string
          processed_at?: string | null
          uploaded_at?: string
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          ocr_error?: string | null
          ocr_status?: Database["public"]["Enums"]["document_status"]
          ocr_text?: string | null
          owner_id?: string
          processed_at?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      drug_interactions: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          description: string
          id: string
          is_acknowledged: boolean | null
          medicine_1_id: string
          medicine_2_id: string
          severity: Database["public"]["Enums"]["interaction_severity"]
          source: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          description: string
          id?: string
          is_acknowledged?: boolean | null
          medicine_1_id: string
          medicine_2_id: string
          severity: Database["public"]["Enums"]["interaction_severity"]
          source?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          description?: string
          id?: string
          is_acknowledged?: boolean | null
          medicine_1_id?: string
          medicine_2_id?: string
          severity?: Database["public"]["Enums"]["interaction_severity"]
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drug_interactions_medicine_1_id_fkey"
            columns: ["medicine_1_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_interactions_medicine_2_id_fkey"
            columns: ["medicine_2_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          created_at: string
          created_by: string
          date_of_birth: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          is_registered: boolean | null
          profile_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          date_of_birth?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          is_registered?: boolean | null
          profile_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          date_of_birth?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          is_registered?: boolean | null
          profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_relationships: {
        Row: {
          created_at: string
          id: string
          member_id: string
          related_member_id: string
          relationship_type: Database["public"]["Enums"]["relationship_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          related_member_id: string
          relationship_type: Database["public"]["Enums"]["relationship_type"]
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          related_member_id?: string
          relationship_type?: Database["public"]["Enums"]["relationship_type"]
        }
        Relationships: [
          {
            foreignKeyName: "family_relationships_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_relationships_related_member_id_fkey"
            columns: ["related_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      glucose_readings: {
        Row: {
          created_at: string
          id: string
          meal_context: Database["public"]["Enums"]["meal_context"] | null
          notes: string | null
          owner_id: string
          reading_type: Database["public"]["Enums"]["reading_type"]
          recorded_at: string
          unit: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          meal_context?: Database["public"]["Enums"]["meal_context"] | null
          notes?: string | null
          owner_id: string
          reading_type: Database["public"]["Enums"]["reading_type"]
          recorded_at: string
          unit?: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          meal_context?: Database["public"]["Enums"]["meal_context"] | null
          notes?: string | null
          owner_id?: string
          reading_type?: Database["public"]["Enums"]["reading_type"]
          recorded_at?: string
          unit?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "glucose_readings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      medicines: {
        Row: {
          created_at: string
          document_id: string | null
          dosage: string | null
          duration: string | null
          end_date: string | null
          fda_data: Json | null
          frequency: string | null
          generic_name: string | null
          id: string
          instructions: string | null
          is_active: boolean | null
          name: string
          owner_id: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          dosage?: string | null
          duration?: string | null
          end_date?: string | null
          fda_data?: Json | null
          frequency?: string | null
          generic_name?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          name: string
          owner_id: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          dosage?: string | null
          duration?: string | null
          end_date?: string | null
          fda_data?: Json | null
          frequency?: string | null
          generic_name?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          name?: string
          owner_id?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicines_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicines_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string | null
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      document_status: "pending" | "processing" | "completed" | "failed"
      gender: "male" | "female" | "other" | "prefer_not_to_say"
      interaction_severity: "minor" | "moderate" | "major" | "contraindicated"
      meal_context: "breakfast" | "lunch" | "dinner" | "snack" | "none"
      permission_level: "view" | "edit" | "admin"
      reading_type: "fasting" | "pre_meal" | "post_meal" | "random" | "bedtime"
      relationship_type: "parent" | "child" | "spouse" | "sibling"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

// Convenience type aliases for backward compatibility
export type Gender = Database["public"]["Enums"]["gender"]
export type RelationshipType = Database["public"]["Enums"]["relationship_type"]
export type PermissionLevel = Database["public"]["Enums"]["permission_level"]
export type DocumentStatus = Database["public"]["Enums"]["document_status"]
export type ReadingType = Database["public"]["Enums"]["reading_type"]
export type MealContext = Database["public"]["Enums"]["meal_context"]
export type InteractionSeverity = Database["public"]["Enums"]["interaction_severity"]

// Legacy helper types (aliased to new names)
export type InsertTables<T extends keyof Database["public"]["Tables"]> = TablesInsert<T>
export type UpdateTables<T extends keyof Database["public"]["Tables"]> = TablesUpdate<T>
