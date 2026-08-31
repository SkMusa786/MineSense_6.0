export type RiskLevel = 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL'

/** Raw physical sensor inputs (what the gateway publishes over MQTT). */
export interface SensorReadings {
  tilt_x_deg: number
  tilt_y_deg: number
  displacement_mm: number
  vibration_g: number
  crack_width_mm: number
}

/** Features the FastAPI backend derives before ML inference. */
export interface CalculatedFeatures {
  tilt_magnitude_deg: number
  displacement_change_mm: number
  displacement_rate_mm_per_hour: number
  crack_change_mm: number
  displacement_vs_neighbor_mm: number
}

/** Request body sent to POST /predict. */
export interface PredictRequest {
  node_id: string
  timestamp_utc: string
  tilt_x_deg: number
  tilt_y_deg: number
  displacement_mm: number
  vibration_g: number
  crack_width_mm: number
}

/** Response returned by the existing FastAPI backend. */
export interface PredictResponse {
  node_id: string
  risk_level: RiskLevel
  probability: number
  current_risk?: RiskLevel
  current_probability?: number
  future_4h_risk?: RiskLevel
  future_4h_probability?: number
  future_6h_risk?: RiskLevel
  future_6h_probability?: number
  early_warning?: boolean
  estimated_time_window?: string
  calculated_features: CalculatedFeatures
}

/** A monitored sensor node with position on the prototype mine map. */
export interface MineNode {
  id: string
  label: string
  /** Map position as a percentage (0-100) of the surface area. */
  x: number
  y: number
  battery: number
  rssi: number
  online: boolean
  timestamp: string
  risk_level: RiskLevel
  probability: number
  future_4h_risk?: RiskLevel
  future_4h_probability?: number
  future_6h_risk?: RiskLevel
  future_6h_probability?: number
  early_warning?: boolean
  estimated_time_window?: string
  sensors: SensorReadings
  features: CalculatedFeatures
}

export interface TrendPoint {
  time: string
  displacement: number
  tilt: number
  crack: number
  vibration: number
}

/** Which pre-registered parties have been notified for an alert. */
export interface AlertNotifications {
  controlRoom: boolean
  safetyOfficer: boolean
  responseTeam: boolean
  hospital: boolean
  ambulance: boolean
}

export interface AlertItem {
  id: string
  severity: RiskLevel
  nodeId: string
  /** Grid zone the node belongs to, e.g. "B2". */
  zone: string
  time: string
  /** ISO date (YYYY-MM-DD) for the alert. */
  date: string
  description: string
  /** Human-readable trigger reasons from the model / thresholds. */
  reasons: string[]
  /** Model confidence (%) — NOT the real-world probability of collapse. */
  confidence: number
  status: 'Active' | 'Acknowledged' | 'Resolved'
  notifications: AlertNotifications
}

/** A pre-configured emergency contact registered for the mine location. */
export interface EmergencyContact {
  role: string
  name: string
  detail: string
  phone: string
  /** Maps to the AlertNotifications flag this contact is notified through. */
  channel: keyof AlertNotifications
}

export interface HistoryRow {
  timestamp: string
  nodeId: string
  tilt: number
  displacement: number
  vibration: number
  crackWidth: number
  risk: RiskLevel
  confidence: number
}

export interface BackendNodeRecord {
  node_id: string
  risk_level: RiskLevel
  probability: number
  future_4h_risk?: RiskLevel
  future_4h_probability?: number
  future_6h_risk?: RiskLevel
  future_6h_probability?: number
  early_warning?: boolean
  estimated_time_window?: string
  timestamp: string
  sensors: {
    tilt_x_deg: number
    tilt_y_deg: number
    displacement_mm: number
    vibration_g: number
    crack_width_mm: number
  }
  calculated_features: CalculatedFeatures
}

export interface BackendNodesResponse {
  highest_risk_node: BackendNodeRecord | null
  nodes: BackendNodeRecord[]
}

export interface BackendZone {
  zone_id: string
  nodes: string[]
  risk_level: string
  message: string
}

export interface BackendZonesResponse {
  potential_subsidence_zones: BackendZone[]
}

export interface BackendAlert {
  node_id: string
  risk_level: RiskLevel
  probability: number
  timestamp: string
  reasons: string[]
  status: 'ACTIVE' | 'RESOLVED' | 'ACKNOWLEDGED'
}

export interface BackendAlertsResponse {
  active_alerts: BackendAlert[]
}

export interface BackendHistoryResponse {
  history: Array<{
    node_id: string
    timestamp_utc: string
    tilt_x_deg: number
    tilt_y_deg: number
    tilt_magnitude_deg: number
    displacement_mm: number
    displacement_change_mm: number
    displacement_rate_mm_per_hour: number
    vibration_g: number
    crack_width_mm: number
    crack_change_mm: number
    displacement_vs_neighbor_mm: number
    risk_level: RiskLevel
    probability: number
  }>
  count: number
}

export interface SystemStatus {
  system: 'ONLINE' | 'OFFLINE'
  mqtt: 'CONNECTED' | 'DISCONNECTED'
  backend: 'ONLINE' | 'OFFLINE'
  ml: 'READY' | 'BUSY'
  lastUpdated: number
}
