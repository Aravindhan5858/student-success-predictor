'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import AdminAssessmentRequests from '@/legacy/pages/AdminAssessmentRequests'

export default function AdminAssessmentRequestsRoutePage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ProtectedShell>
        <AdminAssessmentRequests />
      </ProtectedShell>
    </AuthGuard>
  )
}
