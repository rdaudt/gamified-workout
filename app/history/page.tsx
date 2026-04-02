import { AppShell } from '@/components/layout/AppShell'
import { mockHistory } from '@/lib/platform/mock-data'

export default function HistoryPage() {
  return (
    <AppShell
      title="Workout History"
      eyebrow="History is only for registered users. Each saved workout preserves its own branding snapshot."
    >
      <div className="grid gap-4">
        {mockHistory.map((workout) => (
          <article key={workout.id} className="rounded-[2rem] border border-line bg-panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-accentSoft">
                  {workout.exercise}
                </p>
                <h2 className="mt-2 font-display text-3xl">
                  {workout.goodFormReps} good reps
                </h2>
                <p className="mt-2 text-sm text-ink/70">
                  {new Date(workout.occurredAt).toLocaleDateString()} · form {workout.formScore}%
                  · effort {workout.effortScore}
                </p>
              </div>
              <div className="rounded-2xl bg-panelAlt px-4 py-3 text-sm text-ink/75">
                <p className="text-xs uppercase tracking-[0.25em] text-signal">Branding</p>
                <p className="mt-2">
                  {workout.attribution.brandingSource === 'coach'
                    ? `Coach: ${workout.attribution.coachDisplayName}`
                    : 'App branding'}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  )
}
