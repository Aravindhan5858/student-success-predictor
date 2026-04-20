'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import AdminInterviews from '@/legacy/pages/AdminInterviews'

export default function AdminInterviewsRoutePage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ProtectedShell>
        <AdminInterviews />
      </ProtectedShell>
    </AuthGuard>
  )
}
