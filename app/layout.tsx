import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Be_Vietnam_Pro, Cormorant_Garamond, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const sans = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans-vi',
})

const mono = JetBrains_Mono({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-mono-vi',
})

const fantasy = Cormorant_Garamond({
  subsets: ['latin', 'vietnamese'],
  weight: ['600', '700'],
  variable: '--font-fantasy-vi',
})

export const metadata: Metadata = {
  title: 'World Simulator - God Sandbox',
  description:
    'A 2D pixel art god simulator and world sandbox inspired by WorldBox with living civilizations, dynamic kingdoms, intelligent AI, diplomacy, and divine powers.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0c0a09',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className={`${sans.variable} ${mono.variable} ${fantasy.variable}`}>
      <body className="antialiased bg-stone-950 text-stone-100 overflow-hidden select-none">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
