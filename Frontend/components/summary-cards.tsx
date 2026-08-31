'use client'

import {
  ShieldAlert,
  CircuitBoard,
  Wifi,
  TriangleAlert,
  OctagonAlert,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { RISK_STYLES, highestRisk } from '@/lib/risk'
import { cn } from '@/lib/utils'
import type { MineNode } from '@/lib/types'

interface SummaryCardsProps {
  nodes: MineNode[]
}

export function SummaryCards({ nodes }: SummaryCardsProps) {
  const total = nodes.length
  const active = nodes.filter((n) => n.online).length
  const warningZones = nodes.filter((n) => n.risk_level === 'WARNING').length
  const criticalZones = nodes.filter((n) => n.risk_level === 'CRITICAL').length
  const overall = highestRisk(nodes.filter((n) => n.online).map((n) => n.risk_level))
  const overallStyle = RISK_STYLES[overall]

  const cards = [
    {
      label: 'Overall Risk',
      value: overall,
      icon: ShieldAlert,
      valueClass: overallStyle.text,
      accent: overallStyle.dot,
      isRisk: true,
    },
    {
      label: 'Total Nodes',
      value: String(total),
      icon: CircuitBoard,
      valueClass: 'text-foreground',
      accent: 'bg-primary',
    },
    {
      label: 'Active Nodes',
      value: `${active}`,
      sub: `of ${total}`,
      icon: Wifi,
      valueClass: 'text-foreground',
      accent: 'bg-normal',
    },
    {
      label: 'Warning Zones',
      value: String(warningZones),
      icon: TriangleAlert,
      valueClass: 'text-warning-foreground',
      accent: 'bg-warning',
    },
    {
      label: 'Critical Zones',
      value: String(criticalZones),
      icon: OctagonAlert,
      valueClass: 'text-critical-foreground',
      accent: 'bg-critical',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <Card key={c.label} className="relative overflow-hidden">
            <span
              className={cn('absolute inset-x-0 top-0 h-0.5', c.accent)}
              aria-hidden
            />
            <div className="flex items-start justify-between p-4">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {c.label}
                </p>
                <p
                  className={cn(
                    'mt-1.5 font-bold leading-none',
                    c.isRisk ? 'text-xl' : 'text-2xl',
                    c.valueClass,
                  )}
                >
                  {c.value}
                  {c.sub && (
                    <span className="ml-1 text-sm font-medium text-muted-foreground">
                      {c.sub}
                    </span>
                  )}
                </p>
              </div>
              <Icon className={cn('size-4 shrink-0', c.valueClass)} />
            </div>
          </Card>
        )
      })}
    </div>
  )
}
