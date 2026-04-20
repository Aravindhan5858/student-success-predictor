'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import StudentInterviewResult from '@/legacy/pages/StudentInterviewResult'

export default function StudentInterviewResultRoutePage() {
  return (
    <AuthGuard allowedRoles={['student']}>
      <ProtectedShell>
        <StudentInterviewResult />
      </ProtectedShell>
    </AuthGuard>
  )
}
