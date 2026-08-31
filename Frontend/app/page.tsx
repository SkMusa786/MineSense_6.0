'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Sidebar, type ViewKey } from '@/components/sidebar'
import { Header } from '@/components/header'
import { ControlBar } from '@/components/control-bar'
import { SummaryCards } from '@/components/summary-cards'
import { MineMap } from '@/components/mine-map'
import { NodeDetails } from '@/components/node-details'
import { SensorCards } from '@/components/sensor-cards'
import { TrendCharts } from '@/components/trend-charts'
import { AiAnalysis } from '@/components/ai-analysis'
import { AlertsPanel } from '@/components/alerts-panel'
import { EmergencyResponse } from '@/components/emergency-response'
import { RiskZones } from '@/components/risk-zones'
import { SystemHealth } from '@/components/system-health'
import { HistoryTable } from '@/components/history-table'
import { NODES, zoneFor } from '@/lib/mock-data'
import { classifyRisk, highestRisk } from '@/lib/risk'
import { API_BASE_URL, predict, toPredictRequest, applyPrediction } from '@/lib/api'
import type {
  AlertItem,
  BackendAlert,
  BackendAlertsResponse,
  BackendNodeRecord,
  BackendNodesResponse,
  BackendZonesResponse,
  HistoryRow,
  MineNode,
  RiskLevel,
  SystemStatus,
} from '@/lib/types'

const VIEW_TITLES: Record<ViewKey, { title: string; subtitle: string }> = {
  overview: {
    title: 'Operations Overview',
    subtitle: 'Network-wide subsidence risk at a glance',
  },
  live: {
    title: 'Live Monitoring',
    subtitle: 'Real-time sensor telemetry and ML predictions',
  },
  map: {
    title: 'Risk Map',
    subtitle: 'Spatial distribution of monitored nodes',
  },
  alerts: {
    title: 'Alerts & Emergency Response',
    subtitle: 'Active alerts, alert history, and emergency notification interface',
  },
  history: {
    title: 'Historical Data',
    subtitle: 'Logged sensor readings and prediction history',
  },
  reports: {
    title: 'Reports',
    subtitle: 'Node risk ranking and network summary',
  },
  health: {
    title: 'System Health',
    subtitle: 'Data pipeline and device diagnostics',
  },
}

/** Escalates a single node's readings to simulate a developing subsidence event. */
function escalateNode(node: MineNode, factor: number): MineNode {
  const s = node.sensors
  const nextDisp = s.displacement_mm + factor * 0.6
  const nextTiltX = s.tilt_x_deg + factor * 0.04
  const nextTiltY = s.tilt_y_deg + factor * 0.04
  const nextCrack = s.crack_width_mm + factor * 0.015
  const nextVib = Math.min(0.12, s.vibration_g + factor * 0.004)
  const tiltMag =
    Math.round(Math.sqrt(nextTiltX * nextTiltX + nextTiltY * nextTiltY) * 100) /
    100
  const rate = node.features.displacement_rate_mm_per_hour + factor * 6
  const { level, probability } = classifyRisk(nextDisp, tiltMag, nextCrack, rate)

  return {
    ...node,
    timestamp: new Date().toISOString(),
    risk_level: level,
    probability,
    sensors: {
      tilt_x_deg: Math.round(nextTiltX * 100) / 100,
      tilt_y_deg: Math.round(nextTiltY * 100) / 100,
      displacement_mm: Math.round(nextDisp * 100) / 100,
      vibration_g: Math.round(nextVib * 1000) / 1000,
      crack_width_mm: Math.round(nextCrack * 1000) / 1000,
    },
    features: {
      ...node.features,
      tilt_magnitude_deg: tiltMag,
      displacement_change_mm:
        Math.round((node.features.displacement_change_mm + factor * 0.6) * 100) /
        100,
      displacement_rate_mm_per_hour: Math.round(rate * 10) / 10,
      crack_change_mm:
        Math.round((node.features.crack_change_mm + factor * 0.015) * 1000) /
        1000,
    },
  }
}

const PROTOTYPE_NODE_LOOKUP = Object.fromEntries(NODES.map((node) => [node.id, node]))

