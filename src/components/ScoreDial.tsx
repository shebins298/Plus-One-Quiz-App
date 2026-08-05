type ScoreDialProps = {
  percent: number | null // null = not attempted yet
  size?: number
  strokeWidth?: number
  label?: string
  centerText?: string
}

export function ScoreDial({ percent, size = 72, strokeWidth = 7, label, centerText }: ScoreDialProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = percent ?? 0
  const offset = circumference - (pct / 100) * circumference

  const color =
    percent === null ? 'var(--color-border-soft)' : percent >= 75 ? 'var(--color-leaf)' : percent >= 40 ? 'var(--color-marigold)' : 'var(--color-coral)'

  return (
    <div className="flex flex-col items-center gap-1.5" role="img" aria-label={label ? `${label}: ${percent === null ? 'not attempted' : percent + '%'}` : undefined}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-border-soft)" strokeWidth={strokeWidth} />
          {percent !== null && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono font-semibold" style={{ fontSize: size * 0.24, color: percent === null ? 'var(--color-muted)' : 'var(--color-ink)' }}>
            {centerText ?? (percent === null ? '—' : `${percent}%`)}
          </span>
        </div>
      </div>
      {label && <span className="text-xs font-medium text-center" style={{ color: 'var(--color-muted)' }}>{label}</span>}
    </div>
  )
}

export function AttemptDots({ used, max }: { used: number; max: number | null }) {
  if (max === null) {
    return <span className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>{used} attempt{used === 1 ? '' : 's'}</span>
  }
  return (
    <div className="flex items-center gap-1" aria-label={`${used} of ${max} attempts used`}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className="rounded-full"
          style={{
            width: 6,
            height: 6,
            background: i < used ? 'var(--color-ink)' : 'var(--color-border-soft)',
          }}
        />
      ))}
    </div>
  )
}
