'use client'

import { useCallback, useEffect } from 'react'
import NextLink from 'next/link'
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams,
} from 'next/navigation'

function normalizeTo(to) {
  if (typeof to === 'string') {
    return to
  }

  if (!to || typeof to !== 'object') {
    return '/'
  }

  const pathname = to.pathname || ''
  const search = to.search || ''
  const hash = to.hash || ''
  return `${pathname}${search}${hash}` || '/'
}

function isPathActive(currentPathname, targetPathname, end = false) {
  if (!targetPathname) {
    return currentPathname === '/'
  }

  if (end) {
    return currentPathname === targetPathname
  }

  return currentPathname === targetPathname || currentPathname.startsWith(`${targetPathname}/`)
}

export function BrowserRouter({ children }) {
  return children
}

export function Routes({ children }) {
  return children
}

export function Route() {
  return null
}

export function Outlet({ children }) {
  return children || null
}

export function Link({ to, href, children, ...props }) {
  const target = normalizeTo(to ?? href)
  return (
    <NextLink href={target} {...props}>
      {children}
    </NextLink>
  )
}

export function NavLink({
  to,
  href,
  className,
  style,
  children,
  end = false,
  ...props
}) {
  const pathname = usePathname() || '/'
  const target = normalizeTo(to ?? href)
  const targetPathname = target.split('?')[0].split('#')[0] || '/'
  const isActive = isPathActive(pathname, targetPathname, end)

  const resolvedClassName =
    typeof className === 'function' ? className({ isActive, isPending: false }) : className
  const resolvedStyle = typeof style === 'function' ? style({ isActive, isPending: false }) : style
  const resolvedChildren = typeof children === 'function' ? children({ isActive, isPending: false }) : children

  return (
    <NextLink href={target} className={resolvedClassName} style={resolvedStyle} {...props}>
      {resolvedChildren}
    </NextLink>
  )
}

export function Navigate({ to, replace = false }) {
  const router = useRouter()
  const target = normalizeTo(to)

  useEffect(() => {
    if (replace) {
      router.replace(target)
    } else {
      router.push(target)
    }
  }, [replace, router, target])

  return null
}

export function useNavigate() {
  const router = useRouter()

  return useCallback(
    (to, options = {}) => {
      const target = normalizeTo(to)
      if (options?.replace) {
        router.replace(target)
      } else {
        router.push(target)
      }
    },
    [router],
  )
}

export function useParams() {
  return useNextParams() || {}
}

export function useLocation() {
  const pathname = usePathname() || '/'
  const searchParams = useNextSearchParams()
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : ''
  const hash = typeof window !== 'undefined' ? window.location.hash : ''

  return {
    pathname,
    search,
    hash,
  }
}

export function useSearchParams() {
  const params = useNextSearchParams()
  const pathname = usePathname() || '/'
  const router = useRouter()

  const setSearchParams = useCallback(
    (nextInit, navigateOptions = {}) => {
      let nextString = ''

      if (typeof nextInit === 'string') {
        nextString = nextInit.replace(/^\?/, '')
      } else if (nextInit instanceof URLSearchParams) {
        nextString = nextInit.toString()
      } else if (Array.isArray(nextInit)) {
        nextString = new URLSearchParams(nextInit).toString()
      } else if (nextInit && typeof nextInit === 'object') {
        nextString = new URLSearchParams(nextInit).toString()
      }

      const target = nextString ? `${pathname}?${nextString}` : pathname

      if (navigateOptions?.replace) {
        router.replace(target)
      } else {
        router.push(target)
      }
    },
    [pathname, router],
  )

  return [params, setSearchParams]
}
