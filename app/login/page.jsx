'use client'

import AuthGuard from '@/components/guards/auth-guard'
import Login from '@/legacy/pages/Login'

export default function LoginRoutePage() {
  return (
    <AuthGuard publicOnly>
      <Login />
    </AuthGuard>
  )
}
