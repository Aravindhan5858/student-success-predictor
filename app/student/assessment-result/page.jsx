'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import StudentAssessmentResult from '@/legacy/pages/StudentAssessmentResult'

export default function StudentAssessmentResultRoutePage() {
  return (
    <AuthGuard allowedRoles={['student']}>
      <ProtectedShell>
        <StudentAssessmentResult />
      </ProtectedShell>
    </AuthGuard>
  )
}
