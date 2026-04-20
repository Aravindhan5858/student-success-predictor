'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import AdminAssessments from '@/legacy/pages/AdminAssessments'

export default function AdminAssessmentsRoutePage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ProtectedShell>
        <AdminAssessments />
      </ProtectedShell>
    </AuthGuard>
  )
}
