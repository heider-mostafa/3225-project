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
  const [userAppraiserData, setUserAppraiserData] = useState<any>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Scroll detection for logo animation
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 100
      setIsScrolled(scrolled)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        const role = await getCurrentUserRole()
        setUserRole(role)
        
        // If user is an appraiser, fetch their appraiser data for dashboard link
        if (role === 'appraiser') {
          try {
            const response = await fetch('/api/appraisers')
            if (response.ok) {
              const data = await response.json()
              const userAppraiser = data.appraisers?.find((appraiser: any) => appraiser.user_id === user.id)
              setUserAppraiserData(userAppraiser)
            }
          } catch (error) {
            console.error('Failed to fetch appraiser data:', error)
          }
        }
      } else {
        setUserRole('user')
        setUserAppraiserData(null)
      }
    }

    checkUserRole()
  }, [user])

  // Enhanced prefetching for critical routes
  useEffect(() => {
    const prefetchCriticalRoutes = () => {
      const criticalRoutes = [
        '/properties',
        '/virtual-tours', 
        '/about',
        '/find-appraisers'
      ]
      
      // Prefetch routes after initial load to improve navigation speed
      criticalRoutes.forEach(route => {
        router.prefetch(route)
      })
      
      // Role-based prefetching
      if (user) {
        if (userRole === 'admin' || userRole === 'super_admin') {
          router.prefetch('/admin')
        } else if (userRole === 'appraiser') {
          router.prefetch('/appraiser')
        } else if (userRole === 'broker') {
          router.prefetch('/broker/dashboard')
        } else if (userRole === 'photographer') {
          router.prefetch('/photographer')
        }
        
        // Common authenticated routes
        router.prefetch('/profile')
        router.prefetch('/saved')
      } else {
        // Unauthenticated user routes
        router.prefetch('/auth')
      }
    }
    
    // Delay prefetching to not interfere with initial page load
    const timeoutId = setTimeout(prefetchCriticalRoutes, 1000)
    
    return () => clearTimeout(timeoutId)
  }, [router, user, userRole])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const isAdmin = userRole === 'admin' || userRole === 'super_admin'
  const isComingSoonPage = pathname === '/coming-soon'

  return (
    <nav 
      className={`sticky top-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-xl border-b border-slate-300 shadow-lg' 
          : 'bg-white/80 backdrop-blur-md border-b border-slate-200'
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Animated Logo */}
          <Link href="/" className="flex items-center space-x-3 overflow-hidden">
            <motion.svg 
              width="40" 
              height="40" 
              viewBox="0 0 64 64" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-10 h-10 flex-shrink-0"
              animate={{ 
                scale: isScrolled ? 1.1 : 1 
              }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <rect x="12" y="8" width="28" height="48" stroke="currentColor" strokeWidth="4"/>
              <polygon points="12,8 36,20 36,52 12,56" fill="currentColor"/>
              <circle cx="28" cy="32" r="2.5" fill="white"/>
            </motion.svg>
            
            {/* Animated Text */}
            <div className="relative overflow-hidden">
              <AnimatePresence mode="wait">
                {!isScrolled ? (
                  // Full text when not scrolled
                  <motion.span
                    key="full"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ 
                      opacity: 0, 
                      x: -60,
                      transition: { 
                        duration: 0.6,
                        staggerChildren: 0.04,
                        staggerDirection: 1
                      }
                    }}
                    className="text-2xl font-black text-slate-800 font-montserrat tracking-tight flex"
                  >
                    {/* Animate each letter escaping through the door */}
                    {["O", "p", "e", "n", "B", "e", "i", "t"].map((letter, index) => (
                      <motion.span
                        key={`full-${index}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ 
                          opacity: 0, 
                          x: -45, // All letters escape left through the door
                          y: 0,
                          scale: 0.7,
                          transition: { 
                            duration: 0.4,
                            delay: index * 0.04, // Staggered escape
                            ease: "easeInOut"
                          }
                        }}
                        transition={{ 
                          duration: 0.4, 
                          delay: index * 0.05,
                          ease: "easeOut"
                        }}
                      >
                        {letter}
                      </motion.span>
                    ))}
                  </motion.span>
                ) : (
                  // Empty space when scrolled (just the door icon)
                  <motion.span
                    key="logo-only"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ 
                      duration: 0.3,
                      delay: 0.4 // After letters finish escaping
                    }}
                    className="text-2xl font-black font-montserrat tracking-tight text-transparent"
                  >
                    {/* Invisible placeholder to maintain layout */}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {!isComingSoonPage && (
              <>
                <Link 
                  href="/properties" 
                  className="text-slate-600 hover:text-slate-800 transition-colors"
                >
                  {isMounted ? t('nav.properties') : 'Properties'}
                </Link>
                <Link 
                  href="/virtual-tours" 
                  className="text-slate-600 hover:text-slate-800 transition-colors"
                >
                  {isMounted ? t('nav.virtualTours') : 'Virtual Tours'}
                </Link>
                <Link 
                  href="/about" 
                  className="text-slate-600 hover:text-slate-800 transition-colors"
                >
                  {isMounted ? t('nav.about') : 'About'}
                </Link>
                <Link 
                  href="/find-appraisers" 
                  className="text-slate-600 hover:text-slate-800 transition-colors"
                >
                  {isMounted ? t('nav.appraisers') : 'Find Appraisers'}
                </Link>
                {/* Temporarily hidden Market Intelligence
                <Link 
                  href="/market-intelligence" 
                  className="text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Market Intelligence
                </Link>
                */}
                <Link 
                  href="/rentals" 
                  className="text-slate-600 hover:text-slate-800 transition-colors"
                >
                  {isMounted ? t('nav.rentals') : 'Rentals'}
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
                
                <Link href="/contact">
                  <Button variant="outline">
                    {isMounted ? t('nav.contact') : 'Contact'}
                  </Button>
                </Link>
                {user ? (
                  <>
                    {/* Role-based navigation */}
                    {userRole === 'appraiser' && userAppraiserData && (
                      <Link 
                        href={`/appraiser/${userAppraiserData.id}/dashboard`} 
                        className={`text-slate-600 hover:text-slate-800 transition-colors ${
                          pathname.startsWith('/appraiser') ? 'text-purple-600 font-medium' : ''
                        }`}
                      >
                        Appraiser Dashboard
                      </Link>
                    )}
                    {userRole === 'broker' && (
                      <Link 
                        href="/broker/dashboard" 
                        className={`text-slate-600 hover:text-slate-800 transition-colors ${
                          pathname.startsWith('/broker') ? 'text-green-600 font-medium' : ''
                        }`}
                      >
                        Dashboard
                      </Link>
                    )}
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
              </>
            )}
            
            {/* Language Switcher - Always visible */}
            <LanguageSwitcher />
          </div>

          {/* Mobile Navigation - Language Switcher + Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Language Switcher for Mobile */}
            <LanguageSwitcher />
            
            {/* Mobile Menu Button - Hidden on coming soon page */}
            {!isComingSoonPage && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors z-50 relative"
                aria-label="Toggle mobile menu"
                style={{ touchAction: 'manipulation' }}
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
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && !isComingSoonPage && (
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
                    className="text-lg text-slate-700 hover:text-blue-600 transition-colors"
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
                    className="text-lg text-slate-700 hover:text-blue-600 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {isMounted ? t('nav.virtualTours') : 'Virtual Tours'}
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.35 }}
                >
                  <Link 
                    href="/about" 
                    className="text-lg text-slate-700 hover:text-blue-600 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {isMounted ? t('nav.about') : 'About'}
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.38 }}
                >
                  <Link 
                    href="/find-appraisers" 
                    className="text-lg text-slate-700 hover:text-blue-600 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {isMounted ? t('nav.appraisers') : 'Find Appraisers'}
                  </Link>
                </motion.div>

                {/* Temporarily hidden Market Intelligence
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.385 }}
                >
                  <Link 
                    href="/market-intelligence" 
                    className="text-lg text-slate-700 hover:text-blue-600 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Market Intelligence
                  </Link>
                </motion.div>
                */}

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.395 }}
                >
                  <Link 
                    href="/rentals" 
                    className="text-lg text-slate-700 hover:text-blue-600 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {isMounted ? t('nav.rentals') : 'Rentals'}
                  </Link>
                </motion.div>
                
                {/* Admin Access for Admin Users */}
                {isAdmin && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
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
                  transition={{ duration: 0.3, delay: 0.45 }}
                >
                  <Link 
                    href="/contact" 
                    className="text-lg text-slate-700 hover:text-blue-600 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {isMounted ? t('nav.contact') : 'Contact'}
                  </Link>
                </motion.div>

                {/* Authentication Links */}
                <motion.div 
                  className="border-t border-slate-200 pt-4 space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.55 }}
                >
                  {user ? (
                    <>
                      {/* Role-based mobile navigation */}
                      {userRole === 'appraiser' && userAppraiserData && (
                        <Link 
                          href={`/appraiser/${userAppraiserData.id}/dashboard`} 
                          className={`block text-lg transition-colors ${
                            pathname.startsWith('/appraiser') ? 'text-purple-600 font-medium' : 'text-slate-700 hover:text-purple-600'
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Appraiser Dashboard
                        </Link>
                      )}
                      {userRole === 'broker' && (
                        <Link 
                          href="/broker/dashboard" 
                          className={`block text-lg transition-colors ${
                            pathname.startsWith('/broker') ? 'text-green-600 font-medium' : 'text-slate-700 hover:text-green-600'
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Broker Dashboard
                        </Link>
                      )}
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