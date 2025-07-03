'use client'
import { useEffect, useState } from 'react'
import { 
  Users, 
  Shield, 
  Edit, 
  Search, 
  Filter, 
  Calendar,
  Mail,
  Crown,
  UserCheck,
  MoreVertical,
  Activity,
  Eye,
  Ban,
  UserPlus,
  Phone,
  MapPin,
  DollarSign,
  Clock,
  Star,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { isCurrentUserAdmin, getCurrentUserRole, grantAdminRole, logAdminActivity, type UserRole } from '@/lib/auth/admin-client'
import { supabase } from '@/lib/supabase/config'

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string
  email_confirmed_at: string
  role: UserRole
  is_active: boolean
  saved_properties_count?: number
  inquiries_count?: number
  last_activity?: string
  lead_intelligence?: {
    overall_engagement?: {
      highest_lead_score?: number
      total_properties_viewed?: number
    }
    last_activity?: string
  }
}

interface Lead {
  id: string
  lead_id: string
  name: string
  email?: string
  whatsapp_number: string
  location: string
  price_range: string
  property_type: string
  timeline: string
  initial_score: number
  final_score?: number
  status: string
  recommendation?: string
  call_completed_at?: string
  call_duration_seconds?: number
  virtual_tour_url?: string
  tour_views: number
  unique_visitors: number
  broker_inquiries: number
  viewing_requests: number
  followup_count: number
  source: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  created_at: string
  updated_at: string
}

