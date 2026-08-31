'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HistoryRow, MineNode, TrendPoint } from '@/lib/types'

interface TrendChartsProps {
  node: MineNode
  history: HistoryRow[]
}

const axisProps = {
  stroke: 'var(--muted-foreground)',
  fontSize: 10,
  tickLine: false,
  axisLine: false,
}

function ChartTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border bg-card px-2.5 py-1.5 shadow-md">
      <p className="mb-0.5 font-mono text-[10px] text-muted-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-mono text-xs font-semibold text-foreground">
          {p.value}
          <span className="ml-0.5 text-[10px] text-muted-foreground">{unit}</span>
        </p>
      ))}
    </div>
  )
}

export function TrendCharts({ node, history }: TrendChartsProps) {
  const data: TrendPoint[] = [...history]
    .filter((row) => row.nodeId === node.id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-12)
    .map((row) => ({
      time: new Date(row.timestamp).toISOString().slice(11, 16),
      displacement: row.displacement,
      tilt: row.tilt,
      crack: row.crackWidth,
      vibration: row.vibration,
    }))

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Displacement Trend</CardTitle>
          <span className="font-mono text-[11px] text-muted-foreground">mm · {node.id}</span>
        </CardHeader>
        <CardContent className="p-3">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="dispFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="time" {...axisProps} interval="preserveStartEnd" />
              <YAxis {...axisProps} width={38} />
              <Tooltip content={<ChartTooltip unit="mm" />} />
              <Area
                type="monotone"
                dataKey="displacement"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#dispFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tilt Magnitude Trend</CardTitle>
          <span className="font-mono text-[11px] text-muted-foreground">deg · {node.id}</span>
        </CardHeader>
        <CardContent className="p-3">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="time" {...axisProps} interval="preserveStartEnd" />
              <YAxis {...axisProps} width={38} />
              <Tooltip content={<ChartTooltip unit="°" />} />
              <Line
                type="monotone"
                dataKey="tilt"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Crack Width Trend</CardTitle>
          <span className="font-mono text-[11px] text-muted-foreground">mm · {node.id}</span>
        </CardHeader>
        <CardContent className="p-3">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="time" {...axisProps} interval="preserveStartEnd" />
              <YAxis {...axisProps} width={38} />
              <Tooltip content={<ChartTooltip unit="mm" />} />
              <Line
                type="monotone"
                dataKey="crack"
                stroke="var(--chart-4)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vibration Trend</CardTitle>
          <span className="font-mono text-[11px] text-muted-foreground">g · {node.id}</span>
        </CardHeader>
        <CardContent className="p-3">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="vibFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="time" {...axisProps} interval="preserveStartEnd" />
              <YAxis {...axisProps} width={38} />
              <Tooltip content={<ChartTooltip unit="g" />} />
              <Area
                type="monotone"
                dataKey="vibration"
                stroke="var(--chart-3)"
                strokeWidth={2}
                fill="url(#vibFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
