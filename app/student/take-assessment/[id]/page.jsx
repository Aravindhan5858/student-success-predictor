'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import TakeAssessment from '@/legacy/pages/TakeAssessment'

export default function TakeAssessmentRoutePage() {
  return (
    <AuthGuard allowedRoles={['student']}>
      <ProtectedShell>
        <TakeAssessment />
      </ProtectedShell>
    </AuthGuard>
  )
}
