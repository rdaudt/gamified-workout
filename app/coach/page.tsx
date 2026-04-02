import { AppShell } from '@/components/layout/AppShell'

export default function CoachPage() {
  return (
    <AppShell
      title="Coach Workspace"
      eyebrow="Coach role is additive. A trainee can apply for coach role from the same account and later manage visibility separately from approval."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-[2rem] border border-line bg-panel p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-accentSoft">Application</p>
          <h2 className="mt-3 font-display text-3xl">Pending review</h2>
          <p className="mt-3 text-sm text-ink/72">
            Coach application field strictness is intentionally left flexible for now. The
            workflow only locks the lifecycle state: pending, approved, or rejected.
          </p>
        </section>

        <section className="rounded-[2rem] border border-line bg-panel p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-signal">Directory visibility</p>
          <h2 className="mt-3 font-display text-3xl">Independent toggle</h2>
          <p className="mt-3 text-sm text-ink/72">
            Approval and visibility are separate. An approved coach can stay hidden from the
            public directory until they are ready to be discoverable.
          </p>
        </section>
      </div>
    </AppShell>
  )
}
