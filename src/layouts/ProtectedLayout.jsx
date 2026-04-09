import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'

function ProtectedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="h-screen overflow-hidden bg-slate-100 text-slate-900">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen md:pl-72">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main key={location.pathname} className="h-[calc(100vh-64px)] overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default ProtectedLayout
