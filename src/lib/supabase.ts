import { createClient } from '@supabase/supabase-js';

// URL e chiave "publishable" sono pubbliche per natura: la sicurezza dei dati
// è garantita dalle regole di accesso (RLS) nel database.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lhymcknoojjhkesqorlq.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_z-0lXakVJtLsK4Wr8BKLmg__wxW0EDq';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
