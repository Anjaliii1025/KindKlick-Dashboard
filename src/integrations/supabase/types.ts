export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          child_id: string
          created_at: string
          id: string
          is_dismissed: boolean
          message: string
          severity: string
          site: string | null
          type: string | null
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          is_dismissed?: boolean
          message: string
          severity: string
          site?: string | null
          type?: string | null
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          is_dismissed?: boolean
          message?: string
          severity?: string
          site?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_sites: {
        Row: {
          attempt_count: number
          category: string | null
          child_id: string
          created_at: string
          domain: string
          id: string
          is_whitelist: boolean
          reason: string | null
        }
        Insert: {
          attempt_count?: number
          category?: string | null
          child_id: string
          created_at?: string
          domain: string
          id?: string
          is_whitelist?: boolean
          reason?: string | null
        }
        Update: {
          attempt_count?: number
          category?: string | null
          child_id?: string
          created_at?: string
          domain?: string
          id?: string
          is_whitelist?: boolean
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_sites_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          age: number | null
          avatar_color: string | null
          created_at: string
          daily_limit_minutes: number
          device_name: string | null
          grade: string | null
          id: string
          name: string
          parent_id: string
        }
        Insert: {
          age?: number | null
          avatar_color?: string | null
          created_at?: string
          daily_limit_minutes?: number
          device_name?: string | null
          grade?: string | null
          id?: string
          name: string
          parent_id: string
        }
        Update: {
          age?: number | null
          avatar_color?: string | null
          created_at?: string
          daily_limit_minutes?: number
          device_name?: string | null
          grade?: string | null
          id?: string
          name?: string
          parent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      device_tokens: {
        Row: {
          child_id: string
          created_at: string
          id: string
          is_active: boolean
          label: string | null
          last_used_at: string | null
          token: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          last_used_at?: string | null
          token: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          last_used_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_tokens_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_schedules: {
        Row: {
          child_id: string
          created_at: string
          days_of_week: number[] | null
          end_time: string | null
          id: string
          is_active: boolean
          name: string | null
          start_time: string | null
        }
        Insert: {
          child_id: string
          created_at?: string
          days_of_week?: number[] | null
          end_time?: string | null
          id?: string
          is_active?: boolean
          name?: string | null
          start_time?: string | null
        }
        Update: {
          child_id?: string
          created_at?: string
          days_of_week?: number[] | null
          end_time?: string | null
          id?: string
          is_active?: boolean
          name?: string | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "focus_schedules_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          pin_hash: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          pin_hash?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          pin_hash?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      screen_time: {
        Row: {
          child_id: string
          created_at: string
          date: string
          id: string
          limit_minutes: number
          total_minutes: number
        }
        Insert: {
          child_id: string
          created_at?: string
          date: string
          id?: string
          limit_minutes?: number
          total_minutes?: number
        }
        Update: {
          child_id?: string
          created_at?: string
          date?: string
          id?: string
          limit_minutes?: number
          total_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "screen_time_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          category: string | null
          child_id: string
          domain: string
          duration_seconds: number
          id: string
          status: string
          title: string | null
          visited_at: string
        }
        Insert: {
          category?: string | null
          child_id: string
          domain: string
          duration_seconds?: number
          id?: string
          status: string
          title?: string | null
          visited_at?: string
        }
        Update: {
          category?: string | null
          child_id?: string
          domain?: string
          duration_seconds?: number
          id?: string
          status?: string
          title?: string | null
          visited_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      resolve_device_token: { Args: { _token: string }; Returns: string }
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
