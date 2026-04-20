'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import AdminSendAssessment from '@/legacy/pages/AdminSendAssessment'

export default function AdminSendAssessmentRoutePage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ProtectedShell>
        <AdminSendAssessment />
      </ProtectedShell>
    </AuthGuard>
  )
}
