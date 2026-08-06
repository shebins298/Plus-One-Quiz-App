import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Chapter, Profile, QuizAttempt, QuestionStat, StudentChapterCell } from '../../lib/types'
import { ScoreDial } from '../../components/ScoreDial'

const THRESHOLDS = [40, 50, 60, 70]
const BUCKETS = [
  { label: '0–20', min: 0, max: 20 },
  { label: '21–40', min: 21, max: 40 },
  { label: '41–60', min: 41, max: 60 },
  { label: '61–80', min: 61, max: 80 },
  { label: '81–100', min: 81, max: 100 },
]

function heatColor(pct: number) {
  if (pct >= 75) return { bg: 'var(--color-leaf-light)', fg: 'var(--color-leaf)' }
  if (pct >= 40) return { bg: 'var(--color-marigold-light)', fg: 'var(--color-ink)' }
  return { bg: 'var(--color-coral-light)', fg: 'var(--color-coral)' }
}

export function Analytics() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [students, setStudents] = useState<Profile[]>([])
  const [questionStats, setQuestionStats] = useState<QuestionStat[]>([])
  const [matrix, setMatrix] = useState<StudentChapterCell[]>([])
  const [loading, setLoading] = useState(true)
  const [threshold, setThreshold] = useState(50)

  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: a }, { data: s }, { data: qs }, { data: m }] = await Promise.all([
        supabase.from('chapters').select('*').order('order_index'),
        supabase.from('quiz_attempts').select('*').eq('status', 'completed').eq('is_practice', false),
        supabase.from('profiles').select('*').eq('role', 'student'),
        supabase.rpc('admin_question_stats'),
        supabase.rpc('admin_student_chapter_matrix'),
      ])
      setChapters((c ?? []) as Chapter[])
      setAttempts((a ?? []) as QuizAttempt[])
      setStudents((s ?? []) as Profile[])
      setQuestionStats((qs ?? []) as QuestionStat[])
      setMatrix((m ?? []) as StudentChapterCell[])
      setLoading(false)
    }
    load()
  }, [])

  const chapterStats = useMemo(() => {
    return chapters.map((c) => {
      const list = attempts.filter((a) => a.chapter_id === c.id)
      const uniqueStudents = new Set(list.map((a) => a.student_id)).size
      const percents = list.map((a) => (a.total_questions ? (a.score / a.total_questions) * 100 : 0))
      const avg = percents.length ? Math.round(percents.reduce((s, p) => s + p, 0) / percents.length) : null
      const passCount = percents.filter((p) => p >= threshold).length
      const passRate = percents.length ? Math.round((passCount / percents.length) * 100) : null
      const buckets = BUCKETS.map((b) => percents.filter((p) => p >= b.min && p <= b.max).length)
      return {
        title: c.title.length > 18 ? c.title.slice(0, 16) + '…' : c.title,
        fullTitle: c.title,
        avg,
        passRate,
        buckets,
        attempts: list.length,
        uniqueStudents,
      }
    })
  }, [chapters, attempts, threshold])

  const overallAvg = useMemo(() => {
    if (attempts.length === 0) return null
    return Math.round(attempts.reduce((sum, a) => sum + (a.total_questions ? (a.score / a.total_questions) * 100 : 0), 0) / attempts.length)
  }, [attempts])

  const hardestChapter = useMemo(() => {
    const withData = chapterStats.filter((c) => c.avg !== null)
    if (withData.length === 0) return null
    return withData.reduce((min, c) => (c.avg! < min.avg! ? c : min))
  }, [chapterStats])

  const toughestQuestions = useMemo(() => {
    return questionStats
      .filter((q) => q.total_count >= 3)
      .map((q) => ({ ...q, rate: Math.round((q.correct_count / q.total_count) * 100) }))
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 8)
  }, [questionStats])

  const studentSummaries = useMemo(() => {
    const byStudent = new Map<string, number[]>()
    attempts.forEach((a) => {
      const pct = a.total_questions ? (a.score / a.total_questions) * 100 : 0
      const list = byStudent.get(a.student_id) ?? []
      list.push(pct)
      byStudent.set(a.student_id, list)
    })
    return students
      .filter((s) => s.status === 'active')
      .map((s) => {
        const list = byStudent.get(s.id) ?? []
        const avg = list.length ? Math.round(list.reduce((sum, p) => sum + p, 0) / list.length) : null
        return { student: s, attemptCount: list.length, avg }
      })
  }, [students, attempts])

  const struggling = useMemo(
    () => studentSummaries.filter((s) => s.attemptCount >= 2 && s.avg !== null && s.avg < threshold).sort((a, b) => a.avg! - b.avg!),
    [studentSummaries, threshold]
  )

  const notStarted = useMemo(() => studentSummaries.filter((s) => s.attemptCount === 0), [studentSummaries])

  const activeCount = students.filter((s) => s.status === 'active').length
  const publishedChapters = chapters.filter((c) => c.is_published)
  const matrixMap = useMemo(() => {
    const map = new Map<string, number>()
    matrix.forEach((cell) => map.set(`${cell.student_id}_${cell.chapter_id}`, cell.best_percent))
    return map
  }, [matrix])
  const activeStudentsSorted = useMemo(
    () => students.filter((s) => s.status === 'active').sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? '')),
    [students]
  )

  if (loading) return <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Loading…</p>

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatCard label="Active students" value={String(activeCount)} />
        <StatCard label="Total attempts" value={String(attempts.length)} />
        <StatCard label="Chapters live" value={String(publishedChapters.length)} />
        <StatCard label="Class average" value={overallAvg !== null ? `${overallAvg}%` : '—'} />
      </div>

      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Pass / struggling threshold:</span>
        <div className="flex gap-1">
          {THRESHOLDS.map((t) => (
            <button
              key={t}
              onClick={() => setThreshold(t)}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{
                background: threshold === t ? 'var(--color-ink)' : 'white',
                color: threshold === t ? 'white' : 'var(--color-ink)',
                border: '1px solid var(--color-border-soft)',
              }}
            >
              {t}%
            </button>
          ))}
        </div>
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

      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm mb-6">
        <h3 className="font-display text-lg mb-1">Chapter breakdown</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>
          Pass rate at {threshold}%, and how scores are actually distributed — a good average can still hide a split class.
        </p>
        <div className="flex flex-col gap-4">
          {chapterStats.filter((c) => c.attempts > 0).map((c) => (
            <div key={c.fullTitle}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium">{c.fullTitle}</span>
                <span className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>
                  {c.passRate}% passing · {c.uniqueStudents}/{activeCount} students
                </span>
              </div>
              <div className="flex gap-1 h-6">
                {BUCKETS.map((b, i) => {
                  const count = c.buckets[i]
                  const widthPct = c.attempts > 0 ? Math.max((count / c.attempts) * 100, count > 0 ? 4 : 0) : 0
                  return (
                    <div
                      key={b.label}
                      title={`${b.label}%: ${count} attempt${count === 1 ? '' : 's'}`}
                      className="rounded flex items-center justify-center text-[9px] font-mono font-semibold"
                      style={{
                        width: `${widthPct}%`,
                        minWidth: count > 0 ? 18 : 0,
                        background: i <= 1 ? 'var(--color-coral)' : i === 2 ? 'var(--color-marigold)' : 'var(--color-leaf)',
                        color: 'white',
                        opacity: 0.85,
                      }}
                    >
                      {count > 0 ? count : ''}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {chapterStats.filter((c) => c.attempts > 0).length === 0 && (
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No attempts yet.</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm mb-6">
        <h3 className="font-display text-lg mb-1">Toughest questions</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>
          Lowest correct rates across all chapters (minimum 3 answers). One low question in an otherwise fine chapter is often worth reviewing for wording.
        </p>
        {toughestQuestions.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Not enough data yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {toughestQuestions.map((q) => (
              <Link
                key={q.question_id}
                to={`/admin/chapters/${q.chapter_id}`}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg"
                style={{ background: 'var(--color-surface)' }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{q.question_text}</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{q.chapter_title}</p>
                </div>
                <span
                  className="text-xs font-mono font-semibold px-2 py-1 rounded shrink-0"
                  style={{ background: heatColor(q.rate).bg, color: heatColor(q.rate).fg }}
                >
                  {q.rate}%
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm">
          <h3 className="font-display text-lg mb-1">Needs attention</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>
            Averaging below {threshold}% across 2+ attempts.
          </p>
          {struggling.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No one currently below the threshold.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {struggling.map((s) => (
                <Link
                  key={s.student.id}
                  to={`/admin/students/${s.student.id}`}
                  className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: 'var(--color-surface)' }}
                >
                  <span className="text-sm font-medium truncate">{s.student.full_name}</span>
                  <span className="text-xs font-mono font-semibold" style={{ color: 'var(--color-coral)' }}>{s.avg}%</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm">
          <h3 className="font-display text-lg mb-1">Not started</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>
            Active students who haven't attempted anything yet.
          </p>
          {notStarted.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Everyone's gotten started.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {notStarted.map((s) => (
                <Link
                  key={s.student.id}
                  to={`/admin/students/${s.student.id}`}
                  className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: 'var(--color-surface)' }}
                >
                  <span className="text-sm font-medium truncate">{s.student.full_name}</span>
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{s.student.school_name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm">
        <h3 className="font-display text-lg mb-1">Student × chapter grid</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>
          Best score per chapter. Scroll sideways for more chapters — look for a column that's mostly red.
        </p>
        {publishedChapters.length === 0 || activeStudentsSorted.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Not enough data yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="text-xs border-collapse" style={{ minWidth: 480 }}>
              <thead>
                <tr>
                  <th
                    className="text-left font-semibold px-2 py-2 sticky left-0 bg-white"
                    style={{ minWidth: 120, borderBottom: '1px solid var(--color-border-soft)' }}
                  >
                    Student
                  </th>
                  {publishedChapters.map((c) => (
                    <th
                      key={c.id}
                      className="font-semibold px-2 py-2 text-center"
                      style={{ minWidth: 64, borderBottom: '1px solid var(--color-border-soft)' }}
                      title={c.title}
                    >
                      {c.title.length > 10 ? c.title.slice(0, 9) + '…' : c.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeStudentsSorted.map((s) => (
                  <tr key={s.id}>
                    <td
                      className="px-2 py-1.5 font-medium sticky left-0 bg-white truncate"
                      style={{ maxWidth: 120, borderBottom: '1px solid var(--color-border-soft)' }}
                    >
                      <Link to={`/admin/students/${s.id}`} className="hover:underline">
                        {s.full_name ?? '(no name)'}
                      </Link>
                    </td>
                    {publishedChapters.map((c) => {
                      const val = matrixMap.get(`${s.id}_${c.id}`)
                      return (
                        <td key={c.id} className="px-1 py-1.5 text-center" style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
                          {val === undefined ? (
                            <span style={{ color: 'var(--color-border-soft)' }}>—</span>
                          ) : (
                            <span
                              className="inline-block rounded px-1.5 py-0.5 font-mono font-semibold"
                              style={{ background: heatColor(val).bg, color: heatColor(val).fg }}
                            >
                              {Math.round(val)}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
