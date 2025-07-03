'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/config'
import { useAuth } from '@/components/providers'

export default function DebugAdminPage() {
  const { user, loading } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [granting, setGranting] = useState(false)
  const [checking, setChecking] = useState(false)

  const checkAdminStatus = async () => {
    if (!user) return
    
    setChecking(true)
    try {
      console.log('🔍 Starting comprehensive admin debug...')
      
      // 1. Check API endpoint
      const apiResponse = await fetch('/api/debug/check-admin')
      const apiResult = await apiResponse.json()
      
      // 2. Direct database checks using client
      console.log('🔍 Checking user_roles table directly...')
      
      // Check if user_roles table exists and is accessible
      const { data: tablesCheck, error: tablesError } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
      
      console.log('📊 User roles table check:', { count: tablesCheck?.length, error: tablesError })
      
      // Check current user's roles directly
      const { data: currentUserRoles, error: currentRolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      console.log('👤 Current user roles:', currentUserRoles, 'Error:', currentRolesError)
      
      // Check if RPC functions work
      const { data: rpcIsAdmin, error: rpcError } = await supabase.rpc('is_admin', { 
        user_id_param: user.id 
      })
      
      console.log('🔧 RPC is_admin result:', rpcIsAdmin, 'Error:', rpcError)
      
      // Check if we can query auth.users (this tests basic permissions)
      const { data: userInfo, error: userError } = await supabase.auth.getUser()
      console.log('🔐 Auth user check:', userInfo?.user?.email, 'Error:', userError)
      
      // Check environment (client-side available vars)
      const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
      const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      console.log('🌍 Environment check:', { hasSupabaseUrl, hasSupabaseKey })
      
      // Compile comprehensive debug info
      const comprehensiveDebug = {
        timestamp: new Date().toISOString(),
        apiEndpoint: {
          response: apiResult,
          status: apiResponse.status,
          ok: apiResponse.ok
        },
        directDatabaseChecks: {
          userRolesTableAccessible: !tablesError,
          userRolesError: tablesError?.message,
          currentUserRoles: currentUserRoles || [],
          currentRolesError: currentRolesError?.message,
          totalUserRoles: currentUserRoles?.length || 0
        },
        rpcFunctions: {
          isAdminWorks: !rpcError,
          isAdminResult: rpcIsAdmin,
          rpcError: rpcError?.message
        },
        authentication: {
          hasUser: !!user,
          userEmail: user.email,
          userId: user.id,
          userCreated: user.created_at,
          authWorking: !userError,
          authError: userError?.message
        },
        environment: {
          hasSupabaseUrl,
          hasSupabaseKey,
          nodeEnv: process.env.NODE_ENV || 'development'
        },
        potentialIssues: [] as string[]
      }
      
      // Identify potential issues
      if (tablesError) {
        comprehensiveDebug.potentialIssues.push('❌ Cannot access user_roles table - RLS policies may be broken')
      }
      
      if (currentUserRoles?.length === 0) {
        comprehensiveDebug.potentialIssues.push('❌ User has no roles in database - roles may have been deleted')
      }
      
      if (currentUserRoles?.some(role => !role.is_active)) {
        comprehensiveDebug.potentialIssues.push('⚠️ User has inactive roles - roles may have been revoked')
      }
      
      if (rpcError) {
        comprehensiveDebug.potentialIssues.push('❌ RPC functions not working - database functions may be missing')
      }
      
      if (!hasSupabaseUrl || !hasSupabaseKey) {
        comprehensiveDebug.potentialIssues.push('❌ Environment variables missing')
      }
      
      if (apiResponse.status !== 200) {
        comprehensiveDebug.potentialIssues.push(`❌ API endpoint returning ${apiResponse.status}`)
      }
      
      setDebugInfo(comprehensiveDebug)
      
    } catch (error) {
      console.error('Error in comprehensive debug:', error)
      setDebugInfo({ 
        error: 'Failed to run comprehensive debug',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    } finally {
      setChecking(false)
    }
  }

  const grantAdminDebug = async (role = 'admin') => {
    setGranting(true)
    try {
      // Use the debug endpoint which works without existing admin privileges
      const response = await fetch('/api/debug/grant-admin', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
      })
      const result = await response.json()
      
      console.log('Grant admin response:', result)
      
      if (result.success || result.message) {
        alert('Success: ' + (result.message || `${role} role granted!`))
        // Wait a moment for the database to update
        setTimeout(async () => {
          await checkAdminStatus()
        }, 1000)
      } else {
        alert('Error: ' + (result.error || 'Unknown error'))
        console.error('Grant error details:', result)
      }
    } catch (error) {
      console.error('Error granting admin:', error)
      alert('Failed to grant admin access: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setGranting(false)
    }
  }

  const directDatabaseFix = async () => {
    if (!user) return
    
    setGranting(true)
    try {
      // Direct database query to add the role
      const { data, error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          role: 'super_admin',
          granted_by: user.id,
          granted_at: new Date().toISOString(),
          is_active: true
        }, {
          onConflict: 'user_id,role'
        })
        .select()

      if (error) {
        console.error('Database error:', error)
        alert('Database error: ' + error.message)
      } else {
        console.log('Direct database insert successful:', data)
        alert('Direct database update successful!')
        await checkAdminStatus()
      }
    } catch (error) {
      console.error('Exception in direct database fix:', error)
      alert('Direct database fix failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setGranting(false)
    }
  }

  const emergencyDatabaseFix = async () => {
    if (!user) return
    
    setGranting(true)
    try {
      console.log('🚨 Emergency database fix starting...')
      
      // Method 1: First try to deactivate all existing roles and create fresh
      console.log('🔧 Step 1: Deactivating any existing roles...')
      await supabase
        .from('user_roles')
        .update({ 
          is_active: false, 
          revoked_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
      
      // Method 2: Insert fresh super_admin role with conflict handling
      console.log('🔧 Step 2: Creating fresh super_admin role...')
      const { data: insertResult, error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'super_admin',
          granted_by: user.id,
          granted_at: new Date().toISOString(),
          is_active: true
        })
        .select()
      
      if (insertError) {
        console.log('🔧 Step 3: Insert failed, trying upsert...')
        // Try upsert approach
        const { data: upsertResult, error: upsertError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: user.id,
            role: 'super_admin',
            granted_by: user.id,
            granted_at: new Date().toISOString(),
            is_active: true
          })
          .select()
        
        if (upsertError) {
          throw new Error(`Both insert and upsert failed: ${upsertError.message}`)
        }
        
        console.log('✅ Emergency fix via upsert successful:', upsertResult)
        alert('Emergency fix successful via upsert!')
      } else {
        console.log('✅ Emergency fix via insert successful:', insertResult)
        alert('Emergency fix successful via insert!')
      }
      
      // Verify the fix worked
      setTimeout(async () => {
        await checkAdminStatus()
      }, 1000)
      
    } catch (error) {
      console.error('❌ Emergency fix failed:', error)
      alert('Emergency fix failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setGranting(false)
    }
  }

  const resetEnvironment = async () => {
    try {
      console.log('🔄 Resetting browser environment...')
      
      // Clear all local storage
      localStorage.clear()
      
      // Clear session storage
      sessionStorage.clear()
      
      // Force refresh the Supabase session
      await supabase.auth.refreshSession()
      
      // Wait a moment then reload
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
      alert('Environment reset! Page will reload in 1 second.')
      
    } catch (error) {
      console.error('❌ Environment reset failed:', error)
      alert('Environment reset failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const debugAndFixCookies = async () => {
    setGranting(true)
    try {
      console.log('🔍 Starting comprehensive cookie debugging...')
      
      // Step 1: Check what cookies we have in the browser
      const allCookies = document.cookie
      console.log('🍪 All browser cookies:', allCookies)
      
      // Step 2: Check specific Supabase cookies
      const supabaseCookies = allCookies.split(';').filter(cookie => 
        cookie.trim().includes('supabase') || 
        cookie.trim().includes('sb-') ||
        cookie.trim().includes('auth')
      )
      console.log('🔐 Supabase-related cookies:', supabaseCookies)
      
      // Step 3: Get session info from Supabase client
      const { data: sessionData } = await supabase.auth.getSession()
      console.log('📱 Client session info:', {
        hasSession: !!sessionData.session,
        accessToken: sessionData.session?.access_token?.substring(0, 20) + '...',
        refreshToken: sessionData.session?.refresh_token?.substring(0, 20) + '...',
        expiresAt: sessionData.session?.expires_at
      })
      
      // Step 4: Try manual cookie setting with explicit options
      if (sessionData.session) {
        console.log('🔧 Manually setting cookies with explicit options...')
        
        // Set cookies manually with all possible options for localhost
        const accessToken = sessionData.session.access_token
        const refreshToken = sessionData.session.refresh_token
        
        // Try multiple cookie formats
        const cookieOptions = [
          `sb-access-token=${accessToken}; path=/; samesite=lax`,
          `sb-refresh-token=${refreshToken}; path=/; samesite=lax`,
          `supabase-auth-token=${accessToken}; path=/; samesite=none`,
          `supabase-access-token=${accessToken}; path=/; domain=localhost; samesite=lax`
        ]
        
        cookieOptions.forEach(cookie => {
          document.cookie = cookie
          console.log('🍪 Set cookie:', cookie.substring(0, 50) + '...')
        })
      }
      
      // Step 5: Wait and test
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Step 6: Test with explicit headers
      console.log('🧪 Testing API with explicit headers...')
      const testWithHeaders = await fetch('/api/debug/check-admin', {
        method: 'GET',
        credentials: 'include', // Force include cookies
        headers: {
          'Content-Type': 'application/json',
          'Cookie': document.cookie, // Explicitly pass cookies
          'Authorization': sessionData.session?.access_token ? `Bearer ${sessionData.session.access_token}` : ''
        }
      })
      
      const headerTestResult = await testWithHeaders.json()
      console.log('📡 API test with explicit headers:', headerTestResult)
      
      if (headerTestResult.authenticated) {
        alert('✅ SUCCESS! Cookie issue fixed with explicit headers.')
        window.location.href = '/admin'
      } else {
        // Step 7: Try the nuclear option - direct API call bypass
        console.log('🚨 Trying direct database approach through client...')
        
        // Create a temporary "admin session" by calling admin APIs directly
        try {
          const directAdminTest = await fetch('/api/admin/grant-superadmin', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionData.session?.access_token}`,
              'Cookie': document.cookie
            }
          })
          
          const directResult = await directAdminTest.json()
          console.log('🎯 Direct admin API result:', directResult)
          
          if (directResult.success || directResult.message) {
            alert('✅ Direct admin API worked! Try accessing admin pages now.')
            window.location.href = '/admin'
          } else {
            alert('❌ Cookie transmission issue persists. Manual intervention needed.')
          }
          
        } catch (directError) {
          console.error('Direct API approach failed:', directError)
          alert('❌ All automatic fixes failed. Try the browser reset or manual logout/login.')
        }
      }
      
    } catch (error) {
      console.error('Cookie debugging failed:', error)
      alert('Cookie debugging failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setGranting(false)
    }
  }

  const testBypassMethod = async () => {
    setGranting(true)
    try {
      console.log('🚀 Testing bypass method with access token...')
      
      // Get session data
      const { data: sessionData } = await supabase.auth.getSession()
      
      if (!sessionData.session?.access_token) {
        throw new Error('No access token available')
      }
      
      console.log('🔑 Using access token for bypass...')
      
      // Test the bypass endpoint
      const bypassResponse = await fetch('/api/debug/bypass-admin-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({
          access_token: sessionData.session.access_token
        })
      })
      
      const bypassResult = await bypassResponse.json()
      console.log('🎯 Bypass result:', bypassResult)
      
      if (bypassResult.success && bypassResult.authenticated) {
        alert('✅ SUCCESS! Bypass method worked. You have admin access!')
        
        // Now try to force the normal admin pages to work
        console.log('🔧 Attempting to access admin page directly...')
        window.location.href = '/admin'
      } else {
        alert('❌ Bypass method failed: ' + (bypassResult.error || 'Unknown error'))
        console.error('Bypass failed:', bypassResult)
      }
      
    } catch (error) {
      console.error('Bypass test failed:', error)
      alert('Bypass test failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setGranting(false)
    }
  }

  const forceSetCookies = async () => {
    setGranting(true)
    try {
      console.log('🍪 Force-setting session cookies...')
      
      const { data: sessionData } = await supabase.auth.getSession()
      
      if (!sessionData.session) {
        throw new Error('No session available')
      }
      
      // Call the force-cookies endpoint
      const response = await fetch('/api/debug/force-cookies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert('✅ Cookies force-set! Try accessing admin pages now.')
        console.log('🎉 Cookies set successfully')
        
        // Test admin access immediately
        setTimeout(() => {
          window.location.href = '/admin'
        }, 1000)
      } else {
        throw new Error(result.error || 'Failed to set cookies')
      }
      
    } catch (error) {
      console.error('Force cookie setting failed:', error)
      alert('Force cookie setting failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setGranting(false)
    }
  }

  // Check status when component mounts and user is available
  useEffect(() => {
    if (user && !loading) {
      checkAdminStatus()
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Not Logged In</h1>
          <p className="mb-4">You need to be logged in to debug admin access.</p>
          <a 
            href="/auth" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-6">Admin Access Debug</h1>
          
          {/* Current User Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Current User</h2>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>Created:</strong> {new Date(user.created_at || '').toLocaleString()}</p>
          </div>

          {/* Actions */}
          <div className="mb-6 space-y-4">
            <div className="space-x-4">
              <button
                onClick={checkAdminStatus}
                disabled={checking}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {checking ? 'Checking...' : 'Check Admin Status'}
              </button>
            </div>
            
            <div className="space-x-4">
              <button
                onClick={() => grantAdminDebug('admin')}
                disabled={granting}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {granting ? 'Granting...' : 'Grant Admin Role (Debug)'}
              </button>
              
              <button
                onClick={() => grantAdminDebug('super_admin')}
                disabled={granting}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {granting ? 'Granting...' : 'Grant Superadmin Role (Debug)'}
              </button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">If the above doesn't work, try direct database approach:</p>
              <button
                onClick={directDatabaseFix}
                disabled={granting}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {granting ? 'Updating...' : 'Direct Database Fix (Superadmin)'}
              </button>
            </div>

            <div className="pt-4 border-t border-red-200">
              <p className="text-sm text-red-600 mb-2 font-medium">🚨 EMERGENCY FIXES (if everything is broken):</p>
              <div className="space-x-2">
                <button
                  onClick={emergencyDatabaseFix}
                  disabled={granting}
                  className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 disabled:opacity-50 text-sm"
                >
                  {granting ? 'Fixing...' : '🚨 Emergency Database Reset'}
                </button>
                
                <button
                  onClick={resetEnvironment}
                  disabled={granting}
                  className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50 text-sm"
                >
                  🔄 Reset Browser Environment
                </button>
              </div>
              <p className="text-xs text-red-500 mt-2">
                ⚠️ Emergency fixes will forcefully restore admin access and may clear your browser data
              </p>
            </div>
          </div>

          {/* Debug Information */}
          {debugInfo && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Debug Information</h2>
              
              {/* Show the key issue if API fails but user has roles */}
              {debugInfo.directDatabaseChecks?.currentUserRoles?.length > 0 && 
               !debugInfo.apiEndpoint?.response?.authenticated && (
                <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded">
                  <h3 className="font-semibold text-yellow-800">🎯 ISSUE IDENTIFIED:</h3>
                  <p className="text-yellow-700 text-sm">
                    You have admin role in database but session cookies aren't reaching the server APIs.
                    This is a cookie transmission issue, not a permissions issue.
                  </p>
                  <div className="space-x-2">
                    <button
                      onClick={debugAndFixCookies}
                      disabled={granting}
                      className="mt-2 bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
                    >
                      {granting ? 'Fixing...' : '🔧 Fix Session Cookies'}
                    </button>
                    
                    <button
                      onClick={testBypassMethod}
                      disabled={granting}
                      className="mt-2 ml-2 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      {granting ? 'Testing...' : '🚀 Test Bypass Method'}
                    </button>
                    
                    <button
                      onClick={forceSetCookies}
                      disabled={granting}
                      className="mt-2 ml-2 bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                    >
                      {granting ? 'Setting...' : '🍪 Force Set Cookies'}
                    </button>
                  </div>
                </div>
              )}
              
              <pre className="text-sm overflow-auto bg-white p-4 rounded border max-h-96">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}

          {/* Environment Info */}
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Environment Info</h2>
            <p><strong>Node ENV:</strong> {process.env.NODE_ENV || 'development'}</p>
            <p className="text-sm text-gray-600 mt-2">
              The debug grant endpoint only works in development mode. 
              The direct database approach uses client-side queries.
            </p>
          </div>

          {/* Quick Links */}
          <div className="mt-6 pt-6 border-t">
            <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
            <div className="space-x-4">
              <a 
                href="/admin" 
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 inline-block"
              >
                Try Admin Dashboard
              </a>
              <a 
                href="/admin/users" 
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 inline-block"
              >
                Try Admin Users
              </a>
              <a 
                href="/" 
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 inline-block"
              >
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 