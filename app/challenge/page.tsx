import { PushupChallengeClient } from '@/components/challenge/PushupChallengeClient'
import { AppShell } from '@/components/layout/AppShell'

export const dynamic = 'force-dynamic'

export default function ChallengePage() {
  return (
    <AppShell
      title="Pushup Challenge"
      eyebrow="Portrait, front-camera challenge flow for quick self-testing, instant sharing, and coach-aware visibility."
    >
      <PushupChallengeClient />
    </AppShell>
  )
}
