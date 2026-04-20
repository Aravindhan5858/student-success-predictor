'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import AdminInterviewRequests from '@/legacy/pages/AdminInterviewRequests'

export default function AdminInterviewRequestsRoutePage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ProtectedShell>
        <AdminInterviewRequests />
      </ProtectedShell>
    </AuthGuard>
  )
}
