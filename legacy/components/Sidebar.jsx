import { NavLink } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const adminNavItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Placement', to: '/placement-dashboard' },
  { label: 'Interview Requests', to: '/admin/interviews' },
  { label: 'Schedule Interview', to: '/admin/schedule-interview' },
  { label: 'Create Assessment', to: '/admin/create-assessment' },
  { label: 'Assessment Requests', to: '/admin/assessment-requests' },
  { label: 'Students', to: '/students' },
  { label: 'Add Student', to: '/add-student' },
  { label: 'Predictions', to: '/prediction' },
  { label: 'Model Training', to: '/model-training' },
  { label: 'Evaluation', to: '/evaluation' },
]

const studentNavItems = [
  { label: 'Student Dashboard', to: '/student-dashboard' },
  { label: 'My Details', to: '/student-dashboard' },
  { label: 'Interview Requests', to: '/student/interviews' },
  { label: 'Assessment Requests', to: '/student/assessments' },
  { label: 'Result', to: '/student/results' },
]

function Sidebar({ open, onClose }) {
  const { currentUser, currentStudent } = useAppContext()

  const navItems =
    currentUser?.role === 'admin'
      ? adminNavItems
      : [
          studentNavItems[0],
          ...(currentStudent ? [{ label: 'My Details', to: `/student/${currentStudent.id}` }] : []),
          studentNavItems[2],
          studentNavItems[3],
          studentNavItems[4],
        ]

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/40 transition-opacity md:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[86vw] max-w-72 transform border-r border-white/10 bg-[#0b0f1a]/85 text-white shadow-[0_0_30px_rgba(255,46,159,0.2)] backdrop-blur-xl transition-transform duration-300 md:w-72 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} md:flex md:flex-col`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-pink-300 drop-shadow-[0_0_10px_rgba(255,46,159,0.6)]">SSPS</p>
            <h2 className="mt-1 text-lg font-semibold">Student Portal</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:shadow-[0_0_12px_rgba(255,46,159,0.45)] md:hidden"
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition duration-300 hover:bg-white/10 hover:scale-[1.02] ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_0_20px_rgba(255,46,159,0.45)]'
                    : 'text-gray-300'
                }`
              }
            >
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                  item.label === 'Logout'
                    ? 'bg-pink-500/20 shadow-[0_0_10px_rgba(255,46,159,0.5)]'
                    : 'bg-white/10 shadow-[0_0_12px_rgba(91,140,255,0.38)]'
                }`}
              >
                {item.label === 'Dashboard'
                  ? '⌂'
                  : item.label === 'Placement'
                    ? '🏢'
                    : item.label === 'Schedule Interview'
                      ? '🗓'
                      : item.label === 'Interviews'
                        ? '📝'
                    : item.label === 'Interview Requests'
                      ? '📩'
                    : item.label === 'Create Assessment'
                      ? '✍'
                    : item.label === 'Send Assessment'
                      ? '📨'
                    : item.label === 'Assessment Requests'
                      ? '🧾'
                    : item.label === 'Assessments'
                      ? '📚'
                    : item.label === 'Request Interview'
                      ? '🎤'
                  : item.label === 'Students'
                    ? '👥'
                    : item.label === 'Student Dashboard'
                      ? '⌂'
                    : item.label === 'Interview Requests'
                      ? '📅'
                    : item.label === 'Assessment Requests'
                      ? '🧪'
                    : item.label === 'Results' || item.label === 'Result'
                      ? '🏁'
                    : item.label === 'Add Student'
                      ? '+'
                      : item.label === 'Predictions'
                        ? '📈'
                        : item.label === 'Model Training'
                          ? '⚙'
                          : item.label === 'Evaluation'
                            ? '✓'
                            : item.label === 'Mock Requests'
                              ? '🗂'
                            : item.label === 'Mock Interview'
                              ? '🎤'
                            : item.label === 'Profile'
                              ? '⚪'
                            : '👤'}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4 text-xs text-gray-400">
          Responsive student analytics workspace.
        </div>
      </aside>
    </>
  )
}

export default Sidebar
