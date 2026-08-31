'use client'

import {
  AlertTriangle,
  Bell,
  Check,
  Circle,
  Clock,
  History,
  Info,
  MapPin,
  Phone,
  ShieldAlert,
  Siren,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RiskBadge } from '@/components/risk-badge'
import { RISK_STYLES } from '@/lib/risk'
import { EMERGENCY_CONTACTS } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import type { AlertItem, AlertNotifications } from '@/lib/types'

const NOTIFY_LABELS: { key: keyof AlertNotifications; label: string }[] = [
  { key: 'controlRoom', label: 'Control Room' },
  { key: 'safetyOfficer', label: 'Safety Officer' },
  { key: 'responseTeam', label: 'Response Team' },
  { key: 'hospital', label: 'Hospital' },
  { key: 'ambulance', label: 'Ambulance' },
]

function NotifyRow({ done, label }: { done: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px]">
      {done ? (
        <Check className="size-3.5 text-normal-foreground" aria-hidden />
      ) : (
        <Circle className="size-3 text-muted-foreground" aria-hidden />
      )}
      <span className={done ? 'font-medium text-foreground' : 'text-muted-foreground'}>
        {label}
      </span>
    </span>
  )
}

function AlertCard({
  alert,
  onAcknowledge,
  onSelectNode,
}: {
  alert: AlertItem
  onAcknowledge?: (id: string) => void
  onSelectNode?: (nodeId: string) => void
}) {
  const style = RISK_STYLES[alert.severity]
  return (
    <div
      className={cn(
        'rounded-md border border-l-4 bg-card p-3.5 shadow-sm',
        alert.status !== 'Active' && 'opacity-80',
      )}
      style={{ borderLeftColor: style.cssVar }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <RiskBadge level={alert.severity} />
          <button
            type="button"
            onClick={() => onSelectNode?.(alert.nodeId)}
            className="font-mono text-sm font-bold text-foreground underline-offset-2 hover:underline"
          >
            {alert.nodeId}
          </button>
          <span className="inline-flex items-center gap-1 rounded-full border bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
            <MapPin className="size-3" aria-hidden />
            Zone {alert.zone}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
          <Clock className="size-3" aria-hidden />
          {alert.date} · {alert.time}
        </span>
      </div>

      <div className="mt-2.5 flex items-center gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Risk Level
          </p>
          <p className={cn('text-sm font-bold', style.text)}>{alert.severity}</p>
        </div>
        <div className="border-l pl-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Model Confidence
          </p>
          <p className="font-mono text-sm font-bold text-foreground">
            {alert.confidence}%
          </p>
        </div>
      </div>

      <div className="mt-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Trigger / Reason
        </p>
        <ul className="mt-1 space-y-0.5">
          {alert.reasons.map((reason) => (
            <li
              key={reason}
              className="flex items-start gap-1.5 text-xs leading-relaxed text-foreground"
            >
              <span
                className="mt-1.5 size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: style.cssVar }}
                aria-hidden
              />
              {reason}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-2.5 border-t pt-2.5">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Notification Status
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {NOTIFY_LABELS.map(({ key, label }) => (
            <NotifyRow key={key} done={alert.notifications[key]} label={label} />
          ))}
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <span
          className={cn(
            'text-[10px] font-semibold uppercase tracking-wide',
            alert.status === 'Active'
              ? style.text
              : alert.status === 'Resolved'
                ? 'text-normal-foreground'
                : 'text-muted-foreground',
          )}
        >
          {alert.status}
        </span>
        {alert.status === 'Active' && onAcknowledge && (
          <button
            type="button"
            onClick={() => onAcknowledge(alert.id)}
            className="inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-medium text-foreground hover:bg-accent"
          >
            <Check className="size-3" /> Acknowledge
          </button>
        )}
      </div>
    </div>
  )
}

interface EmergencyResponseProps {
  alerts: AlertItem[]
  onAcknowledge?: (id: string) => void
  onSelectNode?: (nodeId: string) => void
}

export function EmergencyResponse({
  alerts,
  onAcknowledge,
  onSelectNode,
}: EmergencyResponseProps) {
  const active = alerts.filter((a) => a.status === 'Active')
  const history = [...alerts].sort((a, b) => (a.time < b.time ? 1 : -1))
  const criticalAlert = active.find((a) => a.severity === 'CRITICAL')

  return (
    <div className="space-y-4">
      {/* Prominent CRITICAL banner */}
      {criticalAlert && (
        <div
          className="rounded-lg border-2 bg-critical-muted p-4"
          style={{ borderColor: 'var(--critical)' }}
          role="alert"
        >
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-critical text-critical-foreground">
              <Siren className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold uppercase tracking-wide text-critical-foreground">
                  Critical Alert
                </span>
                <span className="font-mono text-sm font-bold text-foreground">
                  {criticalAlert.nodeId}
                </span>
                <span className="text-xs text-muted-foreground">
                  Zone {criticalAlert.zone} · {criticalAlert.time}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-foreground">
                Model confidence{' '}
                <span className="font-bold">{criticalAlert.confidence}%</span>.
                Immediate attention by responsible mine personnel is required.
                The affected node/zone is highlighted on the Risk Map.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Active Alerts */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Bell className="size-4" />
              Active Alerts
            </CardTitle>
            {active.length > 0 ? (
              <span className="rounded-full bg-critical px-2 py-0.5 text-[11px] font-bold text-critical-foreground">
                {active.length} active
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">None</span>
            )}
          </CardHeader>
          <CardContent className="space-y-2.5">
            {active.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No active alerts. All monitored zones nominal.
              </p>
            )}
            {active.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={onAcknowledge}
                onSelectNode={onSelectNode}
              />
            ))}
          </CardContent>
        </Card>

        {/* Alert History */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <History className="size-4" />
              Alert History
            </CardTitle>
            <span className="text-[11px] text-muted-foreground">
              {history.length} total
            </span>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[520px] overflow-y-auto">
            {history.map((alert) => {
              const style = RISK_STYLES[alert.severity]
              return (
                <div
                  key={alert.id}
                  className="flex items-center justify-between gap-2 rounded-md border bg-card p-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: style.cssVar }}
                      aria-hidden
                    />
                    <button
                      type="button"
                      onClick={() => onSelectNode?.(alert.nodeId)}
                      className="font-mono text-xs font-bold text-foreground underline-offset-2 hover:underline"
                    >
                      {alert.nodeId}
                    </button>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {alert.zone} · {alert.severity} · {alert.confidence}%
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {alert.time}
                    </span>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase',
                        alert.status === 'Active'
                          ? 'bg-critical-muted text-critical-foreground'
                          : alert.status === 'Resolved'
                            ? 'bg-normal-muted text-normal-foreground'
                            : 'bg-secondary text-muted-foreground',
                      )}
                    >
                      {alert.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Emergency Medical Response — only for CRITICAL events that may affect people */}
      {criticalAlert && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <ShieldAlert className="size-4 text-critical-foreground" />
              Emergency Medical Support
            </CardTitle>
            <span className="text-[11px] text-muted-foreground">
              Pre-registered contacts
            </span>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs leading-relaxed text-muted-foreground">
              These contacts are configured in advance for this mine location.
              The system only <span className="font-medium text-foreground">notifies</span>{' '}
              the registered parties below — it does not choose a hospital and
              does not independently decide evacuation or medical treatment.
            </p>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {EMERGENCY_CONTACTS.map((contact) => {
                const notified = criticalAlert.notifications[contact.channel]
                return (
                  <div
                    key={contact.role}
                    className="flex items-start justify-between gap-2 rounded-md border bg-card p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {contact.role}
                      </p>
                      <p className="truncate text-sm font-semibold text-foreground">
                        {contact.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {contact.detail}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-foreground">
                        <Phone className="size-3" aria-hidden />
                        {contact.phone}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        notified
                          ? 'bg-normal-muted text-normal-foreground'
                          : 'bg-secondary text-muted-foreground',
                      )}
                    >
                      {notified ? (
                        <>
                          <Check className="size-3" /> Notified
                        </>
                      ) : (
                        <>
                          <Circle className="size-2.5" /> Pending
                        </>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="flex items-start gap-2 rounded-md border border-watch/40 bg-watch-muted p-2.5">
              <Info className="mt-0.5 size-3.5 shrink-0 text-watch-foreground" aria-hidden />
              <p className="text-[11px] leading-relaxed text-foreground">
                <span className="font-semibold">Model Confidence</span> reflects
                the classifier&apos;s certainty in the risk label — it is{' '}
                <span className="font-semibold">not</span> a measured real-world
                probability of ground collapse. Treat it as decision support for
                trained mine personnel, not an automated safety decision.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!criticalAlert && (
        <div className="flex items-center gap-2 rounded-md border bg-secondary p-3 text-xs text-muted-foreground">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          The Emergency Medical Support panel appears automatically when a node
          is classified CRITICAL. Run the Demo Simulation to see the full
          emergency-response workflow.
        </div>
      )}
    </div>
  )
}
