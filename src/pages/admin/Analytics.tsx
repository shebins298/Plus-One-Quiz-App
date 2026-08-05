import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { supabase } from '../../lib/supabase'
import type { Chapter, Profile, QuizAttempt } from '../../lib/types'
import { ScoreDial } from '../../components/ScoreDial'

export function Analytics() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [students, setStudents] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: a }, { data: s }] = await Promise.all([
        supabase.from('chapters').select('*').order('order_index'),
        supabase.from('quiz_attempts').select('*').eq('status', 'completed').eq('is_practice', false),
        supabase.from('profiles').select('*').eq('role', 'student'),
      ])
      setChapters((c ?? []) as Chapter[])
      setAttempts((a ?? []) as QuizAttempt[])
      setStudents((s ?? []) as Profile[])
      setLoading(false)
    }
    load()
  }, [])

  const chapterStats = useMemo(() => {
    return chapters.map((c) => {
      const list = attempts.filter((a) => a.chapter_id === c.id)
      const uniqueStudents = new Set(list.map((a) => a.student_id)).size
      const avg = list.length
        ? Math.round(list.reduce((sum, a) => sum + (a.total_questions ? (a.score / a.total_questions) * 100 : 0), 0) / list.length)
        : null
      return { title: c.title.length > 18 ? c.title.slice(0, 16) + '…' : c.title, fullTitle: c.title, avg, attempts: list.length, uniqueStudents }
    })
  }, [chapters, attempts])

  const overallAvg = useMemo(() => {
    if (attempts.length === 0) return null
    return Math.round(attempts.reduce((sum, a) => sum + (a.total_questions ? (a.score / a.total_questions) * 100 : 0), 0) / attempts.length)
  }, [attempts])

  const hardestChapter = useMemo(() => {
    const withData = chapterStats.filter((c) => c.avg !== null)
    if (withData.length === 0) return null
    return withData.reduce((min, c) => (c.avg! < min.avg! ? c : min))
  }, [chapterStats])

  const activeCount = students.filter((s) => s.status === 'active').length

  if (loading) return <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Loading…</p>

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Active students" value={String(activeCount)} />
        <StatCard label="Total attempts" value={String(attempts.length)} />
        <StatCard label="Chapters live" value={String(chapters.filter((c) => c.is_published).length)} />
        <StatCard label="Class average" value={overallAvg !== null ? `${overallAvg}%` : '—'} />
      </div>

      {hardestChapter && (
        <div className="bg-white rounded-2xl p-4 mb-6 flex items-center gap-4 shadow-sm">
          <ScoreDial percent={hardestChapter.avg} size={56} strokeWidth={5} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-coral)' }}>Needs attention</p>
            <p className="font-display text-lg">{hardestChapter.fullTitle}</p>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Lowest average score across your published chapters</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm mb-6">
        <h3 className="font-display text-lg mb-4">Average score by chapter</h3>
        {chapterStats.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No data yet.</p>
        ) : (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={chapterStats} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E6F0" vertical={false} />
                <XAxis dataKey="title" tick={{ fontSize: 11, fontFamily: 'Manrope' }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} domain={[0, 100]} />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Average score']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullTitle ?? ''}
                  contentStyle={{ fontFamily: 'Manrope', fontSize: 13, borderRadius: 8, border: '1px solid #E4E6F0' }}
                />
                <Bar dataKey="avg" radius={[6, 6, 0, 0]} fill="#F0A83B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm">
        <h3 className="font-display text-lg mb-4">Participation by chapter</h3>
        <div className="flex flex-col gap-2">
          {chapterStats.map((c) => (
            <div key={c.fullTitle} className="flex items-center justify-between text-sm py-1.5" style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
              <span className="font-medium">{c.fullTitle}</span>
              <span className="font-mono text-xs" style={{ color: 'var(--color-muted)' }}>
                {c.uniqueStudents}/{activeCount} students · {c.attempts} attempts
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <p className="font-mono text-2xl font-semibold mb-1">{value}</p>
      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{label}</p>
    </div>
  )
}
