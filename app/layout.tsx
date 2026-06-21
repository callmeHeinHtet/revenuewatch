import './globals.css'
import '@fontsource-variable/fraunces'
import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import SWRegister from './sw-register'

export const metadata: Metadata = {
  title: 'Revenue Watch',
  description: 'Aung Naing Thu Hotel + RestroFlow live revenue',
  applicationName: 'Revenue Watch',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Revenue Watch' },
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0B0A07',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        {children}
        <SWRegister />
      </body>
    </html>
  )
}
