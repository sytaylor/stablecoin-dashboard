'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Moon, Sun, Menu, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDashboardStore } from '@/stores/dashboard'
import { formatRelativeTime } from '@/lib/utils/format'

export function Header() {
  const { theme, setTheme } = useTheme()
  const { sidebarOpen, setSidebarOpen, lastUpdated } = useDashboardStore()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden mr-2"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            S
          </div>
          <span className="font-bold text-lg hidden sm:inline-block">
            StableScan
          </span>
        </Link>

        <nav className="ml-8 hidden md:flex items-center space-x-6">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Overview
          </Link>
          <Link
            href="/stablecoins"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Stablecoins
          </Link>
          <Link
            href="/chains"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Chains
          </Link>
          <Link
            href="/bridges"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Bridges
          </Link>
        </nav>

        <div className="ml-auto flex items-center space-x-2">
          {lastUpdated && (
            <div className="hidden sm:flex items-center text-xs text-muted-foreground mr-4">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin-slow" />
              <span className="live-indicator">
                Updated {formatRelativeTime(lastUpdated)}
              </span>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
