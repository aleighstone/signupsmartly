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
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          timezone?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          timezone?: string;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          created_at?: string;
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
          start_date: string;
          end_date: string;
          published: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          description?: string | null;
          location?: string | null;
          start_date: string;
          end_date: string;
          published?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string;
          description?: string | null;
          location?: string | null;
          start_date?: string;
          end_date?: string;
          published?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
      };
      slots: {
        Row: {
          id: string;
          event_id: string;
          role_name: string;
          role_description: string | null;
          start_time: string;
          end_time: string;
          capacity: number;
          instructions: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          role_name: string;
          role_description?: string | null;
          start_time: string;
          end_time: string;
          capacity?: number;
          instructions?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          role_name?: string;
          role_description?: string | null;
          start_time?: string;
          end_time?: string;
          capacity?: number;
          instructions?: string | null;
          created_at?: string;
        };
      };
      signups: {
        Row: {
          id: string;
          slot_id: string;
          name: string;
          email: string;
          comment: string | null;
          cancelled: boolean;
          cancel_token: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          slot_id: string;
          name: string;
          email: string;
          comment?: string | null;
          cancelled?: boolean;
          cancel_token?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          slot_id?: string;
          name?: string;
          email?: string;
          comment?: string | null;
          cancelled?: boolean;
          cancel_token?: string;
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

export interface SlotWithSignups extends Slot {
  signups: (Signup & { cancelled: boolean })[];
}

export interface EventWithSlots extends Event {
  slots: SlotWithSignups[];
}
