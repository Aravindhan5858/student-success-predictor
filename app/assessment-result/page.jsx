'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/guards/auth-guard'

function AssessmentResultRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/student/assessment-result')
  }, [router])

  return null
}

export default function AssessmentResultPage() {
  return (
    <AuthGuard allowedRoles={['student']}>
      <AssessmentResultRedirect />
    </AuthGuard>
  )
}
