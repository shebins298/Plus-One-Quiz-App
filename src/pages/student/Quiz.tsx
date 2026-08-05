import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Chapter, PublicQuestion } from '../../lib/types'
import { ScoreDial } from '../../components/ScoreDial'

type Feedback = { isCorrect: boolean; correctOptionId: string; explanation: string | null } | null

export function Quiz() {
  const { chapterId } = useParams()
  const navigate = useNavigate()

  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [questions, setQuestions] = useState<PublicQuestion[]>([])
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [startError, setStartError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [submitting, setSubmitting] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState<{ score: number; total: number } | null>(null)

  useEffect(() => {
    async function init() {
      if (!chapterId) return
      const { data: chapterData } = await supabase.from('chapters').select('*').eq('id', chapterId).single()
      setChapter(chapterData as Chapter)

      const { data: attemptData, error: attemptError } = await supabase.rpc('start_quiz_attempt', {
        p_chapter_id: chapterId,
      })
      if (attemptError) {
        setStartError(
          attemptError.message.includes('limit')
            ? "You've used all your attempts for this chapter."
            : "This chapter isn't available right now."
        )
        setLoading(false)
        return
      }
      setAttemptId(attemptData)

      const { data: questionData } = await supabase.rpc('get_chapter_questions', { p_chapter_id: chapterId })
      setQuestions((questionData ?? []) as PublicQuestion[])
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
      if (!attemptId) return
      const { data } = await supabase.rpc('complete_quiz_attempt', { p_attempt_id: attemptId })
      const result = data?.[0]
      setFinished({ score: result?.score ?? correctCount, total: result?.total_questions ?? questions.length })
    }
  }

  if (loading) {
    return <div className="min-h-dvh flex items-center justify-center text-sm" style={{ color: 'var(--color-muted)' }}>Loading quiz…</div>
  }

  if (startError) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-xl mb-2">{startError}</p>
        <Link to="/" className="text-sm font-semibold mt-4 underline" style={{ color: 'var(--color-ink)' }}>Back to chapters</Link>
      </div>
    )
  }

  if (finished) {
    const pct = finished.total > 0 ? Math.round((finished.score / finished.total) * 100) : 0
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--color-surface)' }}>
        <ScoreDial percent={pct} size={140} strokeWidth={12} />
        <h2 className="font-display text-2xl mt-6 mb-1">
          {finished.score} of {finished.total} correct
        </h2>
        <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>{chapter?.title}</p>
        <div className="flex gap-3">
          {finished.score < finished.total && attemptId && (
            <Link
              to={`/review/${attemptId}`}
              className="rounded-xl px-6 py-3 font-semibold text-sm border-2"
              style={{ borderColor: 'var(--color-ink)', color: 'var(--color-ink)' }}
            >
              Review mistakes
            </Link>
          )}
          <Link
            to="/"
            className="rounded-xl px-6 py-3 font-semibold text-sm"
            style={{ background: 'var(--color-ink)', color: 'white' }}
          >
            Back to chapters
          </Link>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-xl mb-2">No questions yet</p>
        <Link to="/" className="text-sm font-semibold mt-2 underline">Back to chapters</Link>
      </div>
    )
  }

  const q = questions[index]

  return (
    <div className="h-dvh flex flex-col overflow-hidden" style={{ background: 'var(--color-surface)' }}>
      <header className="px-5 pt-6 pb-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate('/')} className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
            ← Exit
          </button>
          <span className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>
            {index + 1} / {questions.length}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--color-border-soft)' }}>
          <div
            className="h-1.5 rounded-full transition-all"
            style={{ width: `${((index + 1) / questions.length) * 100}%`, background: 'var(--color-marigold)' }}
          />
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
          <button
            onClick={handleNext}
            className="w-full rounded-xl py-3.5 font-semibold text-base"
            style={{ background: 'var(--color-ink)', color: 'white' }}
          >
            {index + 1 < questions.length ? 'Next question' : 'See results'}
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
