export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      answers: {
        Row: {
          confidence_score: number | null
          content: string
          created_at: string
          downvotes: number | null
          id: string
          is_accepted: boolean | null
          is_ai_generated: boolean | null
          question_id: string
          updated_at: string
          upvotes: number | null
          user_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          content: string
          created_at?: string
          downvotes?: number | null
          id?: string
          is_accepted?: boolean | null
          is_ai_generated?: boolean | null
          question_id: string
          updated_at?: string
          upvotes?: number | null
          user_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          content?: string
          created_at?: string
          downvotes?: number | null
          id?: string
          is_accepted?: boolean | null
          is_ai_generated?: boolean | null
          question_id?: string
          updated_at?: string
          upvotes?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      family_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          invite_code: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          invite_code?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          invite_code?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          family_group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          family_group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          family_group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      indian_medicines: {
        Row: {
          composition: string | null
          contraindications: string[] | null
          created_at: string
          generic_name: string | null
          id: string
          manufacturer: string | null
          name: string
          pregnancy_category: string | null
          schedule: string | null
          side_effects: string[] | null
          storage_conditions: string | null
          therapeutic_class: string | null
          typical_uses: string[] | null
          updated_at: string
        }
        Insert: {
          composition?: string | null
          contraindications?: string[] | null
          created_at?: string
          generic_name?: string | null
          id?: string
          manufacturer?: string | null
          name: string
          pregnancy_category?: string | null
          schedule?: string | null
          side_effects?: string[] | null
          storage_conditions?: string | null
          therapeutic_class?: string | null
          typical_uses?: string[] | null
          updated_at?: string
        }
        Update: {
          composition?: string | null
          contraindications?: string[] | null
          created_at?: string
          generic_name?: string | null
          id?: string
          manufacturer?: string | null
          name?: string
          pregnancy_category?: string | null
          schedule?: string | null
          side_effects?: string[] | null
          storage_conditions?: string | null
          therapeutic_class?: string | null
          typical_uses?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      medicine_barcodes: {
        Row: {
          barcode: string
          barcode_type: string | null
          created_at: string
          id: string
          indian_medicine_id: string
        }
        Insert: {
          barcode: string
          barcode_type?: string | null
          created_at?: string
          id?: string
          indian_medicine_id: string
        }
        Update: {
          barcode?: string
          barcode_type?: string | null
          created_at?: string
          id?: string
          indian_medicine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicine_barcodes_indian_medicine_id_fkey"
            columns: ["indian_medicine_id"]
            isOneToOne: false
            referencedRelation: "indian_medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_brands: {
        Row: {
          brand_name: string
          created_at: string
          id: string
          indian_medicine_id: string
          manufacturer: string | null
          mrp: number | null
          pack_size: string | null
        }
        Insert: {
          brand_name: string
          created_at?: string
          id?: string
          indian_medicine_id: string
          manufacturer?: string | null
          mrp?: number | null
          pack_size?: string | null
        }
        Update: {
          brand_name?: string
          created_at?: string
          id?: string
          indian_medicine_id?: string
          manufacturer?: string | null
          mrp?: number | null
          pack_size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicine_brands_indian_medicine_id_fkey"
            columns: ["indian_medicine_id"]
            isOneToOne: false
            referencedRelation: "indian_medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_category_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_category_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_category_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicine_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "medicine_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_compositions: {
        Row: {
          active_ingredient: string
          created_at: string
          id: string
          indian_medicine_id: string
          strength: string | null
          unit: string | null
        }
        Insert: {
          active_ingredient: string
          created_at?: string
          id?: string
          indian_medicine_id: string
          strength?: string | null
          unit?: string | null
        }
        Update: {
          active_ingredient?: string
          created_at?: string
          id?: string
          indian_medicine_id?: string
          strength?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicine_compositions_indian_medicine_id_fkey"
            columns: ["indian_medicine_id"]
            isOneToOne: false
            referencedRelation: "indian_medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_entries: {
        Row: {
          additional_notes: string | null
          category: string | null
          created_at: string
          daily_dosage: string | null
          expiry_date: string | null
          id: string
          manufacturer: string | null
          medicine_name: string
          photo_url: string | null
          price: number | null
          updated_at: string
          use_case: string | null
          user_id: string
        }
        Insert: {
          additional_notes?: string | null
          category?: string | null
          created_at?: string
          daily_dosage?: string | null
          expiry_date?: string | null
          id?: string
          manufacturer?: string | null
          medicine_name: string
          photo_url?: string | null
          price?: number | null
          updated_at?: string
          use_case?: string | null
          user_id: string
        }
        Update: {
          additional_notes?: string | null
          category?: string | null
          created_at?: string
          daily_dosage?: string | null
          expiry_date?: string | null
          id?: string
          manufacturer?: string | null
          medicine_name?: string
          photo_url?: string | null
          price?: number | null
          updated_at?: string
          use_case?: string | null
          user_id?: string
        }
        Relationships: []
      }
      medicine_prices: {
        Row: {
          availability_status: string | null
          created_at: string
          currency: string | null
          id: string
          indian_medicine_id: string
          last_updated: string
          pack_size: string | null
          pharmacy_id: string
          price: number
        }
        Insert: {
          availability_status?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          indian_medicine_id: string
          last_updated?: string
          pack_size?: string | null
          pharmacy_id: string
          price: number
        }
        Update: {
          availability_status?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          indian_medicine_id?: string
          last_updated?: string
          pack_size?: string | null
          pharmacy_id?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "medicine_prices_indian_medicine_id_fkey"
            columns: ["indian_medicine_id"]
            isOneToOne: false
            referencedRelation: "indian_medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_prices_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_reviews: {
        Row: {
          created_at: string
          ease_of_use_rating: number | null
          effectiveness_rating: number | null
          helpful_votes: number | null
          id: string
          medicine_entry_id: string | null
          medicine_id: string | null
          rating: number
          review_text: string | null
          side_effects: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ease_of_use_rating?: number | null
          effectiveness_rating?: number | null
          helpful_votes?: number | null
          id?: string
          medicine_entry_id?: string | null
          medicine_id?: string | null
          rating: number
          review_text?: string | null
          side_effects?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ease_of_use_rating?: number | null
          effectiveness_rating?: number | null
          helpful_votes?: number | null
          id?: string
          medicine_entry_id?: string | null
          medicine_id?: string | null
          rating?: number
          review_text?: string | null
          side_effects?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicine_reviews_medicine_entry_id_fkey"
            columns: ["medicine_entry_id"]
            isOneToOne: false
            referencedRelation: "medicine_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_reviews_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "indian_medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacies: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          location: string | null
          name: string
          phone: string | null
          updated_at: string
          verified: boolean | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          location?: string | null
          name: string
          phone?: string | null
          updated_at?: string
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          location?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      prescription_medicines: {
        Row: {
          created_at: string
          dosage: string | null
          duration: string | null
          frequency: string | null
          id: string
          indian_medicine_id: string | null
          instructions: string | null
          medicine_name: string
          prescription_id: string
        }
        Insert: {
          created_at?: string
          dosage?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          indian_medicine_id?: string | null
          instructions?: string | null
          medicine_name: string
          prescription_id: string
        }
        Update: {
          created_at?: string
          dosage?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          indian_medicine_id?: string | null
          instructions?: string | null
          medicine_name?: string
          prescription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescription_medicines_indian_medicine_id_fkey"
            columns: ["indian_medicine_id"]
            isOneToOne: false
            referencedRelation: "indian_medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_medicines_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          diagnosis: string | null
          doctor_name: string | null
          id: string
          image_url: string
          ocr_text: string | null
          patient_name: string | null
          prescription_date: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          diagnosis?: string | null
          doctor_name?: string | null
          id?: string
          image_url: string
          ocr_text?: string | null
          patient_name?: string | null
          prescription_date?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          diagnosis?: string | null
          doctor_name?: string | null
          id?: string
          image_url?: string
          ocr_text?: string | null
          patient_name?: string | null
          prescription_date?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          category: string | null
          content: string
          created_at: string
          downvotes: number | null
          id: string
          is_answered: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
          upvotes: number | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          downvotes?: number | null
          id?: string
          is_answered?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
          upvotes?: number | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          downvotes?: number | null
          id?: string
          is_answered?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          upvotes?: number | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          custom_schedule: Json | null
          days_of_week: number[] | null
          frequency: string | null
          id: string
          is_active: boolean
          last_triggered_at: string | null
          medicine_id: string | null
          message: string | null
          next_trigger_at: string | null
          reminder_time: string | null
          reminder_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_schedule?: Json | null
          days_of_week?: number[] | null
          frequency?: string | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          medicine_id?: string | null
          message?: string | null
          next_trigger_at?: string | null
          reminder_time?: string | null
          reminder_type: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_schedule?: Json | null
          days_of_week?: number[] | null
          frequency?: string | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          medicine_id?: string | null
          message?: string | null
          next_trigger_at?: string | null
          reminder_time?: string | null
          reminder_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicine_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_medicines: {
        Row: {
          can_edit: boolean
          family_group_id: string
          id: string
          medicine_id: string
          shared_at: string
          shared_by: string
        }
        Insert: {
          can_edit?: boolean
          family_group_id: string
          id?: string
          medicine_id: string
          shared_at?: string
          shared_by: string
        }
        Update: {
          can_edit?: boolean
          family_group_id?: string
          id?: string
          medicine_id?: string
          shared_at?: string
          shared_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_medicines_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_medicines_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicine_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      symptom_medicine_mapping: {
        Row: {
          confidence_level: string | null
          created_at: string
          effectiveness_score: number | null
          id: string
          indian_medicine_id: string
          symptom_id: string
        }
        Insert: {
          confidence_level?: string | null
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          indian_medicine_id: string
          symptom_id: string
        }
        Update: {
          confidence_level?: string | null
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          indian_medicine_id?: string
          symptom_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "symptom_medicine_mapping_indian_medicine_id_fkey"
            columns: ["indian_medicine_id"]
            isOneToOne: false
            referencedRelation: "indian_medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "symptom_medicine_mapping_symptom_id_fkey"
            columns: ["symptom_id"]
            isOneToOne: false
            referencedRelation: "symptoms"
            referencedColumns: ["id"]
          },
        ]
      }
      symptoms: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          severity_level: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          severity_level?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          severity_level?: string | null
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          action_type: string
          id: string
          logged_at: string
          medicine_id: string | null
          notes: string | null
          quantity_taken: number | null
          user_id: string
        }
        Insert: {
          action_type: string
          id?: string
          logged_at?: string
          medicine_id?: string | null
          notes?: string | null
          quantity_taken?: number | null
          user_id: string
        }
        Update: {
          action_type?: string
          id?: string
          logged_at?: string
          medicine_id?: string | null
          notes?: string | null
          quantity_taken?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_logs_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicine_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_type: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_type: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_type?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_next_reminder_time: {
        Args: {
          reminder_id: string
          frequency: string
          reminder_time: string
          days_of_week: number[]
          custom_schedule: Json
        }
        Returns: string
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
