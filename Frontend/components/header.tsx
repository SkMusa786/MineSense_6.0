'use client'

import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import type { SystemStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

interface HeaderProps {
  status: SystemStatus
  onMenu: () => void
}

function StatusPill({
  label,
  value,
  ok,
}: {
  label: string
  value: string
  ok: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          'size-2 rounded-full',
          ok ? 'bg-normal' : 'bg-critical',
        )}
        aria-hidden
      />
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span
        className={cn(
          'text-[11px] font-semibold',
          ok ? 'text-normal-foreground' : 'text-critical-foreground',
        )}
      >
        {value}
      </span>
    </div>
  )
}

export function Header({ status, onMenu }: HeaderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const lastUpdated = mounted
    ? new Date(status.lastUpdated).toLocaleTimeString('en-GB')
    : '--:--:--'

  return (
    <header className="sticky top-0 z-20 border-b bg-card">
      <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
        <button
          type="button"
          onClick={onMenu}
          className="rounded-md border p-2 text-foreground hover:bg-accent lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="text-balance text-base font-bold leading-tight text-foreground lg:text-lg">
            Mine Subsidence Monitoring System
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            AI-Enabled Real-Time Monitoring &amp; Early Warning
          </p>
        </div>

        <div className="hidden items-center gap-x-5 gap-y-1 md:flex md:flex-wrap md:justify-end xl:gap-x-6">
          <StatusPill
            label="System"
            value={status.system}
            ok={status.system === 'ONLINE'}
          />
          <StatusPill
            label="MQTT"
            value={status.mqtt}
            ok={status.mqtt === 'CONNECTED'}
          />
          <StatusPill
            label="Backend"
            value={status.backend}
            ok={status.backend === 'ONLINE'}
          />
          <div className="hidden flex-col items-end lg:flex">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Last Updated
            </span>
            <span className="font-mono text-[11px] font-medium text-foreground">
              {lastUpdated}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
