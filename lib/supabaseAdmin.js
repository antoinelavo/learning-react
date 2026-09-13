// lib/supabaseAdmin.js
//
// Service-role Supabase client for server-side (API route) use only.
// NEVER import this from client components — the service role key bypasses
// RLS entirely. Mutating/community routes verify the caller's identity via
// getCommunityUser()/requireAdminUser() (see lib/communityAuth.js) *before*
// using this client to read or write.
//
// The client is created lazily (on first actual use) rather than at module
// load time. Next.js imports every route module during the build's "page
// data collection" step, even for routes that are never invoked — so a
// throw at the top level here would fail the whole build the moment
// SUPABASE_SERVICE_ROLE_KEY is unset, instead of only the requests that
// actually need it.
import { createClient } from '@supabase/supabase-js'

let client = null

function getClient() {
  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Both NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  }

  client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return client
}

// Proxy so existing call sites (`supabaseAdmin.from(...)`, `.auth.getUser()`,
// etc.) keep working unchanged — the real client is only constructed the
// first time a property is actually accessed.
export const supabaseAdmin = new Proxy({}, {
  get(_target, prop) {
    return getClient()[prop]
  },
})
