'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  TrendingUp,
  Activity,
  GitBranch,
  Shield,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { useDashboardStore } from '@/stores/dashboard'
import { TIME_RANGES } from '@/stores/dashboard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard, description: 'Executive summary' },
  { name: 'Market', href: '/stablecoins', icon: TrendingUp, description: 'Supply & dominance' },
  { name: 'Activity', href: '/activity', icon: Activity, description: 'Volume & addresses' },
  { name: 'Bridge Activity', href: '/bridges', icon: GitBranch, description: 'Cross-chain flows' },
  { name: 'Risk', href: '/risk', icon: Shield, description: 'Peg & concentration' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen, timeRange, setTimeRange } =
    useDashboardStore()

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-64 border-r bg-background transition-transform duration-200 md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Mobile close button */}
          <div className="flex items-center justify-end p-4 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Time range selector */}
          <div className="border-t p-4">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Time Range
            </label>
            <Select
              value={timeRange.value}
              onValueChange={(value) => {
                const range = TIME_RANGES.find((r) => r.value === value)
                if (range) setTimeRange(range)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="text-xs text-muted-foreground">
              <p>Data from DefiLlama + Dune</p>
              <p className="mt-1">Updates every 5 min</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
