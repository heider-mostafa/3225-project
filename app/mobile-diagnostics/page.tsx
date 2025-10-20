'use client'

import { useEffect, useState } from 'react'

export default function MobileDiagnosticsPage() {
  const [errors, setErrors] = useState<string[]>([])
  const [supabaseStatus, setSupabaseStatus] = useState<string>('Testing...')
  const [apiStatus, setApiStatus] = useState<string>('Testing...')
  const [memoryInfo, setMemoryInfo] = useState<any>(null)
  const [deviceInfo, setDeviceInfo] = useState<any>(null)

  useEffect(() => {
    // Set device info after component mounts (client-side only)
    setDeviceInfo({
      userAgent: navigator.userAgent,
      screenSize: `${screen.width}x${screen.height}`,
      windowSize: `${window.innerWidth}x${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio,
      connection: (navigator as any).connection?.effectiveType || 'unknown'
    })
    
  }, [])

  useEffect(() => {
    const errorLog: string[] = []
    
    // Capture all JavaScript errors
    const originalError = console.error
    console.error = (...args) => {
      const error = args.join(' ')
      errorLog.push(`ERROR: ${error}`)
      setErrors([...errorLog])
      originalError(...args)
    }

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = `Promise Rejection: ${event.reason?.message || event.reason}`
      errorLog.push(error)
      setErrors([...errorLog])
    })

    // Capture global errors
    window.addEventListener('error', (event) => {
      const error = `Global Error: ${event.message} at ${event.filename}:${event.lineno}`
      errorLog.push(error)
      setErrors([...errorLog])
    })

    // Test Supabase client creation
    try {
      import('@/utils/supabase/client').then(({ createClient }) => {
        try {
          const client = createClient()
          setSupabaseStatus('✅ Supabase client created successfully')
          
          // Test a simple query
          client.from('properties').select('id').limit(1).then(result => {
            if (result.error) {
              setSupabaseStatus(`❌ Supabase query failed: ${result.error.message}`)
            } else {
              setSupabaseStatus('✅ Supabase query successful')
            }
          }).catch(err => {
            setSupabaseStatus(`❌ Supabase query error: ${err.message}`)
          })
        } catch (err: any) {
          setSupabaseStatus(`❌ Supabase client error: ${err.message}`)
        }
      }).catch(err => {
        setSupabaseStatus(`❌ Supabase import error: ${err.message}`)
      })
    } catch (err: any) {
      setSupabaseStatus(`❌ Supabase test error: ${err.message}`)
    }

    // Test API endpoint
    fetch('/api/properties?limit=1')
      .then(response => {
        if (response.ok) {
          return response.json()
        } else {
          throw new Error(`API returned ${response.status}: ${response.statusText}`)
        }
      })
      .then(data => {
        setApiStatus(`✅ API working: ${data.properties?.length || 0} properties`)
      })
      .catch(err => {
        setApiStatus(`❌ API failed: ${err.message}`)
      })

    // Memory info
    if ('memory' in performance) {
      setMemoryInfo({
        used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)
      })
    }

    return () => {
      console.error = originalError
    }
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Mobile Diagnostics</h1>
      
      <div className="space-y-4">
        <div className="bg-white border rounded p-4">
          <h2 className="font-semibold mb-2">Device Info</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded">
            {deviceInfo ? JSON.stringify(deviceInfo, null, 2) : 'Loading device info...'}
          </pre>
        </div>

        <div className="bg-white border rounded p-4">
          <h2 className="font-semibold mb-2">Supabase Status</h2>
          <p className="text-sm">{supabaseStatus}</p>
        </div>

        <div className="bg-white border rounded p-4">
          <h2 className="font-semibold mb-2">API Status</h2>
          <p className="text-sm">{apiStatus}</p>
        </div>

        {memoryInfo && (
          <div className="bg-white border rounded p-4">
            <h2 className="font-semibold mb-2">Memory Usage</h2>
            <p className="text-sm">
              Used: {memoryInfo.used}MB / {memoryInfo.total}MB (Limit: {memoryInfo.limit}MB)
            </p>
          </div>
        )}

        <div className="bg-white border rounded p-4">
          <h2 className="font-semibold mb-2">JavaScript Errors ({errors.length})</h2>
          <div className="text-sm bg-red-50 p-2 rounded max-h-64 overflow-y-auto">
            {errors.length === 0 ? (
              <p>No errors detected yet...</p>
            ) : (
              errors.map((error, index) => (
                <div key={index} className="mb-1 font-mono text-xs">
                  {error}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}