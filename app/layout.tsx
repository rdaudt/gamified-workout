import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Coach Gabe Pushup Challenge',
  description:
    'Sponsor-led pushup challenge microsite for fast sessions, branded share cards, and session video exports.',
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
