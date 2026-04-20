'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import MyInterviews from '@/legacy/pages/MyInterviews'

export default function MyInterviewsRoutePage() {
  return (
    <AuthGuard allowedRoles={['student']}>
      <ProtectedShell>
        <MyInterviews />
      </ProtectedShell>
    </AuthGuard>
  )
}
