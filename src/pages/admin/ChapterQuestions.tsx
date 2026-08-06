import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Chapter, Question, QuestionOption } from '../../lib/types'

const emptyOptions: QuestionOption[] = [
  { id: 'a', text: '' },
  { id: 'b', text: '' },
  { id: 'c', text: '' },
  { id: 'd', text: '' },
]

function correctRateColor(rate: number) {
  if (rate >= 75) return { bg: 'var(--color-leaf-light)', fg: 'var(--color-leaf)' }
  if (rate >= 40) return { bg: 'var(--color-marigold-light)', fg: 'var(--color-ink)' }
  return { bg: 'var(--color-coral-light)', fg: 'var(--color-coral)' }
}

function QuestionEditor({
  q,
  stat,
  onSave,
  onDelete,
}: {
  q: Question
  stat?: { correct_count: number; total_count: number }
  onSave: (q: Question) => void
  onDelete: () => void
}) {
  const [draft, setDraft] = useState<Question>(q)
  const [dirty, setDirty] = useState(false)

  function update<K extends keyof Question>(key: K, value: Question[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
    setDirty(true)
  }

  function updateOption(id: string, text: string) {
    update('options', draft.options.map((o) => (o.id === id ? { ...o, text } : o)))
  }

  const rate = stat && stat.total_count > 0 ? Math.round((stat.correct_count / stat.total_count) * 100) : null

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-3">
        <textarea
          value={draft.question_text}
          onChange={(e) => update('question_text', e.target.value)}
          rows={2}
          className="flex-1 rounded-lg px-3 py-2 text-sm border outline-none font-medium resize-none"
          style={{ borderColor: 'var(--color-border-soft)' }}
        />
        {rate !== null && (
          <span
            className="text-[10px] font-mono font-semibold px-2 py-1.5 rounded-lg shrink-0 whitespace-nowrap"
            style={{ background: correctRateColor(rate).bg, color: correctRateColor(rate).fg }}
            title={`${stat!.correct_count} of ${stat!.total_count} answered correctly`}
          >
            {rate}% · {stat!.total_count}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2 mb-3">
        {draft.options.map((opt) => (
          <div key={opt.id} className="flex items-center gap-2">
            <button
              onClick={() => update('correct_option_id', opt.id)}
              className="w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center text-xs font-bold"
              style={{
                borderColor: draft.correct_option_id === opt.id ? 'var(--color-leaf)' : 'var(--color-border-soft)',
                background: draft.correct_option_id === opt.id ? 'var(--color-leaf)' : 'transparent',
                color: draft.correct_option_id === opt.id ? 'white' : 'var(--color-muted)',
              }}
              title="Mark as correct answer"
            >
              {opt.id.toUpperCase()}
            </button>
            <input
              value={opt.text}
              onChange={(e) => updateOption(opt.id, e.target.value)}
              className="flex-1 rounded-lg px-3 py-1.5 text-sm border outline-none"
              style={{ borderColor: 'var(--color-border-soft)' }}
            />
          </div>
        ))}
      </div>
      <textarea
        value={draft.explanation ?? ''}
        onChange={(e) => update('explanation', e.target.value)}
        placeholder="Explanation shown after answering (optional)"
        rows={2}
        className="w-full rounded-lg px-3 py-2 text-xs border outline-none resize-none mb-3"
        style={{ borderColor: 'var(--color-border-soft)', color: 'var(--color-muted)' }}
      />
      <div className="flex justify-between items-center">
        <button onClick={onDelete} className="text-xs font-semibold" style={{ color: 'var(--color-coral)' }}>
          Delete question
        </button>
        {dirty && (
          <button
            onClick={() => { onSave(draft); setDirty(false) }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--color-marigold)', color: 'var(--color-ink)' }}
          >
            Save changes
          </button>
        )}
      </div>
    </div>
  )
}

export function ChapterQuestions() {
  const { chapterId } = useParams()
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [stats, setStats] = useState<Map<string, { correct_count: number; total_count: number }>>(new Map())
  const [loading, setLoading] = useState(true)

  async function load() {
    const [{ data: c }, { data: qs }, { data: statData }] = await Promise.all([
      supabase.from('chapters').select('*').eq('id', chapterId).single(),
      supabase.from('questions').select('*').eq('chapter_id', chapterId).order('order_index'),
      supabase.rpc('admin_question_stats'),
    ])
    setChapter(c as Chapter)
    setQuestions((qs ?? []) as Question[])
    const map = new Map<string, { correct_count: number; total_count: number }>()
    ;(statData ?? [])
      .filter((s: { chapter_id: string }) => s.chapter_id === chapterId)
      .forEach((s: { question_id: string; correct_count: number; total_count: number }) => {
        map.set(s.question_id, { correct_count: s.correct_count, total_count: s.total_count })
      })
    setStats(map)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [chapterId])

  async function addQuestion() {
    const { data } = await supabase
      .from('questions')
      .insert({
        chapter_id: chapterId,
        question_text: 'New question — edit me',
        options: emptyOptions,
        correct_option_id: 'a',
        order_index: questions.length,
      })
      .select()
      .single()
    if (data) setQuestions((qs) => [...qs, data as Question])
  }

  async function saveQuestion(q: Question) {
    await supabase.from('questions').update({
      question_text: q.question_text,
      options: q.options,
      correct_option_id: q.correct_option_id,
      explanation: q.explanation,
    }).eq('id', q.id)
    load()
  }

  async function deleteQuestion(id: string) {
    await supabase.from('questions').delete().eq('id', id)
    setQuestions((qs) => qs.filter((q) => q.id !== id))
  }

  if (loading) return <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Loading…</p>

  return (
    <div>
      <Link to="/admin/chapters" className="text-sm font-medium mb-4 inline-block" style={{ color: 'var(--color-muted)' }}>← Back to chapters</Link>

      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display text-2xl">{chapter?.title}</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
            {chapter?.is_published ? 'Live — students can see these questions' : 'Draft — hidden from students until published'}
          </p>
        </div>
        <button
          onClick={addQuestion}
          className="text-sm font-semibold px-4 py-2.5 rounded-lg shrink-0"
          style={{ background: 'var(--color-marigold)', color: 'var(--color-ink)' }}
        >
          + Add question
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {questions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              No questions yet. Send Claude the chapter PDF to draft some, or add one manually.
            </p>
          </div>
        ) : (
          questions.map((q) => (
            <QuestionEditor key={q.id} q={q} stat={stats.get(q.id)} onSave={saveQuestion} onDelete={() => deleteQuestion(q.id)} />
          ))
        )}
      </div>
    </div>
  )
}
