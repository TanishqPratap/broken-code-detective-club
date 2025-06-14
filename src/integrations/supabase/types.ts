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
      chat_sessions: {
        Row: {
          created_at: string
          creator_id: string
          hourly_rate: number
          id: string
          payment_status: string
          session_end: string | null
          session_start: string
          stripe_payment_intent_id: string | null
          subscriber_id: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          hourly_rate: number
          id?: string
          payment_status?: string
          session_end?: string | null
          session_start?: string
          stripe_payment_intent_id?: string | null
          subscriber_id: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          hourly_rate?: number
          id?: string
          payment_status?: string
          session_end?: string | null
          session_start?: string
          stripe_payment_intent_id?: string | null
          subscriber_id?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content: {
        Row: {
          content_type: string
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_premium: boolean | null
          media_url: string | null
          price: number | null
          title: string
          updated_at: string
        }
        Insert: {
          content_type: string
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_premium?: boolean | null
          media_url?: string | null
          price?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          content_type?: string
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_premium?: boolean | null
          media_url?: string | null
          price?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_streams: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          ended_at: string | null
          id: string
          started_at: string | null
          status: string
          stream_key: string
          title: string
          updated_at: string
          viewer_count: number | null
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          stream_key?: string
          title: string
          updated_at?: string
          viewer_count?: number | null
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          stream_key?: string
          title?: string
          updated_at?: string
          viewer_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_streams_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          recipient_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          recipient_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          recipient_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          chat_rate: number | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          is_verified: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          subscription_price: number | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          chat_rate?: number | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          is_verified?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          subscription_price?: number | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          chat_rate?: number | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          is_verified?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          subscription_price?: number | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      stream_viewers: {
        Row: {
          id: string
          joined_at: string
          left_at: string | null
          stream_id: string
          viewer_id: string | null
        }
        Insert: {
          id?: string
          joined_at?: string
          left_at?: string | null
          stream_id: string
          viewer_id?: string | null
        }
        Update: {
          id?: string
          joined_at?: string
          left_at?: string | null
          stream_id?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_viewers_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_viewers_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          creator_id: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_subscription_id: string | null
          subscriber_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status: string
          stripe_subscription_id?: string | null
          subscriber_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_subscription_id?: string | null
          subscriber_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tips: {
        Row: {
          amount: number
          content_id: string | null
          created_at: string
          creator_id: string
          id: string
          message: string | null
          stripe_payment_intent_id: string | null
          tipper_id: string
        }
        Insert: {
          amount: number
          content_id?: string | null
          created_at?: string
          creator_id: string
          id?: string
          message?: string | null
          stripe_payment_intent_id?: string | null
          tipper_id: string
        }
        Update: {
          amount?: number
          content_id?: string | null
          created_at?: string
          creator_id?: string
          id?: string
          message?: string | null
          stripe_payment_intent_id?: string | null
          tipper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tips_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tips_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tips_tipper_id_fkey"
            columns: ["tipper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "creator" | "subscriber" | "admin"
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
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
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["creator", "subscriber", "admin"],
    },
  },
} as const
