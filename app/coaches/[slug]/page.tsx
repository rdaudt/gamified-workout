import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { getCoachPublicPageData } from '@/lib/platform/repository'

export const dynamic = 'force-dynamic'

export default async function CoachPublicPage({
  params,
}: {
  params: { slug: string }
}) {
  const { coach } = await getCoachPublicPageData(params.slug)

  if (!coach) {
    notFound()
  }

  return (
    <AppShell
      title={coach.coachProfile.nickname}
      eyebrow="Approved coaches use these public pages to turn challenge traffic into visibility for themselves and their business."
    >
      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="overflow-hidden rounded-[2rem] border border-line bg-panel shadow-glow">
          <div className="aspect-[4/5] w-full bg-canvas">
            <img
              src={coach.coachProfile.pictureUrl}
              alt={coach.coachProfile.nickname}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-accentSoft">
              @{coach.profile.userName}
            </p>
            <h2 className="mt-3 font-display text-4xl">{coach.coachProfile.nickname}</h2>
            <p className="mt-4 text-sm leading-7 text-ink/75">
              {coach.coachProfile.shortBio ??
                'Coach profile is live and ready for challenge visibility.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {coach.businessProfile.businessEmail ? (
                <a
                  href={`mailto:${coach.businessProfile.businessEmail}`}
                  className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-canvas"
                >
                  Contact coach
                </a>
              ) : null}
              <Link
                href="/challenge"
                className="rounded-full border border-line px-4 py-2 text-sm text-ink/75"
              >
                Open pushup challenge
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <article className="rounded-[2rem] border border-line bg-panel p-6 shadow-glow">
            <p className="text-xs uppercase tracking-[0.28em] text-signal">Business</p>
            <h3 className="mt-3 font-display text-3xl">
              {coach.businessProfile.businessName ?? 'Independent coach'}
            </h3>
            {coach.businessProfile.businessMotto ? (
              <p className="mt-3 text-sm text-ink/72">
                {coach.businessProfile.businessMotto}
              </p>
            ) : null}
            <div className="mt-5 grid gap-3 text-sm text-ink/75">
              <div className="rounded-2xl bg-panelAlt px-4 py-3">
                Location: {coach.businessProfile.businessLocation ?? 'Remote'}
              </div>
              <div className="rounded-2xl bg-panelAlt px-4 py-3">
                Credentials:{' '}
                {coach.coachProfile.professionalCredentials ?? 'Not listed yet'}
              </div>
              <div className="rounded-2xl bg-panelAlt px-4 py-3">
                Visibility: public challenge discovery is enabled
              </div>
            </div>
          </article>

          <article className="rounded-[2rem] border border-line bg-panel p-6 shadow-glow">
            <p className="text-xs uppercase tracking-[0.28em] text-accentSoft">
              Reach surfaces
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              {coach.businessProfile.instagramUrl ? (
                <a
                  href={coach.businessProfile.instagramUrl}
                  className="rounded-full border border-line px-4 py-2 text-ink/75"
                  target="_blank"
                  rel="noreferrer"
                >
                  Instagram
                </a>
              ) : null}
              {coach.businessProfile.youtubeUrl ? (
                <a
                  href={coach.businessProfile.youtubeUrl}
                  className="rounded-full border border-line px-4 py-2 text-ink/75"
                  target="_blank"
                  rel="noreferrer"
                >
                  YouTube
                </a>
              ) : null}
              {coach.businessProfile.linkedinUrl ? (
                <a
                  href={coach.businessProfile.linkedinUrl}
                  className="rounded-full border border-line px-4 py-2 text-ink/75"
                  target="_blank"
                  rel="noreferrer"
                >
                  LinkedIn
                </a>
              ) : null}
            </div>
            <p className="mt-4 text-sm text-ink/72">
              These coach pages are the public landing surfaces for challenge-driven discovery
              until Team and gym profiles arrive later.
            </p>
          </article>
        </section>
      </div>
    </AppShell>
  )
}
