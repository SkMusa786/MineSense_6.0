import type {
  AlertItem,
  EmergencyContact,
  HistoryRow,
  MineNode,
  RiskLevel,
  TrendPoint,
} from './types'

/** Deterministic grid zone (A-C columns, 1-3 rows) from a node's map position. */
export function zoneFor(pos: { x: number; y: number }): string {
  const col = pos.x < 34 ? 'A' : pos.x < 67 ? 'B' : 'C'
  const row = pos.y < 34 ? '1' : pos.y < 67 ? '2' : '3'
  return `${col}${row}`
}

function mag(x: number, y: number) {
  return Math.round(Math.sqrt(x * x + y * y) * 100) / 100
}

interface Seed {
  id: string
  x: number
  y: number
  risk: RiskLevel
  prob: number
  online?: boolean
  battery?: number
  rssi?: number
  s: [number, number, number, number, number] // tiltX, tiltY, disp, vib, crack
  f: [number, number, number, number, number?] // dispChange, dispRate, crackChange, neighbor, (unused)
}

// Notable nodes follow the SIH spec examples; the rest fill out a 24-node network.
const SEEDS: Seed[] = [
  { id: 'N01', x: 18, y: 22, risk: 'NORMAL', prob: 22, s: [0.12, 0.08, 1.4, 0.02, 0.04], f: [0.3, 3.2, 0.02, 0.4, 0] },
  { id: 'N02', x: 46, y: 30, risk: 'CRITICAL', prob: 89, s: [0.7, 0.71, 7.5, 0.06, 0.25], f: [5.3, 63.6, 0.23, 5.5, 0] },
  { id: 'N03', x: 70, y: 20, risk: 'NORMAL', prob: 18, s: [0.09, 0.11, 1.1, 0.01, 0.03], f: [0.2, 2.1, 0.01, 0.3, 0] },
  { id: 'N04', x: 30, y: 48, risk: 'WATCH', prob: 44, s: [0.34, 0.28, 3.2, 0.03, 0.09], f: [1.4, 16.8, 0.05, 1.2, 0] },
  { id: 'N05', x: 58, y: 52, risk: 'WARNING', prob: 67, s: [0.41, 0.38, 4.8, 0.04, 0.18], f: [2.9, 34.8, 0.14, 2.4, 0] },
  { id: 'N06', x: 80, y: 46, risk: 'NORMAL', prob: 25, s: [0.14, 0.1, 1.6, 0.02, 0.05], f: [0.4, 4.0, 0.02, 0.5, 0] },
  { id: 'N07', x: 22, y: 70, risk: 'WATCH', prob: 41, s: [0.36, 0.24, 2.9, 0.03, 0.08], f: [1.1, 13.2, 0.04, 1.0, 0] },
  { id: 'N08', x: 50, y: 74, risk: 'WARNING', prob: 61, s: [0.39, 0.35, 4.4, 0.05, 0.16], f: [2.6, 31.2, 0.12, 2.1, 0] },
  { id: 'N09', x: 74, y: 70, risk: 'NORMAL', prob: 20, s: [0.1, 0.09, 1.2, 0.01, 0.03], f: [0.2, 2.4, 0.01, 0.3, 0] },
  { id: 'N10', x: 12, y: 44, risk: 'NORMAL', prob: 16, s: [0.08, 0.07, 0.9, 0.01, 0.02], f: [0.1, 1.6, 0.01, 0.2, 0] },
  { id: 'N11', x: 38, y: 16, risk: 'WATCH', prob: 39, s: [0.3, 0.26, 2.7, 0.03, 0.07], f: [1.0, 12.0, 0.03, 0.9, 0] },
  { id: 'N12', x: 64, y: 34, risk: 'WARNING', prob: 58, s: [0.37, 0.33, 4.1, 0.04, 0.15], f: [2.4, 28.8, 0.11, 1.9, 0] },
  { id: 'N13', x: 88, y: 28, risk: 'NORMAL', prob: 19, s: [0.09, 0.08, 1.0, 0.01, 0.03], f: [0.2, 2.0, 0.01, 0.2, 0] },
  { id: 'N14', x: 16, y: 60, risk: 'NORMAL', prob: 23, s: [0.11, 0.1, 1.3, 0.02, 0.04], f: [0.3, 2.8, 0.02, 0.4, 0] },
  { id: 'N15', x: 42, y: 60, risk: 'WATCH', prob: 43, s: [0.33, 0.29, 3.1, 0.03, 0.09], f: [1.3, 15.6, 0.05, 1.1, 0] },
  { id: 'N16', x: 66, y: 62, risk: 'NORMAL', prob: 21, s: [0.1, 0.09, 1.2, 0.01, 0.03], f: [0.2, 2.2, 0.01, 0.3, 0] },
  { id: 'N17', x: 86, y: 60, risk: 'NORMAL', prob: 17, s: [0.08, 0.07, 0.9, 0.01, 0.02], f: [0.1, 1.8, 0.01, 0.2, 0] },
  { id: 'N18', x: 28, y: 32, risk: 'NORMAL', prob: 24, s: [0.12, 0.1, 1.4, 0.02, 0.04], f: [0.3, 3.0, 0.02, 0.4, 0] },
  { id: 'N19', x: 54, y: 18, risk: 'NORMAL', prob: 20, s: [0.1, 0.08, 1.1, 0.01, 0.03], f: [0.2, 2.2, 0.01, 0.3, 0] },
  { id: 'N20', x: 34, y: 84, risk: 'NORMAL', prob: 26, s: [0.13, 0.11, 1.5, 0.02, 0.05], f: [0.3, 3.4, 0.02, 0.5, 0] },
  { id: 'N21', x: 62, y: 84, risk: 'NORMAL', prob: 22, s: [0.11, 0.09, 1.3, 0.02, 0.04], f: [0.3, 2.6, 0.02, 0.4, 0] },
  { id: 'N22', x: 10, y: 80, risk: 'NORMAL', prob: 15, s: [0.07, 0.06, 0.8, 0.01, 0.02], f: [0.1, 1.4, 0.01, 0.2, 0] },
  { id: 'N23', x: 90, y: 80, risk: 'NORMAL', prob: 18, s: [0.09, 0.08, 1.0, 0.01, 0.03], f: [0.2, 2.0, 0.01, 0.2, 0] },
  { id: 'N24', x: 78, y: 12, risk: 'NORMAL', prob: 0, online: false, battery: 4, rssi: -102, s: [0, 0, 0, 0, 0], f: [0, 0, 0, 0, 0] },
]

