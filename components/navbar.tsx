// components/navbar.tsx
"use client"
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Menu, X } from 'lucide-react'
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
              <rect x="12" y="8" width="28" height="48" stroke="currentColor" strokeWidth="4"/>
              <polygon points="12,8 36,20 36,52 12,56" fill="currentColor"/>
              <circle cx="28" cy="32" r="2.5" fill="white"/>
            </svg>
            <span className="text-2xl font-black text-slate-800 font-montserrat tracking-tight">OpenBeit</span>
          </Link>

          {/* Desktop Navigation */}
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors z-50 relative"
            aria-label="Toggle mobile menu"
          >
            <motion.div
              animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-700" />
              ) : (
                <Menu className="w-6 h-6 text-slate-700" />
              )}
            </motion.div>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              className="md:hidden mt-4 pb-4 border-t border-slate-200 overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <motion.div 
                className="flex flex-col space-y-4 pt-4"
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Link 
                    href="/properties" 
                    className={`text-lg transition-colors ${
                      pathname === '/properties' 
                        ? 'text-blue-600 font-medium' 
                        : 'text-slate-700 hover:text-blue-600'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {isMounted ? t('nav.properties') : 'Properties'}
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <Link 
                    href="/virtual-tours" 
                    className={`text-lg transition-colors ${
                      pathname === '/virtual-tours' 
                        ? 'text-blue-600 font-medium' 
                        : 'text-slate-700 hover:text-blue-600'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {isMounted ? t('nav.virtualTours') : 'Virtual Tours'}
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <Link 
                    href="/about" 
                    className={`text-lg transition-colors ${
                      pathname === '/about' 
                        ? 'text-blue-600 font-medium' 
                        : 'text-slate-700 hover:text-blue-600'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {isMounted ? t('nav.about') : 'About'}
                  </Link>
                </motion.div>
                
                {/* Admin Access for Admin Users */}
                {isAdmin && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                  >
                    <Link 
                      href="/admin" 
                      className={`flex items-center space-x-2 text-lg transition-colors ${
                        pathname.startsWith('/admin') 
                          ? 'text-purple-600 font-medium' 
                          : 'text-slate-700 hover:text-purple-600'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Shield className="w-5 h-5" />
                      <span>{isMounted ? t('nav.admin') : 'Admin'}</span>
                    </Link>
                  </motion.div>
                )}
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                >
                  <Link 
                    href="/contact" 
                    className={`text-lg transition-colors ${
                      pathname === '/contact' 
                        ? 'text-blue-600 font-medium' 
                        : 'text-slate-700 hover:text-blue-600'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {isMounted ? t('nav.contact') : 'Contact'}
                  </Link>
                </motion.div>

                {/* Language Switcher */}
                <motion.div 
                  className="py-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.7 }}
                >
                  <LanguageSwitcher />
                </motion.div>

                {/* Authentication Links */}
                <motion.div 
                  className="border-t border-slate-200 pt-4 space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.8 }}
                >
                  {user ? (
                    <>
                      <Link 
                        href="/profile" 
                        className="block text-lg text-slate-700 hover:text-blue-600 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {isMounted ? t('nav.profile') : 'Profile'}
                      </Link>
                      <button 
                        onClick={() => {
                          handleSignOut()
                          setIsMobileMenuOpen(false)
                        }} 
                        className="block text-lg text-red-600 hover:text-red-700 transition-colors font-medium w-full text-left"
                      >
                        {isMounted ? t('nav.signOut') : 'Sign Out'}
                      </button>
                    </>
                  ) : (
                    <Link 
                      href="/auth" 
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                        {isMounted ? t('nav.signIn') : 'Sign In'}
                      </Button>
                    </Link>
                  )}
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}