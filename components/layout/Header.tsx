'use client'

import Link from 'next/link'
import { Menu, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDashboardStore } from '@/stores/dashboard'
import { formatRelativeTime } from '@/lib/utils/format'

export function Header() {
  const { sidebarOpen, setSidebarOpen, lastUpdated } = useDashboardStore()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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

        <Link href="/" className="flex items-center space-x-3">
          {/* Tokenized logo - gradient circle */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#5189F1] to-[#C54AD8]">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-bold text-lg gradient-text leading-tight">
              Tokenized
            </span>
            <span className="text-[10px] text-muted-foreground -mt-1">
              Stablecoin Analytics
            </span>
          </div>
        </Link>

        <nav className="ml-8 hidden lg:flex items-center space-x-6">
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
            href="/activity"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Activity
          </Link>
          <Link
            href="/bridges"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Bridges
          </Link>
        </nav>

        <div className="ml-auto flex items-center space-x-4">
          {lastUpdated && (
            <div className="hidden sm:flex items-center text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3 mr-1.5" />
              <span className="live-indicator">
                Updated {formatRelativeTime(lastUpdated)}
              </span>
            </div>
          )}

          {/* Podcast link */}
          <a
            href="https://www.tokenizedpod.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-colors"
          >
            Listen to Podcast
          </a>
        </div>
      </div>
    </header>
  )
}
