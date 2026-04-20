'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import MockInterviewContact from '@/legacy/pages/MockInterviewContact'

export default function MockInterviewContactRoutePage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ProtectedShell>
        <MockInterviewContact />
      </ProtectedShell>
    </AuthGuard>
  )
}
