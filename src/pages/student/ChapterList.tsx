import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import type { Chapter, QuizAttempt } from '../../lib/types'
import { ScoreDial, AttemptDots } from '../../components/ScoreDial'

type ChapterRow = Chapter & {
  attemptsUsed: number
  bestPercent: number | null
  effectiveMax: number | null
}

export function ChapterList() {
  const { session, profile, signOut } = useAuth()
  const [rows, setRows] = useState<ChapterRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: chapters }, { data: attempts }, { data: settings }] = await Promise.all([
        supabase.from('chapters').select('*').eq('is_published', true).order('order_index'),
        supabase
          .from('quiz_attempts')
          .select('*')
          .eq('student_id', session!.user.id)
          .eq('status', 'completed'),
        supabase.from('app_settings').select('default_max_attempts').eq('id', 1).single(),
      ])

      const defaultMax = settings?.default_max_attempts ?? null
      const byChapter = new Map<string, QuizAttempt[]>()
      ;(attempts ?? []).forEach((a) => {
        const list = byChapter.get(a.chapter_id) ?? []
        list.push(a)
        byChapter.set(a.chapter_id, list)
      })

      const computed: ChapterRow[] = (chapters ?? []).map((c) => {
        const list = byChapter.get(c.id) ?? []
        const best = list.reduce<number | null>((acc, a) => {
          if (a.total_questions === 0) return acc
          const pct = Math.round((a.score / a.total_questions) * 100)
          return acc === null ? pct : Math.max(acc, pct)
        }, null)
        return {
          ...c,
          attemptsUsed: list.length,
          bestPercent: best,
          effectiveMax: c.max_attempts ?? defaultMax,
        }
      })

      setRows(computed)
      setLoading(false)
    }
    load()
  }, [session])

  return (
    <div className="min-h-screen pb-10" style={{ background: 'var(--color-surface)' }}>
      <header className="px-5 pt-8 pb-6" style={{ background: 'var(--color-ink)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: '#A8AEC4' }}>Welcome back</p>
            <h1 className="font-display text-2xl text-white">{profile?.full_name}</h1>
          </div>
          <button onClick={signOut} className="text-xs font-medium underline" style={{ color: '#A8AEC4' }}>
            Sign out
          </button>
        </div>
      </header>

      <main className="px-5 -mt-3">
        {loading ? (
          <p className="text-center py-16 text-sm" style={{ color: 'var(--color-muted)' }}>Loading chapters…</p>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center mt-6 shadow-sm">
            <p className="font-display text-lg mb-1">No chapters yet</p>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Your teacher hasn't published any quizzes. Check back soon.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mt-4">
            {rows.map((c) => {
              const exhausted = c.effectiveMax !== null && c.attemptsUsed >= c.effectiveMax
              return (
                <div key={c.id} className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                  <ScoreDial percent={c.bestPercent} size={58} strokeWidth={5} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-base leading-tight mb-1 truncate">{c.title}</h3>
                    <AttemptDots used={c.attemptsUsed} max={c.effectiveMax} />
                  </div>
                  {exhausted ? (
                    <span
                      className="text-xs font-semibold px-3 py-2 rounded-lg text-center shrink-0"
                      style={{ background: 'var(--color-coral-light)', color: 'var(--color-coral)' }}
                    >
                      No attempts left
                    </span>
                  ) : (
                    <Link
                      to={`/quiz/${c.id}`}
                      className="text-xs font-semibold px-3.5 py-2.5 rounded-lg shrink-0 whitespace-nowrap"
                      style={{ background: 'var(--color-marigold)', color: 'var(--color-ink)' }}
                    >
                      {c.attemptsUsed > 0 ? 'Retake' : 'Start quiz'}
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
