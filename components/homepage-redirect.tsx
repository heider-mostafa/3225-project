"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function HomepageRedirect({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/') {
      router.push('/coming-soon')
    }
  }, [pathname, router])

  return <>{children}</>
}