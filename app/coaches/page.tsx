import { CoachDirectory } from '@/components/coaches/CoachDirectory'
import { AppShell } from '@/components/layout/AppShell'
import { getCoachDirectoryPageData } from '@/lib/platform/repository'

export const dynamic = 'force-dynamic'

export default async function CoachesPage() {
  const { coaches, source } = await getCoachDirectoryPageData()

  return (
    <AppShell
      title="Coach Directory"
      eyebrow="Approved coaches control whether they appear here. Trainees can attach one current coach from this directory or by invite link."
    >
      <div className="mb-4 rounded-full border border-line bg-panelAlt px-4 py-2 text-xs uppercase tracking-[0.25em] text-ink/60">
        {source === 'mock' ? 'Demo directory fallback' : 'Supabase public directory'}
      </div>
      {coaches.length > 0 ? (
        <CoachDirectory coaches={coaches} />
      ) : (
        <section className="rounded-[2rem] border border-dashed border-line bg-panel p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-accentSoft">No coaches yet</p>
          <h2 className="mt-3 font-display text-3xl">The public directory is empty</h2>
          <p className="mt-3 max-w-2xl text-sm text-ink/72">
            This now reads from the real coach directory tables. Coaches only appear here after
            approval and after enabling visibility.
          </p>
        </section>
      )}
    </AppShell>
  )
}
