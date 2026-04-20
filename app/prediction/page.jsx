'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import Prediction from '@/legacy/pages/Prediction'

export default function PredictionRoutePage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ProtectedShell>
        <Prediction />
      </ProtectedShell>
    </AuthGuard>
  )
}
