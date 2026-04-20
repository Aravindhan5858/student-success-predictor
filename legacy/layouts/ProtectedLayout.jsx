import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'

function ProtectedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isRouteLoading, setIsRouteLoading] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const navigationTimeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
      }
    }
  }, [])

  const handleDelayedNavigation = (targetPath) => {
    if (!targetPath) {
      return
    }

    const currentPath = `${location.pathname}${location.search}${location.hash}`
    if (targetPath === currentPath) {
      setSidebarOpen(false)
      return
    }

    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current)
    }

    setSidebarOpen(false)
    setIsRouteLoading(true)

    navigationTimeoutRef.current = setTimeout(() => {
      navigate(targetPath)
      setTimeout(() => {
        setIsRouteLoading(false)
      }, 120)
      navigationTimeoutRef.current = null
    }, 1000)
  }

  const handleInternalLinkCapture = (event) => {
    if (isRouteLoading || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return
    }

    const anchor = event.target.closest('a[href]')
    if (!anchor) {
      return
    }

    if (anchor.target === '_blank' || anchor.hasAttribute('download')) {
      return
    }

    const destinationUrl = new URL(anchor.href, window.location.origin)
    if (destinationUrl.origin !== window.location.origin) {
      return
    }

    const targetPath = `${destinationUrl.pathname}${destinationUrl.search}${destinationUrl.hash}`
    const currentPath = `${location.pathname}${location.search}${location.hash}`

    if (targetPath === currentPath) {
      return
    }

    event.preventDefault()
    handleDelayedNavigation(targetPath)
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-[#0b0f1a] via-[#1a0f2e] to-[#0b0f1a] text-white" onClickCapture={handleInternalLinkCapture}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-dvh md:pl-72">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main key={location.pathname} className="page-transition h-[calc(100dvh-65px)] overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {isRouteLoading ? (
        <div className="route-loader-overlay" role="status" aria-live="polite" aria-label="Loading next page">
          <div className="route-loader-orbit" aria-hidden="true">
            <span className="route-loader-ring route-loader-ring--one" />
            <span className="route-loader-ring route-loader-ring--two" />
            <span className="route-loader-ring route-loader-ring--three" />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default ProtectedLayout
