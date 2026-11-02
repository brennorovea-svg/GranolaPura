import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

// Cliente com service role: ignora RLS. Só existe dentro das funções.
export const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);
