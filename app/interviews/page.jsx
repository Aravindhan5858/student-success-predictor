'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import InterviewManagement from '@/legacy/pages/InterviewManagement'

export default function InterviewManagementRoutePage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ProtectedShell>
        <InterviewManagement />
      </ProtectedShell>
    </AuthGuard>
  )
}
