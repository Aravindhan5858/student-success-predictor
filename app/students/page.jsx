'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import Students from '@/legacy/pages/Students'

export default function StudentsRoutePage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ProtectedShell>
        <Students />
      </ProtectedShell>
    </AuthGuard>
  )
}
