import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'

const pillars = [
  'Guests can complete the full pushup challenge without creating an account.',
  'One account can carry trainee, coach, and admin roles.',
  'Coach relationships are optional and zero-or-one in MVP.',
  'Branding is frozen per saved challenge result, not globally reassigned later.',
]

export default function HomePage() {
  return (
    <AppShell
      title="Challenge Platform"
      eyebrow="Beat Past You is being built as a social fitness challenge platform, not a generic workout tracker."
    >
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-line bg-panel p-6 shadow-glow">
          <p className="text-sm uppercase tracking-[0.3em] text-accentSoft">
            Canonical MVP
          </p>
          <h2 className="mt-3 font-display text-4xl leading-tight">
            Pushup-first challenge sessions built to be performed, saved, and shared fast.
          </h2>
          <p className="mt-4 max-w-2xl text-base text-ink/72">
            Guests get the complete challenge and result-card flow with zero persistence.
            Registered users add saved results, coach relationships, and role-driven
            visibility surfaces on top.
          </p>
          <div className="mt-6 grid gap-3">
            {pillars.map((item) => (
              <div key={item} className="rounded-2xl bg-panelAlt px-4 py-3 text-sm text-ink/75">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/challenge"
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-canvas"
            >
              Open pushup challenge
            </Link>
            <Link
              href="/coaches"
              className="rounded-full border border-line px-5 py-3 text-sm text-ink/80"
            >
              Browse coaches
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[2rem] border border-line bg-panel p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-signal">Guest rule</p>
            <p className="mt-2 text-sm text-ink/75">
              Share and download are allowed for guests. Persistence is not.
            </p>
          </div>
          <div className="rounded-[2rem] border border-line bg-panel p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-signal">Coach rule</p>
            <p className="mt-2 text-sm text-ink/75">
              Coach approval and directory visibility are separate states.
            </p>
          </div>
          <div className="rounded-[2rem] border border-line bg-panel p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-signal">History rule</p>
            <p className="mt-2 text-sm text-ink/75">
              Past challenge results keep the branding they had when they were created.
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  )
}
