import { useAuth } from '../lib/AuthContext'

export function Login() {
  const { signInWithGoogle } = useAuth()

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6" style={{ background: 'var(--color-ink)' }}>
      <div className="w-full max-w-sm text-center">
        <div
          className="mx-auto mb-8 flex items-center justify-center rounded-2xl"
          style={{ width: 64, height: 64, background: 'var(--color-marigold)' }}
        >
          <span className="font-display text-2xl font-semibold" style={{ color: 'var(--color-ink)' }}>CA</span>
        </div>

        <h1 className="font-display text-4xl text-white mb-3" style={{ letterSpacing: '-0.01em' }}>
          Plus One Computer Application
        </h1>
        <p className="text-base mb-10" style={{ color: '#A8AEC4' }}>
          Chapter-wise quizzes to track how you're really doing, chapter by chapter.
        </p>

        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white rounded-xl py-3.5 font-semibold text-base transition-transform active:scale-[0.98]"
          style={{ color: 'var(--color-ink)' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path fill="#4285F4" d="M19.6 10.23c0-.68-.06-1.36-.17-2H10v3.79h5.4a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.9-1.75 2.98-4.33 2.98-7.31z"/>
            <path fill="#34A853" d="M10 20c2.7 0 4.96-.89 6.62-2.42l-3.23-2.5c-.9.6-2.05.95-3.39.95-2.6 0-4.8-1.76-5.59-4.12H1.06v2.59A10 10 0 0 0 10 20z"/>
            <path fill="#FBBC05" d="M4.41 11.9a6 6 0 0 1 0-3.8V5.51H1.06a10 10 0 0 0 0 8.98l3.35-2.59z"/>
            <path fill="#EA4335" d="M10 3.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.6 9.6 0 0 0 10 0 10 10 0 0 0 1.06 5.51L4.41 8.1C5.2 5.74 7.4 3.98 10 3.98z"/>
          </svg>
          Continue with Google
        </button>

        <p className="mt-6 text-xs" style={{ color: '#6B7290' }}>
          Use your regular Google account to sign in.
        </p>
      </div>
    </div>
  )
}
