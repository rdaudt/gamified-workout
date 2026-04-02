import type { Route } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

const navItems = [
  { href: '/', label: 'Overview' },
  { href: '/workout', label: 'Workout' },
  { href: '/history', label: 'History' },
  { href: '/coaches', label: 'Coaches' },
  { href: '/account', label: 'Account' },
  { href: '/coach', label: 'Coach' },
  { href: '/admin', label: 'Admin' },
] as const satisfies ReadonlyArray<{ href: Route; label: string }>

interface AppShellProps {
  title: string
  eyebrow?: string
  children: ReactNode
}

export function AppShell({ title, eyebrow, children }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line/70 bg-canvas/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-accentSoft">
                Beat Past You
              </p>
              <h1 className="font-display text-3xl text-ink">{title}</h1>
              {eyebrow ? (
                <p className="mt-1 max-w-2xl text-sm text-ink/70">{eyebrow}</p>
              ) : null}
            </div>
            <div className="rounded-full border border-line bg-panel px-3 py-1 text-xs text-signal">
              Mobile-first MVP
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-line bg-panelAlt px-3 py-2 text-sm text-ink/80 transition hover:border-accent hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}
