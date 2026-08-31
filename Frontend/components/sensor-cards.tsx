'use client'

import { Gauge, Move3d, Activity, Ruler, Waves } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { RISK_STYLES } from '@/lib/risk'
import { cn } from '@/lib/utils'
import type { MineNode, RiskLevel } from '@/lib/types'

interface SensorCardsProps {
  node: MineNode
}

interface Metric {
  key: string
  label: string
  value: number
  unit: string
  icon: typeof Gauge
  warn: number
  crit: number
}

function statusFor(value: number, warn: number, crit: number): RiskLevel {
  if (value >= crit) return 'CRITICAL'
  if (value >= warn) return 'WARNING'
  if (value >= warn * 0.6) return 'WATCH'
  return 'NORMAL'
}

export function SensorCards({ node }: SensorCardsProps) {
  const s = node.sensors
  const f = node.features

  const metrics: Metric[] = [
    { key: 'tilt', label: 'Tilt Magnitude', value: f.tilt_magnitude_deg, unit: '°', icon: Move3d, warn: 0.5, crit: 0.8 },
    { key: 'disp', label: 'Displacement', value: s.displacement_mm, unit: 'mm', icon: Ruler, warn: 5, crit: 7 },
    { key: 'vib', label: 'Vibration', value: s.vibration_g, unit: 'g', icon: Waves, warn: 0.05, crit: 0.08 },
    { key: 'crack', label: 'Crack Width', value: s.crack_width_mm, unit: 'mm', icon: Activity, warn: 0.15, crit: 0.22 },
    { key: 'rate', label: 'Displacement Rate', value: f.displacement_rate_mm_per_hour, unit: 'mm/h', icon: Gauge, warn: 30, crit: 55 },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {metrics.map((m) => {
        const status = statusFor(m.value, m.warn, m.crit)
        const style = RISK_STYLES[status]
        const pct = Math.min(100, (m.value / m.crit) * 100)
        const Icon = m.icon
        return (
          <Card key={m.key} className="p-3">
            <div className="flex items-center justify-between">
              <Icon className={cn('size-4', style.text)} />
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-[9px] font-bold uppercase',
                  style.badgeBg,
                  style.text,
                )}
              >
                {status}
              </span>
            </div>
            <p className="mt-2 text-[11px] font-medium text-muted-foreground">
              {m.label}
            </p>
            <p className="font-mono text-lg font-bold text-foreground">
              {m.value.toFixed(2)}
              <span className="ml-0.5 text-xs font-medium text-muted-foreground">
                {m.unit}
              </span>
            </p>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn('h-full rounded-full', style.dot)}
                style={{ width: `${Math.max(4, pct)}%` }}
              />
            </div>
          </Card>
        )
      })}
    </div>
  )
}
