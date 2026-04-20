'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import StudentDashboard from '@/legacy/pages/StudentDashboard'

export default function StudentDashboardRoutePage() {
  return (
    <AuthGuard>
      <ProtectedShell>
        <StudentDashboard />
      </ProtectedShell>
    </AuthGuard>
  )
}
