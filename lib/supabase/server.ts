import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { requireSupabasePublicEnv } from '@/lib/supabase/env'

export function createSupabaseServerClient(): SupabaseClient<Database> {
  const cookieStore = cookies()
  const { url, publishableKey } = requireSupabasePublicEnv()

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components may render with a read-only cookie store.
        }
      },
    },
  })
}
