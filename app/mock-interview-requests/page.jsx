'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import MockInterviewRequests from '@/legacy/pages/MockInterviewRequests'

export default function MockInterviewRequestsRoutePage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ProtectedShell>
        <MockInterviewRequests />
      </ProtectedShell>
    </AuthGuard>
  )
}
