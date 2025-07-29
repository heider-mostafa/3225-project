"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function HomepageRedirect({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Redirect all pages to coming-soon except the coming-soon page itself
    if (pathname !== '/coming-soon' && !pathname.startsWith('/coming-soon')) {
      router.push('/coming-soon')
    }
  }, [pathname, router])

  return <>{children}</>
}