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
          thumbnail_url: string | null
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
          thumbnail_url?: string | null
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
          thumbnail_url?: string | null
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
          is_paid: boolean | null
          playback_id: string | null
          price: number | null
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
          is_paid?: boolean | null
          playback_id?: string | null
          price?: number | null
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
          is_paid?: boolean | null
          playback_id?: string | null
          price?: number | null
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
          is_one_time_media: boolean | null
          media_type: string | null
          media_url: string | null
          recipient_id: string
          sender_id: string
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_one_time_media?: boolean | null
          media_type?: string | null
          media_url?: string | null
          recipient_id: string
          sender_id: string
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_one_time_media?: boolean | null
          media_type?: string | null
          media_url?: string | null
          recipient_id?: string
          sender_id?: string
          updated_at?: string
          viewed_at?: string | null
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
      notification_settings: {
        Row: {
          content_interactions: boolean
          created_at: string
          id: string
          live_streams: boolean
          new_followers: boolean
          new_messages: boolean
          push_enabled: boolean
          tips_received: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          content_interactions?: boolean
          created_at?: string
          id?: string
          live_streams?: boolean
          new_followers?: boolean
          new_messages?: boolean
          push_enabled?: boolean
          tips_received?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          content_interactions?: boolean
          created_at?: string
          id?: string
          live_streams?: boolean
          new_followers?: boolean
          new_messages?: boolean
          push_enabled?: boolean
          tips_received?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          related_content_id: string | null
          related_content_type: string | null
          related_user_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          related_content_id?: string | null
          related_content_type?: string | null
          related_user_id?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          related_content_id?: string | null
          related_content_type?: string | null
          related_user_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          content_type: string
          created_at: string
          description: string | null
          id: string
          media_type: string | null
          media_url: string | null
          text_content: string | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_type: string
          created_at?: string
          description?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          text_content?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_type?: string
          created_at?: string
          description?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          text_content?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_posts_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts_interactions: {
        Row: {
          comment_text: string | null
          created_at: string
          id: string
          interaction_type: string
          post_id: string
          user_id: string
        }
        Insert: {
          comment_text?: string | null
          created_at?: string
          id?: string
          interaction_type: string
          post_id: string
          user_id: string
        }
        Update: {
          comment_text?: string | null
          created_at?: string
          id?: string
          interaction_type?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_interactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
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
      scheduled_posts: {
        Row: {
          content: string
          created_at: string
          creator_id: string
          id: string
          media_url: string | null
          scheduled_for: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          creator_id: string
          id?: string
          media_url?: string | null
          scheduled_for: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          creator_id?: string
          id?: string
          media_url?: string | null
          scheduled_for?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          content_type: string
          created_at: string
          creator_id: string
          expires_at: string
          id: string
          media_url: string
          text_overlay: string | null
        }
        Insert: {
          content_type: string
          created_at?: string
          creator_id: string
          expires_at?: string
          id?: string
          media_url: string
          text_overlay?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string
          creator_id?: string
          expires_at?: string
          id?: string
          media_url?: string
          text_overlay?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_likes: {
        Row: {
          created_at: string
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_likes_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          stream_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          stream_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_comments_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_subscriptions: {
        Row: {
          amount: number
          created_at: string
          expires_at: string | null
          id: string
          status: string | null
          stream_id: string | null
          stripe_payment_intent_id: string | null
          subscriber_id: string | null
          tier_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          expires_at?: string | null
          id?: string
          status?: string | null
          stream_id?: string | null
          stripe_payment_intent_id?: string | null
          subscriber_id?: string | null
          tier_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          status?: string | null
          stream_id?: string | null
          stripe_payment_intent_id?: string | null
          subscriber_id?: string | null
          tier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_subscriptions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_tips: {
        Row: {
          amount: number
          created_at: string
          id: string
          message: string | null
          stream_id: string
          tipper_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          message?: string | null
          stream_id: string
          tipper_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          message?: string | null
          stream_id?: string
          tipper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_tips_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
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
      subscription_tiers: {
        Row: {
          created_at: string
          description: string | null
          features: string[] | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
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
      trailer_content: {
        Row: {
          content_type: string
          created_at: string
          creator_id: string
          description: string | null
          id: string
          media_url: string
          order_position: number
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content_type: string
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          media_url: string
          order_position: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content_type?: string
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          media_url?: string
          order_position?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      trailer_interactions: {
        Row: {
          comment_text: string | null
          created_at: string
          id: string
          interaction_type: string
          trailer_id: string
          user_id: string
        }
        Insert: {
          comment_text?: string | null
          created_at?: string
          id?: string
          interaction_type: string
          trailer_id: string
          user_id: string
        }
        Update: {
          comment_text?: string | null
          created_at?: string
          id?: string
          interaction_type?: string
          trailer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trailer_interactions_trailer_id_fkey"
            columns: ["trailer_id"]
            isOneToOne: false
            referencedRelation: "trailer_content"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clear_chat: {
        Args: { user1_id: string; user2_id: string }
        Returns: undefined
      }
      create_notification: {
        Args: {
          p_user_id: string
          p_type: string
          p_title: string
          p_message: string
          p_related_user_id?: string
          p_related_content_id?: string
          p_related_content_type?: string
          p_metadata?: Json
        }
        Returns: string
      }
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
