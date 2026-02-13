// lib/supabase.js
import { createClient } from '@supabase/supabase-js'



const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnon) {
  throw new Error('Both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set')
}

export const supabase = createClient(supabaseUrl, supabaseAnon)

export async function getUserRole() {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  return data?.role ?? null;
}

export async function getTeacherStatus() {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('teachers')
    .select('status')
    .eq('user_id', user.id)
    .single();

  return data?.status ?? null;
}
