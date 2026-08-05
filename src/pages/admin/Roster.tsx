import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Profile } from '../../lib/types'

export function Roster() {
  const [students, setStudents] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  async function load() {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false })
    setStudents((data ?? []) as Profile[])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function toggleBan(s: Profile) {
    const newStatus = s.status === 'banned' ? 'active' : 'banned'
    await supabase.from('profiles').update({ status: newStatus }).eq('id', s.id)
    load()
  }

  async function deleteStudent(id: string) {
    await supabase.from('profiles').delete().eq('id', id)
    setConfirmDelete(null)
    load()
  }

  const filtered = students.filter((s) => {
    const q = search.toLowerCase()
    return (s.full_name ?? '').toLowerCase().includes(q) || (s.school_name ?? '').toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, school, or email"
          className="flex-1 max-w-sm rounded-lg px-4 py-2.5 text-sm border outline-none bg-white"
          style={{ borderColor: 'var(--color-border-soft)' }}
        />
        <span className="text-xs font-mono shrink-0" style={{ color: 'var(--color-muted)' }}>
          {filtered.length} student{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {loading ? (
        <p className="text-sm py-10 text-center" style={{ color: 'var(--color-muted)' }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center">
          <p className="font-display text-lg mb-1">No students yet</p>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Students will appear here once they sign in.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {filtered.map((s, i) => (
            <div
              key={s.id}
              className="flex items-center gap-3 px-4 py-3.5"
              style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-border-soft)' }}
            >
              <Link to={`/admin/students/${s.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{s.full_name ?? '(no name)'}</p>
                  {s.status === 'banned' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--color-coral-light)', color: 'var(--color-coral)' }}>
                      BANNED
                    </span>
                  )}
                </div>
                <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>{s.school_name ?? '—'} · {s.email}</p>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleBan(s)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                  style={{
                    background: s.status === 'banned' ? 'var(--color-leaf-light)' : 'var(--color-surface)',
                    color: s.status === 'banned' ? 'var(--color-leaf)' : 'var(--color-ink)',
                  }}
                >
                  {s.status === 'banned' ? 'Unban' : 'Deny access'}
                </button>
                {confirmDelete === s.id ? (
                  <button
                    onClick={() => deleteStudent(s.id)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                    style={{ background: 'var(--color-coral)', color: 'white' }}
                  >
                    Confirm?
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(s.id)}
                    onBlur={() => setConfirmDelete(null)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                    style={{ color: 'var(--color-coral)' }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
