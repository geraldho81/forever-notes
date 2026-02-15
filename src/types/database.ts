export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          preferences?: Json
        }
        Update: {
          display_name?: string | null
          avatar_url?: string | null
          preferences?: Json
        }
        Relationships: []
      }
      notebooks: {
        Row: {
          id: string
          user_id: string
          parent_id: string | null
          name: string
          icon: string | null
          color: string | null
          sort_order: number
          depth: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          parent_id?: string | null
          name?: string
          icon?: string | null
          color?: string | null
          sort_order?: number
          depth?: number
        }
        Update: {
          parent_id?: string | null
          name?: string
          icon?: string | null
          color?: string | null
          sort_order?: number
          depth?: number
        }
        Relationships: []
      }
      notes: {
        Row: {
          id: string
          user_id: string
          notebook_id: string | null
          title: string
          content: Json
          plain_text: string
          is_favorited: boolean
          is_pinned: boolean
          is_trashed: boolean
          trashed_at: string | null
          word_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          notebook_id?: string | null
          title?: string
          content?: Json
          plain_text?: string
          is_favorited?: boolean
          is_pinned?: boolean
          is_trashed?: boolean
          trashed_at?: string | null
          word_count?: number
        }
        Update: {
          notebook_id?: string | null
          title?: string
          content?: Json
          plain_text?: string
          is_favorited?: boolean
          is_pinned?: boolean
          is_trashed?: boolean
          trashed_at?: string | null
          word_count?: number
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
        }
        Update: {
          name?: string
          color?: string
        }
        Relationships: []
      }
      note_tags: {
        Row: {
          note_id: string
          tag_id: string
        }
        Insert: {
          note_id: string
          tag_id: string
        }
        Update: {
          note_id?: string
          tag_id?: string
        }
        Relationships: []
      }
      note_versions: {
        Row: {
          id: string
          note_id: string
          user_id: string
          title: string | null
          content: Json
          version_number: number
          created_at: string
        }
        Insert: {
          id?: string
          note_id: string
          user_id: string
          title?: string | null
          content?: Json
          version_number: number
        }
        Update: {
          title?: string | null
          content?: Json
        }
        Relationships: []
      }
      shared_links: {
        Row: {
          id: string
          note_id: string
          user_id: string
          token: string
          password_hash: string | null
          expires_at: string | null
          is_active: boolean
          view_count: number
          created_at: string
        }
        Insert: {
          id?: string
          note_id: string
          user_id: string
          token?: string
          password_hash?: string | null
          expires_at?: string | null
        }
        Update: {
          password_hash?: string | null
          expires_at?: string | null
          is_active?: boolean
          view_count?: number
        }
        Relationships: []
      }
      attachments: {
        Row: {
          id: string
          note_id: string
          user_id: string
          file_name: string
          file_type: string | null
          file_size: number | null
          storage_path: string
          ocr_text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          note_id: string
          user_id: string
          file_name: string
          file_type?: string | null
          file_size?: number | null
          storage_path: string
          ocr_text?: string | null
        }
        Update: {
          file_name?: string
          ocr_text?: string | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          id: string
          user_id: string | null
          name: string
          content: Json
          category: string | null
          is_system: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          content?: Json
          category?: string | null
          is_system?: boolean
        }
        Update: {
          name?: string
          content?: Json
          category?: string | null
        }
        Relationships: []
      }
      audio_recordings: {
        Row: {
          id: string
          note_id: string
          user_id: string
          storage_path: string
          duration_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          note_id: string
          user_id: string
          storage_path: string
          duration_seconds?: number | null
        }
        Update: {
          duration_seconds?: number | null
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Note = Database['public']['Tables']['notes']['Row']
export type NoteInsert = Database['public']['Tables']['notes']['Insert']
export type NoteUpdate = Database['public']['Tables']['notes']['Update']
export type Notebook = Database['public']['Tables']['notebooks']['Row']
export type NotebookInsert = Database['public']['Tables']['notebooks']['Insert']
export type Tag = Database['public']['Tables']['tags']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
