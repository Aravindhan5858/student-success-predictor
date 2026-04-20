'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import EditStudent from '@/legacy/pages/EditStudent'

export default function EditStudentRoutePage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ProtectedShell>
        <EditStudent />
      </ProtectedShell>
    </AuthGuard>
  )
}
