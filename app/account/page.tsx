import { RoleBadges } from '@/components/account/RoleBadges'
import { AppShell } from '@/components/layout/AppShell'
import { mockCurrentUser, mockRelationship } from '@/lib/platform/mock-data'

export default function AccountPage() {
  return (
    <AppShell
      title="Account"
      eyebrow="One account can carry multiple roles. Coach attachment is optional and user-controlled."
    >
      <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[2rem] border border-line bg-panel p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-accentSoft">Profile</p>
          <h2 className="mt-3 font-display text-3xl">{mockCurrentUser.userName}</h2>
          <p className="mt-2 text-sm text-ink/72">{mockCurrentUser.email}</p>
          <div className="mt-5">
            <RoleBadges roles={mockCurrentUser.roles} />
          </div>
        </section>

        <section className="rounded-[2rem] border border-line bg-panel p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-signal">Current coach</p>
          <h2 className="mt-3 font-display text-3xl">
            {mockRelationship.coachUserId ? 'Attached' : 'No coach assigned'}
          </h2>
          <p className="mt-3 text-sm text-ink/72">
            When no coach is attached, cards use app branding and the product can prompt the
            user to browse the directory instead of showing a coach booking CTA.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-canvas">
              Browse coaches
            </button>
            <button className="rounded-full border border-line px-4 py-2 text-sm text-ink/75">
              Remove current coach
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
