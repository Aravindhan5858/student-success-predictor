import { Link, useNavigate } from 'react-router-dom'
import Button from './Button'
import { useAppContext } from '../context/AppContext'

function Navbar({ onMenuClick }) {
  const navigate = useNavigate()
  const { currentUser, logoutUser } = useAppContext()

  const handleLogout = () => {
    logoutUser()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 md:hidden"
          aria-label="Open sidebar"
        >
          ☰
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-slate-900 sm:text-base lg:text-lg">Student Success Prediction System</h1>
          <p className="hidden text-xs text-slate-500 sm:block">Analytics dashboard for student performance monitoring</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-700">
            Welcome, {currentUser?.username} ({currentUser?.role === 'admin' ? 'Admin' : 'Student'})
          </p>
          <p className="text-xs text-slate-500">User ID: {currentUser?.userId ?? 'N/A'}</p>
        </div>
        <Link to="/profile" className="hidden sm:inline-flex">
          <Button fullWidth={false} variant="outline" className="px-3 py-2">
            Profile
          </Button>
        </Link>
        <Button fullWidth={false} variant="outline" className="hidden px-3 py-2 sm:inline-flex" onClick={handleLogout}>
          Logout
        </Button>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700 sm:hidden"
          aria-label="Logout"
        >
          <span aria-hidden="true">👤</span>
        </button>
      </div>
    </header>
  )
}

export default Navbar
