'use client'

import {
  LayoutDashboard,
  Radio,
  Map,
  Bell,
  Database,
  FileText,
  Activity,
  Mountain,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type ViewKey =
  | 'overview'
  | 'live'
  | 'map'
  | 'alerts'
  | 'history'
  | 'reports'
  | 'health'

const NAV: { key: ViewKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'live', label: 'Live Monitoring', icon: Radio },
  { key: 'map', label: 'Risk Map', icon: Map },
  { key: 'alerts', label: 'Alerts & Emergency', icon: Bell },
  { key: 'history', label: 'Historical Data', icon: Database },
  { key: 'reports', label: 'Reports', icon: FileText },
  { key: 'health', label: 'System Health', icon: Activity },
]

interface SidebarProps {
  active: ViewKey
  onChange: (view: ViewKey) => void
  alertCount: number
  open: boolean
  onClose: () => void
}

export function Sidebar({
  active,
  onChange,
  alertCount,
  open,
  onClose,
}: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-2.5 border-b border-sidebar-border px-4 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Mountain className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">
              Subsidence Monitor
            </p>
            <p className="truncate text-[11px] text-sidebar-foreground/70">
              SIH 2026 Prototype
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-md p-1 text-sidebar-foreground/70 hover:bg-sidebar-accent lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((item) => {
            const Icon = item.icon
            const isActive = active === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onChange(item.key)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.key === 'alerts' && alertCount > 0 && (
                  <span className="rounded-full bg-critical px-1.5 py-0.5 text-[10px] font-bold text-critical-foreground">
                    {alertCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4 text-[11px] leading-relaxed text-sidebar-foreground/60">
          <p className="font-medium text-sidebar-foreground/80">
            Data Pipeline
          </p>
          <p>Sensors → Gateway → MQTT → FastAPI → Random Forest → Dashboard</p>
        </div>
      </aside>
    </>
  )
}
