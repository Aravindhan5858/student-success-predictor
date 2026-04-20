'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import Dashboard from '@/legacy/pages/Dashboard'

export default function DashboardRoutePage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ProtectedShell>
        <Dashboard />
      </ProtectedShell>
    </AuthGuard>
  )
}