interface LeadsStats {
  total: number
  new_leads: number
  qualified: number
  called: number
  booked: number
  completed: number
  avg_initial_score: number
  avg_final_score: number
  today_leads: number
}

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState<'users' | 'leads'>('users')
  
  // Users state
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [authorizationLoading, setAuthorizationLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('user')
  const [roleChangeUser, setRoleChangeUser] = useState<string | null>(null)
  const [newRole, setNewRole] = useState<UserRole>('user')
  
  // Leads state
  const [leads, setLeads] = useState<Lead[]>([])
  const [leadsStats, setLeadsStats] = useState<LeadsStats | null>(null)
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [leadsSearchTerm, setLeadsSearchTerm] = useState('')
  const [leadsStatusFilter, setLeadsStatusFilter] = useState('all')
  const [leadsLocationFilter, setLeadsLocationFilter] = useState('all')
  const [availableLocations, setAvailableLocations] = useState<string[]>([])
  const [leadsPage, setLeadsPage] = useState(1)
  const [leadsPagination, setLeadsPagination] = useState<any>(null)

  // Load leads function
  const loadLeads = async () => {
    if (!authorized) return
    
    try {
      setLeadsLoading(true)
      
      const params = new URLSearchParams({
        page: leadsPage.toString(),
        limit: '20',
        ...(leadsStatusFilter !== 'all' && { status: leadsStatusFilter }),
        ...(leadsLocationFilter !== 'all' && { location: leadsLocationFilter }),
        ...(leadsSearchTerm && { search: leadsSearchTerm }),
        sortBy: 'created_at',
        sortOrder: 'desc'
      })

      const response = await fetch(`/api/admin/leads?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Action': 'load-leads',
          'X-Requested-With': 'XMLHttpRequest'
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Error loading leads:', errorData.error)
        return
      }

      const data = await response.json()
      setLeads(data.leads || [])
      setLeadsStats(data.stats)
      setAvailableLocations(data.locations || [])
      setLeadsPagination(data.pagination)
      
      console.log('✅ Loaded', data.leads?.length || 0, 'leads')
      
    } catch (error) {
      console.error('Error loading leads:', error)
    } finally {
      setLeadsLoading(false)
    }
  }

  // Load leads when filters change
  useEffect(() => {
    if (authorized && activeTab === 'leads') {
      loadLeads()
    }
  }, [authorized, activeTab, leadsPage, leadsStatusFilter, leadsLocationFilter, leadsSearchTerm])

  useEffect(() => {
    const checkAuthorizationAndLoad = async () => {
      try {
        setAuthorizationLoading(true)
        
        // Multi-layered authorization check
        console.log('🔒 Starting authorization verification for users page')
        
        // Check 1: Verify user is logged in
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session) {
          console.error('❌ No valid session found')
          window.location.href = '/auth?redirectTo=/admin/users'
          return
        }
        
        console.log('✅ Session verified for user:', session.user.email)
        
        // Check 2: Verify admin status using client-side function
        const isAdmin = await isCurrentUserAdmin()
        if (!isAdmin) {
          console.error('❌ User is not an admin')
          window.location.href = '/unauthorized'
          return
        }
        
        console.log('✅ Admin status verified')
        
        // Check 3: Double-check with direct database query as additional security
        const { data: userRoles, error: roleError } = await supabase
          .from('user_roles')
          .select('role, is_active')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .in('role', ['admin', 'super_admin'])
        
        if (roleError || !userRoles || userRoles.length === 0) {
          console.error('❌ Failed to verify admin role in database:', roleError)
          window.location.href = '/unauthorized'
          return
        }
        
        console.log('✅ Database role verification passed')
        
        // Check 4: Verify specific permission for user management
        const { data: hasPermission, error: permError } = await supabase.rpc('has_permission', {
          permission_name: 'users:read'
        })
        
        if (permError) {
          console.warn('⚠️ Permission check failed, falling back to role-based access:', permError)
          // Continue with role-based access as fallback
        } else if (!hasPermission) {
          console.error('❌ User does not have users:read permission')
          window.location.href = '/unauthorized'
          return
        }
        
        console.log('✅ Permission verification passed')
        
        // Check 5: Test API access by making a small request
        try {
          const testResponse = await fetch('/api/admin/users?limit=1', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          })
          
          if (!testResponse.ok) {
            console.error('❌ API access test failed:', testResponse.status)
            if (testResponse.status === 403) {
              window.location.href = '/unauthorized'
              return
            }
          }
          
          console.log('✅ API access test passed')
        } catch (apiError) {
          console.error('❌ API access test failed with exception:', apiError)
          alert('Unable to verify API access. Please refresh the page.')
          return
        }
        
        // All checks passed - user is authorized
        setAuthorized(true)
        
        const role = await getCurrentUserRole()
        setCurrentUserRole(role)
        
        console.log('✅ Full authorization completed for role:', role)
        
        // Log access attempt for security auditing
        await logAdminActivity(
          'users_page_accessed',
          'page',
          undefined,
          { 
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          }
        )
        
        await loadUsers(true) // Skip auth check since we just verified authorization
        
        // Also load leads if that's the active tab
        if (activeTab === 'leads') {
          await loadLeads()
        }
        
      } catch (error) {
        console.error('❌ Authorization check failed with exception:', error)
        window.location.href = '/unauthorized'
      } finally {
        setAuthorizationLoading(false)
      }
    }

    checkAuthorizationAndLoad()
  }, [])

  useEffect(() => {
    if (authorized && users.length > 0) {
      filterUsers()
    }
  }, [searchTerm, roleFilter, users, authorized])

  const loadUsers = async (skipAuthCheck = false) => {
    if (!skipAuthCheck && !authorized) {
      console.log('🚫 Skipping user load - not authorized')
      return
    }
    
    try {
      console.log('📊 Loading users data...')
      
      // Use the API route with additional security headers
      const response = await fetch('/api/admin/users?limit=1000', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Action': 'load-users',
          'X-Requested-With': 'XMLHttpRequest'
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Error loading users:', errorData.error)
        if (response.status === 403) {
          alert('Your session has expired or permissions have changed. Redirecting...')
          window.location.href = '/unauthorized'
        }
        return
      }

      const { users: apiUsers } = await response.json()
      console.log('✅ Loaded', apiUsers.length, 'users')

      // Get user roles for users not returned by API
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, is_active')
        .eq('is_active', true)

      if (rolesError) {
        console.error('⚠️ Error loading user roles:', rolesError)
      }

      // Create role mapping
      const roleMap = userRoles?.reduce((acc, ur) => {
        acc[ur.user_id] = ur.role
        return acc
      }, {} as Record<string, UserRole>) || {}

      // Get user activity data for additional metrics
      const userIds = apiUsers.map((u: any) => u.id)
      
      // Get saved properties count
      const { data: savedProps } = await supabase
        .from('saved_properties')
        .select('user_id')
        .in('user_id', userIds)
      
      const savedPropsCount = savedProps?.reduce((acc, sp) => {
        acc[sp.user_id] = (acc[sp.user_id] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      // Get inquiries count
      const { data: inquiries } = await supabase
        .from('inquiries')
        .select('user_id, created_at')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
      
      const inquiriesCount = inquiries?.reduce((acc, inq) => {
        acc[inq.user_id] = (acc[inq.user_id] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      // Get last activity from inquiries
      const lastActivity = inquiries?.reduce((acc, inq) => {
        if (!acc[inq.user_id] || new Date(inq.created_at) > new Date(acc[inq.user_id])) {
          acc[inq.user_id] = inq.created_at
        }
        return acc
      }, {} as Record<string, string>) || {}

      const processedUsers: User[] = apiUsers.map((user: any) => ({
        id: user.id,
        email: user.email || '',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at || '',
        email_confirmed_at: user.email_confirmed_at || '',
        role: user.user_roles?.[0]?.role || roleMap[user.id] || 'user',
        is_active: user.user_roles?.[0]?.is_active !== false,
        saved_properties_count: savedPropsCount[user.id] || 0,
        inquiries_count: inquiriesCount[user.id] || 0,
        last_activity: lastActivity[user.id]
      }))

      setUsers(processedUsers)
    } catch (error) {
      console.error('❌ Error loading users:', error)
      alert('Failed to load users. Your session may have expired.')
      window.location.href = '/admin'
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    // Additional authorization check for role changes
    if (currentUserRole !== 'super_admin') {
      alert('Only Super Admins can change user roles')
      return
    }

    // Verify permission to change roles
    try {
      const { data: hasRolePermission } = await supabase.rpc('has_permission', {
        permission_name: 'users:roles'
      })
      
      if (!hasRolePermission) {
        alert('You do not have permission to change user roles')
        return
      }
    } catch (error) {
      console.error('Error checking role permission:', error)
      alert('Unable to verify permissions for role change')
      return
    }

    try {
      const result = await grantAdminRole(userId, newRole)
      
      if (result.success) {
        // Update local state
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ))
        setRoleChangeUser(null)
        
        await logAdminActivity(
          'role_change',
          'user',
          userId,
          { new_role: newRole, previous_role: users.find(u => u.id === userId)?.role }
        )
      } else {
        alert('Failed to change role: ' + result.error)
      }
    } catch (error) {
      console.error('Error changing role:', error)
      alert('Failed to change role')
    }
  }

  const getRoleBadge = (role: UserRole) => {
    const roleStyles = {
      super_admin: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      user: 'bg-gray-100 text-gray-800'
    }
    
    return roleStyles[role] || roleStyles.user
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return Crown
      case 'admin':
        return Shield
      default:
        return Users
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return 'Never'
    const now = new Date()
    const date = new Date(dateString)
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return `${Math.floor(diffInDays / 30)} months ago`
  }

  const formatLeadStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Show loading state during authorization check
  if (authorizationLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Verifying Access</h2>
          <p className="text-gray-600">Checking admin permissions...</p>
        </div>
      </div>
    )
  }

  // If not authorized, this shouldn't render (user should be redirected)
  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, leads, and monitor platform activity</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleBadge(currentUserRole)}`}>
            {currentUserRole === 'super_admin' ? 'Super Admin' : 
             currentUserRole === 'admin' ? 'Admin' : 'User'}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Users</span>
              <span className="bg-gray-100 text-gray-900 ml-2 py-0.5 px-2 rounded-full text-xs font-medium">
                {users.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'leads'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <UserPlus className="w-4 h-4" />
              <span>Leads</span>
              {leadsStats && (
                <span className="bg-gray-100 text-gray-900 ml-2 py-0.5 px-2 rounded-full text-xs font-medium">
                  {leadsStats.total}
                </span>
              )}
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && (
        <>
          {/* Users Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Super Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'super_admin').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.is_active).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
            <option value="super_admin">Super Admins</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI Conversations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Sign In
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const RoleIcon = getRoleIcon(user.role)
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.email}</p>
                            <div className="flex items-center space-x-2">
                              {user.is_active ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Inactive
                                </span>
                              )}
                              {!user.email_confirmed_at && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Unverified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <RoleIcon className="w-4 h-4 text-gray-400" />
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                            {user.role === 'super_admin' ? 'Super Admin' : 
                             user.role === 'admin' ? 'Admin' : 'User'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.last_activity ? formatRelativeTime(user.last_activity) : 'No activity'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.inquiries_count} inquiries
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.saved_properties_count} saved
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.lead_intelligence ? (
                          <div className="space-y-1">
                            {(() => {
                              const leadScore = user.lead_intelligence.overall_engagement?.highest_lead_score ?? 0;
                              return (
                                <>
                                  <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                      leadScore >= 80 ? 'bg-red-500' :
                                      leadScore >= 60 ? 'bg-orange-500' :
                                      leadScore >= 40 ? 'bg-yellow-500' :
                                      'bg-gray-400'
                                    }`}></div>
                                    <span className={`text-xs font-medium ${
                                      leadScore >= 80 ? 'text-red-700' :
                                      leadScore >= 60 ? 'text-orange-700' :
                                      leadScore >= 40 ? 'text-yellow-700' :
                                      'text-gray-600'
                                    }`}>
                                      {leadScore >= 80 ? 'Hot Lead' :
                                       leadScore >= 60 ? 'Warm Lead' :
                                       leadScore >= 40 ? 'Qualified' :
                                       'Cold'}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Score: {leadScore}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {user.lead_intelligence.overall_engagement?.total_properties_viewed || 0} properties viewed
                                  </div>
                                  {user.lead_intelligence.last_activity && (
                                    <div className="text-xs text-gray-400">
                                      Last: {formatRelativeTime(user.lead_intelligence.last_activity)}
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">No conversations</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(user.created_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(user.last_sign_in_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {currentUserRole === 'super_admin' && user.role !== 'super_admin' && (
                            <button
                              onClick={() => {
                                setRoleChangeUser(user.id)
                                setNewRole(user.role === 'admin' ? 'user' : 'admin')
                              }}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Change Role"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Change Modal */}
      {roleChangeUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change User Role</h3>
            <p className="text-gray-600 mb-4">
              Select the new role for {users.find(u => u.id === roleChangeUser)?.email}
            </p>
            
            <div className="space-y-3 mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={newRole === 'user'}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>User</span>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={newRole === 'admin'}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span>Admin</span>
                </div>
              </label>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setRoleChangeUser(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRoleChange(roleChangeUser, newRole)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Change Role
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Leads Tab Content */}
      {activeTab === 'leads' && (
        <>
          {/* Leads Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold text-gray-900">{leadsStats?.total || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Today's Leads</p>
                  <p className="text-2xl font-bold text-gray-900">{leadsStats?.today_leads || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {leadsStats?.avg_initial_score ? Math.round(leadsStats.avg_initial_score) : 0}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Qualified</p>
                  <p className="text-2xl font-bold text-gray-900">{leadsStats?.qualified || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Overview */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{leadsStats?.new_leads || 0}</div>
                <div className="text-sm text-gray-600">New</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{leadsStats?.qualified || 0}</div>
                <div className="text-sm text-gray-600">Qualified</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{leadsStats?.called || 0}</div>
                <div className="text-sm text-gray-600">Called</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{leadsStats?.booked || 0}</div>
                <div className="text-sm text-gray-600">Booked</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">{leadsStats?.completed || 0}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </div>

          {/* Leads Filters */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search leads by name, email, or phone..."
                  value={leadsSearchTerm}
                  onChange={(e) => setLeadsSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={leadsStatusFilter}
                onChange={(e) => setLeadsStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="new_lead">New Lead</option>
                <option value="qualified">Qualified</option>
                <option value="called">Called</option>
                <option value="booked">Booked</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>

              {/* Location Filter */}
              <select
                value={leadsLocationFilter}
                onChange={(e) => setLeadsLocationFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Locations</option>
                {availableLocations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>

              {/* Refresh Button */}
              <button
                onClick={loadLeads}
                disabled={leadsLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${leadsLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Leads Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {leadsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading leads...</p>
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No leads found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lead Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requirements
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score & Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {lead.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                              <p className="text-xs text-gray-500">{lead.lead_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="flex items-center space-x-1 text-gray-900">
                              <Phone className="w-3 h-3" />
                              <span>{lead.whatsapp_number}</span>
                            </div>
                            {lead.email && (
                              <div className="flex items-center space-x-1 text-gray-500 mt-1">
                                <Mail className="w-3 h-3" />
                                <span>{lead.email}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="flex items-center space-x-1 text-gray-900">
                              <MapPin className="w-3 h-3" />
                              <span>{lead.location}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-gray-500 mt-1">
                              <DollarSign className="w-3 h-3" />
                              <span>{lead.price_range}</span>
                            </div>
                            <div className="text-gray-500 mt-1">{lead.property_type}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2">
                              <Star className="w-3 h-3 text-yellow-500" />
                              <span className="text-sm font-medium">{lead.initial_score}</span>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              lead.status === 'new_lead' ? 'bg-blue-100 text-blue-800' :
                              lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                              lead.status === 'called' ? 'bg-yellow-100 text-yellow-800' :
                              lead.status === 'booked' ? 'bg-purple-100 text-purple-800' :
                              lead.status === 'completed' ? 'bg-indigo-100 text-indigo-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {formatLeadStatus(lead.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="text-gray-900">{lead.tour_views} views</div>
                            <div className="text-gray-500">{lead.followup_count} follow-ups</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(lead.created_at)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatRelativeTime(lead.created_at)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {leadsPagination && leadsPagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setLeadsPage(Math.max(1, leadsPage - 1))}
                  disabled={leadsPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setLeadsPage(Math.min(leadsPagination.totalPages, leadsPage + 1))}
                  disabled={leadsPage === leadsPagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{(leadsPage - 1) * 20 + 1}</span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(leadsPage * 20, leadsPagination.total)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{leadsPagination.total}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setLeadsPage(Math.max(1, leadsPage - 1))}
                      disabled={leadsPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, leadsPagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setLeadsPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === leadsPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                             : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                           }`}
                         >
                           {pageNum}
                         </button>
                       )
                     })}
                     <button
                       onClick={() => setLeadsPage(Math.min(leadsPagination.totalPages, leadsPage + 1))}
                       disabled={leadsPage === leadsPagination.totalPages}
                       className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                     >
                       Next
                     </button>
                   </nav>
                 </div>
               </div>
             </div>
           )}
         </>
       )}
     </div>
   )
 }