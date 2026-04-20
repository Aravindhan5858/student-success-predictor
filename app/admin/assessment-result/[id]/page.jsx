'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import AdminAssessmentResult from '@/legacy/pages/AdminAssessmentResult'

export default function AdminAssessmentResultRoutePage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ProtectedShell>
        <AdminAssessmentResult />
      </ProtectedShell>
    </AuthGuard>
  )
}
