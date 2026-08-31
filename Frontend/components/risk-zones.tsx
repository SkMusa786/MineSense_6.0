'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RiskBadge } from '@/components/risk-badge'
import { riskRank } from '@/lib/risk'
import { cn } from '@/lib/utils'
import type { BackendZone, MineNode } from '@/lib/types'

interface RiskZonesProps {
  nodes: MineNode[]
  selectedId: string
  onSelect: (id: string) => void
  title?: string
  limit?: number
  zones?: BackendZone[]
}

export function RiskZones({
  nodes,
  selectedId,
  onSelect,
  title = 'Node Risk Ranking',
  limit,
  zones = [],
}: RiskZonesProps) {
  const sorted = [...nodes].sort((a, b) => {
    const r = riskRank(b.risk_level) - riskRank(a.risk_level)
    return r !== 0 ? r : b.probability - a.probability
  })
  const list = limit ? sorted.slice(0, limit) : sorted

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <span className="text-[11px] text-muted-foreground">{list.length} nodes</span>
      </CardHeader>
      <CardContent className="max-h-[420px] space-y-1.5 overflow-y-auto p-2">
        {zones.length > 0 && (
          <div className="rounded-md border bg-secondary/40 p-2">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Subsidence Zones
            </p>
            <div className="space-y-2">
              {zones.slice(0, 3).map((zone) => (
                <div key={zone.zone_id} className="rounded border bg-card/70 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-foreground">
                      {zone.zone_id}
                    </span>
                    <RiskBadge level={zone.risk_level === 'HIGH' ? 'WARNING' : 'NORMAL'} showDot={false} />
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">{zone.message}</p>
                  <p className="mt-1 font-mono text-[10px] text-foreground">{zone.nodes.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {list.map((node) => {
          const isSelected = node.id === selectedId
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => onSelect(node.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors',
                isSelected
                  ? 'border-primary/50 bg-secondary'
                  : 'border-transparent hover:bg-secondary/60',
              )}
              aria-pressed={isSelected}
            >
              <span className="font-mono text-xs font-bold text-foreground">
                {node.id}
              </span>
              <div className="flex-1">
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      node.online ? 'bg-primary' : 'bg-muted-foreground/40',
                    )}
                    style={{ width: `${Math.max(4, node.probability)}%` }}
                  />
                </div>
              </div>
              <span className="w-9 text-right font-mono text-[11px] text-muted-foreground">
                {node.online ? `${node.probability}%` : '—'}
              </span>
              {node.online ? (
                <RiskBadge level={node.risk_level} showDot={false} />
              ) : (
                <span className="rounded-full border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  OFFLINE
                </span>
              )}
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
