import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import {
  requireSupabasePublicEnv,
  requireSupabaseServiceRoleKey,
} from '@/lib/supabase/env'

export function createSupabaseAdminClient(): SupabaseClient<Database> {
  const { url } = requireSupabasePublicEnv()
  const serviceRoleKey = requireSupabaseServiceRoleKey()

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
