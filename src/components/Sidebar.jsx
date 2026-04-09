import { NavLink } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const adminNavItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Students', to: '/students' },
  { label: 'Add Student', to: '/add-student' },
  { label: 'Predictions', to: '/prediction' },
  { label: 'Model Training', to: '/model-training' },
  { label: 'Evaluation', to: '/evaluation' },
]

const studentNavItems = [
  { label: 'Student Dashboard', to: '/student-dashboard' },
  { label: 'My Details', to: '/student-dashboard' },
]

function Sidebar({ open, onClose }) {
  const navigate = useNavigate()
  const { currentUser, currentStudent, logoutUser } = useAppContext()

  const navItems =
    currentUser?.role === 'admin'
      ? adminNavItems
      : [
          studentNavItems[0],
          { label: 'My Details', to: currentStudent ? `/student/${currentStudent.id}` : '/student-dashboard' },
        ]

  const handleLogout = () => {
    logoutUser()
    onClose()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/40 transition-opacity md:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-slate-200 bg-slate-950 text-white transition-transform duration-300 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} md:flex md:flex-col`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">SSPS</p>
            <h2 className="mt-1 text-lg font-semibold">Student Portal</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 md:hidden"
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-5">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition duration-300 hover:bg-white/10 ${
                  isActive ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300'
                }`
              }
            >
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${item.label === 'Logout' ? 'bg-rose-500/20' : 'bg-white/10'}`}
              >
                {item.label === 'Dashboard'
                  ? '⌂'
                  : item.label === 'Students'
                    ? '👥'
                    : item.label === 'Student Dashboard'
                      ? '⌂'
                    : item.label === 'Add Student'
                      ? '+'
                      : item.label === 'Predictions'
                        ? '📈'
                        : item.label === 'Model Training'
                          ? '⚙'
                          : item.label === 'Evaluation'
                            ? '✓'
                            : '👤'}
              </span>
              {item.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-rose-300 transition duration-300 hover:bg-white/10"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20">↩</span>
            Logout
          </button>
        </nav>

        <div className="border-t border-white/10 p-4 text-xs text-slate-400">
          Static UI only. No backend integration.
        </div>
      </aside>
    </>
  )
}

export default Sidebar
