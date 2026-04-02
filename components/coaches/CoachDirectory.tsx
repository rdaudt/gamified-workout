import Link from 'next/link'
import type { CoachDirectoryEntry } from '@/lib/types/domain'

export function CoachDirectory({
  coaches,
  allowAttach = true,
}: {
  coaches: CoachDirectoryEntry[]
  allowAttach?: boolean
}) {
  return (
    <div className="grid gap-4">
      {coaches
        .filter((coach) => coach.directory.isApproved && coach.directory.visibilityEnabled)
        .map((coach) => (
          <article
            key={coach.profile.id}
            className="rounded-3xl border border-line bg-panel p-5 shadow-glow"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-accentSoft">
                  @{coach.profile.userName}
                </p>
                <Link href={`/coaches/${coach.profile.userName}`}>
                  <h2 className="mt-1 font-display text-2xl transition hover:text-accentSoft">
                    {coach.coachProfile.nickname}
                  </h2>
                </Link>
                <p className="mt-2 text-sm text-ink/75">{coach.coachProfile.shortBio}</p>
              </div>
              <div className="rounded-full border border-line bg-canvas px-3 py-1 text-xs text-signal">
                {coach.businessProfile.businessLocation ?? 'Remote'}
              </div>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-ink/75 sm:grid-cols-2">
              <div className="rounded-2xl bg-panelAlt p-3">
                <p className="text-xs uppercase tracking-[0.25em] text-ink/45">Business</p>
                <p className="mt-2">{coach.businessProfile.businessName ?? 'Independent coach'}</p>
                {coach.businessProfile.businessMotto ? (
                  <p className="mt-1 text-ink/60">
                    {coach.businessProfile.businessMotto}
                  </p>
                ) : null}
              </div>
              <div className="rounded-2xl bg-panelAlt p-3">
                <p className="text-xs uppercase tracking-[0.25em] text-ink/45">Credentials</p>
                <p className="mt-2">
                  {coach.coachProfile.professionalCredentials ?? 'Not listed yet'}
                </p>
              </div>
            </div>

            {allowAttach ? (
              <div className="mt-4 flex gap-3">
                <Link
                  href={`/coaches/${coach.profile.userName}`}
                  className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-canvas"
                >
                  View coach
                </Link>
                <Link
                  href="/challenge"
                  className="rounded-full border border-line px-4 py-2 text-sm text-ink/70"
                >
                  Open challenge
                </Link>
              </div>
            ) : null}
          </article>
        ))}
    </div>
  )
}
