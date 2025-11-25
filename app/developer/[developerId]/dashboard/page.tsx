'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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
  Percent,
  User,
  Badge,
  CreditCard,
  FileText,
  Car,
  BarChart3,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Bell,
  Calculator,
  PieChart
} from 'lucide-react'
import { isCurrentUserAdmin, getCurrentUserRole, logAdminActivity, type UserRole } from '@/lib/auth/admin-client'
import { supabase } from '@/lib/supabase/config'

interface DeveloperDashboardData {
  developer: {
    id: string
    company_name: string
    commercial_registration: string
    logo_url?: string
    contact_person_name: string
    contact_phone: string
    contact_email: string
    subscription_tier: 'starter' | 'growth' | 'enterprise'
    subscription_status: 'active' | 'suspended' | 'cancelled'
    monthly_fee: number
    created_at: string
  }
  stats: {
    total_compounds: number
    active_compounds: number
    total_units: number
    occupied_units: number
    total_residents: number
    verified_residents: number
    monthly_revenue: number
    pending_fees: number
    service_requests_open: number
    visitor_passes_today: number
    amenity_bookings_today: number
    announcements_this_month: number
  }
  recent_activity: Array<{
    id: string
    type: 'compound_created' | 'resident_verified' | 'fee_paid' | 'service_request' | 'announcement'
    title: string
    description: string
    compound_name?: string
    created_at: string
  }>
  compound_performance: Array<{
    compound_id: string
    compound_name: string
    total_units: number
    occupied_units: number
    occupancy_rate: number
    monthly_fees_collected: number
    pending_fees: number
    resident_satisfaction: number
    service_requests_resolved: number
    service_requests_pending: number
  }>
  financial_overview: {
    total_monthly_fees: number
    collected_fees: number
    pending_fees: number
    collection_rate: number
    revenue_trend: Array<{
      month: string
      collected: number
      pending: number
    }>
  }
}

