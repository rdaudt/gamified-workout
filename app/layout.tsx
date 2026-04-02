import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Beat Past You',
  description:
    'Social fitness challenge platform with pushup sessions, shareable result cards, coach discovery, and role-based surfaces.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
