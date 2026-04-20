'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import AddStudent from '@/legacy/pages/AddStudent'

export default function AddStudentRoutePage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ProtectedShell>
        <AddStudent />
      </ProtectedShell>
    </AuthGuard>
  )
}
