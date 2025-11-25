'use client'
import { useEffect, useState } from 'react'
import { 
  Building, 
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
  RefreshCw,
  Package,
  Settings,
  Plus,
  ExternalLink,
  Building2,
  Users,
  Factory
} from 'lucide-react'
import { isCurrentUserAdmin, getCurrentUserRole, logAdminActivity, type UserRole } from '@/lib/auth/admin-client'
import { supabase } from '@/lib/supabase/config'

interface CommunityDeveloper {
  id: string
  company_name: string
  commercial_registration: string
  logo_url?: string
  contact_person_name: string
  contact_phone: string
  contact_email: string
  company_address?: string
  subscription_tier: 'starter' | 'growth' | 'enterprise'
  subscription_status: 'active' | 'suspended' | 'cancelled'
  monthly_fee: number
  whitelabel_config: any
  api_credentials: any
  created_at: string
  updated_at: string
  stats?: {
    compound_count: number
    total_units: number
  }
}

interface DeveloperStats {
  total_developers: number
  active_developers: number
  total_compounds: number
  total_units: number
  total_monthly_revenue: number
  avg_monthly_fee: number
  subscription_breakdown: {
    starter: number
    growth: number
    enterprise: number
  }
}

interface CreateDeveloperForm {
  company_name: string
  commercial_registration: string
  logo_url: string
  contact_person_name: string
  contact_phone: string
  contact_email: string
  company_address: string
  subscription_tier: 'starter' | 'growth' | 'enterprise'
  monthly_fee?: number
  developer_user_id: string
}

