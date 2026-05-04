import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Open Source Project Index',
  description: 'Discover production-grade open source repositories',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        <header className="border-b border-gray-800 px-6 py-4">
          <h1 className="text-lg font-semibold tracking-tight">Open Source Project Index</h1>
        </header>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
