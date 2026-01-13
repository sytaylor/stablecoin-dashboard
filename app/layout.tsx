import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Tokenized - Stablecoin Analytics',
  description:
    'Real-time stablecoin market intelligence. Track payments volume, bridge flows, and on-chain activity across 80+ stablecoins and 50+ blockchains.',
  keywords: [
    'stablecoin',
    'USDT',
    'USDC',
    'payments',
    'tokenization',
    'RWA',
    'crypto',
    'blockchain',
    'DeFi',
    'bridge',
    'analytics',
  ],
  openGraph: {
    title: 'Tokenized - Stablecoin Analytics',
    description:
      'Real-time stablecoin market intelligence from the Tokenized podcast team.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen bg-background">
            <Header />
            <div className="flex">
              <Sidebar />
              <main className="flex-1 md:ml-64">
                <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
