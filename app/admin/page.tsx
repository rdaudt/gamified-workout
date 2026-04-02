import { AppShell } from '@/components/layout/AppShell'
import { getAdminPageData } from '@/lib/platform/repository'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const { currentUser, isAdmin, pendingProfiles, source } = await getAdminPageData()

  return (
    <AppShell
      title="Admin Operations"
      eyebrow="Service admins approve coaches, promote backup admins, and keep the platform operable. They are not a separate account type."
    >
      <div className="mb-4 rounded-full border border-line bg-panelAlt px-4 py-2 text-xs uppercase tracking-[0.25em] text-ink/60">
        {source === 'mock' ? 'Demo admin fallback' : 'Supabase admin queue'}
      </div>

      {!isAdmin && source === 'supabase' ? (
        <section className="rounded-[2rem] border border-dashed border-line bg-panel p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-accentSoft">Admin only</p>
          <h2 className="mt-3 font-display text-3xl">Approval tools are locked</h2>
          <p className="mt-3 max-w-2xl text-sm text-ink/72">
            {currentUser
              ? 'This session resolved a real account, but it does not carry the admin role.'
              : 'Sign in with an admin account once auth is wired to use the approval queue.'}
          </p>
        </section>
      ) : (
        <div className="grid gap-4">
          <section className="rounded-[2rem] border border-line bg-panel p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-accentSoft">Approval queue</p>
            <div className="mt-4 grid gap-3">
              {pendingProfiles.map((profile) => (
                <article key={profile.id} className="rounded-2xl bg-panelAlt p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-display text-2xl">{profile.userName}</h2>
                      <p className="text-sm text-ink/70">{profile.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-canvas">
                        Approve
                      </button>
                      <button className="rounded-full border border-line px-4 py-2 text-sm text-ink/75">
                        Reject
                      </button>
                    </div>
                  </div>
                </article>
              ))}
              {pendingProfiles.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line p-4 text-sm text-ink/70">
                  No pending coach applications.
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[2rem] border border-line bg-panel p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-signal">Backup admins</p>
            <p className="mt-3 text-sm text-ink/72">
              The first admin is seeded directly in the backend. Existing admins can later
              promote backup admins from ordinary accounts.
            </p>
          </section>
        </div>
      )}
    </AppShell>
  )
}
