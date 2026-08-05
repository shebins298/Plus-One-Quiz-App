import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Chapter, PublicQuestion } from '../../lib/types'

type Feedback = { isCorrect: boolean; correctOptionId: string; explanation: string | null } | null

export function Practice() {
  const { chapterId } = useParams()
  const navigate = useNavigate()

  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [questions, setQuestions] = useState<PublicQuestion[]>([])
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [submitting, setSubmitting] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    async function init() {
      if (!chapterId) return
      const [{ data: chapterData }, { data: weakQuestions }] = await Promise.all([
        supabase.from('chapters').select('*').eq('id', chapterId).single(),
        supabase.rpc('get_weak_questions', { p_chapter_id: chapterId }),
      ])
      setChapter(chapterData as Chapter)
      setQuestions((weakQuestions ?? []) as PublicQuestion[])

      if (weakQuestions && weakQuestions.length > 0) {
        const { data: id } = await supabase.rpc('start_practice_attempt', { p_chapter_id: chapterId })
        setAttemptId(id)
      }
      setLoading(false)
    }
    init()
  }, [chapterId])

  async function handleSubmitAnswer() {
    if (!selected || !attemptId) return
    setSubmitting(true)
    const q = questions[index]
    const { data, error } = await supabase.rpc('submit_answer', {
      p_attempt_id: attemptId,
      p_question_id: q.id,
      p_selected_option_id: selected,
    })
    setSubmitting(false)
    if (error || !data || data.length === 0) return
    const result = data[0]
    setFeedback({ isCorrect: result.is_correct, correctOptionId: result.correct_option_id, explanation: result.explanation })
    if (result.is_correct) setCorrectCount((c) => c + 1)
  }

  async function handleNext() {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1)
      setSelected(null)
      setFeedback(null)
    } else {
      if (attemptId) await supabase.rpc('complete_quiz_attempt', { p_attempt_id: attemptId })
      setFinished(true)
    }
  }

  if (loading) {
    return <div className="min-h-dvh flex items-center justify-center text-sm" style={{ color: 'var(--color-muted)' }}>Finding what to practice…</div>
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-2xl mb-2">Nothing to practice here!</p>
        <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
          You haven't missed any questions in {chapter?.title ?? 'this chapter'} — nice work.
        </p>
        <Link to="/" className="text-sm font-semibold underline">Back to chapters</Link>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--color-surface)' }}>
        <p className="font-display text-2xl mb-2">
          {correctCount} of {questions.length} this time
        </p>
        <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>
          Practice doesn't count against your attempts — keep going whenever you like.
        </p>
        <Link to="/" className="rounded-xl px-6 py-3 font-semibold text-sm" style={{ background: 'var(--color-ink)', color: 'white' }}>
          Back to chapters
        </Link>
      </div>
    )
  }

  const q = questions[index]

  return (
    <div className="h-dvh flex flex-col overflow-hidden" style={{ background: 'var(--color-surface)' }}>
      <header className="px-5 pt-6 pb-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate('/')} className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>← Exit</button>
          <span className="text-xs font-mono uppercase tracking-wide px-2 py-1 rounded" style={{ background: 'var(--color-marigold-light)', color: 'var(--color-ink)' }}>
            Practice · {index + 1}/{questions.length}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--color-border-soft)' }}>
          <div className="h-1.5 rounded-full transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%`, background: 'var(--color-marigold)' }} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5">
        <h2 className="font-display text-xl leading-snug mb-6 mt-2">{q.question_text}</h2>

        <div className="flex flex-col gap-3">
          {q.options.map((opt) => {
            const isSelected = selected === opt.id
            let style: React.CSSProperties = { borderColor: 'var(--color-border-soft)', background: 'white' }
            if (feedback) {
              if (opt.id === feedback.correctOptionId) {
                style = { borderColor: 'var(--color-leaf)', background: 'var(--color-leaf-light)' }
              } else if (isSelected && !feedback.isCorrect) {
                style = { borderColor: 'var(--color-coral)', background: 'var(--color-coral-light)' }
              }
            } else if (isSelected) {
              style = { borderColor: 'var(--color-ink)', background: 'var(--color-surface-warm)' }
            }
            return (
              <button
                key={opt.id}
                disabled={!!feedback}
                onClick={() => setSelected(opt.id)}
                className="text-left px-4 py-3.5 rounded-xl border-2 text-base transition-colors"
                style={style}
              >
                {opt.text}
              </button>
            )
          })}
        </div>

        {feedback?.explanation && (
          <div className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ background: 'white', color: 'var(--color-muted)' }}>
            {feedback.explanation}
          </div>
        )}
      </div>

      <div className="shrink-0 px-5 pt-3" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        {feedback ? (
          <button onClick={handleNext} className="w-full rounded-xl py-3.5 font-semibold text-base" style={{ background: 'var(--color-ink)', color: 'white' }}>
            {index + 1 < questions.length ? 'Next question' : 'Finish practice'}
          </button>
        ) : (
          <button
            onClick={handleSubmitAnswer}
            disabled={!selected || submitting}
            className="w-full rounded-xl py-3.5 font-semibold text-base disabled:opacity-50"
            style={{ background: 'var(--color-marigold)', color: 'var(--color-ink)' }}
          >
            {submitting ? 'Checking…' : 'Submit answer'}
          </button>
        )}
      </div>
    </div>
  )
}
