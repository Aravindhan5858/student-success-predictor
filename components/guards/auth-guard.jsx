'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAppContext } from '@/legacy/context/AppContext'

export default function AuthGuard({ children, allowedRoles = null, publicOnly = false }) {
  const router = useRouter()
  const pathname = usePathname()
  const { currentUser } = useAppContext()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) {
      return
    }

    if (publicOnly) {
      if (currentUser) {
        router.replace(currentUser.role === 'admin' ? '/dashboard' : '/student-dashboard')
      }
      return
    }

    if (!currentUser) {
      if (pathname !== '/login') {
        router.replace('/login')
      }
      return
    }

    if (Array.isArray(allowedRoles) && allowedRoles.length && !allowedRoles.includes(currentUser.role)) {
      router.replace(currentUser.role === 'student' ? '/student-dashboard' : '/dashboard')
    }
  }, [allowedRoles, currentUser, isMounted, pathname, publicOnly, router])

  if (!isMounted) {
    return null
  }

  if (publicOnly) {
    if (currentUser) {
      return null
    }
    return children
  }

  if (!currentUser) {
    return null
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length && !allowedRoles.includes(currentUser.role)) {
    return null
  }

  return children
}