function mapBackendNode(node: BackendNodeRecord): MineNode {
  const prototype = PROTOTYPE_NODE_LOOKUP[node.node_id] ?? NODES[0]

  return {
    ...prototype,
    id: node.node_id,
    label: node.node_id,
    timestamp: node.timestamp ?? prototype.timestamp,
    risk_level: node.risk_level ?? prototype.risk_level,
    probability: Number(node.probability ?? prototype.probability),
    future_4h_risk: node.future_4h_risk ?? prototype.future_4h_risk,
    future_4h_probability: Number(node.future_4h_probability ?? prototype.future_4h_probability ?? 0),
    future_6h_risk: node.future_6h_risk ?? prototype.future_6h_risk,
    future_6h_probability: Number(node.future_6h_probability ?? prototype.future_6h_probability ?? 0),
    early_warning: Boolean(node.early_warning ?? prototype.early_warning ?? false),
    estimated_time_window: node.estimated_time_window ?? prototype.estimated_time_window ?? 'approximately 4-6 hours',
    sensors: {
      ...prototype.sensors,
      tilt_x_deg: Number(node.sensors?.tilt_x_deg ?? prototype.sensors.tilt_x_deg),
      tilt_y_deg: Number(node.sensors?.tilt_y_deg ?? prototype.sensors.tilt_y_deg),
      displacement_mm: Number(node.sensors?.displacement_mm ?? prototype.sensors.displacement_mm),
      vibration_g: Number(node.sensors?.vibration_g ?? prototype.sensors.vibration_g),
      crack_width_mm: Number(node.sensors?.crack_width_mm ?? prototype.sensors.crack_width_mm),
    },
    features: {
      ...prototype.features,
      tilt_magnitude_deg: Number(
        node.calculated_features?.tilt_magnitude_deg ?? prototype.features.tilt_magnitude_deg,
      ),
      displacement_change_mm: Number(
        node.calculated_features?.displacement_change_mm ?? prototype.features.displacement_change_mm,
      ),
      displacement_rate_mm_per_hour: Number(
        node.calculated_features?.displacement_rate_mm_per_hour ?? prototype.features.displacement_rate_mm_per_hour,
      ),
      crack_change_mm: Number(
        node.calculated_features?.crack_change_mm ?? prototype.features.crack_change_mm,
      ),
      displacement_vs_neighbor_mm: Number(
        node.calculated_features?.displacement_vs_neighbor_mm ?? prototype.features.displacement_vs_neighbor_mm,
      ),
    },
    online: true,
  }
}

function mapBackendAlert(alert: BackendAlert): AlertItem {
  const prototype = PROTOTYPE_NODE_LOOKUP[alert.node_id] ?? NODES[0]
  const iso = new Date(alert.timestamp)
  const date = Number.isNaN(iso.getTime()) ? new Date().toISOString().slice(0, 10) : iso.toISOString().slice(0, 10)
  const time = Number.isNaN(iso.getTime()) ? '00:00:00 UTC' : `${iso.toISOString().slice(11, 19)} UTC`

  return {
    id: `${alert.node_id}-${alert.timestamp}`,
    severity: alert.risk_level,
    nodeId: alert.node_id,
    zone: zoneFor(prototype),
    date,
    time,
    description: alert.reasons.join(' · '),
    reasons: alert.reasons,
    confidence: Number(alert.probability ?? 0),
    status: alert.status === 'ACTIVE' ? 'Active' : alert.status === 'RESOLVED' ? 'Resolved' : 'Acknowledged',
    notifications: {
      controlRoom: false,
      safetyOfficer: false,
      responseTeam: false,
      hospital: false,
      ambulance: false,
    },
  }
}

