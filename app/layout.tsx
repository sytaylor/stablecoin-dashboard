import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StableScan - Stablecoin Analytics Dashboard',
  description:
    'Real-time stablecoin market data, cross-chain bridge flows, and analytics. Track USDT, USDC, DAI and 80+ stablecoins across 50+ blockchains.',
  keywords: [
    'stablecoin',
    'USDT',
    'USDC',
    'DAI',
    'crypto',
    'blockchain',
    'DeFi',
    'bridge',
    'cross-chain',
    'analytics',
  ],
  openGraph: {
    title: 'StableScan - Stablecoin Analytics Dashboard',
    description:
      'Real-time stablecoin market data, cross-chain bridge flows, and analytics.',
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
