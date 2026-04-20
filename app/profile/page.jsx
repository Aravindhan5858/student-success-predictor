'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import Profile from '@/legacy/pages/Profile'

export default function ProfileRoutePage() {
  return (
    <AuthGuard>
      <ProtectedShell>
        <Profile />
      </ProtectedShell>
    </AuthGuard>
  )
}