export default function DeveloperDashboard() {
  const params = useParams()
  const developerId = params.developerId as string

  // State management
  const [dashboardData, setDashboardData] = useState<DeveloperDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorizationLoading, setAuthorizationLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('user')
  const [isDeveloperUser, setIsDeveloperUser] = useState(false)

  useEffect(() => {
    const checkAuthorizationAndLoad = async () => {
      try {
        setAuthorizationLoading(true)
        
        console.log('🔒 Starting authorization verification for developer dashboard')
        
        // Check 1: Verify user is logged in
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session) {
          console.error('❌ No valid session found')
          window.location.href = '/auth?redirectTo=/developer/' + developerId + '/dashboard'
          return
        }
        
        console.log('✅ Session verified for user:', session.user.email)
        
        // Check 2: Verify user has access to this developer
        const { data: userRoles, error: roleError } = await supabase
          .from('user_roles')
          .select('role, developer_id, is_active')
          .eq('user_id', session.user.id)
          .eq('is_active', true)

        if (roleError || !userRoles || userRoles.length === 0) {
          console.error('❌ Failed to verify user roles in database:', roleError)
          window.location.href = '/unauthorized'
          return
        }

        // Check admin access OR developer access to this specific developer
        const hasAdminAccess = userRoles.some((role: any) => 
          ['admin', 'super_admin'].includes(role.role)
        )

        const hasDeveloperAccess = userRoles.some((role: any) => 
          role.role === 'developer' && role.developer_id === developerId
        )

        if (!hasAdminAccess && !hasDeveloperAccess) {
          console.error('❌ User does not have access to this developer organization')
          window.location.href = '/unauthorized'
          return
        }

        console.log('✅ Access verification passed')
        
        // Set authorization states
        setAuthorized(true)
        setIsDeveloperUser(hasDeveloperAccess)
        
        const role = userRoles.find((r: any) => ['admin', 'super_admin'].includes(r.role))?.role || 'developer'
        setCurrentUserRole(role)
        
        console.log('✅ Full authorization completed for role:', role)
        
        // Log access
        await logAdminActivity(
          'developer_dashboard_accessed',
          'developer',
          developerId,
          { 
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            is_developer_user: hasDeveloperAccess
          }
        )
        
        await loadDashboardData()
        
      } catch (error) {
        console.error('❌ Authorization check failed with exception:', error)
        window.location.href = '/unauthorized'
      } finally {
        setAuthorizationLoading(false)
      }
    }

    if (developerId) {
      checkAuthorizationAndLoad()
    }
  }, [developerId])

  const loadDashboardData = async () => {
    if (!authorized) {
      console.log('🚫 Skipping dashboard load - not authorized')
      return
    }
    
    try {
      console.log('📊 Loading developer dashboard data...')
      
      // Load developer information
      const { data: developer, error: devError } = await supabase
        .from('community_developers')
        .select('*')
        .eq('id', developerId)
        .single()

      if (devError || !developer) {
        console.error('❌ Error loading developer:', devError)
        alert('Developer organization not found')
        window.location.href = '/admin/developers'
        return
      }

      // Load compounds for this developer
      const { data: compounds } = await supabase
        .from('compounds')
        .select(`
          id, 
          name, 
          total_units, 
          is_active,
          community_units!inner(
            id,
            occupancy_status
          )
        `)
        .eq('developer_id', developerId)

      // Load residents
      const { data: residents } = await supabase
        .from('compound_residents')
        .select(`
          id,
          verification_status,
          is_active,
          move_out_date,
          community_units!inner(
            compound_id,
            compounds!inner(
              developer_id
            )
          )
        `)
        .eq('community_units.compounds.developer_id', developerId)

      // Load fees
      const { data: fees } = await supabase
        .from('community_fees')
        .select(`
          amount,
          payment_status,
          created_at,
          community_units!inner(
            compound_id,
            compounds!inner(
              developer_id
            )
          )
        `)
        .eq('community_units.compounds.developer_id', developerId)

      // Load service requests
      const { data: serviceRequests } = await supabase
        .from('community_service_requests')
        .select(`
          request_status,
          created_at,
          community_units!inner(
            compound_id,
            compounds!inner(
              developer_id
            )
          )
        `)
        .eq('community_units.compounds.developer_id', developerId)

      // Load recent activity (announcements, etc.)
      const { data: announcements } = await supabase
        .from('community_announcements')
        .select(`
          id,
          title,
          announcement_type,
          created_at,
          compounds!inner(
            name,
            developer_id
          )
        `)
        .eq('compounds.developer_id', developerId)
        .order('created_at', { ascending: false })
        .limit(10)

      // Calculate statistics
      const totalCompounds = compounds?.length || 0
      const activeCompounds = compounds?.filter((c: any) => c.is_active).length || 0
      const totalUnits = compounds?.reduce((sum: number, c: any) => sum + c.total_units, 0) || 0
      const occupiedUnits = compounds?.reduce((sum: number, c: any) => 
        sum + c.community_units.filter((u: any) => u.occupancy_status !== 'vacant').length, 0
      ) || 0
      const totalResidents = residents?.filter((r: any) => r.is_active && !r.move_out_date).length || 0
      const verifiedResidents = residents?.filter((r: any) => 
        r.verification_status === 'approved' && r.is_active && !r.move_out_date
      ).length || 0

      const currentMonth = new Date().toISOString().slice(0, 7)
      const monthlyRevenue = fees?.filter((f: any) => 
        f.payment_status === 'paid' && f.created_at.startsWith(currentMonth)
      ).reduce((sum: number, f: any) => sum + f.amount, 0) || 0

      const pendingFees = fees?.filter((f: any) => f.payment_status === 'pending')
        .reduce((sum: number, f: any) => sum + f.amount, 0) || 0

      const openServiceRequests = serviceRequests?.filter((sr: any) => 
        ['submitted', 'acknowledged', 'in_progress'].includes(sr.request_status)
      ).length || 0

      const today = new Date().toISOString().slice(0, 10)
      const announcementsThisMonth = announcements?.filter((a: any) => 
        a.created_at.startsWith(currentMonth)
      ).length || 0

      // Build compound performance data
      const compoundPerformance = compounds?.map((compound: any) => {
        const compoundResidents = residents?.filter((r: any) => 
          r.community_units.compound_id === compound.id && r.is_active && !r.move_out_date
        ) || []
        
        const compoundFees = fees?.filter((f: any) => 
          f.community_units.compound_id === compound.id
        ) || []

        const compoundServiceRequests = serviceRequests?.filter((sr: any) => 
          sr.community_units.compound_id === compound.id
        ) || []

        const occupiedUnitsCount = compound.community_units.filter((u: any) => 
          u.occupancy_status !== 'vacant'
        ).length

        const monthlyFeesCollected = compoundFees.filter((f: any) => 
          f.payment_status === 'paid' && f.created_at.startsWith(currentMonth)
        ).reduce((sum: number, f: any) => sum + f.amount, 0)

        const compoundPendingFees = compoundFees.filter((f: any) => 
          f.payment_status === 'pending'
        ).reduce((sum: number, f: any) => sum + f.amount, 0)

        const resolvedRequests = compoundServiceRequests.filter((sr: any) => 
          sr.request_status === 'completed'
        ).length

        const pendingRequests = compoundServiceRequests.filter((sr: any) => 
          ['submitted', 'acknowledged', 'in_progress'].includes(sr.request_status)
        ).length

        return {
          compound_id: compound.id,
          compound_name: compound.name,
          total_units: compound.total_units,
          occupied_units: occupiedUnitsCount,
          occupancy_rate: compound.total_units > 0 ? (occupiedUnitsCount / compound.total_units) * 100 : 0,
          monthly_fees_collected: monthlyFeesCollected,
          pending_fees: compoundPendingFees,
          resident_satisfaction: 85, // Mock data - would be calculated from feedback
          service_requests_resolved: resolvedRequests,
          service_requests_pending: pendingRequests
        }
      }) || []

      // Build recent activity
      const recentActivity = announcements?.slice(0, 5).map((ann: any) => ({
        id: ann.id,
        type: 'announcement' as const,
        title: `New ${ann.announcement_type} announcement`,
        description: ann.title,
        compound_name: ann.compounds.name,
        created_at: ann.created_at
      })) || []

      // Financial overview
      const financialOverview = {
        total_monthly_fees: fees?.reduce((sum: number, f: any) => sum + f.amount, 0) || 0,
        collected_fees: fees?.filter((f: any) => f.payment_status === 'paid')
          .reduce((sum: number, f: any) => sum + f.amount, 0) || 0,
        pending_fees: pendingFees,
        collection_rate: fees?.length ? 
          (fees.filter((f: any) => f.payment_status === 'paid').length / fees.length) * 100 : 0,
        revenue_trend: [] // Would be populated with historical data
      }

      const dashboardData: DeveloperDashboardData = {
        developer,
        stats: {
          total_compounds: totalCompounds,
          active_compounds: activeCompounds,
          total_units: totalUnits,
          occupied_units: occupiedUnits,
          total_residents: totalResidents,
          verified_residents: verifiedResidents,
          monthly_revenue: monthlyRevenue,
          pending_fees: pendingFees,
          service_requests_open: openServiceRequests,
          visitor_passes_today: 0, // Mock data
          amenity_bookings_today: 0, // Mock data
          announcements_this_month: announcementsThisMonth
        },
        recent_activity: recentActivity,
        compound_performance: compoundPerformance,
        financial_overview: financialOverview
      }

      setDashboardData(dashboardData)
      
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error)
      alert('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'announcement': return Bell
      case 'compound_created': return Building2
      case 'resident_verified': return UserCheck
      case 'fee_paid': return DollarSign
      case 'service_request': return FileText
      default: return Activity
    }
  }

  // Show loading state during authorization check
  if (authorizationLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Verifying Access</h2>
          <p className="text-gray-600">Checking developer permissions...</p>
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
          <p className="text-gray-600">You don't have permission to access this developer dashboard.</p>
        </div>
      </div>
    )
  }

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const { developer, stats, recent_activity, compound_performance, financial_overview } = dashboardData

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              {developer.logo_url ? (
                <img 
                  src={developer.logo_url} 
                  alt={developer.company_name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {developer.company_name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{developer.company_name}</h1>
                <p className="text-gray-600">Developer Dashboard - {developer.contact_person_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                developer.subscription_tier === 'enterprise' ? 'bg-green-100 text-green-800' :
                developer.subscription_tier === 'growth' ? 'bg-purple-100 text-purple-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {developer.subscription_tier.charAt(0).toUpperCase() + developer.subscription_tier.slice(1)}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                developer.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                developer.subscription_status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {developer.subscription_status.charAt(0).toUpperCase() + developer.subscription_status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Compounds</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_compounds}</p>
                <p className="text-xs text-gray-500">of {stats.total_compounds} total</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Units Occupied</p>
                <p className="text-2xl font-bold text-gray-900">{stats.occupied_units.toLocaleString()}</p>
                <p className="text-xs text-gray-500">
                  {formatPercentage(stats.total_units > 0 ? (stats.occupied_units / stats.total_units) * 100 : 0)} occupancy
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Verified Residents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.verified_residents}</p>
                <p className="text-xs text-gray-500">of {stats.total_residents} total</p>
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
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthly_revenue)}</p>
                <p className="text-xs text-red-500">
                  {formatCurrency(stats.pending_fees)} pending
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Financial Overview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Financial Overview</h3>
                <PieChart className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(financial_overview.collected_fees)}
                  </div>
                  <div className="text-sm text-gray-600">Collected Fees</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {formatCurrency(financial_overview.pending_fees)}
                  </div>
                  <div className="text-sm text-gray-600">Pending Fees</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatPercentage(financial_overview.collection_rate)}
                  </div>
                  <div className="text-sm text-gray-600">Collection Rate</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  Total Portfolio Value: <span className="font-semibold">{formatCurrency(financial_overview.total_monthly_fees)}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              {recent_activity.length > 0 ? (
                recent_activity.map((activity) => {
                  const IconComponent = getActivityIcon(activity.type)
                  return (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                        {activity.compound_name && (
                          <p className="text-xs text-gray-500">{activity.compound_name}</p>
                        )}
                        <p className="text-xs text-gray-400">{formatDate(activity.created_at)}</p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Compound Performance */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Compound Performance</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => window.location.href = `/developer/${developerId}/compounds`}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Manage Compounds</span>
                </button>
                <button
                  onClick={() => window.location.href = `/developer/${developerId}/analytics`}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>View Analytics</span>
                </button>
              </div>
            </div>
            
            {compound_performance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border border-gray-200 rounded-lg">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Compound
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Occupancy
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monthly Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pending Fees
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service Requests
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Satisfaction
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {compound_performance.map((compound) => (
                      <tr key={compound.compound_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{compound.compound_name}</div>
                            <div className="text-sm text-gray-500">{compound.total_units} total units</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">
                              {compound.occupied_units}/{compound.total_units}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatPercentage(compound.occupancy_rate)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(compound.monthly_fees_collected)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-red-600">
                            {formatCurrency(compound.pending_fees)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-green-600">
                              {compound.service_requests_resolved} resolved
                            </div>
                            <div className="text-sm text-yellow-600">
                              {compound.service_requests_pending} pending
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 mr-1" />
                            <span className="text-sm text-gray-900">
                              {compound.resident_satisfaction}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No compounds found</p>
                <p className="text-sm text-gray-400">Create your first compound to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => window.location.href = `/manager/new?developer_id=${developerId}`}
                className="flex items-center justify-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Add Compound</span>
              </button>
              
              <button
                onClick={() => window.location.href = `/admin/residents?developer_id=${developerId}`}
                className="flex items-center justify-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Users className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Manage Residents</span>
              </button>
              
              <button
                onClick={() => window.location.href = `/developer/${developerId}/analytics`}
                className="flex items-center justify-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <BarChart3 className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">View Analytics</span>
              </button>
              
              <button
                onClick={() => window.location.href = `/settings/billing?developer_id=${developerId}`}
                className="flex items-center justify-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <CreditCard className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Billing Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}