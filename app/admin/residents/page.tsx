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
  RefreshCw,
  Package,
  Settings,
  Plus,
  ExternalLink,
  Building,
  Building2,
  Factory,
  Home,
  ShieldCheck,
  Percent,
  User,
  Badge,
  CreditCard,
  FileText,
  Car
} from 'lucide-react'
import { isCurrentUserAdmin, getCurrentUserRole, logAdminActivity, type UserRole } from '@/lib/auth/admin-client'
import { supabase } from '@/lib/supabase/config'

interface Resident {
  id: string
  user_id: string
  unit_id: string
  full_name_arabic?: string
  full_name_english: string
  national_id?: string
  date_of_birth?: string
  profile_photo_url?: string
  primary_phone: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  resident_type: 'owner' | 'tenant' | 'family_member'
  move_in_date: string
  move_out_date?: string
  family_members: any[]
  verification_status: 'pending' | 'approved' | 'rejected'
  verification_documents: any
  approved_by_user_id?: string
  approved_at?: string
  is_active: boolean
  created_at: string
  updated_at: string
  community_units?: {
    id: string
    unit_number: string
    compound_id: string
    compounds?: {
      name: string
      city: string
      community_developers?: {
        company_name: string
      }
    }
  }
  auth_users?: {
    email: string
    created_at: string
    last_sign_in_at?: string
  }
  stats?: {
    pending_fees_count: number
    pending_fees_amount: number
    service_requests_count: number
    visitor_passes_count: number
    amenity_bookings_count: number
  }
}

interface ResidentStats {
  total_residents: number
  verified_residents: number
  pending_verification: number
  owners: number
  tenants: number
  family_members: number
  active_residents: number
  total_pending_fees: number
  avg_pending_fees: number
  verification_breakdown: {
    pending: number
    approved: number
    rejected: number
  }
  type_breakdown: {
    owner: number
    tenant: number
    family_member: number
  }
}

