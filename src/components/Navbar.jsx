import { Link, useNavigate } from 'react-router-dom'
import Button from './Button'
import { useAppContext } from '../context/AppContext'

function Navbar({ onMenuClick }) {
  const navigate = useNavigate()
  const { currentUser, interviews, studentInterviews, logoutUser } = useAppContext()

  const now = Date.now()
  const upcomingCount =
    currentUser?.role === 'admin'
      ? interviews.filter((item) => item.status === 'Scheduled' && Number(new Date(item.interviewDateTime)) >= now).length
      : studentInterviews.filter((item) => item.status === 'Scheduled' && Number(new Date(item.interviewDateTime)) >= now).length

  const notificationTarget = currentUser?.role === 'admin' ? '/admin/interviews' : '/student/interviews'

  const handleLogout = () => {
    logoutUser()
    navigate('/login', { replace: true })
  }

  const roleLabel = currentUser?.role === 'admin' ? 'Admin' : 'Student'

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3 shadow-[0_0_24px_rgba(255,46,159,0.14)] backdrop-blur-xl md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:shadow-[0_0_12px_rgba(255,46,159,0.45)] md:hidden"
          aria-label="Open sidebar"
        >
          ☰
        </button>

        <div className="min-w-0 flex-1">
          <div className="hidden max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 shadow-[0_0_14px_rgba(91,140,255,0.18)] sm:flex">
            <span className="text-sm text-gray-400">⌕</span>
            <input
              type="text"
              placeholder="Search students, interviews, assessments..."
              className="w-full bg-transparent text-sm text-white placeholder:text-gray-400 focus:outline-none"
            />
          </div>
          <h1 className="truncate text-sm font-semibold text-white sm:hidden">Student Success Prediction System</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          to={notificationTarget}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white shadow-[0_0_12px_rgba(91,140,255,0.24)] transition hover:shadow-[0_0_16px_rgba(255,46,159,0.5)]"
          aria-label="Interview notifications"
        >
          <span aria-hidden="true">🔔</span>
          {upcomingCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-xs font-semibold text-white">
              {upcomingCount}
            </span>
          ) : null}
        </Link>
        <Button fullWidth={false} variant="outline" className="hidden px-3 py-2 sm:inline-flex" onClick={handleLogout}>
          Logout
        </Button>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white shadow-[0_0_12px_rgba(91,140,255,0.24)] transition hover:shadow-[0_0_16px_rgba(255,46,159,0.4)] sm:hidden"
          aria-label="Logout"
        >
          <span aria-hidden="true">↩</span>
        </button>

        <Link to="/profile" className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 shadow-[0_0_14px_rgba(255,46,159,0.2)] sm:flex" aria-label="Open profile">
          <div className="text-right">
            <p className="max-w-28 truncate text-xs font-medium text-white">{currentUser?.username}</p>
            <p className="text-[11px] text-gray-400">{roleLabel}</p>
          </div>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_0_14px_rgba(255,46,159,0.45)]" aria-hidden="true">
            👤
          </span>
        </Link>
      </div>
    </header>
  )
}

export default Navbar
