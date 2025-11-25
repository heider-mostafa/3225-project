'use client'
import { useEffect, useState } from 'react'
import { 
  Building2, 
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
  Building,
  Users,
  Factory,
  Home,
  ShieldCheck,
  Percent
} from 'lucide-react'
import { isCurrentUserAdmin, getCurrentUserRole, logAdminActivity, type UserRole } from '@/lib/auth/admin-client'
import { supabase } from '@/lib/supabase/config'

interface Compound {
  id: string
  developer_id: string
  name: string
  address: string
  city: string
  district?: string
  location_lat?: number
  location_lng?: number
  total_units: number
  total_area_sqm?: number
  handover_year?: number
  compound_type: 'residential' | 'mixed_use'
  compound_manager_user_id?: string
  management_company?: string
  emergency_phone?: string
  operating_hours_start: string
  operating_hours_end: string
  security_level: 'low' | 'medium' | 'high'
  is_active: boolean
  branding_config: any
  notification_settings: any
  created_at: string
  updated_at: string
  community_developers?: {
    company_name: string
    contact_email: string
    subscription_tier: string
  }
  stats?: {
    occupied_units: number
    occupancy_rate: number
    active_residents: number
    pending_fees_total: number
    active_amenities: number
    pending_service_requests: number
  }
}

interface CompoundStats {
  total_compounds: number
  active_compounds: number
  total_units: number
  occupied_units: number
  avg_occupancy_rate: number
  total_residents: number
  total_pending_fees: number
  avg_monthly_fees: number
  security_breakdown: {
    low: number
    medium: number
    high: number
  }
  type_breakdown: {
    residential: number
    mixed_use: number
  }
}

