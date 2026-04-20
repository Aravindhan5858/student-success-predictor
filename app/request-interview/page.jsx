'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import RequestInterview from '@/legacy/pages/RequestInterview'

export default function RequestInterviewRoutePage() {
  return (
    <AuthGuard allowedRoles={['student']}>
      <ProtectedShell>
        <RequestInterview />
      </ProtectedShell>
    </AuthGuard>
  )
}
