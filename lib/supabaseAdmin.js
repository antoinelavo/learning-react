// lib/supabaseAdmin.js
//
// Service-role Supabase client for server-side (API route) use only.
// NEVER import this from client components — the service role key bypasses
// RLS entirely. Mutating/community routes verify the caller's identity via
// requireCommunityUser()/requireAdmin() (see lib/communityAuth.js) *before*
// using this client to read or write.
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Both NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
