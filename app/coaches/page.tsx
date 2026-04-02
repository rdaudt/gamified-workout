import { CoachDirectory } from '@/components/coaches/CoachDirectory'
import { AppShell } from '@/components/layout/AppShell'
import { mockCoachDirectory } from '@/lib/platform/mock-data'

export default function CoachesPage() {
  return (
    <AppShell
      title="Coach Directory"
      eyebrow="Approved coaches control whether they appear here. Trainees can attach one current coach from this directory or by invite link."
    >
      <CoachDirectory coaches={mockCoachDirectory} />
    </AppShell>
  )
}
