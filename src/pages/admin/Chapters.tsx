import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Chapter, AppSettings } from '../../lib/types'

export function Chapters() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({})
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)

  async function load() {
    const [{ data: c }, { data: s }, { data: q }] = await Promise.all([
      supabase.from('chapters').select('*').order('order_index'),
      supabase.from('app_settings').select('*').eq('id', 1).single(),
      supabase.from('questions').select('chapter_id'),
    ])
    setChapters((c ?? []) as Chapter[])
    setSettings(s as AppSettings)
    const counts: Record<string, number> = {}
    ;(q ?? []).forEach((row: { chapter_id: string }) => {
      counts[row.chapter_id] = (counts[row.chapter_id] ?? 0) + 1
    })
    setQuestionCounts(counts)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function createChapter() {
    if (!newTitle.trim()) return
    setCreating(true)
    await supabase.from('chapters').insert({ title: newTitle.trim(), order_index: chapters.length })
    setNewTitle('')
    setCreating(false)
    load()
  }

  async function togglePublish(c: Chapter) {
    const goingLive = !c.is_published
    const payload: { is_published: boolean; published_at?: string } = { is_published: goingLive }
    if (goingLive && !c.published_at) {
      payload.published_at = new Date().toISOString()
    }
    await supabase.from('chapters').update(payload).eq('id', c.id)
    load()
  }

  async function updateMaxAttempts(c: Chapter, value: string) {
    const num = value === '' ? null : parseInt(value, 10)
    await supabase.from('chapters').update({ max_attempts: num }).eq('id', c.id)
    load()
  }

  async function updateDefaultMax(value: string) {
    const num = parseInt(value, 10)
    if (isNaN(num) || num < 1) return
    await supabase.from('app_settings').update({ default_max_attempts: num }).eq('id', 1)
    load()
  }

  if (loading) return <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Loading…</p>

  return (
    <div>
      <div className="bg-white rounded-2xl p-4 mb-6 flex items-center gap-3 shadow-sm">
        <span className="text-sm font-medium">Default attempts per chapter</span>
        <input
          type="number"
          min={1}
          defaultValue={settings?.default_max_attempts ?? 3}
          onBlur={(e) => updateDefaultMax(e.target.value)}
          className="w-16 rounded-lg px-2 py-1.5 text-sm border font-mono text-center"
          style={{ borderColor: 'var(--color-border-soft)' }}
        />
        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Chapters can override this individually.</span>
      </div>

      <div className="bg-white rounded-2xl p-4 mb-6 flex gap-3 shadow-sm">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New chapter title, e.g. Chapter 4: Thermodynamics"
          className="flex-1 rounded-lg px-3 py-2.5 text-sm border outline-none"
          style={{ borderColor: 'var(--color-border-soft)' }}
        />
        <button
          onClick={createChapter}
          disabled={creating || !newTitle.trim()}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold shrink-0 disabled:opacity-50"
          style={{ background: 'var(--color-marigold)', color: 'var(--color-ink)' }}
        >
          Add chapter
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {chapters.map((c) => (
          <div key={c.id} className="bg-white rounded-xl px-4 py-3.5 flex items-center gap-3 flex-wrap shadow-sm">
            <div className="flex-1 min-w-[160px]">
              <Link to={`/admin/chapters/${c.id}`} className="font-medium text-sm hover:underline">
                {c.title}
              </Link>
              <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-muted)' }}>
                {questionCounts[c.id] ?? 0} question{(questionCounts[c.id] ?? 0) === 1 ? '' : 's'}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Max attempts</span>
              <input
                type="number"
                min={1}
                placeholder={String(settings?.default_max_attempts ?? 3)}
                defaultValue={c.max_attempts ?? ''}
                onBlur={(e) => updateMaxAttempts(c, e.target.value)}
                className="w-14 rounded-lg px-2 py-1.5 text-sm border font-mono text-center"
                style={{ borderColor: 'var(--color-border-soft)' }}
              />
            </div>

            <button
              onClick={() => togglePublish(c)}
              className="text-xs font-semibold px-3 py-2 rounded-lg shrink-0"
              style={{
                background: c.is_published ? 'var(--color-leaf-light)' : 'var(--color-surface)',
                color: c.is_published ? 'var(--color-leaf)' : 'var(--color-muted)',
              }}
            >
              {c.is_published ? 'Published' : 'Draft'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
