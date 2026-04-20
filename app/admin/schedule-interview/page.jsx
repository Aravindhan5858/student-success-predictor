'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import AdminScheduleInterview from '@/legacy/pages/AdminScheduleInterview'

export default function AdminScheduleInterviewRoutePage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ProtectedShell>
        <AdminScheduleInterview />
      </ProtectedShell>
    </AuthGuard>
  )
}
