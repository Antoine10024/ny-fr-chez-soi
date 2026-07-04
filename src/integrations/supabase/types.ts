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
      listing_availabilities: {
        Row: {
          created_at: string
          end_date: string
          id: string
          listing_id: string
          start_date: string
          status: Database["public"]["Enums"]["availability_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          listing_id: string
          start_date: string
          status?: Database["public"]["Enums"]["availability_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          listing_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["availability_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_availabilities_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_availabilities_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          author_email: string
          author_name: string
          contact_label: string | null
          contact_type: Database["public"]["Enums"]["contact_type"]
          contact_value: string
          created_at: string
          description: string
          housing_type: Database["public"]["Enums"]["housing_type"]
          id: string
          management_token: string
          moderation_token: string
          neighborhood: string
          photos: string[]
          practical_info: string | null
          status: Database["public"]["Enums"]["listing_status"]
          summary: string
        }
        Insert: {
          author_email: string
          author_name: string
          contact_label?: string | null
          contact_type: Database["public"]["Enums"]["contact_type"]
          contact_value: string
          created_at?: string
          description: string
          housing_type: Database["public"]["Enums"]["housing_type"]
          id?: string
          management_token?: string
          moderation_token?: string
          neighborhood: string
          photos?: string[]
          practical_info?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          summary: string
        }
        Update: {
          author_email?: string
          author_name?: string
          contact_label?: string | null
          contact_type?: Database["public"]["Enums"]["contact_type"]
          contact_value?: string
          created_at?: string
          description?: string
          housing_type?: Database["public"]["Enums"]["housing_type"]
          id?: string
          management_token?: string
          moderation_token?: string
          neighborhood?: string
          photos?: string[]
          practical_info?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          summary?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_listings: {
        Row: {
          author_name: string | null
          availabilities: Json | null
          contact_label: string | null
          contact_type: Database["public"]["Enums"]["contact_type"] | null
          contact_value: string | null
          created_at: string | null
          description: string | null
          housing_type: Database["public"]["Enums"]["housing_type"] | null
          id: string | null
          neighborhood: string | null
          photos: string[] | null
          practical_info: string | null
          summary: string | null
        }
        Insert: {
          author_name?: string | null
          availabilities?: never
          contact_label?: string | null
          contact_type?: Database["public"]["Enums"]["contact_type"] | null
          contact_value?: string | null
          created_at?: string | null
          description?: string | null
          housing_type?: Database["public"]["Enums"]["housing_type"] | null
          id?: string | null
          neighborhood?: string | null
          photos?: string[] | null
          practical_info?: string | null
          summary?: string | null
        }
        Update: {
          author_name?: string | null
          availabilities?: never
          contact_label?: string | null
          contact_type?: Database["public"]["Enums"]["contact_type"] | null
          contact_value?: string | null
          created_at?: string | null
          description?: string | null
          housing_type?: Database["public"]["Enums"]["housing_type"] | null
          id?: string | null
          neighborhood?: string | null
          photos?: string[] | null
          practical_info?: string | null
          summary?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      availability_status: "available" | "booked" | "unavailable"
      contact_type:
        | "email"
        | "whatsapp"
        | "facebook"
        | "instagram"
        | "telegram"
        | "autre"
      housing_type: "chambre" | "studio" | "1-bed" | "2-bed" | "autre"
      listing_status: "pending" | "approved" | "rejected"
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
    Enums: {
      availability_status: ["available", "booked", "unavailable"],
      contact_type: [
        "email",
        "whatsapp",
        "facebook",
        "instagram",
        "telegram",
        "autre",
      ],
      housing_type: ["chambre", "studio", "1-bed", "2-bed", "autre"],
      listing_status: ["pending", "approved", "rejected"],
    },
  },
} as const
