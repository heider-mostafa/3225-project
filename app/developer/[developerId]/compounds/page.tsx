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
  PieChart,
  Map,
  Lock,
  Unlock,
  Timer,
  Zap,
  Target,
  TrendingDown,
  Trash2,
  Copy,
  Edit3,
  Save,
  X,
  Camera,
  Upload
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
  stats?: {
    occupied_units: number
    occupancy_rate: number
    active_residents: number
    pending_fees_total: number
    active_amenities: number
    pending_service_requests: number
    monthly_revenue: number
    satisfaction_score: number
  }
  manager_info?: {
    name: string
    email: string
    phone: string
    last_login?: string
  }
}

interface DeveloperCompoundsData {
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
  }
  compounds: Compound[]
  stats: {
    total_compounds: number
    active_compounds: number
    total_units: number
    occupied_units: number
    avg_occupancy_rate: number
    total_monthly_revenue: number
    total_pending_fees: number
    avg_satisfaction_score: number
  }
}

interface CreateCompoundForm {
  name: string
  address: string
  city: string
  district: string
  location_lat?: number
  location_lng?: number
  total_units: number
  total_area_sqm?: number
  handover_year?: number
  compound_type: 'residential' | 'mixed_use'
  management_company: string
  emergency_phone: string
  operating_hours_start: string
  operating_hours_end: string
  security_level: 'low' | 'medium' | 'high'
  manager_email: string
  manager_name: string
  manager_phone: string
}

