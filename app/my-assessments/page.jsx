'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import MyAssessments from '@/legacy/pages/MyAssessments'

export default function MyAssessmentsRoutePage() {
  return (
    <AuthGuard allowedRoles={['student']}>
      <ProtectedShell>
        <MyAssessments />
      </ProtectedShell>
    </AuthGuard>
  )
}
