'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import MyRequests from '@/legacy/pages/MyRequests'

export default function MyRequestsRoutePage() {
  return (
    <AuthGuard allowedRoles={['student']}>
      <ProtectedShell>
        <MyRequests />
      </ProtectedShell>
    </AuthGuard>
  )
}
