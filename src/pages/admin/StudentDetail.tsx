import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Chapter, Profile, QuizAttempt } from '../../lib/types'
import { ScoreDial } from '../../components/ScoreDial'
import { BadgeStrip } from '../../components/BadgeStrip'

export function StudentDetail() {
  const { studentId } = useParams()
  const [student, setStudent] = useState<Profile | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmChapter, setConfirmChapter] = useState<string | null>(null)
  const [confirmAttempt, setConfirmAttempt] = useState<string | null>(null)

  async function load() {
    const [{ data: s }, { data: c }, { data: a }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', studentId).single(),
      supabase.from('chapters').select('*').order('order_index'),
      supabase.from('quiz_attempts').select('*').eq('student_id', studentId).order('started_at', { ascending: false }),
    ])
    setStudent(s as Profile)
    setChapters((c ?? []) as Chapter[])
    setAttempts((a ?? []) as QuizAttempt[])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [studentId])

  async function deleteAttempt(id: string) {
    await supabase.from('quiz_attempts').delete().eq('id', id)
    setConfirmAttempt(null)
    load()
  }

  async function resetChapter(chapterId: string) {
    await supabase.from('quiz_attempts').delete().eq('student_id', studentId).eq('chapter_id', chapterId)
    setConfirmChapter(null)
    load()
  }

  if (loading) return <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Loading…</p>
  if (!student) return <p className="text-sm">Student not found.</p>

  const completed = attempts.filter((a) => a.status === 'completed' && !a.is_practice)
  const overallAvg = completed.length
    ? Math.round(completed.reduce((sum, a) => sum + (a.total_questions ? (a.score / a.total_questions) * 100 : 0), 0) / completed.length)
    : null

  return (
    <div>
      <Link to="/admin" className="text-sm font-medium mb-4 inline-block" style={{ color: 'var(--color-muted)' }}>← Back to roster</Link>

      <div className="bg-white rounded-2xl p-5 flex items-center gap-5 mb-6 shadow-sm">
        <ScoreDial percent={overallAvg} size={80} strokeWidth={7} label="Average" />
        <div>
          <h2 className="font-display text-2xl mb-0.5">{student.full_name}</h2>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{student.school_name}</p>
          <p className="text-xs font-mono mt-1" style={{ color: 'var(--color-muted)' }}>{student.email}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
        <h3 className="font-display text-lg mb-3">Badges</h3>
        <BadgeStrip studentId={student.id} />
      </div>

      <h3 className="font-display text-lg mb-1">Chapter attempts</h3>
      <p className="text-xs mb-3" style={{ color: 'var(--color-muted)' }}>
        Delete an individual attempt (e.g. one broken by a bug) or reset a whole chapter to give a fresh set of tries.
      </p>
      <div className="flex flex-col gap-2">
        {chapters.map((c) => {
          const chapterAttempts = completed.filter((a) => a.chapter_id === c.id).sort((a, b) => a.attempt_number - b.attempt_number)
          if (chapterAttempts.length === 0) {
            return (
              <div key={c.id} className="bg-white rounded-xl px-4 py-3 flex items-center justify-between opacity-60">
                <span className="text-sm font-medium">{c.title}</span>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Not attempted</span>
              </div>
            )
          }
          return (
            <div key={c.id} className="bg-white rounded-xl px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{c.title}</p>
                {confirmChapter === c.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Delete all {chapterAttempts.length} attempts?</span>
                    <button
                      onClick={() => resetChapter(c.id)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                      style={{ background: 'var(--color-coral)', color: 'white' }}
                    >
                      Confirm
                    </button>
                    <button onClick={() => setConfirmChapter(null)} className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmChapter(c.id)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-ink)' }}
                  >
                    Reset chapter
                  </button>
                )}
              </div>
              <div className="flex gap-4 flex-wrap">
                {chapterAttempts.map((a) => {
                  const pct = a.total_questions ? Math.round((a.score / a.total_questions) * 100) : 0
                  return (
                    <div key={a.id} className="flex flex-col items-center gap-1">
                      <ScoreDial percent={pct} size={40} strokeWidth={4} centerText={`${a.score}/${a.total_questions}`} />
                      <span className="text-[10px] font-mono" style={{ color: 'var(--color-muted)' }}>#{a.attempt_number}</span>
                      {confirmAttempt === a.id ? (
                        <button
                          onClick={() => deleteAttempt(a.id)}
                          onBlur={() => setConfirmAttempt(null)}
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--color-coral)', color: 'white' }}
                        >
                          Confirm?
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmAttempt(a.id)}
                          className="text-[10px] font-medium"
                          style={{ color: 'var(--color-coral)' }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

