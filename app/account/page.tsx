import Link from 'next/link'
import { RoleBadges } from '@/components/account/RoleBadges'
import { AppShell } from '@/components/layout/AppShell'
import { getAccountPageData } from '@/lib/platform/repository'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const { currentUser, relationship, currentCoachName, source } =
    await getAccountPageData()

  return (
    <AppShell
      title="Account"
      eyebrow="One account can carry multiple roles. Coach attachment is optional, and future challenge results use the current relationship automatically."
    >
      <div className="mb-4 rounded-full border border-line bg-panelAlt px-4 py-2 text-xs uppercase tracking-[0.25em] text-ink/60">
        {source === 'mock' ? 'Demo data fallback' : 'Supabase-backed account state'}
      </div>

      {!currentUser ? (
        <section className="rounded-[2rem] border border-dashed border-line bg-panel p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-accentSoft">Auth required</p>
          <h2 className="mt-3 font-display text-3xl">Sign in to load your account</h2>
          <p className="mt-3 max-w-2xl text-sm text-ink/72">
            Supabase is configured, but there is no active user session in this request. The
            next slice is wiring the real signup and login surfaces into this challenge
            foundation.
          </p>
          <div className="mt-5">
            <Link
              href="/coaches"
              className="rounded-full border border-line px-4 py-2 text-sm text-ink/75"
            >
              Browse coaches
            </Link>
          </div>
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] border border-line bg-panel p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-accentSoft">Profile</p>
            <h2 className="mt-3 font-display text-3xl">{currentUser.userName}</h2>
            <p className="mt-2 text-sm text-ink/72">{currentUser.email}</p>
            <div className="mt-5">
              <RoleBadges roles={currentUser.roles} />
            </div>
          </section>

          <section className="rounded-[2rem] border border-line bg-panel p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-signal">Current coach</p>
            <h2 className="mt-3 font-display text-3xl">
              {relationship?.coachUserId
                ? currentCoachName ?? 'Coach attached'
                : 'No coach assigned'}
            </h2>
            <p className="mt-3 text-sm text-ink/72">
              {relationship?.coachUserId
                ? 'Future saved challenge results will keep this coach attribution until the relationship changes again.'
                : 'When no coach is attached, result cards use app branding and the product can prompt the user to browse the directory instead of showing a coach booking CTA.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/coaches"
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-canvas"
              >
                Browse coaches
              </Link>
              <button className="rounded-full border border-line px-4 py-2 text-sm text-ink/75">
                Remove current coach
              </button>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  )
}
