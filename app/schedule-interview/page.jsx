'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import ScheduleInterview from '@/legacy/pages/ScheduleInterview'

export default function ScheduleInterviewRoutePage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ProtectedShell>
        <ScheduleInterview />
      </ProtectedShell>
    </AuthGuard>
  )
}