export default function AdminDevelopers() {
  // State management
  const [developers, setDevelopers] = useState<CommunityDeveloper[]>([])
  const [filteredDevelopers, setFilteredDevelopers] = useState<CommunityDeveloper[]>([])
  const [stats, setStats] = useState<DeveloperStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorizationLoading, setAuthorizationLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('user')
  
  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState<CreateDeveloperForm>({
    company_name: '',
    commercial_registration: '',
    logo_url: '',
    contact_person_name: '',
    contact_phone: '',
    contact_email: '',
    company_address: '',
    subscription_tier: 'starter',
    developer_user_id: ''
  })
  const [createLoading, setCreateLoading] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [itemsPerPage] = useState(20)

  useEffect(() => {
    const checkAuthorizationAndLoad = async () => {
      try {
        setAuthorizationLoading(true)
        
        console.log('🔒 Starting authorization verification for developers page')
        
        // Check 1: Verify user is logged in
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session) {
          console.error('❌ No valid session found')
          window.location.href = '/auth?redirectTo=/admin/developers'
          return
        }
        
        console.log('✅ Session verified for user:', session.user.email)
        
        // Check 2: Verify admin status
        const isAdmin = await isCurrentUserAdmin()
        if (!isAdmin) {
          console.error('❌ User is not an admin')
          window.location.href = '/unauthorized'
          return
        }
        
        console.log('✅ Admin status verified')
        
        // Check 3: Double-check with database query
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
        
        // Check 4: Test API access
        try {
          const testResponse = await fetch('/api/community/developers?limit=1', {
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
        
        // All checks passed - load data directly without waiting for state update
        const role = await getCurrentUserRole()
        setCurrentUserRole(role)
        
        console.log('✅ Full authorization completed for role:', role)
        
        // Log access
        await logAdminActivity(
          'developers_page_accessed',
          'page',
          undefined,
          { 
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          }
        )
        
        // Load data directly since authorization passed
        await loadDevelopersData()
        
        // Set authorized state after data is loaded
        setAuthorized(true)
        
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
    if (authorized && developers.length > 0) {
      filterDevelopers()
    }
  }, [searchTerm, tierFilter, statusFilter, developers, authorized])

  const loadDevelopersData = async () => {
    try {
      console.log('📊 Loading developers data...')
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sort_by: 'company_name',
        sort_order: 'asc'
      })

      if (tierFilter !== 'all') {
        params.append('subscription_tier', tierFilter)
      }

      if (statusFilter !== 'all') {
        params.append('subscription_status', statusFilter)
      }

      if (searchTerm) {
        params.append('company_name', searchTerm)
      }

      const response = await fetch(`/api/community/developers?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Action': 'load-developers',
          'X-Requested-With': 'XMLHttpRequest'
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Error loading developers:', errorData.error)
        if (response.status === 403) {
          alert('Your session has expired or permissions have changed. Redirecting...')
          window.location.href = '/unauthorized'
        }
        return
      }

      const { developers: apiDevelopers, pagination } = await response.json()
      console.log('✅ Loaded', apiDevelopers.length, 'developers')

      setDevelopers(apiDevelopers || [])
      setTotalPages(pagination?.pages || 1)

      // Load statistics
      await loadDeveloperStats()
      
    } catch (error) {
      console.error('❌ Error loading developers:', error)
      alert('Failed to load developers. Your session may have expired.')
      window.location.href = '/admin'
    } finally {
      setLoading(false)
    }
  }

  const loadDeveloperStats = async () => {
    try {
      // Calculate statistics from the developers data
      const totalDevelopers = developers.length
      const activeDevelopers = developers.filter(d => d.subscription_status === 'active').length
      const totalCompounds = developers.reduce((sum, d) => sum + (d.stats?.compound_count || 0), 0)
      const totalUnits = developers.reduce((sum, d) => sum + (d.stats?.total_units || 0), 0)
      const totalMonthlyRevenue = developers
        .filter(d => d.subscription_status === 'active')
        .reduce((sum, d) => sum + d.monthly_fee, 0)
      const avgMonthlyFee = activeDevelopers > 0 ? totalMonthlyRevenue / activeDevelopers : 0

      const subscriptionBreakdown = developers.reduce((acc, d) => {
        acc[d.subscription_tier] = (acc[d.subscription_tier] || 0) + 1
        return acc
      }, { starter: 0, growth: 0, enterprise: 0 } as any)

      setStats({
        total_developers: totalDevelopers,
        active_developers: activeDevelopers,
        total_compounds: totalCompounds,
        total_units: totalUnits,
        total_monthly_revenue: totalMonthlyRevenue,
        avg_monthly_fee: avgMonthlyFee,
        subscription_breakdown: subscriptionBreakdown
      })
    } catch (error) {
      console.error('Error calculating developer stats:', error)
    }
  }

  const filterDevelopers = () => {
    let filtered = developers

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(developer =>
        developer.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        developer.contact_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        developer.commercial_registration.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(developer => developer.subscription_tier === tierFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(developer => developer.subscription_status === statusFilter)
    }

    setFilteredDevelopers(filtered)
  }

  const handleCreateDeveloper = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (currentUserRole !== 'super_admin') {
      alert('Only Super Admins can create developer organizations')
      return
    }

    try {
      setCreateLoading(true)

      const response = await fetch('/api/community/developers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Action': 'create-developer',
        },
        body: JSON.stringify(createForm)
      })

      const data = await response.json()

      if (!response.ok) {
        alert('Failed to create developer: ' + data.error)
        return
      }

      // Log activity
      await logAdminActivity(
        'developer_created',
        'developer',
        data.developer.id,
        { 
          company_name: data.developer.company_name,
          subscription_tier: data.developer.subscription_tier 
        }
      )

      // Reset form and reload data
      setCreateForm({
        company_name: '',
        commercial_registration: '',
        logo_url: '',
        contact_person_name: '',
        contact_phone: '',
        contact_email: '',
        company_address: '',
        subscription_tier: 'starter',
        developer_user_id: ''
      })
      setShowCreateForm(false)
      await loadDevelopersData()
      
      alert('Developer organization created successfully!')

    } catch (error) {
      console.error('Error creating developer:', error)
      alert('Failed to create developer organization')
    } finally {
      setCreateLoading(false)
    }
  }

  const getTierBadge = (tier: string) => {
    const tierStyles = {
      starter: 'bg-blue-100 text-blue-800',
      growth: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-green-100 text-green-800'
    }
    
    return tierStyles[tier as keyof typeof tierStyles] || tierStyles.starter
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    
    return statusStyles[status as keyof typeof statusStyles] || statusStyles.active
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount)
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
          <h1 className="text-3xl font-bold text-gray-900">Developer Organizations</h1>
          <p className="text-gray-600">Manage property developer organizations and subscriptions</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          {currentUserRole === 'super_admin' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Developer</span>
            </button>
          )}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${currentUserRole === 'super_admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
            {currentUserRole === 'super_admin' ? 'Super Admin' : 'Admin'}
          </span>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Developers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_developers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Developers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_developers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Compounds</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_compounds}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_monthly_revenue)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Overview */}
      {stats && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Breakdown</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.subscription_breakdown.starter}</div>
              <div className="text-sm text-gray-600">Starter</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.subscription_breakdown.growth}</div>
              <div className="text-sm text-gray-600">Growth</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.subscription_breakdown.enterprise}</div>
              <div className="text-sm text-gray-600">Enterprise</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by company name, email, or registration..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tier Filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Tiers</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="enterprise">Enterprise</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            onClick={loadDevelopersData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Developers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredDevelopers.length === 0 ? (
          <div className="text-center py-12">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No developers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDevelopers.map((developer) => (
                  <tr key={developer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {developer.company_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{developer.company_name}</p>
                          <p className="text-xs text-gray-500">{developer.contact_person_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="flex items-center space-x-1 text-gray-900">
                          <Mail className="w-3 h-3" />
                          <span>{developer.contact_email}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-500 mt-1">
                          <Phone className="w-3 h-3" />
                          <span>{developer.contact_phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTierBadge(developer.subscription_tier)}`}>
                          {developer.subscription_tier.charAt(0).toUpperCase() + developer.subscription_tier.slice(1)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(developer.subscription_status)}`}>
                          {developer.subscription_status.charAt(0).toUpperCase() + developer.subscription_status.slice(1)}
                        </span>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(developer.monthly_fee)}/mo
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900">{developer.stats?.compound_count || 0} compounds</div>
                        <div className="text-gray-500">{developer.stats?.total_units || 0} units</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {developer.commercial_registration}
                      </div>
                      <div className="text-xs text-gray-500">
                        {developer.company_address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(developer.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => window.location.href = `/admin/compounds?developer_id=${developer.id}`}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="View Compounds"
                        >
                          <Building2 className="w-4 h-4" />
                        </button>
                        {currentUserRole === 'super_admin' && (
                          <button
                            onClick={() => {/* TODO: Edit developer modal */}}
                            className="text-gray-600 hover:text-gray-800 p-1"
                            title="Edit Developer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Developer Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Developer Organization</h3>
            
            <form onSubmit={handleCreateDeveloper} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.company_name}
                    onChange={(e) => setCreateForm({...createForm, company_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. Mountain View Real Estate"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commercial Registration *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.commercial_registration}
                    onChange={(e) => setCreateForm({...createForm, commercial_registration: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. 123456789"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.contact_person_name}
                    onChange={(e) => setCreateForm({...createForm, contact_person_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. Ahmed Mohamed"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={createForm.contact_phone}
                    onChange={(e) => setCreateForm({...createForm, contact_phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. +201234567890"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.contact_email}
                    onChange={(e) => setCreateForm({...createForm, contact_email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. contact@company.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subscription Tier
                  </label>
                  <select
                    value={createForm.subscription_tier}
                    onChange={(e) => setCreateForm({...createForm, subscription_tier: e.target.value as 'starter' | 'growth' | 'enterprise'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="starter">Starter (EGP 2,000/mo)</option>
                    <option value="growth">Growth (EGP 5,000/mo)</option>
                    <option value="enterprise">Enterprise (EGP 10,000/mo)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Address
                </label>
                <textarea
                  value={createForm.company_address}
                  onChange={(e) => setCreateForm({...createForm, company_address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="e.g. 123 Main Street, New Cairo, Egypt"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={createForm.logo_url}
                  onChange={(e) => setCreateForm({...createForm, logo_url: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. https://company.com/logo.png"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Developer User ID (Optional)
                </label>
                <input
                  type="text"
                  value={createForm.developer_user_id}
                  onChange={(e) => setCreateForm({...createForm, developer_user_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="UUID of user to assign developer role"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: User ID to automatically assign developer role to
                </p>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {createLoading ? 'Creating...' : 'Create Developer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg mt-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredDevelopers.length)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{filteredDevelopers.length}</span>
                {' '}results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}