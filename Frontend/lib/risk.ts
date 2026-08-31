import type { RiskLevel } from './types'

export const RISK_ORDER: RiskLevel[] = ['NORMAL', 'WATCH', 'WARNING', 'CRITICAL']

interface RiskStyle {
  /** solid marker / dot background */
  dot: string
  /** text color token class */
  text: string
  /** soft badge background */
  badgeBg: string
  /** border color class */
  border: string
  /** hex-ish token value for charts / inline styles */
  cssVar: string
  label: string
  guidance: string
}

export const RISK_STYLES: Record<RiskLevel, RiskStyle> = {
  NORMAL: {
    dot: 'bg-normal',
    text: 'text-normal-foreground',
    badgeBg: 'bg-normal-muted',
    border: 'border-normal/40',
    cssVar: 'var(--normal)',
    label: 'Normal',
    guidance: 'Routine monitoring',
  },
  WATCH: {
    dot: 'bg-watch',
    text: 'text-watch-foreground',
    badgeBg: 'bg-watch-muted',
    border: 'border-watch/40',
    cssVar: 'var(--watch)',
    label: 'Watch',
    guidance: 'Continue close monitoring',
  },
  WARNING: {
    dot: 'bg-warning',
    text: 'text-warning-foreground',
    badgeBg: 'bg-warning-muted',
    border: 'border-warning/40',
    cssVar: 'var(--warning)',
    label: 'Warning',
    guidance: 'Inspection / precaution required',
  },
  CRITICAL: {
    dot: 'bg-critical',
    text: 'text-critical-foreground',
    badgeBg: 'bg-critical-muted',
    border: 'border-critical/40',
    cssVar: 'var(--critical)',
    label: 'Critical',
    guidance: 'Immediate attention by responsible mine personnel',
  },
}

export function riskRank(level: RiskLevel): number {
  return RISK_ORDER.indexOf(level)
}

export function highestRisk(levels: RiskLevel[]): RiskLevel {
  return levels.reduce<RiskLevel>(
    (acc, l) => (riskRank(l) > riskRank(acc) ? l : acc),
    'NORMAL',
  )
}

/**
 * Local risk approximation used for the Demo Simulation and as a graceful
 * fallback when the FastAPI backend is unreachable. The authoritative
 * classification always comes from the trained Random Forest via /predict.
 */
export function classifyRisk(
  displacementMm: number,
  tiltMagnitudeDeg: number,
  crackWidthMm: number,
  displacementRateMmPerHour: number,
): { level: RiskLevel; probability: number } {
  const score =
    Math.min(1, displacementMm / 7.5) * 0.4 +
    Math.min(1, tiltMagnitudeDeg / 1.0) * 0.2 +
    Math.min(1, crackWidthMm / 0.25) * 0.15 +
    Math.min(1, displacementRateMmPerHour / 64) * 0.25

  const probability = Math.round(Math.max(4, Math.min(99, score * 100)))

  let level: RiskLevel = 'NORMAL'
  if (probability >= 80) level = 'CRITICAL'
  else if (probability >= 55) level = 'WARNING'
  else if (probability >= 35) level = 'WATCH'

  return { level, probability }
}
