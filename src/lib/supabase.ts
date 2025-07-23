import { createClient } from '@supabase/supabase-js';

// This file only exports the Supabase client. If you want type safety for your tables, generate types using the Supabase CLI and import them from a generated types file (e.g., src/types/supabase.ts).
// See: https://supabase.com/docs/guides/api/generating-types

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '<YOUR_SUPABASE_URL>';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '<YOUR_SUPABASE_ANON_KEY>';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase; 