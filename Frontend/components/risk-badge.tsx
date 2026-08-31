import { cn } from '@/lib/utils'
import { RISK_STYLES } from '@/lib/risk'
import type { RiskLevel } from '@/lib/types'

interface RiskBadgeProps {
  level: RiskLevel
  className?: string
  showDot?: boolean
  size?: 'sm' | 'md'
}

export function RiskBadge({
  level,
  className,
  showDot = true,
  size = 'sm',
}: RiskBadgeProps) {
  const style = RISK_STYLES[level]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-wide',
        style.badgeBg,
        style.text,
        style.border,
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
        className,
      )}
    >
      {showDot && (
        <span className={cn('size-1.5 rounded-full', style.dot)} aria-hidden />
      )}
      {level}
    </span>
  )
}
