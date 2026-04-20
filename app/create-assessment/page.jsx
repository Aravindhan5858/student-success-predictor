'use client'

import ProtectedShell from '@/components/app/protected-shell'
import AuthGuard from '@/components/guards/auth-guard'
import CreateAssessment from '@/legacy/pages/CreateAssessment'

export default function CreateAssessmentRoutePage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ProtectedShell>
        <CreateAssessment />
      </ProtectedShell>
    </AuthGuard>
  )
}