export default function DeveloperCompounds() {
  const params = useParams()
  const developerId = params.developerId as string

  // State management
  const [compoundsData, setCompoundsData] = useState<DeveloperCompoundsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorizationLoading, setAuthorizationLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('user')
  const [isDeveloperUser, setIsDeveloperUser] = useState(false)
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [securityFilter, setSecurityFilter] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCompound, setEditingCompound] = useState<string | null>(null)
  
  // Form state
  const [createForm, setCreateForm] = useState<CreateCompoundForm>({
    name: '',
    address: '',
    city: '',
    district: '',
    location_lat: undefined,
    location_lng: undefined,
    total_units: 0,
    total_area_sqm: undefined,
    handover_year: undefined,
    compound_type: 'residential',
    management_company: '',
    emergency_phone: '',
    operating_hours_start: '08:00',
    operating_hours_end: '22:00',
    security_level: 'medium',
    manager_email: '',
    manager_name: '',
    manager_phone: ''
  })
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    const checkAuthorizationAndLoad = async () => {
      try {
        setAuthorizationLoading(true)
        
        console.log('🔒 Starting authorization verification for developer compounds')
        
        // Check 1: Verify user is logged in
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session) {
          console.error('❌ No valid session found')
          window.location.href = '/auth?redirectTo=/developer/' + developerId + '/compounds'
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
          'developer_compounds_accessed',
          'developer',
          developerId,
          { 
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            is_developer_user: hasDeveloperAccess
          }
        )
        
        await loadCompoundsData()
        
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

  const loadCompoundsData = async () => {
    if (!authorized) {
      console.log('🚫 Skipping compounds load - not authorized')
      return
    }
    
    try {
      console.log('📊 Loading developer compounds data...')
      
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

      // Load compounds for this developer with detailed information
      const { data: compounds, error: compoundsError } = await supabase
        .from('compounds')
        .select(`
          *,
          community_units!inner(
            id,
            unit_number,
            occupancy_status,
            compound_residents!left(
              id,
              is_active,
              move_out_date,
              verification_status
            )
          ),
          community_fees!inner(
            amount,
            payment_status,
            created_at,
            community_units!inner(
              compound_id
            )
          ),
          community_service_requests!inner(
            request_status,
            created_at,
            community_units!inner(
              compound_id
            )
          ),
          community_amenities!inner(
            id,
            is_active
          )
        `)
        .eq('developer_id', developerId)

      if (compoundsError) {
        console.error('❌ Error loading compounds:', compoundsError)
        setCompoundsData({
          developer,
          compounds: [],
          stats: {
            total_compounds: 0,
            active_compounds: 0,
            total_units: 0,
            occupied_units: 0,
            avg_occupancy_rate: 0,
            total_monthly_revenue: 0,
            total_pending_fees: 0,
            avg_satisfaction_score: 0
          }
        })
        return
      }

      // Process compounds with statistics
      const processedCompounds: Compound[] = compounds?.map((compound: any) => {
        const units = compound.community_units || []
        const fees = compound.community_fees || []
        const serviceRequests = compound.community_service_requests || []
        const amenities = compound.community_amenities || []

        const occupiedUnits = units.filter((unit: any) => unit.occupancy_status !== 'vacant').length
        const occupancyRate = units.length > 0 ? (occupiedUnits / units.length) * 100 : 0

        const activeResidents = units.reduce((count: number, unit: any) => {
          const activeResidentsInUnit = unit.compound_residents?.filter((resident: any) => 
            resident.is_active && !resident.move_out_date && resident.verification_status === 'approved'
          )?.length || 0
          return count + activeResidentsInUnit
        }, 0)

        const currentMonth = new Date().toISOString().slice(0, 7)
        const monthlyRevenue = fees
          .filter((fee: any) => fee.payment_status === 'paid' && fee.created_at.startsWith(currentMonth))
          .reduce((sum: number, fee: any) => sum + fee.amount, 0)

        const pendingFeesTotal = fees
          .filter((fee: any) => fee.payment_status === 'pending')
          .reduce((sum: number, fee: any) => sum + fee.amount, 0)

        const activeAmenities = amenities.filter((amenity: any) => amenity.is_active).length

        const pendingServiceRequests = serviceRequests
          .filter((sr: any) => ['submitted', 'acknowledged', 'in_progress'].includes(sr.request_status))
          .length

        return {
          ...compound,
          stats: {
            occupied_units: occupiedUnits,
            occupancy_rate: occupancyRate,
            active_residents: activeResidents,
            pending_fees_total: pendingFeesTotal,
            active_amenities: activeAmenities,
            pending_service_requests: pendingServiceRequests,
            monthly_revenue: monthlyRevenue,
            satisfaction_score: 85 // Mock data - would be calculated from feedback
          }
        }
      }) || []

      // Calculate overall statistics
      const totalCompounds = processedCompounds.length
      const activeCompounds = processedCompounds.filter((c: any) => c.is_active).length
      const totalUnits = processedCompounds.reduce((sum: number, c: any) => sum + c.total_units, 0)
      const occupiedUnits = processedCompounds.reduce((sum: number, c: any) => sum + (c.stats?.occupied_units || 0), 0)
      const avgOccupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0
      const totalMonthlyRevenue = processedCompounds.reduce((sum: number, c: any) => sum + (c.stats?.monthly_revenue || 0), 0)
      const totalPendingFees = processedCompounds.reduce((sum: number, c: any) => sum + (c.stats?.pending_fees_total || 0), 0)
      const avgSatisfactionScore = processedCompounds.length > 0 
        ? processedCompounds.reduce((sum: number, c: any) => sum + (c.stats?.satisfaction_score || 0), 0) / processedCompounds.length 
        : 0

      const compoundsData: DeveloperCompoundsData = {
        developer,
        compounds: processedCompounds,
        stats: {
          total_compounds: totalCompounds,
          active_compounds: activeCompounds,
          total_units: totalUnits,
          occupied_units: occupiedUnits,
          avg_occupancy_rate: avgOccupancyRate,
          total_monthly_revenue: totalMonthlyRevenue,
          total_pending_fees: totalPendingFees,
          avg_satisfaction_score: avgSatisfactionScore
        }
      }

      setCompoundsData(compoundsData)
      
    } catch (error) {
      console.error('❌ Error loading compounds data:', error)
      alert('Failed to load compounds data.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCompound = async () => {
    if (!createForm.name || !createForm.address || !createForm.city || !createForm.total_units) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setFormLoading(true)
      
      // Create compound
      const { data: compoundData, error: compoundError } = await supabase
        .from('compounds')
        .insert({
          developer_id: developerId,
          name: createForm.name,
          address: createForm.address,
          city: createForm.city,
          district: createForm.district || null,
          location_lat: createForm.location_lat || null,
          location_lng: createForm.location_lng || null,
          total_units: createForm.total_units,
          total_area_sqm: createForm.total_area_sqm || null,
          handover_year: createForm.handover_year || null,
          compound_type: createForm.compound_type,
          management_company: createForm.management_company || null,
          emergency_phone: createForm.emergency_phone || null,
          operating_hours_start: createForm.operating_hours_start,
          operating_hours_end: createForm.operating_hours_end,
          security_level: createForm.security_level,
          is_active: true,
          branding_config: {},
          notification_settings: {}
        })
        .select()
        .single()

      if (compoundError) {
        console.error('❌ Error creating compound:', compoundError)
        alert('Failed to create compound: ' + compoundError.message)
        return
      }

      // If manager email provided, create manager user role
      if (createForm.manager_email && compoundData) {
        // Check if user exists with this email
        const { data: existingUser } = await supabase
          .from('auth.users')
          .select('id')
          .eq('email', createForm.manager_email)
          .single()

        if (existingUser) {
          // Create user role for compound manager
          await supabase
            .from('user_roles')
            .insert({
              user_id: existingUser.id,
              role: 'compound_manager',
              compound_id: compoundData.id,
              is_active: true
            })

          // Update compound with manager
          await supabase
            .from('compounds')
            .update({ compound_manager_user_id: existingUser.id })
            .eq('id', compoundData.id)
        }
      }

      // Log the activity
      await logAdminActivity(
        'compound_created',
        'compound',
        compoundData.id,
        { 
          developer_id: developerId,
          compound_name: createForm.name,
          total_units: createForm.total_units,
          created_by: currentUserRole
        }
      )

      alert('Compound created successfully!')
      setShowCreateForm(false)
      setCreateForm({
        name: '',
        address: '',
        city: '',
        district: '',
        location_lat: undefined,
        location_lng: undefined,
        total_units: 0,
        total_area_sqm: undefined,
        handover_year: undefined,
        compound_type: 'residential',
        management_company: '',
        emergency_phone: '',
        operating_hours_start: '08:00',
        operating_hours_end: '22:00',
        security_level: 'medium',
        manager_email: '',
        manager_name: '',
        manager_phone: ''
      })
      
      // Reload data
      await loadCompoundsData()
      
    } catch (error) {
      console.error('❌ Error in compound creation:', error)
      alert('An unexpected error occurred while creating the compound.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleToggleCompoundStatus = async (compoundId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('compounds')
        .update({ is_active: !currentStatus })
        .eq('id', compoundId)

      if (error) {
        console.error('❌ Error updating compound status:', error)
        alert('Failed to update compound status')
        return
      }

      await logAdminActivity(
        currentStatus ? 'compound_deactivated' : 'compound_activated',
        'compound',
        compoundId,
        { developer_id: developerId }
      )

      await loadCompoundsData()
    } catch (error) {
      console.error('❌ Error toggling compound status:', error)
    }
  }

  // Filter compounds based on search and filters
  const filteredCompounds = compoundsData?.compounds.filter((compound: any) => {
    const matchesSearch = !searchTerm || 
      compound.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      compound.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      compound.city.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || compound.compound_type === typeFilter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && compound.is_active) ||
      (statusFilter === 'inactive' && !compound.is_active)
    const matchesSecurity = securityFilter === 'all' || compound.security_level === securityFilter
    
    return matchesSearch && matchesType && matchesStatus && matchesSecurity
  }) || []

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

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSecurityLevelIcon = (level: string) => {
    switch (level) {
      case 'high': return ShieldCheck
      case 'medium': return Shield
      case 'low': return Lock
      default: return Shield
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
          <p className="text-gray-600">You don't have permission to access this developer's compounds.</p>
        </div>
      </div>
    )
  }

  if (loading || !compoundsData) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const { developer, compounds, stats } = compoundsData

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
                <h1 className="text-2xl font-bold text-gray-900">Compound Management</h1>
                <p className="text-gray-600">{developer.company_name} - Portfolio Overview</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <button
                onClick={() => window.location.href = `/developer/${developerId}/dashboard`}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Compound</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
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
                <p className="text-sm text-gray-600">Avg Occupancy</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(stats.avg_occupancy_rate)}</p>
                <p className="text-xs text-gray-500">{stats.occupied_units} of {stats.total_units} units</p>
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
                <p className="text-xs text-red-500">{formatCurrency(stats.total_pending_fees)} pending</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(stats.avg_satisfaction_score)}</p>
                <p className="text-xs text-gray-500">across all compounds</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search compounds..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="residential">Residential</option>
              <option value="mixed_use">Mixed Use</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            
            <select
              value={securityFilter}
              onChange={(e) => setSecurityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Security</option>
              <option value="high">High Security</option>
              <option value="medium">Medium Security</option>
              <option value="low">Low Security</option>
            </select>
          </div>
        </div>

        {/* Compounds List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Compounds ({filteredCompounds.length})</h3>
          </div>
          
          {filteredCompounds.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredCompounds.map((compound: any) => {
                const SecurityIcon = getSecurityLevelIcon(compound.security_level)
                return (
                  <div key={compound.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">{compound.name}</h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            compound.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {compound.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSecurityLevelColor(compound.security_level)}`}>
                            <SecurityIcon className="w-3 h-3 mr-1" />
                            {compound.security_level} security
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            compound.compound_type === 'residential' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {compound.compound_type.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{compound.address}, {compound.city}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Building className="w-4 h-4" />
                            <span>{compound.total_units} units</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{compound.operating_hours_start} - {compound.operating_hours_end}</span>
                          </div>
                        </div>
                        
                        {/* Performance Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-lg font-bold text-gray-900">{formatPercentage(compound.stats?.occupancy_rate || 0)}</div>
                            <div className="text-xs text-gray-600">Occupancy</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-lg font-bold text-green-600">{formatCurrency(compound.stats?.monthly_revenue || 0)}</div>
                            <div className="text-xs text-gray-600">Monthly Revenue</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-lg font-bold text-blue-600">{compound.stats?.active_residents || 0}</div>
                            <div className="text-xs text-gray-600">Active Residents</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-lg font-bold text-purple-600">{compound.stats?.satisfaction_score || 0}%</div>
                            <div className="text-xs text-gray-600">Satisfaction</div>
                          </div>
                        </div>
                        
                        {/* Warning indicators */}
                        <div className="flex items-center space-x-4 text-sm">
                          {(compound.stats?.pending_fees_total || 0) > 0 && (
                            <div className="flex items-center space-x-1 text-red-600">
                              <AlertTriangle className="w-4 h-4" />
                              <span>{formatCurrency(compound.stats?.pending_fees_total)} pending fees</span>
                            </div>
                          )}
                          {(compound.stats?.pending_service_requests || 0) > 0 && (
                            <div className="flex items-center space-x-1 text-yellow-600">
                              <FileText className="w-4 h-4" />
                              <span>{compound.stats?.pending_service_requests} open requests</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => window.location.href = `/manager/${compound.id}/dashboard`}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Manage</span>
                        </button>
                        
                        <button
                          onClick={() => handleToggleCompoundStatus(compound.id, compound.is_active)}
                          className={`px-3 py-2 rounded-lg text-sm flex items-center space-x-2 ${
                            compound.is_active 
                              ? 'bg-red-100 hover:bg-red-200 text-red-700' 
                              : 'bg-green-100 hover:bg-green-200 text-green-700'
                          }`}
                        >
                          {compound.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          <span>{compound.is_active ? 'Deactivate' : 'Activate'}</span>
                        </button>
                        
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No compounds found</p>
              {compounds.length === 0 ? (
                <p className="text-sm text-gray-400">Create your first compound to get started</p>
              ) : (
                <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Compound Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Create New Compound</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Compound Name *</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Mountain View Compound"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Units *</label>
                  <input
                    type="number"
                    value={createForm.total_units}
                    onChange={(e) => setCreateForm({...createForm, total_units: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 150"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                <input
                  type="text"
                  value={createForm.address}
                  onChange={(e) => setCreateForm({...createForm, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Full address including street and district"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    value={createForm.city}
                    onChange={(e) => setCreateForm({...createForm, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Cairo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                  <input
                    type="text"
                    value={createForm.district}
                    onChange={(e) => setCreateForm({...createForm, district: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., New Cairo"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Compound Type</label>
                  <select
                    value={createForm.compound_type}
                    onChange={(e) => setCreateForm({...createForm, compound_type: e.target.value as 'residential' | 'mixed_use'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="residential">Residential</option>
                    <option value="mixed_use">Mixed Use</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Security Level</label>
                  <select
                    value={createForm.security_level}
                    onChange={(e) => setCreateForm({...createForm, security_level: e.target.value as 'low' | 'medium' | 'high'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Handover Year</label>
                  <input
                    type="number"
                    value={createForm.handover_year || ''}
                    onChange={(e) => setCreateForm({...createForm, handover_year: parseInt(e.target.value) || undefined})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 2024"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Operating Hours Start</label>
                  <input
                    type="time"
                    value={createForm.operating_hours_start}
                    onChange={(e) => setCreateForm({...createForm, operating_hours_start: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Operating Hours End</label>
                  <input
                    type="time"
                    value={createForm.operating_hours_end}
                    onChange={(e) => setCreateForm({...createForm, operating_hours_end: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Management Company</label>
                  <input
                    type="text"
                    value={createForm.management_company}
                    onChange={(e) => setCreateForm({...createForm, management_company: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., ABC Property Management"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Phone</label>
                  <input
                    type="tel"
                    value={createForm.emergency_phone}
                    onChange={(e) => setCreateForm({...createForm, emergency_phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., +20 10 1234 5678"
                  />
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Compound Manager (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Manager Name</label>
                    <input
                      type="text"
                      value={createForm.manager_name}
                      onChange={(e) => setCreateForm({...createForm, manager_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Manager Email</label>
                    <input
                      type="email"
                      value={createForm.manager_email}
                      onChange={(e) => setCreateForm({...createForm, manager_email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="manager@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Manager Phone</label>
                    <input
                      type="tel"
                      value={createForm.manager_phone}
                      onChange={(e) => setCreateForm({...createForm, manager_phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="+20 10 1234 5678"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={formLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCompound}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2"
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Create Compound</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}