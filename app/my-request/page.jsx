'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/guards/auth-guard'

function MyRequestRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/my-requests')
  }, [router])

  return null
}

export default function MyRequestPage() {
  return (
    <AuthGuard allowedRoles={['student']}>
      <MyRequestRedirect />
    </AuthGuard>
  )
}
