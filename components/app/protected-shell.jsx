'use client'

import { useState } from 'react'
import Navbar from '@/components/app/navbar'
import Sidebar from '@/components/app/sidebar'

export default function ProtectedShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-dvh bg-gradient-to-br from-[#0b0f1a] via-[#1a0f2e] to-[#0b0f1a] text-white">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-dvh md:pl-72">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="page-transition h-[calc(100dvh-65px)] overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
