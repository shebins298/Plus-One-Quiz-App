import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { Login } from './pages/Login'
import { OnboardingModal } from './components/OnboardingModal'
import { ChapterList } from './pages/student/ChapterList'
import { Quiz } from './pages/student/Quiz'
import { AdminLayout } from './pages/admin/AdminLayout'
import { Roster } from './pages/admin/Roster'
import { StudentDetail } from './pages/admin/StudentDetail'
import { Chapters } from './pages/admin/Chapters'
import { ChapterQuestions } from './pages/admin/ChapterQuestions'
import { Analytics } from './pages/admin/Analytics'

function BannedScreen() {
  const { signOut } = useAuth()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-2xl mb-2">Access restricted</p>
      <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
        Your teacher has restricted access to this account. Contact them if you think this is a mistake.
      </p>
      <button onClick={signOut} className="text-sm font-semibold underline">Sign out</button>
    </div>
  )
}

function Gate() {
  const { session, profile, loading, needsOnboarding } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm" style={{ color: 'var(--color-muted)' }}>Loading…</div>
  }

  if (!session) return <Login />

  if (profile?.status === 'banned') return <BannedScreen />

  if (needsOnboarding) return <OnboardingModal />

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center text-sm" style={{ color: 'var(--color-muted)' }}>Setting up your account…</div>
  }

  if (profile.role === 'admin') {
    return (
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Roster />} />
          <Route path="students/:studentId" element={<StudentDetail />} />
          <Route path="chapters" element={<Chapters />} />
          <Route path="chapters/:chapterId" element={<ChapterQuestions />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<ChapterList />} />
      <Route path="/quiz/:chapterId" element={<Quiz />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </BrowserRouter>
  )
}
