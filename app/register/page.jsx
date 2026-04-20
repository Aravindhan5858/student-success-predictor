'use client'

import AuthGuard from '@/components/guards/auth-guard'
import Register from '@/legacy/pages/Register'

export default function RegisterRoutePage() {
  return (
    <AuthGuard publicOnly>
      <Register />
    </AuthGuard>
  )
}
