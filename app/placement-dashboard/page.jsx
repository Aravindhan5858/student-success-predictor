'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import PlacementDashboard from '@/legacy/pages/PlacementDashboard'

export default function PlacementDashboardRoutePage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ProtectedShell>
        <PlacementDashboard />
      </ProtectedShell>
    </AuthGuard>
  )
}
