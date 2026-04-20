'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import AdminInterviewResult from '@/legacy/pages/AdminInterviewResult'

export default function AdminInterviewResultRoutePage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ProtectedShell>
        <AdminInterviewResult />
      </ProtectedShell>
    </AuthGuard>
  )
}
