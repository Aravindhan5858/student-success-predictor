'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import ModelTraining from '@/legacy/pages/ModelTraining'

export default function ModelTrainingRoutePage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ProtectedShell>
        <ModelTraining />
      </ProtectedShell>
    </AuthGuard>
  )
}
