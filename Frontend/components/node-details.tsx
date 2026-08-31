'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RiskBadge } from '@/components/risk-badge'
import { RISK_STYLES } from '@/lib/risk'
import { cn } from '@/lib/utils'
import type { MineNode } from '@/lib/types'

interface NodeDetailsProps {
  node: MineNode
}

function Row({
  label,
  value,
  unit,
  emphasize,
}: {
  label: string
  value: string | number
  unit?: string
  emphasize?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          'font-mono text-xs font-semibold text-foreground',
          emphasize && 'text-sm',
        )}
      >
        {value}
        {unit && <span className="ml-0.5 text-[10px] text-muted-foreground">{unit}</span>}
      </span>
    </div>
  )
}

export function NodeDetails({ node }: NodeDetailsProps) {
  const style = RISK_STYLES[node.risk_level]
  const s = node.sensors
  const f = node.features

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selected Node</CardTitle>
        <RiskBadge level={node.risk_level} />
      </CardHeader>
      <CardContent className="p-0">
        <div className={cn('flex items-center justify-between px-4 py-3', style.badgeBg)}>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Node
            </p>
            <p className="font-mono text-2xl font-bold text-foreground">{node.id}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Model Confidence
            </p>
            <p className={cn('text-2xl font-bold', style.text)}>
              {node.probability.toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="px-4 py-2">
          <p className="py-1.5 font-mono text-[11px] text-muted-foreground">
            {new Date(node.timestamp).toISOString().replace('T', ' ').slice(0, 19)} UTC
          </p>
          <div className="grid grid-cols-2 gap-x-5">
            <div className="divide-y">
              <p className="pt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Sensor Readings
              </p>
              <Row label="Tilt X" value={s.tilt_x_deg.toFixed(2)} unit="°" />
              <Row label="Tilt Y" value={s.tilt_y_deg.toFixed(2)} unit="°" />
              <Row label="Tilt Magnitude" value={f.tilt_magnitude_deg.toFixed(2)} unit="°" />
              <Row label="Displacement" value={s.displacement_mm.toFixed(2)} unit="mm" />
              <Row label="Vibration" value={s.vibration_g.toFixed(2)} unit="g" />
              <Row label="Crack Width" value={s.crack_width_mm.toFixed(2)} unit="mm" />
            </div>
            <div className="divide-y">
              <p className="pt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Derived Features
              </p>
              <Row label="Displacement Change" value={f.displacement_change_mm.toFixed(2)} unit="mm" />
              <Row label="Displacement Rate" value={f.displacement_rate_mm_per_hour.toFixed(2)} unit="mm/h" />
              <Row label="Crack Change" value={f.crack_change_mm.toFixed(2)} unit="mm" />
              <Row label="Neighbour Difference" value={f.displacement_vs_neighbor_mm.toFixed(2)} unit="mm" />
              <Row label="Risk Probability" value={`${node.probability.toFixed(0)}%`} emphasize />
            </div>
          </div>

          {(node.future_4h_risk || node.future_6h_risk || node.early_warning) && (
            <div className="mt-4 rounded-md border border-warning/40 bg-warning-muted p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-warning-foreground">
                Early Warning
              </p>
              <div className="mt-2 space-y-2 text-xs text-foreground">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">4h forecast</span>
                  <span className="font-semibold">{node.future_4h_risk ?? 'NORMAL'}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">4h probability</span>
                  <span className="font-semibold">{(node.future_4h_probability ?? 0).toFixed(0)}%</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">6h forecast</span>
                  <span className="font-semibold">{node.future_6h_risk ?? 'NORMAL'}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">6h probability</span>
                  <span className="font-semibold">{(node.future_6h_probability ?? 0).toFixed(0)}%</span>
                </div>
                <p className="text-[11px] text-warning-foreground">
                  Possible critical condition within approximately 4–6 hours.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