export default function DashboardPage() {
  const [view, setView] = useState<ViewKey>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [nodes, setNodes] = useState<MineNode[]>(NODES)
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [zones, setZones] = useState<BackendZonesResponse['potential_subsidence_zones']>([])
  const [selectedId, setSelectedId] = useState<string>('N02')
  const [liveMode, setLiveMode] = useState(false)
  const [demoRunning, setDemoRunning] = useState(false)
  const [pollInterval, setPollInterval] = useState(5000)
  const [lastUpdated, setLastUpdated] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  const [backendOnline, setBackendOnline] = useState(false)
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [nodesLoading, setNodesLoading] = useState(true)
  const [nodesError, setNodesError] = useState<string | null>(null)
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [alertsError, setAlertsError] = useState<string | null>(null)
  const [zonesLoading, setZonesLoading] = useState(true)
  const [zonesError, setZonesError] = useState<string | null>(null)

  const demoTick = useRef(0)
  const nodesRef = useRef(nodes)

  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])

  useEffect(() => {
    let cancelled = false
    let inFlight = false

    const headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    }

    async function fetchLatestData() {
      if (inFlight) return
      inFlight = true

      setNodesLoading(true)
      setAlertsLoading(true)
      setZonesLoading(true)
      setNodesError(null)
      setAlertsError(null)
      setZonesError(null)

      try {
        const [nodesRes, alertsRes, zonesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/nodes`, { cache: 'no-store', headers }),
          fetch(`${API_BASE_URL}/alerts`, { cache: 'no-store', headers }),
          fetch(`${API_BASE_URL}/zones`, { cache: 'no-store', headers }),
        ])

        if (cancelled) return

        if (!nodesRes.ok || !alertsRes.ok || !zonesRes.ok) {
          throw new Error('One or more backend data sources failed to load.')
        }

        const nodesPayload = (await nodesRes.json()) as BackendNodesResponse
        const alertsPayload = (await alertsRes.json()) as BackendAlertsResponse
        const zonesPayload = (await zonesRes.json()) as BackendZonesResponse

        const mappedNodes = (nodesPayload.nodes ?? []).map(mapBackendNode)
        setNodes(mappedNodes.length > 0 ? mappedNodes : NODES)
        setBackendOnline(mappedNodes.length > 0)

        const mappedAlerts = (alertsPayload.active_alerts ?? []).map(mapBackendAlert)
        setAlerts(mappedAlerts)

        setZones(zonesPayload.potential_subsidence_zones ?? [])

        if (mappedNodes.length > 0 && !mappedNodes.some((node) => node.id === selectedId)) {
          setSelectedId(mappedNodes[0].id)
        }
      } catch (err) {
        if (cancelled) return
        setNodesError(
          err instanceof Error ? err.message : 'Unable to load live node data from the backend.',
        )
        setAlertsError('Unable to load live alerts from the backend.')
        setZonesError('Unable to load potential subsidence zones from the backend.')
        setNodes(NODES)
        setAlerts([])
        setZones([])
      } finally {
        if (!cancelled) {
          setNodesLoading(false)
          setAlertsLoading(false)
          setZonesLoading(false)
          setLastUpdated(Date.now())
        }
        inFlight = false
      }
    }

    void fetchLatestData()

    const id = setInterval(() => {
      void fetchLatestData()
    }, 5000)

    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadHistory() {
      setHistoryLoading(true)
      setHistoryError(null)

      try {
        // Import the optimized history fetch function
        const { fetchHistory } = await import('@/lib/api')
        
        // Fetch with limit of 500 most recent records (default, user can increase via load more)
        const result = await fetchHistory(500, null)

        if (cancelled) return

        if (!result.ok || !result.history) {
          throw new Error(result.error || 'Failed to load history')
        }

        const mappedHistory = (result.history ?? []).map((row) => ({
          timestamp: String(row.timestamp_utc ?? ''),
          nodeId: String(row.node_id ?? ''),
          tilt: Number(row.tilt_magnitude_deg ?? 0),
          displacement: Number(row.displacement_mm ?? 0),
          vibration: Number(row.vibration_g ?? 0),
          crackWidth: Number(row.crack_width_mm ?? 0),
          risk: (String(row.risk_level ?? 'NORMAL') as RiskLevel),
          confidence: Number(row.probability ?? 0),
        }))

        setHistory(mappedHistory)
      } catch (err) {
        if (cancelled) return
        setHistory([])
        setHistoryError(
          err instanceof Error ? err.message : 'Unable to load historical data.',
        )
      } finally {
        if (!cancelled) {
          setHistoryLoading(false)
        }
      }
    }

    void loadHistory()

    return () => {
      cancelled = true
    }
  }, [])

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? nodes[0]

  const status: SystemStatus = useMemo(
    () => ({
      system: 'ONLINE',
      mqtt: liveMode || demoRunning ? 'CONNECTED' : 'DISCONNECTED',
      backend: backendOnline ? 'ONLINE' : liveMode ? 'OFFLINE' : 'ONLINE',
      ml: 'READY',
      lastUpdated,
    }),
    [liveMode, demoRunning, backendOnline, lastUpdated],
  )

  const alertCount = alerts.filter((a) => a.status === 'Active').length

  // Keep the "updated Xs ago" ticker moving.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
  }, [])

  const handleAcknowledge = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Acknowledged' } : a)),
    )
  }, [])

  const jumpToNode = useCallback((nodeId: string) => {
    setSelectedId(nodeId)
    setView('live')
  }, [])

  // Live mode: poll the FastAPI backend for the selected node. Falls back
  // gracefully to the current values if the backend is unreachable.
  useEffect(() => {
    if (!liveMode) return

    const controller = new AbortController()
    let cancelled = false
    let inflight = false

    async function poll() {
      if (inflight) return
      inflight = true

      const node = nodesRef.current.find((n) => n.id === selectedId)
      if (!node || !node.online) {
        inflight = false
        return
      }

      const res = await predict(toPredictRequest(node), controller.signal)
      if (cancelled) return

      if (res.ok && res.data) {
        setBackendOnline(true)
        setNodes((prev) =>
          prev.map((n) =>
            n.id === node.id ? applyPrediction(n, res.data!) : n,
          ),
        )
      } else {
        setBackendOnline(false)
      }
      setLastUpdated(Date.now())
      inflight = false
    }

    void poll()
    const id = setInterval(() => {
      void poll()
    }, pollInterval)

    return () => {
      cancelled = true
      controller.abort()
      clearInterval(id)
    }
  }, [liveMode, pollInterval, selectedId])

  // Demo simulation: gradually escalate two nodes to demonstrate the early
  // warning workflow, generating a fresh alert when a node turns CRITICAL.
  useEffect(() => {
    if (!demoRunning) return
    demoTick.current = 0

    const id = setInterval(() => {
      demoTick.current += 1
      const factor = demoTick.current
      const targets = new Set(['N05', 'N12'])

      setNodes((prev) =>
        prev.map((n) => (targets.has(n.id) ? escalateNode(n, factor) : n)),
      )
      setLastUpdated(Date.now())

      setNodes((current) => {
        for (const nodeId of targets) {
          const node = current.find((n) => n.id === nodeId)
          if (node && node.risk_level === 'CRITICAL') {
            setAlerts((prev) =>
              prev.some((a) => a.nodeId === nodeId && a.status === 'Active')
                ? prev
                : [
                    {
                      id: `demo-${nodeId}-${Date.now()}`,
                      severity: 'CRITICAL',
                      nodeId,
                      zone: zoneFor(node),
                      date: new Date().toISOString().slice(0, 10),
                      time: new Date().toISOString().slice(11, 19) + ' UTC',
                      description:
                        'Rapid displacement escalation crossed the critical threshold. Immediate attention by responsible mine personnel is required.',
                      reasons: [
                        `Rapid displacement increase (${node.features.displacement_rate_mm_per_hour} mm/h)`,
                        `Crack width increasing (${node.sensors.crack_width_mm} mm)`,
                        `Neighbour displacement difference (${node.features.displacement_vs_neighbor_mm} mm)`,
                      ],
                      confidence: node.probability,
                      status: 'Active',
                      notifications: {
                        controlRoom: true,
                        safetyOfficer: true,
                        responseTeam: true,
                        hospital: false,
                        ambulance: false,
                      },
                    },
                    ...prev,
                  ],
            )
          }
        }
        return current
      })

      if (demoTick.current >= 8) {
        setDemoRunning(false)
      }
    }, 1500)

    return () => clearInterval(id)
  }, [demoRunning])

  const secondsAgo = Math.max(0, Math.round((now - lastUpdated) / 1000))

  const overallRisk = highestRisk(
    nodes.filter((n) => n.online).map((n) => n.risk_level),
  )

  const viewMeta = VIEW_TITLES[view]

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        active={view}
        onChange={(v) => {
          setView(v)
          setSidebarOpen(false)
        }}
        alertCount={alertCount}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header status={status} onMenu={() => setSidebarOpen(true)} />
        <ControlBar
          status={status}
          liveMode={liveMode}
          onToggleLive={() => setLiveMode((v) => !v)}
          demoRunning={demoRunning}
          onToggleDemo={() => setDemoRunning((v) => !v)}
          pollInterval={pollInterval}
          onPollIntervalChange={setPollInterval}
          secondsAgo={secondsAgo}
        />

        <main className="flex-1 overflow-x-hidden p-4 lg:p-6">
          <div className="mb-4">
            <h2 className="text-balance text-lg font-bold text-foreground">
              {viewMeta.title}
            </h2>
            <p className="text-sm text-muted-foreground">{viewMeta.subtitle}</p>
          </div>

          {(nodesLoading || alertsLoading || zonesLoading) && (
            <div className="mb-4 rounded-md border border-dashed bg-secondary/40 px-3 py-2 text-[11px] text-muted-foreground">
              Loading live backend data for monitoring, alerts, and zones…
            </div>
          )}
          {(nodesError || alertsError || zonesError) && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[11px] text-destructive">
              {nodesError ?? alertsError ?? zonesError}
            </div>
          )}

          {view === 'overview' && (
            <div className="space-y-4">
              <SummaryCards nodes={nodes} />
              <div className="grid gap-4 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <MineMap
                    nodes={nodes}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                  />
                </div>
                <AlertsPanel
                  alerts={alerts}
                  onAcknowledge={handleAcknowledge}
                  onSelectNode={jumpToNode}
                  compact
                />
              </div>
              <div className="grid gap-4 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <RiskZones
                    nodes={nodes}
                    selectedId={selectedId}
                    onSelect={jumpToNode}
                    limit={8}
                    zones={zones}
                  />
                </div>
                <AiAnalysis node={selectedNode} />
              </div>
            </div>
          )}

          {view === 'live' && (
            <div className="space-y-4">
              <SensorCards node={selectedNode} />
              <div className="grid gap-4 xl:grid-cols-3">
                <div className="space-y-4 xl:col-span-2">
                  <TrendCharts node={selectedNode} history={history} />
                </div>
                <div className="space-y-4">
                  <NodeDetails node={selectedNode} />
                  <AiAnalysis node={selectedNode} />
                </div>
              </div>
              <RiskZones
                nodes={nodes}
                selectedId={selectedId}
                onSelect={handleSelect}
                title="Select a Node"
              />
            </div>
          )}

          {view === 'map' && (
            <div className="grid gap-4 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <MineMap
                  nodes={nodes}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                />
              </div>
              <div className="space-y-4">
                <NodeDetails node={selectedNode} />
                <RiskZones
                  nodes={nodes}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                  limit={6}
                />
              </div>
            </div>
          )}

          {view === 'alerts' && (
            <EmergencyResponse
              alerts={alerts}
              onAcknowledge={handleAcknowledge}
              onSelectNode={jumpToNode}
            />
          )}

          {view === 'history' && (
            <HistoryTable
              rows={history}
              loading={historyLoading}
              error={historyError}
            />
          )}

          {view === 'reports' && (
            <div className="space-y-4">
              <SummaryCards nodes={nodes} />
              <div className="grid gap-4 xl:grid-cols-2">
                <RiskZones
                  nodes={nodes}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                  title="Full Node Risk Ranking"
                  zones={zones}
                />
                <AiAnalysis node={selectedNode} />
              </div>
            </div>
          )}

          {view === 'health' && (
            <div className="space-y-4">
              <SummaryCards nodes={nodes} />
              <SystemHealth status={status} nodes={nodes} />
            </div>
          )}

          <footer className="mt-8 border-t pt-4 text-center text-[11px] text-muted-foreground">
            Overall network risk:{' '}
            <span className="font-semibold text-foreground">{overallRisk}</span>{' '}
            · Prototype for SIH 2026 · Sensors → Gateway → MQTT → FastAPI →
            Random Forest → Dashboard
          </footer>
        </main>
      </div>
    </div>
  )
}
