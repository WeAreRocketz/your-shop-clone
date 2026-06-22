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
      abuse_reports: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          description: string
          id: string
          reporter_email: string
          reporter_name: string
          status: string
          target_url: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          reporter_email: string
          reporter_name: string
          status?: string
          target_url?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          reporter_email?: string
          reporter_name?: string
          status?: string
          target_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      auto_sync_settings: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          source_store_id: string
          target_store_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          source_store_id: string
          target_store_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          source_store_id?: string
          target_store_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_sync_settings_source_store_id_fkey"
            columns: ["source_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_sync_settings_target_store_id_fkey"
            columns: ["target_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_sync_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_drawer_configs: {
        Row: {
          config: Json
          created_at: string
          id: string
          layout: string
          name: string
          published_at: string | null
          store_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          layout?: string
          name?: string
          published_at?: string | null
          store_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          layout?: string
          name?: string
          published_at?: string | null
          store_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_drawer_configs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_drawer_configs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_sessions: {
        Row: {
          assigned_checkout_store_id: string | null
          client_user_agent: string | null
          created_at: string
          customer_email: string | null
          customer_phone: string | null
          event_source_url: string | null
          fbc: string | null
          fbclid: string | null
          fbp: string | null
          gclid: string | null
          id: string
          ip_address: string | null
          items: Json
          session_token: string
          status: Database["public"]["Enums"]["cart_session_status"]
          ttclid: string | null
          ttp: string | null
          updated_at: string
          user_agent: string | null
          vitrine_store_id: string
          workspace_id: string
        }
        Insert: {
          assigned_checkout_store_id?: string | null
          client_user_agent?: string | null
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          event_source_url?: string | null
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          gclid?: string | null
          id?: string
          ip_address?: string | null
          items?: Json
          session_token: string
          status?: Database["public"]["Enums"]["cart_session_status"]
          ttclid?: string | null
          ttp?: string | null
          updated_at?: string
          user_agent?: string | null
          vitrine_store_id: string
          workspace_id: string
        }
        Update: {
          assigned_checkout_store_id?: string | null
          client_user_agent?: string | null
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          event_source_url?: string | null
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          gclid?: string | null
          id?: string
          ip_address?: string | null
          items?: Json
          session_token?: string
          status?: Database["public"]["Enums"]["cart_session_status"]
          ttclid?: string | null
          ttp?: string | null
          updated_at?: string
          user_agent?: string | null
          vitrine_store_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_sessions_assigned_checkout_store_id_fkey"
            columns: ["assigned_checkout_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_sessions_vitrine_store_id_fkey"
            columns: ["vitrine_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_distributions: {
        Row: {
          cart_session_id: string | null
          checkout_url: string | null
          created_at: string
          distribution_rule: string
          id: string
          shopify_draft_order_id: string | null
          source_store_id: string
          status: string
          target_store_id: string
          workspace_id: string
        }
        Insert: {
          cart_session_id?: string | null
          checkout_url?: string | null
          created_at?: string
          distribution_rule: string
          id?: string
          shopify_draft_order_id?: string | null
          source_store_id: string
          status?: string
          target_store_id: string
          workspace_id: string
        }
        Update: {
          cart_session_id?: string | null
          checkout_url?: string | null
          created_at?: string
          distribution_rule?: string
          id?: string
          shopify_draft_order_id?: string | null
          source_store_id?: string
          status?: string
          target_store_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_distributions_cart_session_id_fkey"
            columns: ["cart_session_id"]
            isOneToOne: false
            referencedRelation: "cart_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_distributions_source_store_id_fkey"
            columns: ["source_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_distributions_target_store_id_fkey"
            columns: ["target_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_distributions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      operation_checkout_stores: {
        Row: {
          created_at: string
          limit_metric: string | null
          limit_value: number | null
          limit_window: string | null
          operation_id: string
          position: number
          store_id: string
        }
        Insert: {
          created_at?: string
          limit_metric?: string | null
          limit_value?: number | null
          limit_window?: string | null
          operation_id: string
          position?: number
          store_id: string
        }
        Update: {
          created_at?: string
          limit_metric?: string | null
          limit_value?: number | null
          limit_window?: string | null
          operation_id?: string
          position?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operation_checkout_stores_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operation_checkout_stores_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      operations: {
        Row: {
          activated_at: string | null
          cart_template_id: string | null
          created_at: string
          current_step: number
          id: string
          mode: Database["public"]["Enums"]["operation_mode"]
          name: string
          status: Database["public"]["Enums"]["operation_status"]
          updated_at: string
          vitrine_store_id: string | null
          warmup_simultaneous: boolean
          workspace_id: string
        }
        Insert: {
          activated_at?: string | null
          cart_template_id?: string | null
          created_at?: string
          current_step?: number
          id?: string
          mode?: Database["public"]["Enums"]["operation_mode"]
          name: string
          status?: Database["public"]["Enums"]["operation_status"]
          updated_at?: string
          vitrine_store_id?: string | null
          warmup_simultaneous?: boolean
          workspace_id: string
        }
        Update: {
          activated_at?: string | null
          cart_template_id?: string | null
          created_at?: string
          current_step?: number
          id?: string
          mode?: Database["public"]["Enums"]["operation_mode"]
          name?: string
          status?: Database["public"]["Enums"]["operation_status"]
          updated_at?: string
          vitrine_store_id?: string | null
          warmup_simultaneous?: boolean
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operations_vitrine_store_id_fkey"
            columns: ["vitrine_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          id: string
          is_trial: boolean
          max_orders_monthly: number | null
          max_products: number | null
          max_stores: number | null
          name: string
          price_monthly: number
          slug: string | null
          trial_days: number | null
        }
        Insert: {
          id?: string
          is_trial?: boolean
          max_orders_monthly?: number | null
          max_products?: number | null
          max_stores?: number | null
          name: string
          price_monthly: number
          slug?: string | null
          trial_days?: number | null
        }
        Update: {
          id?: string
          is_trial?: boolean
          max_orders_monthly?: number | null
          max_products?: number | null
          max_stores?: number | null
          name?: string
          price_monthly?: number
          slug?: string | null
          trial_days?: number | null
        }
        Relationships: []
      }
      product_mappings: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          is_active: boolean
          mapping_method: Database["public"]["Enums"]["mapping_method"]
          source_product_id: string
          source_store_id: string
          source_variant_id: string | null
          target_product_id: string
          target_store_id: string
          target_variant_id: string | null
          workspace_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          mapping_method?: Database["public"]["Enums"]["mapping_method"]
          source_product_id: string
          source_store_id: string
          source_variant_id?: string | null
          target_product_id: string
          target_store_id: string
          target_variant_id?: string | null
          workspace_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          mapping_method?: Database["public"]["Enums"]["mapping_method"]
          source_product_id?: string
          source_store_id?: string
          source_variant_id?: string | null
          target_product_id?: string
          target_store_id?: string
          target_variant_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_mappings_source_product_id_fkey"
            columns: ["source_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_mappings_source_store_id_fkey"
            columns: ["source_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_mappings_target_product_id_fkey"
            columns: ["target_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_mappings_target_store_id_fkey"
            columns: ["target_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_mappings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          handle: string | null
          id: string
          images: Json
          product_type: string | null
          shopify_product_id: string
          status: string | null
          store_id: string
          synced_at: string
          tags: string[]
          title: string
          variants: Json
          vendor: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          handle?: string | null
          id?: string
          images?: Json
          product_type?: string | null
          shopify_product_id: string
          status?: string | null
          store_id: string
          synced_at?: string
          tags?: string[]
          title: string
          variants?: Json
          vendor?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          handle?: string | null
          id?: string
          images?: Json
          product_type?: string | null
          shopify_product_id?: string
          status?: string | null
          store_id?: string
          synced_at?: string
          tags?: string[]
          title?: string
          variants?: Json
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          company_name: string | null
          created_at: string
          document: string | null
          email: string
          id: string
          name: string | null
          person_type: string | null
          plan: string
          whatsapp: string | null
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          company_name?: string | null
          created_at?: string
          document?: string | null
          email: string
          id: string
          name?: string | null
          person_type?: string | null
          plan?: string
          whatsapp?: string | null
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          company_name?: string | null
          created_at?: string
          document?: string | null
          email?: string
          id?: string
          name?: string | null
          person_type?: string | null
          plan?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      store_camouflage_settings: {
        Row: {
          applied_product_ids: string[]
          apply_to_titles: boolean
          blur: number
          brightness: number
          enabled: boolean
          flip_horizontal: boolean
          hue_shift: number
          saturation: number
          store_id: string
          title_suffix: string | null
          updated_at: string
          watermark_text: string | null
          zoom: number
          zoom_origin_x: number
          zoom_origin_y: number
        }
        Insert: {
          applied_product_ids?: string[]
          apply_to_titles?: boolean
          blur?: number
          brightness?: number
          enabled?: boolean
          flip_horizontal?: boolean
          hue_shift?: number
          saturation?: number
          store_id: string
          title_suffix?: string | null
          updated_at?: string
          watermark_text?: string | null
          zoom?: number
          zoom_origin_x?: number
          zoom_origin_y?: number
        }
        Update: {
          applied_product_ids?: string[]
          apply_to_titles?: boolean
          blur?: number
          brightness?: number
          enabled?: boolean
          flip_horizontal?: boolean
          hue_shift?: number
          saturation?: number
          store_id?: string
          title_suffix?: string | null
          updated_at?: string
          watermark_text?: string | null
          zoom?: number
          zoom_origin_x?: number
          zoom_origin_y?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_camouflage_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_pixels: {
        Row: {
          access_token: string | null
          created_at: string
          enabled: boolean
          extra: Json
          id: string
          last_error: string | null
          last_event_at: string | null
          pixel_id: string
          platform: Database["public"]["Enums"]["pixel_platform"]
          store_id: string
          test_event_code: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          enabled?: boolean
          extra?: Json
          id?: string
          last_error?: string | null
          last_event_at?: string | null
          pixel_id: string
          platform: Database["public"]["Enums"]["pixel_platform"]
          store_id: string
          test_event_code?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          enabled?: boolean
          extra?: Json
          id?: string
          last_error?: string | null
          last_event_at?: string | null
          pixel_id?: string
          platform?: Database["public"]["Enums"]["pixel_platform"]
          store_id?: string
          test_event_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_pixels_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_receivables: {
        Row: {
          created_at: string
          expected_release_date: string | null
          id: string
          notes: string | null
          received_at: string | null
          receiving_account: string | null
          release_days: number | null
          retained_balance: number
          status: string
          store_id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          expected_release_date?: string | null
          id?: string
          notes?: string | null
          received_at?: string | null
          receiving_account?: string | null
          release_days?: number | null
          retained_balance?: number
          status?: string
          store_id: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          expected_release_date?: string | null
          id?: string
          notes?: string | null
          received_at?: string | null
          receiving_account?: string | null
          release_days?: number | null
          retained_balance?: number
          status?: string
          store_id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_receivables_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_receivables_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      store_rotation_events: {
        Row: {
          action_taken: string
          consumed: number | null
          created_at: string
          details: Json | null
          id: string
          limit_value: number | null
          metric: string | null
          redirected_to_store_id: string | null
          rule_id: string | null
          store_id: string
          time_window: string | null
          workspace_id: string
        }
        Insert: {
          action_taken: string
          consumed?: number | null
          created_at?: string
          details?: Json | null
          id?: string
          limit_value?: number | null
          metric?: string | null
          redirected_to_store_id?: string | null
          rule_id?: string | null
          store_id: string
          time_window?: string | null
          workspace_id: string
        }
        Update: {
          action_taken?: string
          consumed?: number | null
          created_at?: string
          details?: Json | null
          id?: string
          limit_value?: number | null
          metric?: string | null
          redirected_to_store_id?: string | null
          rule_id?: string | null
          store_id?: string
          time_window?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_rotation_events_redirected_to_store_id_fkey"
            columns: ["redirected_to_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_rotation_events_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "store_rotation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_rotation_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_rotation_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      store_rotation_rules: {
        Row: {
          action: string
          created_at: string
          enabled: boolean
          fallback_store_ids: string[]
          id: string
          limit_value: number
          metric: string
          store_id: string
          time_window: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          action: string
          created_at?: string
          enabled?: boolean
          fallback_store_ids?: string[]
          id?: string
          limit_value: number
          metric: string
          store_id: string
          time_window: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          action?: string
          created_at?: string
          enabled?: boolean
          fallback_store_ids?: string[]
          id?: string
          limit_value?: number
          metric?: string
          store_id?: string
          time_window?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_rotation_rules_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_rotation_rules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          access_token: string | null
          cached_token: string | null
          cart_disabled: boolean
          cart_disabled_at: string | null
          cart_disabled_reason: string | null
          client_id: string | null
          client_secret: string | null
          created_at: string
          deactivated_at: string | null
          deactivation_reason: string | null
          display_name: string | null
          id: string
          is_active: boolean
          last_health_check_at: string | null
          notified_down_at: string | null
          shopify_domain: string
          status: Database["public"]["Enums"]["store_status"]
          store_type: Database["public"]["Enums"]["store_type"]
          token_expires_at: string | null
          webhook_secret: string | null
          workspace_id: string
        }
        Insert: {
          access_token?: string | null
          cached_token?: string | null
          cart_disabled?: boolean
          cart_disabled_at?: string | null
          cart_disabled_reason?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivation_reason?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean
          last_health_check_at?: string | null
          notified_down_at?: string | null
          shopify_domain: string
          status?: Database["public"]["Enums"]["store_status"]
          store_type?: Database["public"]["Enums"]["store_type"]
          token_expires_at?: string | null
          webhook_secret?: string | null
          workspace_id: string
        }
        Update: {
          access_token?: string | null
          cached_token?: string | null
          cart_disabled?: boolean
          cart_disabled_at?: string | null
          cart_disabled_reason?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivation_reason?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean
          last_health_check_at?: string | null
          notified_down_at?: string | null
          shopify_domain?: string
          status?: Database["public"]["Enums"]["store_status"]
          store_type?: Database["public"]["Enums"]["store_type"]
          token_expires_at?: string | null
          webhook_secret?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_admin: boolean
          sender_id: string
          ticket_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_admin?: boolean
          sender_id: string
          ticket_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_admin?: boolean
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          id: string
          last_message_at: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          last_message_at?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          last_message_at?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sync_jobs: {
        Row: {
          created_at: string
          errors_log: Json
          finished_at: string | null
          id: string
          products_synced: number
          products_total: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["sync_job_status"]
          store_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          errors_log?: Json
          finished_at?: string | null
          id?: string
          products_synced?: number
          products_total?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["sync_job_status"]
          store_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          errors_log?: Json
          finished_at?: string | null
          id?: string
          products_synced?: number
          products_total?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["sync_job_status"]
          store_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_jobs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tag_mapping_rules: {
        Row: {
          created_at: string
          id: string
          source_store_id: string
          tag: string
          target_store_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          source_store_id: string
          tag: string
          target_store_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          source_store_id?: string
          tag?: string
          target_store_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tag_mapping_rules_source_store_id_fkey"
            columns: ["source_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_mapping_rules_target_store_id_fkey"
            columns: ["target_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_mapping_rules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_events: {
        Row: {
          cart_session_id: string | null
          created_at: string
          error_message: string | null
          event_id: string | null
          event_name: string
          http_status: number | null
          id: string
          latency_ms: number | null
          platform: Database["public"]["Enums"]["pixel_platform"]
          request_payload: Json | null
          response_body: Json | null
          status: string
          store_id: string | null
          workspace_id: string
        }
        Insert: {
          cart_session_id?: string | null
          created_at?: string
          error_message?: string | null
          event_id?: string | null
          event_name: string
          http_status?: number | null
          id?: string
          latency_ms?: number | null
          platform: Database["public"]["Enums"]["pixel_platform"]
          request_payload?: Json | null
          response_body?: Json | null
          status: string
          store_id?: string | null
          workspace_id: string
        }
        Update: {
          cart_session_id?: string | null
          created_at?: string
          error_message?: string | null
          event_id?: string | null
          event_name?: string
          http_status?: number | null
          id?: string
          latency_ms?: number | null
          platform?: Database["public"]["Enums"]["pixel_platform"]
          request_payload?: Json | null
          response_body?: Json | null
          status?: string
          store_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_events_cart_session_id_fkey"
            columns: ["cart_session_id"]
            isOneToOne: false
            referencedRelation: "cart_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          plan_id: string | null
          settings: Json
          trial_ends_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan_id?: string | null
          settings?: Json
          trial_ends_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan_id?: string | null
          settings?: Json
          trial_ends_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_plan_limit: {
        Args: { _resource: string; _workspace_id: string }
        Returns: boolean
      }
      evaluate_store_limits: {
        Args: { _store_id: string }
        Returns: {
          action: string
          consumed: number
          exceeded: boolean
          fallback_store_ids: string[]
          limit_value: number
          metric: string
          rule_id: string
          time_window: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      cart_session_status:
        | "active"
        | "checkout_started"
        | "completed"
        | "abandoned"
      mapping_method: "manual" | "tag" | "ai" | "auto"
      operation_mode: "direct" | "warmup" | "smart_advance"
      operation_status: "draft" | "active" | "paused" | "archived"
      pixel_platform: "meta" | "tiktok" | "google_ads" | "ga4"
      store_status: "active" | "down" | "disabled"
      store_type: "vitrine" | "checkout"
      sync_job_status: "pending" | "running" | "done" | "error"
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
      app_role: ["admin", "user"],
      cart_session_status: [
        "active",
        "checkout_started",
        "completed",
        "abandoned",
      ],
      mapping_method: ["manual", "tag", "ai", "auto"],
      operation_mode: ["direct", "warmup", "smart_advance"],
      operation_status: ["draft", "active", "paused", "archived"],
      pixel_platform: ["meta", "tiktok", "google_ads", "ga4"],
      store_status: ["active", "down", "disabled"],
      store_type: ["vitrine", "checkout"],
      sync_job_status: ["pending", "running", "done", "error"],
    },
  },
} as const
