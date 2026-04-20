'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import Assessments from '@/legacy/pages/Assessments'

export default function AssessmentsRoutePage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ProtectedShell>
        <Assessments />
      </ProtectedShell>
    </AuthGuard>
  )
}
