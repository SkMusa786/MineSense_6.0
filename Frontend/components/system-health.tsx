'use client'

import {
  Cpu,
  Radio,
  Server,
  BrainCircuit,
  BatteryMedium,
  SignalHigh,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { API_BASE_URL } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { MineNode, SystemStatus } from '@/lib/types'

interface SystemHealthProps {
  status: SystemStatus
  nodes: MineNode[]
}

const PIPELINE = [
  { label: 'Sensor Nodes', icon: Cpu, desc: 'Tilt · Displacement · Vibration · Crack' },
  { label: 'Gateway / MQTT Broker', icon: Radio, desc: 'Telemetry ingestion' },
  { label: 'FastAPI Backend', icon: Server, desc: 'Feature engineering · /predict' },
  { label: 'Random Forest Model', icon: BrainCircuit, desc: 'Risk classification' },
]

export function SystemHealth({ status, nodes }: SystemHealthProps) {
  const online = nodes.filter((n) => n.online)
  const avgBattery = Math.round(
    online.reduce((a, n) => a + n.battery, 0) / Math.max(1, online.length),
  )
  const avgRssi = Math.round(
    online.reduce((a, n) => a + n.rssi, 0) / Math.max(1, online.length),
  )

  const services: { label: string; value: string; ok: boolean }[] = [
    { label: 'System', value: status.system, ok: status.system === 'ONLINE' },
    { label: 'MQTT Broker', value: status.mqtt, ok: status.mqtt === 'CONNECTED' },
    { label: 'Backend API', value: status.backend, ok: status.backend === 'ONLINE' },
    { label: 'ML Inference', value: status.ml, ok: status.ml === 'READY' },
  ]

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {services.map((svc) => (
            <div
              key={svc.label}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span className="text-xs font-medium text-foreground">{svc.label}</span>
              <span className="flex items-center gap-1.5">
                <span
                  className={cn('size-2 rounded-full', svc.ok ? 'bg-normal' : 'bg-critical')}
                  aria-hidden
                />
                <span
                  className={cn(
                    'font-mono text-[11px] font-semibold',
                    svc.ok ? 'text-normal-foreground' : 'text-critical-foreground',
                  )}
                >
                  {svc.value}
                </span>
              </span>
            </div>
          ))}
          <div className="rounded-md bg-secondary/60 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Backend Endpoint
            </p>
            <p className="break-all font-mono text-[11px] text-foreground">
              {API_BASE_URL}/predict
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Network &amp; Device Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <SignalHigh className="size-4" />
                <span className="text-[11px]">Nodes Reporting</span>
              </div>
              <p className="mt-1 font-mono text-xl font-bold text-foreground">
                {online.length}/{nodes.length}
              </p>
            </div>
            <div className="rounded-md border p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <BatteryMedium className="size-4" />
                <span className="text-[11px]">Avg Battery</span>
              </div>
              <p className="mt-1 font-mono text-xl font-bold text-foreground">
                {avgBattery}%
              </p>
            </div>
          </div>
          <div className="rounded-md border p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Avg Signal (RSSI)</span>
              <span className="font-mono text-sm font-bold text-foreground">
                {avgRssi} dBm
              </span>
            </div>
          </div>
          <div className="rounded-md border p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Data Pipeline
            </p>
            <div className="space-y-2">
              {PIPELINE.map((step, i) => {
                const Icon = step.icon
                return (
                  <div key={step.label} className="flex items-center gap-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground">{step.label}</p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {step.desc}
                      </p>
                    </div>
                    <span className="size-2 rounded-full bg-normal" aria-hidden />
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
