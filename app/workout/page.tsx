import { AppShell } from '@/components/layout/AppShell'

const guestActions = [
  'Start a camera-guided session',
  'See live rep counting and result screen',
  'Generate a card',
  'Download and share it immediately',
]

export default function WorkoutPage() {
  return (
    <AppShell
      title="Workout Flow"
      eyebrow="This scaffold does not implement camera AI yet, but the product rules for guests and registered users are already encoded."
    >
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[2rem] border border-line bg-panel p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-accentSoft">Guest session</p>
          <h2 className="mt-3 font-display text-3xl">Stateless but full-featured</h2>
          <ul className="mt-4 grid gap-3 text-sm text-ink/75">
            {guestActions.map((action) => (
              <li key={action} className="rounded-2xl bg-panelAlt px-4 py-3">
                {action}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink/60">
            When the guest session ends, the app does not keep workouts, cards, coach
            relationships, or profile state.
          </p>
        </article>

        <article className="rounded-[2rem] border border-line bg-panel p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-signal">Registered session</p>
          <h2 className="mt-3 font-display text-3xl">Same flow, plus persistence</h2>
          <div className="mt-4 grid gap-3 text-sm text-ink/75">
            <div className="rounded-2xl bg-panelAlt px-4 py-3">
              Save workouts and build exercise history
            </div>
            <div className="rounded-2xl bg-panelAlt px-4 py-3">
              Keep app or coach branding snapshots with each saved workout
            </div>
            <div className="rounded-2xl bg-panelAlt px-4 py-3">
              Surface coach CTA only when a current coach exists
            </div>
          </div>
        </article>
      </section>
    </AppShell>
  )
}
