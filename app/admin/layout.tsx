'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  Shield,
  Activity,
  UserCheck,
  Camera,
  FileText
} from 'lucide-react'
import { useAuth } from '@/components/providers'
import { getCurrentUserRole, type UserRole } from '@/lib/auth/admin-client'
import { supabase } from '@/lib/supabase/config'

const sidebarItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    permission: null
  },
  {
    name: 'Properties',
    href: '/admin/properties',
    icon: Building2,
    permission: 'properties:read'
  },
  {
    name: 'Brokers',
    href: '/admin/brokers',
    icon: UserCheck,
    permission: 'users:read'
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
    permission: 'users:read'
  },
  {
    name: 'Leads',
    href: '/admin/leads',
    icon: FileText,
    permission: 'inquiries:read'
  },
  {
    name: 'Photographers',
    href: '/admin/photographers',
    icon: Camera,
    permission: 'users:read'
  },
  {
    name: 'Inquiries',
    href: '/admin/inquiries',
    icon: MessageSquare,
    permission: 'inquiries:read'
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    permission: 'analytics:read'
  },
  {
    name: 'Activity Logs',
    href: '/admin/logs',
    icon: Activity,
    permission: 'system:logs'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    permission: 'system:settings'
  }
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userRole, setUserRole] = useState<UserRole>('user')
  const [adminLoading, setAdminLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    const checkAdminAccess = async () => {
      // Wait for auth context to load
      if (authLoading) {
        return
      }
      
      if (!user) {
        router.push('/auth?redirectTo=' + pathname)
        return
      }

      try {
        const role = await getCurrentUserRole()
        setUserRole(role)
        
        if (role === 'user') {
          router.push('/unauthorized')
          return
        }
      } catch (error) {
        console.error('Error checking admin access:', error)
        router.push('/unauthorized')
        return
      } finally {
        setAdminLoading(false)
      }
    }

    checkAdminAccess()
  }, [user, authLoading, router, pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-200 ease-in-out lg:translate-x-0 lg:relative lg:transform-none`}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-800">Admin</span>
          </div>
          
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email}
              </p>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(userRole)}`}>
                  {userRole === 'super_admin' ? 'Super Admin' : 
                   userRole === 'admin' ? 'Admin' : 'User'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || (
              item.href !== '/admin' && pathname.startsWith(item.href)
            )
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={`mr-3 h-5 w-5 ${
                  isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-md flex items-center justify-center">
                <Shield className="w-3 h-3 text-white" />
              </div>
              <span className="font-semibold text-gray-800">Admin Panel</span>
            </div>
            
            <div className="w-10" /> {/* Spacer for balance */}
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
} 