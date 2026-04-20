'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import Evaluation from '@/legacy/pages/Evaluation'

export default function EvaluationRoutePage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ProtectedShell>
        <Evaluation />
      </ProtectedShell>
    </AuthGuard>
  )
}
