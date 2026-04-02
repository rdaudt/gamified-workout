import {
  getSupabasePublicEnv,
  selectSupabasePublicKey,
} from '@/lib/supabase/env'

describe('supabase env helpers', () => {
  it('prefers the publishable key when both public key formats are present', () => {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    } as NodeJS.ProcessEnv

    expect(selectSupabasePublicKey(env)).toBe('publishable-key')
    expect(getSupabasePublicEnv(env)).toEqual({
      url: 'https://example.supabase.co',
      publishableKey: 'publishable-key',
    })
  })

  it('falls back to the anon key for older env files', () => {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    } as NodeJS.ProcessEnv

    expect(selectSupabasePublicKey(env)).toBe('anon-key')
  })

  it('returns null when the public environment is incomplete', () => {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: '',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    } as NodeJS.ProcessEnv

    expect(getSupabasePublicEnv(env)).toBeNull()
  })
})
