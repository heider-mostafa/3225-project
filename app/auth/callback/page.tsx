'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/config'
import { useTranslation } from 'react-i18next'

export default function AuthCallbackPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'

  useEffect(() => {
    const handleCallback = async () => {
      console.log('🔄 Auth callback starting...')
      
      // Check if we have a session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      console.log('🔄 Session check:', { 
        hasSession: !!session, 
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        error: sessionError?.message 
      })
      
      if (session?.user) {
        try {
          console.log('🔄 Checking user roles for:', session.user.id)
          
          // Check user role via API to avoid RLS issues
          const response = await fetch(`/api/user_roles?user_id=${session.user.id}`)
          
          console.log('🔄 User roles API response:', { status: response.status, ok: response.ok })
          
          if (response.ok) {
            const { user_roles } = await response.json()
            console.log('🔄 User roles:', user_roles)
            
            const isAppraiser = user_roles?.some((ur: any) => ur.role === 'appraiser' && ur.is_active)
            console.log('🔄 Is appraiser:', isAppraiser)
            
            if (isAppraiser) {
              console.log('🔄 Checking appraiser status...')
              
              // Check appraiser status via API
              const appraiserResponse = await fetch(`/api/appraisers?user_id=${session.user.id}`)
              
              console.log('🔄 Appraisers API response:', { status: appraiserResponse.status, ok: appraiserResponse.ok })
              
              if (appraiserResponse.ok) {
                const { appraisers } = await appraiserResponse.json()
                const broker = appraisers?.[0]
                
                console.log('🔄 Broker record:', { id: broker?.id, valify_status: broker?.valify_status })

                if (broker && (!broker.valify_status || broker.valify_status === 'pending' || broker.valify_status === 'in_progress' || broker.valify_status === 'failed')) {
                  console.log('🔄 Redirecting to verification:', `/appraiser/verify/${broker.id}`)
                  router.push(`/appraiser/verify/${broker.id}`)
                  return
                } else if (broker && broker.valify_status === 'verified') {
                  console.log('🔄 Redirecting to dashboard:', `/appraiser/${broker.id}/dashboard`)
                  router.push(`/appraiser/${broker.id}/dashboard`)
                  return
                } else if (!broker) {
                  console.error('🔄 No broker record found for appraiser')
                  router.push('/auth?error=profile_setup_incomplete')
                  return
                }
              } else {
                console.error('🔄 Appraisers API failed:', await appraiserResponse.text())
              }
            }
          } else {
            console.error('🔄 User roles API failed:', await response.text())
          }
        } catch (error) {
          console.error('🔄 Error in callback:', error)
        }

        console.log('🔄 Normal redirect to:', redirectTo)
        router.push(redirectTo)
      } else {
        console.log('🔄 No session, redirecting to auth')
        router.push('/auth')
      }
    }

    handleCallback()
  }, [redirectTo, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">{t('auth.completingSignIn')}</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  )
} 