'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShieldX, Home, ArrowLeft } from 'lucide-react'

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <ShieldX className="w-8 h-8 text-red-600" />
          </div>

          {/* Content */}
          <h1 className="text-2xl font-bold text-slate-800 mb-4">
            Access Denied
          </h1>
          <p className="text-slate-600 mb-8">
            You don't have permission to access this page. Admin privileges are required to view this content.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go to Homepage
            </Link>
            
            <button
              onClick={() => router.back()}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>

          {/* Help Text */}
          <p className="text-sm text-slate-400 mt-6">
            If you believe this is an error, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  )
} 