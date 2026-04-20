'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import StudentDetails from '@/legacy/pages/StudentDetails'

export default function StudentDetailsRoutePage() {
  return (
    <AuthGuard>
      <ProtectedShell>
        <StudentDetails />
      </ProtectedShell>
    </AuthGuard>
  )
}
