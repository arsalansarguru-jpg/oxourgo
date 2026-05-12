/**
 * Generated Supabase types — replace with `supabase gen types`.
 * @example npx supabase gen types typescript --project-id <id> > services/supabase/database.types.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
