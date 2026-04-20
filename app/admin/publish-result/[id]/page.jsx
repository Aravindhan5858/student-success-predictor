'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import AdminPublishResult from '@/legacy/pages/AdminPublishResult'

export default function AdminPublishResultRoutePage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ProtectedShell>
        <AdminPublishResult />
      </ProtectedShell>
    </AuthGuard>
  )
}