const NOW = Date.parse('2026-08-26T17:05:00Z')

function seededBattery(id: string) {
  const n = Number(id.slice(1))
  return 100 - ((n * 7) % 42)
}
function seededRssi(id: string) {
  const n = Number(id.slice(1))
  return -52 - ((n * 3) % 34)
}

export const NODES: MineNode[] = SEEDS.map((seed, i) => {
  const [tiltX, tiltY, disp, vib, crack] = seed.s
  const [dispChange, dispRate, crackChange, neighbor] = seed.f
  return {
    id: seed.id,
    label: seed.id,
    x: seed.x,
    y: seed.y,
    online: seed.online ?? true,
    battery: seed.battery ?? seededBattery(seed.id),
    rssi: seed.rssi ?? seededRssi(seed.id),
    timestamp: new Date(NOW - i * 15000).toISOString(),
    risk_level: seed.risk,
    probability: seed.prob,
    sensors: {
      tilt_x_deg: tiltX,
      tilt_y_deg: tiltY,
      displacement_mm: disp,
      vibration_g: vib,
      crack_width_mm: crack,
    },
    features: {
      tilt_magnitude_deg: mag(tiltX, tiltY),
      displacement_change_mm: dispChange,
      displacement_rate_mm_per_hour: dispRate,
      crack_change_mm: crackChange,
      displacement_vs_neighbor_mm: neighbor,
    },
  }
})

export const NODE_MAP: Record<string, MineNode> = Object.fromEntries(
  NODES.map((n) => [n.id, n]),
)

/** Deterministic rising trend for a given node, ending at its current values. */
export function trendForNode(node: MineNode): TrendPoint[] {
  const steps = 12
  const s = node.sensors
  const startFactor = node.risk_level === 'NORMAL' ? 0.85 : 0.28
  const points: TrendPoint[] = []
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    // ease-in curve so the deformation clearly accelerates toward the latest reading
    const growth = startFactor + (1 - startFactor) * Math.pow(t, 1.8)
    const minute = 5 * (steps - 1 - i)
    const base = new Date(NOW - minute * 60000)
    points.push({
      time: base.toISOString().slice(11, 16),
      displacement: round(s.displacement_mm * growth),
      tilt: round(mag(s.tilt_x_deg, s.tilt_y_deg) * growth),
      crack: round(s.crack_width_mm * growth, 3),
      vibration: round(s.vibration_g * (0.6 + 0.4 * growth), 3),
    })
  }
  return points
}

function round(v: number, dp = 2) {
  const f = Math.pow(10, dp)
  return Math.round(v * f) / f
}

function timeAgo(msAgo: number) {
  return new Date(NOW - msAgo).toISOString().slice(11, 19) + ' UTC'
}

const ALERT_DATE = '2026-08-26'

function alertZone(nodeId: string): string {
  const n = NODE_MAP[nodeId]
  return n ? zoneFor(n) : '—'
}

