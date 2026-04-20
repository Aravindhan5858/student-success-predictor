'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import AdminEvaluateAssessment from '@/legacy/pages/AdminEvaluateAssessment'

export default function AdminEvaluateAssessmentRoutePage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ProtectedShell>
        <AdminEvaluateAssessment />
      </ProtectedShell>
    </AuthGuard>
  )
}
