import { AppShell } from '@/components/layout/AppShell'
import { getHistoryPageData } from '@/lib/platform/repository'

export const dynamic = 'force-dynamic'

function formatDuration(durationSeconds: number) {
  const minutes = Math.floor(durationSeconds / 60)
  const seconds = durationSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default async function HistoryPage() {
  const { currentUser, source, workouts } = await getHistoryPageData()

  return (
    <AppShell
      title="Challenge History"
      eyebrow="History is only for registered users. Each saved challenge result preserves its own branding snapshot."
    >
      <div className="mb-4 rounded-full border border-line bg-panelAlt px-4 py-2 text-xs uppercase tracking-[0.25em] text-ink/60">
        {source === 'mock' ? 'Demo history fallback' : 'Supabase challenge history'}
      </div>

      {!currentUser ? (
        <section className="rounded-[2rem] border border-dashed border-line bg-panel p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-accentSoft">Sign in required</p>
          <h2 className="mt-3 font-display text-3xl">No persisted history for guests</h2>
          <p className="mt-3 max-w-2xl text-sm text-ink/72">
            Guests still get the full session and share flow, but history only exists once an
            authenticated challenger saves results to Supabase.
          </p>
        </section>
      ) : workouts.length > 0 ? (
        <div className="grid gap-4">
          {workouts.map((workout) => (
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
                    {new Date(workout.occurredAt).toLocaleDateString()} |{' '}
                    {formatDuration(workout.durationSeconds)} | form {workout.formScore}% |
                    effort {workout.effortScore}
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
      ) : (
        <section className="rounded-[2rem] border border-dashed border-line bg-panel p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-accentSoft">No saves yet</p>
          <h2 className="mt-3 font-display text-3xl">Your challenge history is empty</h2>
          <p className="mt-3 max-w-2xl text-sm text-ink/72">
            The persistence boundary is live, but there are no saved challenge results for
            this account yet. Each saved session lands here with its frozen attribution
            snapshot.
          </p>
        </section>
      )}
    </AppShell>
  )
}
