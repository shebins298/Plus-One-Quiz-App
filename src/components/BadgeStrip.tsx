import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { BADGE_DEFS, type BadgeKey } from '../lib/badges'

export function BadgeStrip({ studentId }: { studentId: string }) {
  const [earned, setEarned] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('badges').select('badge_key').eq('student_id', studentId)
      setEarned(new Set((data ?? []).map((b) => b.badge_key)))
      setLoading(false)
    }
    load()
  }, [studentId])

  if (loading) return null

  const keys = Object.keys(BADGE_DEFS) as BadgeKey[]

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-5 px-5" style={{ scrollbarWidth: 'none' }}>
      {keys.map((key) => {
        const def = BADGE_DEFS[key]
        const has = earned.has(key)
        return (
          <div
            key={key}
            title={def.description}
            className="flex flex-col items-center gap-1 shrink-0"
            style={{ width: 64, opacity: has ? 1 : 0.35 }}
          >
            <div
              className="rounded-full flex items-center justify-center"
              style={{ width: 44, height: 44, background: has ? 'var(--color-marigold-light)' : 'var(--color-surface)', fontSize: 20 }}
            >
              {def.emoji}
            </div>
            <span className="text-[10px] font-medium text-center leading-tight" style={{ color: has ? 'var(--color-ink)' : 'var(--color-muted)' }}>
              {def.name}
            </span>
          </div>
        )
      })}
    </div>
  )
}
