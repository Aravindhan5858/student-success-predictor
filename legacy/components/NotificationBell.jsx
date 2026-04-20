import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const STORAGE_PREFIX = 'sps_seen_notifications'
const ACTIVE_STATUSES = new Set(['Requested', 'Pending'])

function getStorageKey(user) {
  if (!user?.username) {
    return `${STORAGE_PREFIX}_guest`
  }

  return `${STORAGE_PREFIX}_${user.role || 'user'}_${user.username}`
}

function readSeenIds(key) {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? parsed.map((value) => String(value)) : [])
  } catch {
    return new Set()
  }
}

function writeSeenIds(key, ids) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(ids)))
  } catch {
    // ignore storage failures
  }
}

function getRequestTarget(request, role) {
  const isAdmin = role === 'admin'

  if (request?.type === 'assessment') {
    return isAdmin ? '/admin/assessment-requests' : '/student/assessments'
  }

  return isAdmin ? '/admin/interview-requests' : '/student/interviews'
}

function getRequestTitle(request) {
  if (request?.type === 'assessment') {
    return request.assessmentTitle || request.title || 'Assessment request'
  }

  return request.meetingLink ? 'Interview request' : request.title || 'Interview request'
}

function getRequestDescription(request) {
  const studentName = request.studentName ? `${request.studentName} · ` : ''
  const status = request.status || 'New'
  const dateLabel = request.scheduledDate ? new Date(request.scheduledDate).toLocaleString() : ''
  return `${studentName}${status}${dateLabel ? ` · ${dateLabel}` : ''}`
}

function NotificationBell() {
  const { currentUser, currentStudent, workflowRequests } = useAppContext()
  const [open, setOpen] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const [seenIds, setSeenIds] = useState(() => readSeenIds(getStorageKey(currentUser)))
  const previousUnreadCount = useRef(0)
  const panelRef = useRef(null)

  const visibleRequests = useMemo(() => {
    const relevantRequests = Array.isArray(workflowRequests) ? workflowRequests : []

    return relevantRequests
      .filter((request) => request?.type === 'interview' || request?.type === 'assessment')
      .filter((request) => ACTIVE_STATUSES.has(request?.status))
      .filter((request) => {
        if (currentUser?.role === 'admin') {
          return true
        }

        if (!currentStudent?.id) {
          return false
        }

        return String(request?.studentId) === String(currentStudent.id)
      })
      .sort((a, b) => Number(new Date(b?.createdAt || 0)) - Number(new Date(a?.createdAt || 0)))
  }, [workflowRequests, currentUser?.role, currentStudent?.id])

  const unreadRequests = useMemo(() => {
    return visibleRequests.filter((request) => !seenIds.has(String(request?.id || request?._id)))
  }, [visibleRequests, seenIds])

  useEffect(() => {
    const key = getStorageKey(currentUser)
    const stored = readSeenIds(key)
    setSeenIds(stored)
  }, [currentUser?.username, currentUser?.role])

  useEffect(() => {
    if (!unreadRequests.length) {
      previousUnreadCount.current = 0
      return undefined
    }

    const unreadCount = unreadRequests.length
    if (unreadCount > previousUnreadCount.current) {
      setIsShaking(true)
      const timer = window.setTimeout(() => setIsShaking(false), 1200)
      previousUnreadCount.current = unreadCount
      return () => window.clearTimeout(timer)
    }

    previousUnreadCount.current = unreadCount
    return undefined
  }, [unreadRequests.length])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const markAllAsSeen = () => {
    const key = getStorageKey(currentUser)
    const nextSeen = new Set(seenIds)

    unreadRequests.forEach((request) => {
      nextSeen.add(String(request?.id || request?._id))
    })

    setSeenIds(nextSeen)
    writeSeenIds(key, nextSeen)
  }

  const handleToggle = () => {
    const nextOpen = !open
    setOpen(nextOpen)

    if (nextOpen && unreadRequests.length) {
      markAllAsSeen()
    }
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white shadow-[0_0_12px_rgba(91,140,255,0.24)] transition hover:shadow-[0_0_16px_rgba(255,46,159,0.5)] ${isShaking ? 'notification-shake' : ''}`}
        aria-label="Notifications"
      >
        <span aria-hidden="true">🔔</span>
        {unreadRequests.length > 0 ? (
          <span className="absolute right-0 top-0 inline-flex h-3 w-3 rounded-full border border-[#0b0f1a] bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.75)]" />
        ) : null}
        {unreadRequests.length > 9 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-xs font-semibold text-white">
            {unreadRequests.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 mt-3 w-[22rem] overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a] shadow-[0_22px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Notifications</p>
              <p className="text-xs text-gray-400">New interview and assessment requests</p>
            </div>
            {unreadRequests.length > 0 ? (
              <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                {unreadRequests.length} new
              </span>
            ) : (
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-gray-400">
                All caught up
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {visibleRequests.length ? (
              visibleRequests.map((request) => {
                const requestId = String(request?.id || request?._id)
                return (
                  <Link
                    key={requestId}
                    to={getRequestTarget(request, currentUser?.role)}
                    className={`block border-b border-white/5 px-4 py-3 transition hover:bg-white/5 ${seenIds.has(requestId) ? 'opacity-75' : ''}`}
                    onClick={() => {
                      const nextSeen = new Set(seenIds)
                      nextSeen.add(requestId)
                      setSeenIds(nextSeen)
                      writeSeenIds(getStorageKey(currentUser), nextSeen)
                      setOpen(false)
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${seenIds.has(requestId) ? 'bg-slate-500' : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.75)]'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{getRequestTitle(request)}</p>
                        <p className="mt-1 text-xs text-gray-400">{getRequestDescription(request)}</p>
                      </div>
                    </div>
                  </Link>
                )
              })
            ) : (
              <div className="px-4 py-8 text-center text-sm text-gray-400">No new requests</div>
            )}
          </div>

          <div className="border-t border-white/10 px-4 py-3">
            <button
              type="button"
              onClick={() => {
                markAllAsSeen()
                setOpen(false)
              }}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Mark all as read
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default NotificationBell