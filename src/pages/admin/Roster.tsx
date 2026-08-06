import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Profile } from '../../lib/types'

export function Roster() {
  const [students, setStudents] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

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

  async function deleteSelected() {
    setBulkDeleting(true)
    await supabase.from('profiles').delete().in('id', Array.from(selected))
    setSelected(new Set())
    setConfirmBulkDelete(false)
    setBulkDeleting(false)
    load()
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filtered = students.filter((s) => {
    const q = search.toLowerCase()
    return (s.full_name ?? '').toLowerCase().includes(q) || (s.school_name ?? '').toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
  })

  const allFilteredSelected = filtered.length > 0 && filtered.every((s) => selected.has(s.id))

  function toggleSelectAll() {
    setSelected((prev) => {
      if (allFilteredSelected) {
        const next = new Set(prev)
        filtered.forEach((s) => next.delete(s.id))
        return next
      }
      const next = new Set(prev)
      filtered.forEach((s) => next.add(s.id))
      return next
    })
  }

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

      {selected.size > 0 && (
        <div
          className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 mb-3"
          style={{ background: 'var(--color-ink)' }}
        >
          <span className="text-sm font-medium text-white">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            {confirmBulkDelete ? (
              <>
                <span className="text-xs text-white">Delete {selected.size} permanently?</span>
                <button
                  onClick={deleteSelected}
                  disabled={bulkDeleting}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-60"
                  style={{ background: 'var(--color-coral)', color: 'white' }}
                >
                  {bulkDeleting ? 'Deleting…' : 'Confirm'}
                </button>
                <button onClick={() => setConfirmBulkDelete(false)} className="text-xs font-semibold text-white underline">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setConfirmBulkDelete(true)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: 'var(--color-coral)', color: 'white' }}
                >
                  Delete selected
                </button>
                <button onClick={() => setSelected(new Set())} className="text-xs font-semibold text-white underline">
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm py-10 text-center" style={{ color: 'var(--color-muted)' }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center">
          <p className="font-display text-lg mb-1">No students yet</p>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Students will appear here once they sign in.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: '1px solid var(--color-border-soft)', background: 'var(--color-surface)' }}>
            <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} className="shrink-0" style={{ width: 16, height: 16 }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Select all{search ? ' (filtered)' : ''}</span>
          </div>
          {filtered.map((s, i) => (
            <div
              key={s.id}
              className="flex items-center gap-3 px-4 py-3.5"
              style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-border-soft)' }}
            >
              <input
                type="checkbox"
                checked={selected.has(s.id)}
                onChange={() => toggleOne(s.id)}
                className="shrink-0"
                style={{ width: 16, height: 16 }}
              />
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
