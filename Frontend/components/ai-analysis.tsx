'use client'

import { BrainCircuit, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RiskBadge } from '@/components/risk-badge'
import { RISK_STYLES } from '@/lib/risk'
import { cn } from '@/lib/utils'
import type { MineNode } from '@/lib/types'

interface AiAnalysisProps {
  node: MineNode
}

/**
 * Approximate per-node feature contributions for explainability.
 * The true importances come from the trained Random Forest; here we normalise
 * the node's derived features against their warning thresholds to visualise
 * which signals are driving the prediction.
 */
function contributions(node: MineNode) {
  const f = node.features
  const raw = [
    { label: 'Displacement rate', v: f.displacement_rate_mm_per_hour / 55 },
    { label: 'Displacement change', v: f.displacement_change_mm / 6 },
    { label: 'Neighbour difference', v: f.displacement_vs_neighbor_mm / 5.5 },
    { label: 'Tilt magnitude', v: f.tilt_magnitude_deg / 1 },
    { label: 'Crack change', v: f.crack_change_mm / 0.23 },
  ].map((r) => ({ ...r, v: Math.max(0.02, Math.min(1, r.v)) }))

  const total = raw.reduce((a, r) => a + r.v, 0)
  return raw
    .map((r) => ({ label: r.label, pct: Math.round((r.v / total) * 100) }))
    .sort((a, b) => b.pct - a.pct)
}

export function AiAnalysis({ node }: AiAnalysisProps) {
  const style = RISK_STYLES[node.risk_level]
  const feats = contributions(node)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <BrainCircuit className="size-4 text-primary" />
          AI / ML Risk Analysis
        </CardTitle>
        <span className="font-mono text-[10px] text-muted-foreground">
          Random Forest Classifier
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={cn(
            'flex items-center justify-between rounded-md border px-3 py-2.5',
            style.badgeBg,
            style.border,
          )}
        >
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Prediction · {node.id}
            </p>
            <div className="mt-1">
              <RiskBadge level={node.risk_level} size="md" />
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Probability
            </p>
            <p className={cn('text-2xl font-bold', style.text)}>
              {node.probability.toFixed(0)}%
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Top Contributing Features
          </p>
          <div className="space-y-2">
            {feats.map((feat) => (
              <div key={feat.label}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-foreground">{feat.label}</span>
                  <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                    {feat.pct}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${feat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-md bg-secondary/60 px-3 py-2.5">
          <ArrowRight className={cn('mt-0.5 size-4 shrink-0', style.text)} />
          <div>
            <p className="text-xs font-semibold text-foreground">
              Recommended action
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {style.guidance}. Prediction generated from live sensor features
              via the backend inference service.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
