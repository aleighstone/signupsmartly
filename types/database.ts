export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          timezone: string;
          created_at: string;
          slug: string | null;
          primary_color: string | null;
          custom_domain: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          timezone?: string;
          created_at?: string;
          slug?: string | null;
          primary_color?: string | null;
          custom_domain?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          timezone?: string;
          created_at?: string;
          slug?: string | null;
          primary_color?: string | null;
          custom_domain?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          created_at: string;
          nps_dismissed_at: string | null;
          nps_submitted_at: string | null;
          notification_preference: 'instant' | 'daily' | 'weekly' | 'never';
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          created_at?: string;
          nps_dismissed_at?: string | null;
          nps_submitted_at?: string | null;
          notification_preference?: 'instant' | 'daily' | 'weekly' | 'never';
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          created_at?: string;
          nps_dismissed_at?: string | null;
          nps_submitted_at?: string | null;
          notification_preference?: 'instant' | 'daily' | 'weekly' | 'never';
        };
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: 'owner' | 'organizer' | 'viewer';
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role: 'owner' | 'organizer' | 'viewer';
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: 'owner' | 'organizer' | 'viewer';
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          description: string | null;
          location: string | null;
          start_date: string | null;
          end_date: string | null;
          signup_type: 'scheduled' | 'simple';
          published: boolean;
          created_by: string | null;
          created_at: string;
          notification_override: 'instant' | 'daily' | 'weekly' | 'never' | null;
          show_signups: boolean;
          theme: Json | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          description?: string | null;
          location?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          signup_type?: 'scheduled' | 'simple';
          published?: boolean;
          created_by?: string | null;
          created_at?: string;
          notification_override?: 'instant' | 'daily' | 'weekly' | 'never' | null;
          show_signups?: boolean;
          theme?: Json | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string;
          description?: string | null;
          location?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          signup_type?: 'scheduled' | 'simple';
          published?: boolean;
          created_by?: string | null;
          created_at?: string;
          notification_override?: 'instant' | 'daily' | 'weekly' | 'never' | null;
          show_signups?: boolean;
          theme?: Json | null;
        };
      };
      slots: {
        Row: {
          id: string;
          event_id: string;
          role_name: string;
          role_description: string | null;
          start_time: string | null;
          end_time: string | null;
          capacity: number;
          instructions: string | null;
          comment_label: string;
          comment_required: boolean;
          comment_show_publicly: boolean;
          sort_order: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          role_name: string;
          role_description?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          capacity?: number;
          instructions?: string | null;
          comment_label?: string;
          comment_required?: boolean;
          comment_show_publicly?: boolean;
          sort_order?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          role_name?: string;
          role_description?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          capacity?: number;
          instructions?: string | null;
          comment_label?: string;
          comment_required?: boolean;
          comment_show_publicly?: boolean;
          sort_order?: number | null;
          created_at?: string;
        };
      };
      templates: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          signup_type: 'scheduled' | 'simple';
          description: string | null;
          location: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          signup_type: 'scheduled' | 'simple';
          description?: string | null;
          location?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          signup_type?: 'scheduled' | 'simple';
          description?: string | null;
          location?: string | null;
          created_at?: string;
        };
      };
      template_slots: {
        Row: {
          id: string;
          template_id: string;
          slot_name: string;
          capacity: number;
          start_time: string | null;
          end_time: string | null;
          instructions: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          slot_name: string;
          capacity?: number;
          start_time?: string | null;
          end_time?: string | null;
          instructions?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          template_id?: string;
          slot_name?: string;
          capacity?: number;
          start_time?: string | null;
          end_time?: string | null;
          instructions?: string | null;
          created_at?: string;
        };
      };
      nps_responses: {
        Row: {
          id: string;
          user_id: string;
          score: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          score: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          score?: number;
          comment?: string | null;
          created_at?: string;
        };
      };
      signups: {
        Row: {
          id: string;
          slot_id: string;
          name: string;
          email: string | null;
          comment: string | null;
          cancelled: boolean;
          cancel_token: string;
          source: 'volunteer' | 'organizer';
          reminder_opt_in: boolean;
          reminder_offset:
            | '1_week'
            | '3_days'
            | '1_day'
            | 'morning_of'
            | '1_hour';
          reminder_sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slot_id: string;
          name: string;
          email?: string | null;
          comment?: string | null;
          cancelled?: boolean;
          cancel_token?: string;
          source?: 'volunteer' | 'organizer';
          reminder_opt_in?: boolean;
          reminder_offset?:
            | '1_week'
            | '3_days'
            | '1_day'
            | 'morning_of'
            | '1_hour';
          reminder_sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slot_id?: string;
          name?: string;
          email?: string | null;
          comment?: string | null;
          cancelled?: boolean;
          cancel_token?: string;
          source?: 'volunteer' | 'organizer';
          reminder_opt_in?: boolean;
          reminder_offset?:
            | '1_week'
            | '3_days'
            | '1_day'
            | 'morning_of'
            | '1_hour';
          reminder_sent_at?: string | null;
          created_at?: string;
        };
      };
      organizer_notification_digest: {
        Row: {
          id: string;
          user_id: string;
          event_id: string;
          signup_id: string;
          created_at: string;
          digest_sent_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id: string;
          signup_id: string;
          created_at?: string;
          digest_sent_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_id?: string;
          signup_id?: string;
          created_at?: string;
          digest_sent_at?: string | null;
        };
      };
      pending_transfers: {
        Row: {
          id: string;
          event_id: string;
          source_event_id: string | null;
          sender_id: string;
          recipient_email: string;
          token: string;
          claimed_at: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          source_event_id?: string | null;
          sender_id: string;
          recipient_email: string;
          token?: string;
          claimed_at?: string | null;
          expires_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          source_event_id?: string | null;
          sender_id?: string;
          recipient_email?: string;
          token?: string;
          claimed_at?: string | null;
          expires_at?: string;
          created_at?: string;
        };
      };
    };
  };
}

export type Organization = Database['public']['Tables']['organizations']['Row'];
export type User = Database['public']['Tables']['users']['Row'];
export type OrganizationMember =
  Database['public']['Tables']['organization_members']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];
export type Slot = Database['public']['Tables']['slots']['Row'];
export type Signup = Database['public']['Tables']['signups']['Row'];
export type NpsResponse = Database['public']['Tables']['nps_responses']['Row'];
export type OrganizerNotificationDigest = Database['public']['Tables']['organizer_notification_digest']['Row'];
export type PendingTransfer = Database['public']['Tables']['pending_transfers']['Row'];

export interface SlotWithSignups extends Slot {
  signups: (Signup & { cancelled: boolean })[];
}

export interface EventWithSlots extends Event {
  slots: SlotWithSignups[];
}
