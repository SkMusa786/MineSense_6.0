'use client'

import { Navigation, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RISK_STYLES } from '@/lib/risk'
import { cn } from '@/lib/utils'
import type { MineNode, RiskLevel } from '@/lib/types'

interface MineMapProps {
  nodes: MineNode[]
  selectedId: string
  onSelect: (id: string) => void
}

const LEGEND: { level: RiskLevel }[] = [
  { level: 'NORMAL' },
  { level: 'WATCH' },
  { level: 'WARNING' },
  { level: 'CRITICAL' },
]

export function MineMap({ nodes, selectedId, onSelect }: MineMapProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Live Mine Surface Monitoring Map</CardTitle>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          <Info className="size-3" /> Prototype visualization
        </span>
      </CardHeader>
      <CardContent className="p-3">
        <div
          className="relative aspect-[16/10] w-full overflow-hidden rounded-md border bg-secondary/40"
          style={{
            backgroundImage:
              'linear-gradient(to right, color-mix(in oklch, var(--border) 60%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklch, var(--border) 60%, transparent) 1px, transparent 1px)',
            backgroundSize: '8% 10%',
          }}
        >
          {/* Surface monitoring area */}
          <div className="absolute inset-[6%] rounded-md border-2 border-dashed border-primary/30" />
          <span className="absolute left-[7%] top-[7%] rounded bg-card/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Surface Monitoring Area
          </span>

          {/* Underground panel outline */}
          <div className="absolute left-[24%] top-[22%] h-[56%] w-[52%] rounded-sm border-2 border-primary/50 bg-primary/5">
            <span className="absolute -top-2 left-2 bg-card px-1 text-[10px] font-semibold text-primary">
              Underground Panel
            </span>
          </div>

          {/* North indicator */}
          <div className="absolute right-3 top-3 flex flex-col items-center text-primary">
            <Navigation className="size-5" />
            <span className="text-[10px] font-bold">N</span>
          </div>

          {/* Nodes */}
          {nodes.map((node) => {
            const style = RISK_STYLES[node.risk_level]
            const isSelected = node.id === selectedId
            const isAlarm =
              node.risk_level === 'WARNING' || node.risk_level === 'CRITICAL'
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => onSelect(node.id)}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                aria-label={`${node.id} — ${node.risk_level}`}
                aria-pressed={isSelected}
              >
                {isAlarm && node.online && (
                  <span
                    className={cn(
                      'absolute inset-0 -z-10 animate-ping rounded-full opacity-60',
                      style.dot,
                    )}
                    aria-hidden
                  />
                )}
                <span
                  className={cn(
                    'flex size-4 items-center justify-center rounded-full border-2 border-card shadow transition-transform group-hover:scale-125',
                    node.online ? style.dot : 'bg-muted-foreground/40',
                    isSelected && 'ring-2 ring-foreground ring-offset-1',
                  )}
                />
                <span
                  className={cn(
                    'absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap rounded bg-card/90 px-1 text-[9px] font-semibold',
                    isSelected ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {node.id}
                </span>
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground">
            Legend:
          </span>
          {LEGEND.map(({ level }) => (
            <span key={level} className="flex items-center gap-1.5">
              <span
                className={cn('size-2.5 rounded-full', RISK_STYLES[level].dot)}
                aria-hidden
              />
              <span className="text-[11px] text-foreground">{level}</span>
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-muted-foreground/40" aria-hidden />
            <span className="text-[11px] text-foreground">OFFLINE</span>
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
