import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { requireSupabasePublicEnv } from '@/lib/supabase/env'

let browserClient: SupabaseClient<Database> | undefined

export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  if (browserClient) {
    return browserClient
  }

  const { url, publishableKey } = requireSupabasePublicEnv()

  browserClient = createBrowserClient<Database>(url, publishableKey)

  return browserClient
}