export default function AdminCompounds() {
  // State management
  const [compounds, setCompounds] = useState<Compound[]>([])
  const [filteredCompounds, setFilteredCompounds] = useState<Compound[]>([])
  const [stats, setStats] = useState<CompoundStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorizationLoading, setAuthorizationLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [developerFilter, setDeveloperFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [securityFilter, setSecurityFilter] = useState('all')
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('user')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [itemsPerPage] = useState(20)

  // Available options
  const [developers, setDevelopers] = useState<{id: string, company_name: string}[]>([])

  useEffect(() => {
    const checkAuthorizationAndLoad = async () => {
      try {
        setAuthorizationLoading(true)
        
        console.log('🔒 Starting authorization verification for compounds page')
        
        // Check 1: Verify user is logged in
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session) {
          console.error('❌ No valid session found')
          window.location.href = '/auth?redirectTo=/admin/compounds'
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
          const testResponse = await fetch('/api/community/compounds?limit=1', {
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
          'compounds_page_accessed',
          'page',
          undefined,
          { 
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          }
        )
        
        // Load data directly since authorization passed
        await loadCompoundsData()
        
        // Load supporting data for filters
        await loadDevelopers()
        
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
    if (authorized && compounds.length > 0) {
      filterCompounds()
    }
  }, [searchTerm, developerFilter, statusFilter, securityFilter, compounds, authorized])

  const loadCompoundsData = async () => {
    try {
      console.log('📊 Loading compounds data...')
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sort_by: 'name',
        sort_order: 'asc'
      })

      if (developerFilter !== 'all') {
        params.append('developer_id', developerFilter)
      }

      if (statusFilter !== 'all') {
        params.append('is_active', statusFilter === 'active' ? 'true' : 'false')
      }

      if (securityFilter !== 'all') {
        params.append('security_level', securityFilter)
      }

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/community/compounds?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Action': 'load-compounds',
          'X-Requested-With': 'XMLHttpRequest'
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Error loading compounds:', errorData.error)
        if (response.status === 403) {
          alert('Your session has expired or permissions have changed. Redirecting...')
          window.location.href = '/unauthorized'
        }
        return
      }

      const { compounds: apiCompounds, pagination } = await response.json()
      console.log('✅ Loaded', apiCompounds.length, 'compounds')

      setCompounds(apiCompounds || [])
      setTotalPages(pagination?.pages || 1)

      // Load statistics
      await loadCompoundStats()
      
    } catch (error) {
      console.error('❌ Error loading compounds:', error)
      alert('Failed to load compounds. Your session may have expired.')
      window.location.href = '/admin'
    } finally {
      setLoading(false)
    }
  }

  const loadDevelopers = async () => {
    try {
      const response = await fetch('/api/community/developers?limit=1000', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const { developers } = await response.json()
        setDevelopers(developers?.map((d: any) => ({
          id: d.id,
          company_name: d.company_name
        })) || [])
      }
    } catch (error) {
      console.error('Error loading developers:', error)
    }
  }

  const loadCompoundStats = async () => {
    try {
      // Get additional statistics from the database
      const { data: unitsData } = await supabase
        .from('community_units')
        .select('occupancy_status, compound_id')
        .in('compound_id', compounds.map(c => c.id))

      const { data: residentsData } = await supabase
        .from('compound_residents')
        .select('unit_id')
        .is('move_out_date', null)

      const { data: feesData } = await supabase
        .from('community_fees')
        .select('amount, payment_status')
        .eq('payment_status', 'pending')

      const totalCompounds = compounds.length
      const activeCompounds = compounds.filter(c => c.is_active).length
      const totalUnits = compounds.reduce((sum: number, c) => sum + c.total_units, 0)
      const occupiedUnits = unitsData?.filter((u: any) => u.occupancy_status !== 'vacant').length || 0
      const avgOccupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0
      const totalResidents = residentsData?.length || 0
      const totalPendingFees = feesData?.reduce((sum: number, f: any) => sum + f.amount, 0) || 0

      const securityBreakdown = compounds.reduce((acc: any, c) => {
        acc[c.security_level] = (acc[c.security_level] || 0) + 1
        return acc
      }, { low: 0, medium: 0, high: 0 } as any)

      const typeBreakdown = compounds.reduce((acc: any, c) => {
        acc[c.compound_type] = (acc[c.compound_type] || 0) + 1
        return acc
      }, { residential: 0, mixed_use: 0 } as any)

      setStats({
        total_compounds: totalCompounds,
        active_compounds: activeCompounds,
        total_units: totalUnits,
        occupied_units: occupiedUnits,
        avg_occupancy_rate: avgOccupancyRate,
        total_residents: totalResidents,
        total_pending_fees: totalPendingFees,
        avg_monthly_fees: totalPendingFees / totalResidents || 0,
        security_breakdown: securityBreakdown,
        type_breakdown: typeBreakdown
      })
    } catch (error) {
      console.error('Error calculating compound stats:', error)
    }
  }

  const filterCompounds = () => {
    let filtered = compounds

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(compound =>
        compound.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        compound.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        compound.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        compound.community_developers?.company_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Developer filter
    if (developerFilter !== 'all') {
      filtered = filtered.filter(compound => compound.developer_id === developerFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(compound => 
        statusFilter === 'active' ? compound.is_active : !compound.is_active
      )
    }

    // Security filter
    if (securityFilter !== 'all') {
      filtered = filtered.filter(compound => compound.security_level === securityFilter)
    }

    setFilteredCompounds(filtered)
  }

  const getSecurityBadge = (level: string) => {
    const securityStyles = {
      low: 'bg-yellow-100 text-yellow-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-green-100 text-green-800'
    }
    
    return securityStyles[level as keyof typeof securityStyles] || securityStyles.medium
  }

  const getTypeBadge = (type: string) => {
    const typeStyles = {
      residential: 'bg-purple-100 text-purple-800',
      mixed_use: 'bg-orange-100 text-orange-800'
    }
    
    return typeStyles[type as keyof typeof typeStyles] || typeStyles.residential
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
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
          <h1 className="text-3xl font-bold text-gray-900">Compound Management</h1>
          <p className="text-gray-600">Monitor and manage all residential compounds across developers</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
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
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Compounds</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_compounds}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Compounds</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_compounds}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Units</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_units.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Percent className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Occupancy</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(stats.avg_occupancy_rate)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Stats Row */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Residents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_residents.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Fees</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_pending_fees)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Occupied Units</p>
                <p className="text-2xl font-bold text-gray-900">{stats.occupied_units.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Level Distribution</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.security_breakdown.low}</div>
                <div className="text-sm text-gray-600">Basic Security</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.security_breakdown.medium}</div>
                <div className="text-sm text-gray-600">Standard Security</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.security_breakdown.high}</div>
                <div className="text-sm text-gray-600">High Security</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compound Type Distribution</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.type_breakdown.residential}</div>
                <div className="text-sm text-gray-600">Residential</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.type_breakdown.mixed_use}</div>
                <div className="text-sm text-gray-600">Mixed Use</div>
              </div>
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
              placeholder="Search by compound name, address, city, or developer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Developer Filter */}
          <select
            value={developerFilter}
            onChange={(e) => setDeveloperFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Developers</option>
            {developers.map(developer => (
              <option key={developer.id} value={developer.id}>{developer.company_name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Security Filter */}
          <select
            value={securityFilter}
            onChange={(e) => setSecurityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Security</option>
            <option value="low">Basic</option>
            <option value="medium">Standard</option>
            <option value="high">High</option>
          </select>

          <button
            onClick={loadCompoundsData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Compounds Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredCompounds.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No compounds found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compound
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Developer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Units & Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Security & Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Occupancy
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
                {filteredCompounds.map((compound) => (
                  <tr key={compound.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {compound.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{compound.name}</p>
                          {compound.management_company && (
                            <p className="text-xs text-gray-500">Managed by {compound.management_company}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900">{compound.community_developers?.company_name || 'N/A'}</div>
                        <div className="text-gray-500">{compound.community_developers?.contact_email || ''}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900">{compound.city}</div>
                        <div className="text-gray-500">{compound.district || ''}</div>
                        <div className="text-gray-400 text-xs">{compound.address}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900">{compound.total_units.toLocaleString()} units</div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(compound.compound_type)}`}>
                          {compound.compound_type === 'mixed_use' ? 'Mixed Use' : 'Residential'}
                        </span>
                        {compound.handover_year && (
                          <div className="text-gray-500 text-xs mt-1">Est. {compound.handover_year}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSecurityBadge(compound.security_level)}`}>
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          {compound.security_level.charAt(0).toUpperCase() + compound.security_level.slice(1)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          compound.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {compound.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {compound.stats ? (
                          <>
                            <div className="text-gray-900">
                              {compound.stats.occupied_units}/{compound.total_units}
                            </div>
                            <div className="text-gray-500">
                              {formatPercentage(compound.stats.occupancy_rate)}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {compound.stats.active_residents} residents
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-400">No data</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(compound.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => window.location.href = `/admin/residents?compound_id=${compound.id}`}
                          className="text-purple-600 hover:text-purple-800 p-1"
                          title="View Residents"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => window.location.href = `/manager/${compound.id}/dashboard`}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Compound Dashboard"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {currentUserRole === 'super_admin' && (
                          <button
                            onClick={() => {/* TODO: Edit compound modal */}}
                            className="text-gray-600 hover:text-gray-800 p-1"
                            title="Edit Compound"
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
                  {Math.min(currentPage * itemsPerPage, filteredCompounds.length)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{filteredCompounds.length}</span>
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