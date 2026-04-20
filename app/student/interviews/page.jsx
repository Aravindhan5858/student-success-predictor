'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import StudentInterviews from '@/legacy/pages/StudentInterviews'

export default function StudentInterviewsRoutePage() {
  return (
    <AuthGuard allowedRoles={['student']}>
      <ProtectedShell>
        <StudentInterviews />
      </ProtectedShell>
    </AuthGuard>
  )
}