export default function AdminResidents() {
  // State management
  const [residents, setResidents] = useState<Resident[]>([])
  const [filteredResidents, setFilteredResidents] = useState<Resident[]>([])
  const [stats, setStats] = useState<ResidentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorizationLoading, setAuthorizationLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [compoundFilter, setCompoundFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [verificationFilter, setVerificationFilter] = useState('all')
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('user')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [itemsPerPage] = useState(20)

  // Available options
  const [compounds, setCompounds] = useState<{id: string, name: string, city: string}[]>([])

  useEffect(() => {
    const checkAuthorizationAndLoad = async () => {
      try {
        setAuthorizationLoading(true)
        
        console.log('🔒 Starting authorization verification for residents page')
        
        // Check 1: Verify user is logged in
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session) {
          console.error('❌ No valid session found')
          window.location.href = '/auth?redirectTo=/admin/residents'
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
          const testResponse = await fetch('/api/community/residents?limit=1', {
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
          'residents_page_accessed',
          'page',
          undefined,
          { 
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          }
        )
        
        // Load data directly since authorization passed
        await loadResidentsData()
        
        // Load supporting data for filters
        await loadCompounds()
        
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
    if (authorized && residents.length > 0) {
      filterResidents()
    }
  }, [searchTerm, compoundFilter, typeFilter, verificationFilter, residents, authorized])

  const loadResidentsData = async () => {
    try {
      console.log('📊 Loading residents data...')
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sort_by: 'full_name_english',
        sort_order: 'asc'
      })

      if (compoundFilter !== 'all') {
        params.append('compound_id', compoundFilter)
      }

      if (typeFilter !== 'all') {
        params.append('resident_type', typeFilter)
      }

      if (verificationFilter !== 'all') {
        params.append('verification_status', verificationFilter)
      }

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/community/residents?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Action': 'load-residents',
          'X-Requested-With': 'XMLHttpRequest'
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Error loading residents:', errorData.error)
        if (response.status === 403) {
          alert('Your session has expired or permissions have changed. Redirecting...')
          window.location.href = '/unauthorized'
        }
        return
      }

      const { residents: apiResidents, pagination } = await response.json()
      console.log('✅ Loaded', apiResidents.length, 'residents')

      setResidents(apiResidents || [])
      setTotalPages(pagination?.pages || 1)

      // Load statistics
      await loadResidentStats()
      
    } catch (error) {
      console.error('❌ Error loading residents:', error)
      alert('Failed to load residents. Your session may have expired.')
      window.location.href = '/admin'
    } finally {
      setLoading(false)
    }
  }

  const loadCompounds = async () => {
    try {
      const response = await fetch('/api/community/compounds?limit=1000', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const { compounds } = await response.json()
        setCompounds(compounds?.map((c: any) => ({
          id: c.id,
          name: c.name,
          city: c.city
        })) || [])
      }
    } catch (error) {
      console.error('Error loading compounds:', error)
    }
  }

  const loadResidentStats = async () => {
    try {
      // Calculate statistics from the residents data
      const totalResidents = residents.length
      const verifiedResidents = residents.filter(r => r.verification_status === 'approved').length
      const pendingVerification = residents.filter(r => r.verification_status === 'pending').length
      const owners = residents.filter(r => r.resident_type === 'owner').length
      const tenants = residents.filter(r => r.resident_type === 'tenant').length
      const familyMembers = residents.filter(r => r.resident_type === 'family_member').length
      const activeResidents = residents.filter(r => r.is_active && !r.move_out_date).length

      // Get additional statistics from the database
      const { data: feesData } = await supabase
        .from('community_fees')
        .select('amount, payment_status')
        .eq('payment_status', 'pending')

      const totalPendingFees = feesData?.reduce((sum: number, f: any) => sum + f.amount, 0) || 0
      const avgPendingFees = totalResidents > 0 ? totalPendingFees / totalResidents : 0

      const verificationBreakdown = residents.reduce((acc: any, r) => {
        acc[r.verification_status] = (acc[r.verification_status] || 0) + 1
        return acc
      }, { pending: 0, approved: 0, rejected: 0 } as any)

      const typeBreakdown = residents.reduce((acc: any, r) => {
        acc[r.resident_type] = (acc[r.resident_type] || 0) + 1
        return acc
      }, { owner: 0, tenant: 0, family_member: 0 } as any)

      setStats({
        total_residents: totalResidents,
        verified_residents: verifiedResidents,
        pending_verification: pendingVerification,
        owners,
        tenants,
        family_members: familyMembers,
        active_residents: activeResidents,
        total_pending_fees: totalPendingFees,
        avg_pending_fees: avgPendingFees,
        verification_breakdown: verificationBreakdown,
        type_breakdown: typeBreakdown
      })
    } catch (error) {
      console.error('Error calculating resident stats:', error)
    }
  }

  const filterResidents = () => {
    let filtered = residents

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(resident =>
        resident.full_name_english.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (resident.full_name_arabic && resident.full_name_arabic.toLowerCase().includes(searchTerm.toLowerCase())) ||
        resident.primary_phone.includes(searchTerm) ||
        resident.national_id?.includes(searchTerm) ||
        resident.auth_users?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resident.community_units?.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resident.community_units?.compounds?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Compound filter
    if (compoundFilter !== 'all') {
      filtered = filtered.filter(resident => resident.community_units?.compound_id === compoundFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(resident => resident.resident_type === typeFilter)
    }

    // Verification filter
    if (verificationFilter !== 'all') {
      filtered = filtered.filter(resident => resident.verification_status === verificationFilter)
    }

    setFilteredResidents(filtered)
  }

  const handleApproveResident = async (residentId: string) => {
    if (currentUserRole !== 'super_admin') {
      alert('Only Super Admins can approve residents')
      return
    }

    try {
      const { error } = await supabase
        .from('compound_residents')
        .update({
          verification_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by_user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', residentId)

      if (error) throw error

      // Log activity
      await logAdminActivity(
        'resident_approved',
        'resident',
        residentId,
        { approved_at: new Date().toISOString() }
      )

      // Reload data
      await loadResidentsData()
      alert('Resident approved successfully!')

    } catch (error) {
      console.error('Error approving resident:', error)
      alert('Failed to approve resident')
    }
  }

  const handleRejectResident = async (residentId: string) => {
    if (currentUserRole !== 'super_admin') {
      alert('Only Super Admins can reject residents')
      return
    }

    try {
      const { error } = await supabase
        .from('compound_residents')
        .update({
          verification_status: 'rejected',
          approved_at: new Date().toISOString(),
          approved_by_user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', residentId)

      if (error) throw error

      // Log activity
      await logAdminActivity(
        'resident_rejected',
        'resident',
        residentId,
        { rejected_at: new Date().toISOString() }
      )

      // Reload data
      await loadResidentsData()
      alert('Resident rejected successfully!')

    } catch (error) {
      console.error('Error rejecting resident:', error)
      alert('Failed to reject resident')
    }
  }

  const getTypeBadge = (type: string) => {
    const typeStyles = {
      owner: 'bg-green-100 text-green-800',
      tenant: 'bg-blue-100 text-blue-800',
      family_member: 'bg-purple-100 text-purple-800'
    }
    
    return typeStyles[type as keyof typeof typeStyles] || typeStyles.tenant
  }

  const getVerificationBadge = (status: string) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    
    return statusStyles[status as keyof typeof statusStyles] || statusStyles.pending
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
          <h1 className="text-3xl font-bold text-gray-900">Resident Management</h1>
          <p className="text-gray-600">Monitor and manage all residents across compounds</p>
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
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Residents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_residents}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Verified Residents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.verified_residents}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Verification</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending_verification}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Residents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_residents}</p>
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
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Pending Fees</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_pending_fees)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Property Owners</p>
                <p className="text-2xl font-bold text-gray-900">{stats.owners}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Badge className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tenants</p>
                <p className="text-2xl font-bold text-gray-900">{stats.tenants}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.verification_breakdown.pending}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.verification_breakdown.approved}</div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.verification_breakdown.rejected}</div>
                <div className="text-sm text-gray-600">Rejected</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resident Type Distribution</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.type_breakdown.owner}</div>
                <div className="text-sm text-gray-600">Owners</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.type_breakdown.tenant}</div>
                <div className="text-sm text-gray-600">Tenants</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.type_breakdown.family_member}</div>
                <div className="text-sm text-gray-600">Family</div>
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
              placeholder="Search by name, phone, email, unit, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Compound Filter */}
          <select
            value={compoundFilter}
            onChange={(e) => setCompoundFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Compounds</option>
            {compounds.map(compound => (
              <option key={compound.id} value={compound.id}>{compound.name} - {compound.city}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="owner">Property Owner</option>
            <option value="tenant">Tenant</option>
            <option value="family_member">Family Member</option>
          </select>

          {/* Verification Filter */}
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Verification</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <button
            onClick={loadResidentsData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Residents Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredResidents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No residents found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resident
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit & Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Move-in Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResidents.map((resident) => (
                  <tr key={resident.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {resident.full_name_english.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{resident.full_name_english}</p>
                          {resident.full_name_arabic && (
                            <p className="text-xs text-gray-500">{resident.full_name_arabic}</p>
                          )}
                          {resident.national_id && (
                            <p className="text-xs text-gray-400">ID: {resident.national_id}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="flex items-center space-x-1 text-gray-900">
                          <Phone className="w-3 h-3" />
                          <span>{resident.primary_phone}</span>
                        </div>
                        {resident.auth_users?.email && (
                          <div className="flex items-center space-x-1 text-gray-500 mt-1">
                            <Mail className="w-3 h-3" />
                            <span>{resident.auth_users.email}</span>
                          </div>
                        )}
                        {resident.emergency_contact_name && (
                          <div className="text-gray-400 text-xs mt-1">
                            Emergency: {resident.emergency_contact_name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900">
                          Unit {resident.community_units?.unit_number || 'N/A'}
                        </div>
                        <div className="text-gray-500">
                          {resident.community_units?.compounds?.name || 'Unknown Compound'}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {resident.community_units?.compounds?.community_developers?.company_name || ''}
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getTypeBadge(resident.resident_type)}`}>
                          {resident.resident_type === 'family_member' ? 'Family' : resident.resident_type.charAt(0).toUpperCase() + resident.resident_type.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getVerificationBadge(resident.verification_status)}`}>
                          {resident.verification_status.charAt(0).toUpperCase() + resident.verification_status.slice(1)}
                        </span>
                        {resident.approved_at && (
                          <div className="text-gray-400 text-xs">
                            {formatDate(resident.approved_at)}
                          </div>
                        )}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          resident.is_active && !resident.move_out_date ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {resident.is_active && !resident.move_out_date ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900">{formatDate(resident.move_in_date)}</div>
                        {resident.move_out_date && (
                          <div className="text-red-500 text-xs">
                            Moved out: {formatDate(resident.move_out_date)}
                          </div>
                        )}
                        {resident.family_members && resident.family_members.length > 0 && (
                          <div className="text-gray-400 text-xs">
                            +{resident.family_members.length} family members
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {resident.stats ? (
                          <>
                            <div className="text-gray-900">
                              {resident.stats.pending_fees_count} pending fees
                            </div>
                            <div className="text-gray-500">
                              {resident.stats.service_requests_count} requests
                            </div>
                            <div className="text-gray-400 text-xs">
                              {resident.stats.visitor_passes_count} visitors
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-400">No activity</div>
                        )}
                        {resident.auth_users?.last_sign_in_at && (
                          <div className="text-gray-400 text-xs">
                            Last login: {formatDate(resident.auth_users.last_sign_in_at)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {resident.verification_status === 'pending' && currentUserRole === 'super_admin' && (
                          <>
                            <button
                              onClick={() => handleApproveResident(resident.id)}
                              className="text-green-600 hover:text-green-800 p-1"
                              title="Approve Resident"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectResident(resident.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Reject Resident"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => window.location.href = `/admin/residents/${resident.id}`}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {currentUserRole === 'super_admin' && (
                          <button
                            onClick={() => {/* TODO: Edit resident modal */}}
                            className="text-gray-600 hover:text-gray-800 p-1"
                            title="Edit Resident"
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
                  {Math.min(currentPage * itemsPerPage, filteredResidents.length)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{filteredResidents.length}</span>
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