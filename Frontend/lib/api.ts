import type { MineNode, PredictRequest, PredictResponse } from './types'

/**
 * Base URL for the existing FastAPI backend.
 * Configure via NEXT_PUBLIC_API_URL in production and local development.
 * Leave empty to use the same-origin host when the backend is served from the
 * same deployment domain or reverse proxy.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export interface PredictResult {
  ok: boolean
  data?: PredictResponse
  error?: string
}

/**
 * Sends a single node's raw sensor reading to POST /predict and returns the
 * ML risk prediction. This talks to the EXISTING backend + Random Forest model.
 * The frontend never performs inference itself.
 */
export async function predict(
  body: PredictRequest,
  signal?: AbortSignal,
): Promise<PredictResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })

    if (!res.ok) {
      return { ok: false, error: `Backend returned ${res.status}` }
    }

    const data = (await res.json()) as PredictResponse
    if (!data || typeof data.risk_level !== 'string') {
      return { ok: false, error: 'Invalid response shape from backend' }
    }
    return { ok: true, data }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Network error contacting backend'
    return { ok: false, error: message }
  }
}

/** Builds a /predict request body from a node's current raw sensor readings. */
export function toPredictRequest(node: MineNode): PredictRequest {
  return {
    node_id: node.id,
    timestamp_utc: new Date().toISOString(),
    tilt_x_deg: node.sensors.tilt_x_deg,
    tilt_y_deg: node.sensors.tilt_y_deg,
    displacement_mm: node.sensors.displacement_mm,
    vibration_g: node.sensors.vibration_g,
    crack_width_mm: node.sensors.crack_width_mm,
  }
}

/** Merges a backend PredictResponse back onto a node object. */
export function applyPrediction(
  node: MineNode,
  res: PredictResponse,
): MineNode {
  return {
    ...node,
    risk_level: res.risk_level,
    probability: res.probability,
    future_4h_risk: res.future_4h_risk ?? node.future_4h_risk,
    future_4h_probability: res.future_4h_probability ?? node.future_4h_probability,
    future_6h_risk: res.future_6h_risk ?? node.future_6h_risk,
    future_6h_probability: res.future_6h_probability ?? node.future_6h_probability,
    early_warning: res.early_warning ?? node.early_warning,
    estimated_time_window: res.estimated_time_window ?? node.estimated_time_window,
    timestamp: new Date().toISOString(),
    features: { ...node.features, ...res.calculated_features },
  }
}

/**
 * Fetch historical sensor data with pagination support.
 * Returns the newest records first (ordered DESC by timestamp).
 */
export async function fetchHistory(
  limit: number = 500,
  nodeId: string | null = null,
  signal?: AbortSignal,
): Promise<{
  ok: boolean
  history?: Array<{
    node_id?: string
    timestamp_utc?: string
    tilt_magnitude_deg?: number
    displacement_mm?: number
    vibration_g?: number
    crack_width_mm?: number
    risk_level?: string
    probability?: number
  }>
  count?: number
  error?: string
}> {
  try {
    const params = new URLSearchParams()
    params.set('limit', String(Math.min(Math.max(limit, 1), 2000)))
    if (nodeId) {
      params.set('node_id', nodeId)
    }

    const res = await fetch(`${API_BASE_URL}/history?${params.toString()}`, {
      cache: 'no-store',
      signal,
    })

    if (!res.ok) {
      return {
        ok: false,
        error: `History request failed with ${res.status}`,
      }
    }

    const payload = (await res.json()) as {
      history?: Array<{
        node_id?: string
        timestamp_utc?: string
        tilt_magnitude_deg?: number
        displacement_mm?: number
        vibration_g?: number
        crack_width_mm?: number
        risk_level?: string
        probability?: number
      }>
      count?: number
    }

    return {
      ok: true,
      history: payload.history,
      count: payload.count,
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Network error fetching history'
    return { ok: false, error: message }
  }
}
