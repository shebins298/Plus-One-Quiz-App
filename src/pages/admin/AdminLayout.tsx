import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'

const tabs = [
  { to: '/admin', label: 'Roster', end: true },
  { to: '/admin/chapters', label: 'Chapters' },
  { to: '/admin/analytics', label: 'Analytics' },
]

export function AdminLayout() {
  const { signOut, profile } = useAuth()

  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-surface)' }}>
      <header className="px-5 sm:px-8 pt-6 pb-4" style={{ background: 'var(--color-ink)' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-medium" style={{ color: '#A8AEC4' }}>Admin · Plus One Computer Application</p>
            <h1 className="font-display text-2xl text-white">{profile?.full_name ?? 'Dashboard'}</h1>
          </div>
          <button onClick={signOut} className="text-xs font-medium underline" style={{ color: '#A8AEC4' }}>
            Sign out
          </button>
        </div>
        <nav className="flex gap-1">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive ? '' : 'opacity-60'}`
              }
              style={({ isActive }) => ({
                background: isActive ? 'var(--color-marigold)' : 'transparent',
                color: isActive ? 'var(--color-ink)' : 'white',
              })}
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="px-5 sm:px-8 py-6">
        <Outlet />
      </main>
    </div>
  )
}
