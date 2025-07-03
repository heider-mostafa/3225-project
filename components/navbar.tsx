// components/navbar.tsx
"use client"
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/config'
import { useAuth } from '@/components/providers'
import { getCurrentUserRole, type UserRole } from '@/lib/auth/admin-client'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/ui/language-switcher'

export default function Navbar() {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const [userRole, setUserRole] = useState<UserRole>('user')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        const role = await getCurrentUserRole()
        setUserRole(role)
      } else {
        setUserRole('user')
      }
    }

    checkUserRole()
  }, [user])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const isAdmin = userRole === 'admin' || userRole === 'super_admin'

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
            <span className="text-xl font-bold text-slate-800">VirtualEstate</span>
          </Link>
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              href="/properties" 
              className={`transition-colors ${
                pathname === '/properties' 
                  ? 'text-blue-600 font-medium' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {isMounted ? t('nav.properties') : 'Properties'}
            </Link>
            <Link 
              href="/virtual-tours" 
              className={`transition-colors ${
                pathname === '/virtual-tours' 
                  ? 'text-blue-600 font-medium' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {isMounted ? t('nav.virtualTours') : 'Virtual Tours'}
            </Link>
            <Link 
              href="/about" 
              className={`transition-colors ${
                pathname === '/about' 
                  ? 'text-blue-600 font-medium' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {isMounted ? t('nav.about') : 'About'}
            </Link>
            
            {/* Admin Access for Admin Users */}
            {isAdmin && (
              <Link 
                href="/admin" 
                className={`flex items-center space-x-1 transition-colors ${
                  pathname.startsWith('/admin') 
                    ? 'text-purple-600 font-medium' 
                    : 'text-slate-600 hover:text-purple-600'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>{isMounted ? t('nav.admin') : 'Admin'}</span>
              </Link>
            )}
            
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            <Link href="/contact">
              <Button variant={pathname === '/contact' ? 'default' : 'outline'}>
                {isMounted ? t('nav.contact') : 'Contact'}
              </Button>
            </Link>
            {user ? (
              <>
                <Link href="/profile" className="text-slate-600 hover:text-slate-800 transition-colors">
                  {isMounted ? t('nav.profile') : 'Profile'}
                </Link>
                <button onClick={handleSignOut} className="text-red-600 hover:text-red-700 transition-colors font-medium">
                  {isMounted ? t('nav.signOut') : 'Sign Out'}
                </button>
              </>
            ) : (
              <Link href="/auth">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isMounted ? t('nav.signIn') : 'Sign In'}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}