export const ALERTS: AlertItem[] = [
  {
    id: 'a1',
    severity: 'CRITICAL',
    nodeId: 'N02',
    zone: alertZone('N02'),
    date: ALERT_DATE,
    time: timeAgo(60000),
    description:
      'Model classified this node as CRITICAL. Immediate attention by responsible mine personnel is required.',
    reasons: [
      'Rapid displacement increase (63.6 mm/h)',
      'Crack width increasing beyond threshold (0.25 mm)',
      'Significant neighbour displacement difference (5.5 mm)',
    ],
    confidence: 89,
    status: 'Active',
    notifications: {
      controlRoom: true,
      safetyOfficer: true,
      responseTeam: false,
      hospital: false,
      ambulance: false,
    },
  },
  {
    id: 'a2',
    severity: 'WARNING',
    nodeId: 'N05',
    zone: alertZone('N05'),
    date: ALERT_DATE,
    time: timeAgo(240000),
    description: 'Crack width increasing beyond expected drift. Inspection recommended.',
    reasons: [
      'Crack width above warning threshold',
      'Displacement rate trending upward',
    ],
    confidence: 67,
    status: 'Active',
    notifications: {
      controlRoom: true,
      safetyOfficer: false,
      responseTeam: false,
      hospital: false,
      ambulance: false,
    },
  },
  {
    id: 'a3',
    severity: 'WARNING',
    nodeId: 'N08',
    zone: alertZone('N08'),
    date: ALERT_DATE,
    time: timeAgo(360000),
    description: 'Sustained displacement rate above warning threshold.',
    reasons: [
      'Displacement rate sustained above threshold',
      'Tilt magnitude gradually increasing',
    ],
    confidence: 61,
    status: 'Active',
    notifications: {
      controlRoom: true,
      safetyOfficer: false,
      responseTeam: false,
      hospital: false,
      ambulance: false,
    },
  },
  {
    id: 'a4',
    severity: 'WATCH',
    nodeId: 'N07',
    zone: alertZone('N07'),
    date: ALERT_DATE,
    time: timeAgo(600000),
    description: 'Tilt trend increasing. Continue close monitoring.',
    reasons: ['Tilt trend increasing over the last hour'],
    confidence: 41,
    status: 'Acknowledged',
    notifications: {
      controlRoom: true,
      safetyOfficer: false,
      responseTeam: false,
      hospital: false,
      ambulance: false,
    },
  },
  {
    id: 'a5',
    severity: 'WATCH',
    nodeId: 'N04',
    zone: alertZone('N04'),
    date: ALERT_DATE,
    time: timeAgo(900000),
    description: 'Minor displacement drift observed over last hour.',
    reasons: ['Minor displacement drift within watch band'],
    confidence: 44,
    status: 'Acknowledged',
    notifications: {
      controlRoom: true,
      safetyOfficer: false,
      responseTeam: false,
      hospital: false,
      ambulance: false,
    },
  },
  {
    id: 'a6',
    severity: 'WARNING',
    nodeId: 'N12',
    zone: alertZone('N12'),
    date: ALERT_DATE,
    time: timeAgo(1500000),
    description: 'Displacement rate returned within safe band after inspection.',
    reasons: ['Displacement rate normalised', 'Field inspection completed'],
    confidence: 58,
    status: 'Resolved',
    notifications: {
      controlRoom: true,
      safetyOfficer: true,
      responseTeam: false,
      hospital: false,
      ambulance: false,
    },
  },
]

/**
 * Pre-registered emergency contacts for the mine location. These are
 * configured by mine operators in advance — the system never selects a
 * hospital or responder using AI. It only notifies these registered parties.
 */
export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    role: 'Mine Control Room',
    name: 'Central Control — Block B',
    detail: '24×7 operations desk',
    phone: '+91 712 245 0100',
    channel: 'controlRoom',
  },
  {
    role: 'Mine Safety Officer',
    name: 'R. Deshmukh (DGMS Certified)',
    detail: 'On-site safety lead',
    phone: '+91 98220 41145',
    channel: 'safetyOfficer',
  },
  {
    role: 'Emergency Response Team',
    name: 'ERT — Rescue Station 3',
    detail: 'Rescue & evacuation crew',
    phone: '+91 98220 77320',
    channel: 'responseTeam',
  },
  {
    role: 'Nearest Hospital',
    name: 'District General Hospital',
    detail: '6.2 km · Trauma & ICU',
    phone: '+91 712 260 8888',
    channel: 'hospital',
  },
  {
    role: 'Ambulance Service',
    name: 'State Emergency Service (108)',
    detail: 'Advanced life support',
    phone: '108',
    channel: 'ambulance',
  },
]

export function buildHistory(): HistoryRow[] {
  const rows: HistoryRow[] = []
  for (const node of NODES) {
    if (!node.online) continue
    const trend = trendForNode(node)
    for (let i = trend.length - 1; i >= trend.length - 4; i--) {
      const p = trend[i]
      const t = i / (trend.length - 1)
      const conf = Math.max(
        12,
        Math.round(node.probability * (0.7 + 0.3 * t)),
      )
      rows.push({
        timestamp: `2026-08-26 ${p.time}`,
        nodeId: node.id,
        tilt: p.tilt,
        displacement: p.displacement,
        vibration: p.vibration,
        crackWidth: p.crack,
        risk: t > 0.75 ? node.risk_level : downgrade(node.risk_level),
        confidence: conf,
      })
    }
  }
  return rows.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
}

function downgrade(r: RiskLevel): RiskLevel {
  const order: RiskLevel[] = ['NORMAL', 'WATCH', 'WARNING', 'CRITICAL']
  const i = order.indexOf(r)
  return order[Math.max(0, i - 1)]
}
