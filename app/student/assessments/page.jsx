'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import StudentAssessments from '@/legacy/pages/StudentAssessments'

export default function StudentAssessmentsRoutePage() {
  return (
    <AuthGuard allowedRoles={['student']}>
      <ProtectedShell>
        <StudentAssessments />
      </ProtectedShell>
    </AuthGuard>
  )
}
