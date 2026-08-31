'use client'

import { Radio, Play, Square, RefreshCw } from 'lucide-react'
import type { SystemStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ControlBarProps {
  status: SystemStatus
  liveMode: boolean
  onToggleLive: () => void
  demoRunning: boolean
  onToggleDemo: () => void
  pollInterval: number
  onPollIntervalChange: (v: number) => void
  secondsAgo: number
}

function MiniStat({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <span className={cn('size-2 rounded-full', ok ? 'bg-normal' : 'bg-critical')} aria-hidden />
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="font-mono text-[11px] font-semibold text-foreground">{value}</span>
    </div>
  )
}

export function ControlBar({
  status,
  liveMode,
  onToggleLive,
  demoRunning,
  onToggleDemo,
  pollInterval,
  onPollIntervalChange,
  secondsAgo,
}: ControlBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b bg-secondary/60 px-4 py-2 lg:px-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <MiniStat label="System" value={status.system} ok={status.system === 'ONLINE'} />
        <MiniStat label="MQTT" value={status.mqtt} ok={status.mqtt === 'CONNECTED'} />
        <MiniStat label="Backend" value={status.backend} ok={status.backend === 'ONLINE'} />
        <MiniStat label="ML" value={status.ml} ok={status.ml === 'READY'} />
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <RefreshCw className="size-3 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">
            Updated {secondsAgo}s ago
          </span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <label className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
          Interval
          <select
            value={pollInterval}
            onChange={(e) => onPollIntervalChange(Number(e.target.value))}
            className="rounded-md border bg-card px-1.5 py-1 font-mono text-[11px] text-foreground"
          >
            <option value={2000}>2s</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
          </select>
        </label>

        <button
          type="button"
          onClick={onToggleLive}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors',
            liveMode
              ? 'border-normal/40 bg-normal-muted text-normal-foreground'
              : 'bg-card text-foreground hover:bg-accent',
          )}
          aria-pressed={liveMode}
        >
          <Radio className={cn('size-3.5', liveMode && 'animate-pulse')} />
          {liveMode ? 'Live: ON' : 'Live Monitoring'}
        </button>

        <button
          type="button"
          onClick={onToggleDemo}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors',
            demoRunning
              ? 'border-warning/40 bg-warning-muted text-warning-foreground'
              : 'bg-primary text-primary-foreground hover:opacity-90',
          )}
          aria-pressed={demoRunning}
        >
          {demoRunning ? <Square className="size-3.5" /> : <Play className="size-3.5" />}
          {demoRunning ? 'Stop Demo' : 'Demo Simulation'}
        </button>
      </div>
    </div>
  )
}
