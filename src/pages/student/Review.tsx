import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { ReviewItem } from '../../lib/types'

export function Review() {
  const { attemptId } = useParams()
  const [items, setItems] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.rpc('get_attempt_review', { p_attempt_id: attemptId })
      setItems((data ?? []) as ReviewItem[])
      setLoading(false)
    }
    load()
  }, [attemptId])

  if (loading) {
    return <div className="min-h-dvh flex items-center justify-center text-sm" style={{ color: 'var(--color-muted)' }}>Loading review…</div>
  }

  const wrong = items.filter((i) => !i.is_correct)
  const visible = showAll ? items : wrong

  return (
    <div className="min-h-dvh pb-10" style={{ background: 'var(--color-surface)' }}>
      <header className="px-5 pt-6 pb-4 flex items-center justify-between">
        <Link to="/" className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>← Chapters</Link>
        <button
          onClick={() => setShowAll((s) => !s)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg"
          style={{ background: 'white', color: 'var(--color-ink)' }}
        >
          {showAll ? 'Show mistakes only' : 'Show all questions'}
        </button>
      </header>

      <main className="px-5">
        <h1 className="font-display text-2xl mb-1">Review</h1>
        <p className="text-sm mb-5" style={{ color: 'var(--color-muted)' }}>
          {wrong.length === 0 ? 'You got everything right — nothing to review here!' : `${wrong.length} question${wrong.length === 1 ? '' : 's'} to look over`}
        </p>

        <div className="flex flex-col gap-3">
          {visible.map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="font-medium text-sm mb-3">{item.question_text}</p>
              <div className="flex flex-col gap-2 mb-3">
                {item.options.map((opt) => {
                  let style: React.CSSProperties = { borderColor: 'var(--color-border-soft)', background: 'white' }
                  if (opt.id === item.correct_option_id) {
                    style = { borderColor: 'var(--color-leaf)', background: 'var(--color-leaf-light)' }
                  } else if (opt.id === item.selected_option_id && !item.is_correct) {
                    style = { borderColor: 'var(--color-coral)', background: 'var(--color-coral-light)' }
                  }
                  return (
                    <div key={opt.id} className="px-3.5 py-2.5 rounded-lg border-2 text-sm" style={style}>
                      {opt.text}
                      {opt.id === item.selected_option_id && (
                        <span className="text-xs font-semibold ml-2" style={{ color: item.is_correct ? 'var(--color-leaf)' : 'var(--color-coral)' }}>
                          — your answer
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
              {item.explanation && (
                <p className="text-xs rounded-lg px-3 py-2" style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}>
                  {item.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
