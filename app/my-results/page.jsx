'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import MyResults from '@/legacy/pages/MyResults'

export default function MyResultsRoutePage() {
  return (
    <AuthGuard allowedRoles={['student']}>
      <ProtectedShell>
        <MyResults />
      </ProtectedShell>
    </AuthGuard>
  )
}
