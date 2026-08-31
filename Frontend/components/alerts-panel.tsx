'use client'

import { Bell, BellOff, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RiskBadge } from '@/components/risk-badge'
import { RISK_STYLES } from '@/lib/risk'
import { cn } from '@/lib/utils'
import type { AlertItem } from '@/lib/types'

interface AlertsPanelProps {
  alerts: AlertItem[]
  onAcknowledge?: (id: string) => void
  onSelectNode?: (nodeId: string) => void
  compact?: boolean
}

export function AlertsPanel({
  alerts,
  onAcknowledge,
  onSelectNode,
  compact,
}: AlertsPanelProps) {
  const active = alerts.filter((a) => a.status === 'Active').length

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Bell className="size-4" />
          Active Alerts
        </CardTitle>
        {active > 0 ? (
          <span className="rounded-full bg-critical px-2 py-0.5 text-[11px] font-bold text-critical-foreground">
            {active} active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <BellOff className="size-3" /> None
          </span>
        )}
      </CardHeader>
      <CardContent className={cn('space-y-2', compact ? 'max-h-80 overflow-y-auto' : '')}>
        {alerts.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No alerts. All monitored zones nominal.
          </p>
        )}
        {alerts.map((alert) => {
          const style = RISK_STYLES[alert.severity]
          return (
            <div
              key={alert.id}
              className={cn(
                'rounded-md border-l-4 bg-card p-3 shadow-sm',
                alert.status === 'Acknowledged' && 'opacity-70',
              )}
              style={{ borderLeftColor: style.cssVar }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <RiskBadge level={alert.severity} />
                  <button
                    type="button"
                    onClick={() => onSelectNode?.(alert.nodeId)}
                    className="font-mono text-xs font-bold text-foreground underline-offset-2 hover:underline"
                  >
                    {alert.nodeId}
                  </button>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {alert.time}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {alert.description}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span
                  className={cn(
                    'text-[10px] font-semibold uppercase tracking-wide',
                    alert.status === 'Active'
                      ? 'text-critical-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {alert.status}
                </span>
                {alert.status === 'Active' && onAcknowledge && (
                  <button
                    type="button"
                    onClick={() => onAcknowledge(alert.id)}
                    className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-medium text-foreground hover:bg-accent"
                  >
                    <Check className="size-3" /> Acknowledge
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
