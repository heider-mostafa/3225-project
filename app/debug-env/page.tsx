'use client'

export default function DebugEnvPage() {
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Debug</h1>
      <div className="bg-gray-100 p-4 rounded">
        <pre className="text-sm">
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </div>
      <div className="mt-4">
        <h2 className="text-lg font-semibold">All process.env keys starting with NEXT_PUBLIC_:</h2>
        <ul className="list-disc pl-6">
          {Object.keys(process.env)
            .filter(key => key.startsWith('NEXT_PUBLIC_'))
            .map(key => (
              <li key={key} className="text-sm">
                {key}: {process.env[key] ? '✅ Set' : '❌ Missing'}
              </li>
            ))}
        </ul>
      </div>
    </div>
  )
}