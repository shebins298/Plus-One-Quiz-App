import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export function OnboardingModal() {
  const { session, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !schoolName.trim()) {
      setError('Both fields are needed to continue.')
      return
    }
    setSaving(true)
    setError(null)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), school_name: schoolName.trim() })
      .eq('id', session!.user.id)

    if (updateError) {
      setError('Something went wrong saving that. Try again.')
      setSaving(false)
      return
    }
    await refreshProfile()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-6">
      <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-7 pb-9">
        <h2 className="font-display text-2xl mb-1.5" style={{ color: 'var(--color-ink)' }}>
          Welcome! One quick thing.
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
          Your teacher needs your name and school to track your progress.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-muted)' }}>
              Your full name
            </label>
            <input
              autoFocus
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full rounded-xl px-4 py-3 text-base border outline-none"
              style={{ borderColor: 'var(--color-border-soft)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-muted)' }}>
              School name
            </label>
            <input
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="Your school's name"
              className="w-full rounded-xl px-4 py-3 text-base border outline-none"
              style={{ borderColor: 'var(--color-border-soft)' }}
            />
          </div>

          {error && <p className="text-sm" style={{ color: 'var(--color-coral)' }}>{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl py-3.5 font-semibold text-base disabled:opacity-60"
            style={{ background: 'var(--color-marigold)', color: 'var(--color-ink)' }}
          >
            {saving ? 'Saving…' : 'Start learning'}
          </button>
        </form>
      </div>
    </div>
  )
}
