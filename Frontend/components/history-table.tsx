'use client'

import { useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RiskBadge } from '@/components/risk-badge'
import { RISK_ORDER } from '@/lib/risk'
import type { HistoryRow, RiskLevel } from '@/lib/types'

interface HistoryTableProps {
  rows: HistoryRow[]
  loading?: boolean
  error?: string | null
}

export function HistoryTable({ rows, loading = false, error = null }: HistoryTableProps) {
  const [node, setNode] = useState<string>('ALL')
  const [risk, setRisk] = useState<string>('ALL')
  const [query, setQuery] = useState('')

  const nodeIds = useMemo(
    () => Array.from(new Set(rows.map((r) => r.nodeId))).sort(),
    [rows],
  )

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (node !== 'ALL' && r.nodeId !== node) return false
      if (risk !== 'ALL' && r.risk !== risk) return false
      if (query && !`${r.nodeId} ${r.timestamp}`.toLowerCase().includes(query.toLowerCase()))
        return false
      return true
    })
  }, [rows, node, risk, query])

  function exportCsv() {
    const header = [
      'timestamp',
      'node_id',
      'tilt_deg',
      'displacement_mm',
      'vibration_g',
      'crack_width_mm',
      'risk_level',
      'confidence_pct',
    ]
    const lines = filtered.map((r) =>
      [
        r.timestamp,
        r.nodeId,
        r.tilt,
        r.displacement,
        r.vibration,
        r.crackWidth,
        r.risk,
        r.confidence,
      ].join(','),
    )
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `subsidence-history-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectClass =
    'rounded-md border bg-card px-2 py-1.5 text-xs text-foreground'

  return (
    <Card>
      <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <CardTitle>Historical Sensor &amp; Prediction Log</CardTitle>
          {loading && (
            <p className="text-[11px] text-muted-foreground">Loading historical data…</p>
          )}
          {!loading && error && (
            <p className="text-[11px] text-destructive">{error}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-32 rounded-md border bg-card py-1.5 pl-7 pr-2 text-xs text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <select value={node} onChange={(e) => setNode(e.target.value)} className={selectClass}>
            <option value="ALL">All nodes</option>
            {nodeIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <select value={risk} onChange={(e) => setRisk(e.target.value)} className={selectClass}>
            <option value="ALL">All risk</option>
            {RISK_ORDER.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            <Download className="size-3.5" /> CSV
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[460px] overflow-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-secondary text-muted-foreground">
              <tr>
                {['Timestamp (UTC)', 'Node', 'Tilt °', 'Disp. mm', 'Vib. g', 'Crack mm', 'Risk', 'Conf.'].map(
                  (h) => (
                    <th key={h} className="whitespace-nowrap px-3 py-2 font-semibold">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr
                  key={`${r.nodeId}-${r.timestamp}-${i}`}
                  className="border-t hover:bg-secondary/50"
                >
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-muted-foreground">
                    {r.timestamp}
                  </td>
                  <td className="px-3 py-2 font-mono font-semibold text-foreground">
                    {r.nodeId}
                  </td>
                  <td className="px-3 py-2 font-mono">{r.tilt.toFixed(2)}</td>
                  <td className="px-3 py-2 font-mono">{r.displacement.toFixed(2)}</td>
                  <td className="px-3 py-2 font-mono">{r.vibration.toFixed(2)}</td>
                  <td className="px-3 py-2 font-mono">{r.crackWidth.toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <RiskBadge level={r.risk as RiskLevel} showDot={false} />
                  </td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">
                    {r.confidence}%
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                    No records match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t px-3 py-2 text-[11px] text-muted-foreground">
          Showing {filtered.length} of {rows.length} records
        </div>
      </CardContent>
    </Card>
  )
}
