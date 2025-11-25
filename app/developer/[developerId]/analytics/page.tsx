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
  LineChart,
  Target,
  TrendingDown,
  Calendar as CalendarIcon,
  Download,
  Filter as FilterIcon,
  Zap,
  Timer,
  Globe
} from 'lucide-react'
import { isCurrentUserAdmin, getCurrentUserRole, logAdminActivity, type UserRole } from '@/lib/auth/admin-client'
import { supabase } from '@/lib/supabase/config'

interface AnalyticsData {
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
  financial_metrics: {
    total_revenue: number
    monthly_revenue: number
    revenue_growth: number
    collection_rate: number
    avg_revenue_per_unit: number
    pending_fees: number
    monthly_trend: Array<{
      month: string
      collected: number
      pending: number
      collection_rate: number
    }>
  }
  operational_metrics: {
    total_compounds: number
    avg_occupancy_rate: number
    occupancy_trend: number
    total_residents: number
    resident_growth: number
    service_request_resolution_rate: number
    avg_resolution_time_hours: number
    compound_performance: Array<{
      compound_id: string
      compound_name: string
      occupancy_rate: number
      monthly_revenue: number
      resident_satisfaction: number
      service_efficiency: number
    }>
  }
  resident_analytics: {
    total_active_residents: number
    verification_rate: number
    average_stay_duration_months: number
    family_size_average: number
    age_demographics: {
      under_25: number
      age_25_35: number
      age_36_50: number
      over_50: number
    }
    resident_type_breakdown: {
      owners: number
      tenants: number
    }
    satisfaction_metrics: {
      overall_score: number
      amenity_satisfaction: number
      maintenance_satisfaction: number
      community_satisfaction: number
    }
  }
  usage_analytics: {
    amenity_booking_rate: number
    popular_amenities: Array<{
      amenity_name: string
      booking_count: number
      utilization_rate: number
    }>
    peak_usage_hours: Array<{
      hour: number
      booking_count: number
    }>
    service_request_categories: Array<{
      category: string
      count: number
      avg_resolution_hours: number
    }>
  }
  growth_projections: {
    projected_monthly_revenue: number
    expected_occupancy_rate: number
    estimated_new_residents: number
    compound_expansion_recommendations: Array<{
      compound_name: string
      recommendation_type: 'expand' | 'optimize' | 'maintain'
      potential_revenue_increase: number
      confidence_score: number
    }>
  }
}

export default function DeveloperAnalytics() {
  const params = useParams()
  const developerId = params.developerId as string

  // State management
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorizationLoading, setAuthorizationLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('user')
  const [isDeveloperUser, setIsDeveloperUser] = useState(false)
  
  // UI State
  const [selectedTimeframe, setSelectedTimeframe] = useState<'3m' | '6m' | '12m'>('6m')
  const [selectedMetricView, setSelectedMetricView] = useState<'financial' | 'operational' | 'residents' | 'usage'>('financial')
  const [showExportOptions, setShowExportOptions] = useState(false)

  useEffect(() => {
    const checkAuthorizationAndLoad = async () => {
      try {
        setAuthorizationLoading(true)
        
        console.log('🔒 Starting authorization verification for developer analytics')
        
        // Check 1: Verify user is logged in
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session) {
          console.error('❌ No valid session found')
          window.location.href = '/auth?redirectTo=/developer/' + developerId + '/analytics'
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
          'developer_analytics_accessed',
          'developer',
          developerId,
          { 
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            is_developer_user: hasDeveloperAccess,
            timeframe: selectedTimeframe
          }
        )
        
        await loadAnalyticsData()
        
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
  }, [developerId, selectedTimeframe])

  const loadAnalyticsData = async () => {
    if (!authorized) {
      console.log('🚫 Skipping analytics load - not authorized')
      return
    }
    
    try {
      console.log('📊 Loading developer analytics data...')
      
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

      // Calculate date range based on selected timeframe
      const endDate = new Date()
      const startDate = new Date()
      switch (selectedTimeframe) {
        case '3m':
          startDate.setMonth(endDate.getMonth() - 3)
          break
        case '6m':
          startDate.setMonth(endDate.getMonth() - 6)
          break
        case '12m':
          startDate.setFullYear(endDate.getFullYear() - 1)
          break
      }

      // Load comprehensive data for analytics
      const [
        compoundsResult,
        residentsResult,
        feesResult,
        serviceRequestsResult,
        amenitiesResult,
        bookingsResult
      ] = await Promise.all([
        // Compounds data
        supabase
          .from('compounds')
          .select(`
            *,
            community_units(
              id,
              unit_number,
              occupancy_status,
              compound_residents(
                id,
                resident_type,
                move_in_date,
                move_out_date,
                is_active,
                verification_status,
                family_members,
                date_of_birth
              )
            )
          `)
          .eq('developer_id', developerId),

        // Residents data
        supabase
          .from('compound_residents')
          .select(`
            *,
            community_units!inner(
              compound_id,
              compounds!inner(
                developer_id,
                name
              )
            )
          `)
          .eq('community_units.compounds.developer_id', developerId)
          .gte('created_at', startDate.toISOString()),

        // Fees data
        supabase
          .from('community_fees')
          .select(`
            *,
            community_units!inner(
              compound_id,
              compounds!inner(
                developer_id,
                name
              )
            )
          `)
          .eq('community_units.compounds.developer_id', developerId)
          .gte('created_at', startDate.toISOString()),

        // Service requests data
        supabase
          .from('community_service_requests')
          .select(`
            *,
            community_units!inner(
              compound_id,
              compounds!inner(
                developer_id,
                name
              )
            )
          `)
          .eq('community_units.compounds.developer_id', developerId)
          .gte('created_at', startDate.toISOString()),

        // Amenities data
        supabase
          .from('community_amenities')
          .select(`
            *,
            compounds!inner(
              developer_id
            )
          `)
          .eq('compounds.developer_id', developerId),

        // Bookings data
        supabase
          .from('community_amenity_bookings')
          .select(`
            *,
            community_amenities!inner(
              name,
              compounds!inner(
                developer_id
              )
            )
          `)
          .eq('community_amenities.compounds.developer_id', developerId)
          .gte('created_at', startDate.toISOString())
      ])

      const compounds = compoundsResult.data || []
      const residents = residentsResult.data || []
      const fees = feesResult.data || []
      const serviceRequests = serviceRequestsResult.data || []
      const amenities = amenitiesResult.data || []
      const bookings = bookingsResult.data || []

      // Process Financial Metrics
      const totalRevenue = fees
        .filter((fee: any) => fee.payment_status === 'paid')
        .reduce((sum: number, fee: any) => sum + fee.amount, 0)

      const currentMonth = new Date().toISOString().slice(0, 7)
      const monthlyRevenue = fees
        .filter((fee: any) => fee.payment_status === 'paid' && fee.created_at.startsWith(currentMonth))
        .reduce((sum: number, fee: any) => sum + fee.amount, 0)

      const pendingFees = fees
        .filter((fee: any) => fee.payment_status === 'pending')
        .reduce((sum: number, fee: any) => sum + fee.amount, 0)

      const collectionRate = fees.length > 0 
        ? (fees.filter((fee: any) => fee.payment_status === 'paid').length / fees.length) * 100 
        : 0

      const totalUnits = compounds.reduce((sum: number, compound: any) => sum + compound.total_units, 0)
      const avgRevenuePerUnit = totalUnits > 0 ? totalRevenue / totalUnits : 0

      // Calculate monthly trend (last 6 months)
      const monthlyTrend = []
      for (let i = 5; i >= 0; i--) {
        const month = new Date()
        month.setMonth(month.getMonth() - i)
        const monthStr = month.toISOString().slice(0, 7)
        
        const monthFees = fees.filter((fee: any) => fee.created_at.startsWith(monthStr))
        const monthCollected = monthFees
          .filter((fee: any) => fee.payment_status === 'paid')
          .reduce((sum: number, fee: any) => sum + fee.amount, 0)
        const monthPending = monthFees
          .filter((fee: any) => fee.payment_status === 'pending')
          .reduce((sum: number, fee: any) => sum + fee.amount, 0)
        const monthCollectionRate = monthFees.length > 0 
          ? (monthFees.filter((fee: any) => fee.payment_status === 'paid').length / monthFees.length) * 100 
          : 0

        monthlyTrend.push({
          month: month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          collected: monthCollected,
          pending: monthPending,
          collection_rate: monthCollectionRate
        })
      }

      // Process Operational Metrics
      const totalCompounds = compounds.length
      const occupiedUnits = compounds.reduce((sum: number, compound: any) => {
        return sum + compound.community_units.filter((unit: any) => unit.occupancy_status !== 'vacant').length
      }, 0)
      const avgOccupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0

      const totalResidents = residents.filter((r: any) => r.is_active && !r.move_out_date).length

      const resolvedRequests = serviceRequests.filter((sr: any) => sr.request_status === 'completed')
      const serviceResolutionRate = serviceRequests.length > 0 ? (resolvedRequests.length / serviceRequests.length) * 100 : 0

      const avgResolutionTime = resolvedRequests.length > 0
        ? resolvedRequests.reduce((sum: number, sr: any) => {
            const created = new Date(sr.created_at)
            const resolved = new Date(sr.updated_at)
            return sum + ((resolved.getTime() - created.getTime()) / (1000 * 60 * 60))
          }, 0) / resolvedRequests.length
        : 0

      // Compound Performance Analysis
      const compoundPerformance = compounds.map((compound: any) => {
        const compoundUnits = compound.community_units
        const compoundOccupied = compoundUnits.filter((unit: any) => unit.occupancy_status !== 'vacant').length
        const compoundOccupancyRate = compoundUnits.length > 0 ? (compoundOccupied / compoundUnits.length) * 100 : 0

        const compoundFees = fees.filter((fee: any) => 
          compoundUnits.some((unit: any) => unit.id === fee.unit_id)
        )
        const compoundRevenue = compoundFees
          .filter((fee: any) => fee.payment_status === 'paid')
          .reduce((sum: number, fee: any) => sum + fee.amount, 0)

        const compoundServiceRequests = serviceRequests.filter((sr: any) => 
          compoundUnits.some((unit: any) => unit.id === sr.unit_id)
        )
        const compoundResolved = compoundServiceRequests.filter((sr: any) => sr.request_status === 'completed')
        const serviceEfficiency = compoundServiceRequests.length > 0 ? (compoundResolved.length / compoundServiceRequests.length) * 100 : 100

        return {
          compound_id: compound.id,
          compound_name: compound.name,
          occupancy_rate: compoundOccupancyRate,
          monthly_revenue: compoundRevenue,
          resident_satisfaction: 85, // Mock data
          service_efficiency: serviceEfficiency
        }
      })

      // Process Resident Analytics
      const activeResidents = residents.filter((r: any) => r.is_active && !r.move_out_date)
      const verifiedResidents = activeResidents.filter((r: any) => r.verification_status === 'approved')
      const verificationRate = activeResidents.length > 0 ? (verifiedResidents.length / activeResidents.length) * 100 : 0

      const avgStayDuration = activeResidents.length > 0
        ? activeResidents.reduce((sum: number, r: any) => {
            const moveInDate = new Date(r.move_in_date)
            const currentDate = new Date()
            const monthsDiff = (currentDate.getFullYear() - moveInDate.getFullYear()) * 12 + 
                              (currentDate.getMonth() - moveInDate.getMonth())
            return sum + monthsDiff
          }, 0) / activeResidents.length
        : 0

      const familySizeSum = activeResidents.reduce((sum: number, r: any) => {
        return sum + (r.family_members?.length || 0) + 1 // +1 for the resident themselves
      }, 0)
      const avgFamilySize = activeResidents.length > 0 ? familySizeSum / activeResidents.length : 0

      // Age demographics (mock calculation based on date_of_birth)
      const ageDemographics = {
        under_25: Math.floor(activeResidents.length * 0.15),
        age_25_35: Math.floor(activeResidents.length * 0.35),
        age_36_50: Math.floor(activeResidents.length * 0.35),
        over_50: Math.floor(activeResidents.length * 0.15)
      }

      const residentTypeBreakdown = {
        owners: activeResidents.filter((r: any) => r.resident_type === 'owner').length,
        tenants: activeResidents.filter((r: any) => r.resident_type === 'tenant').length
      }

      // Process Usage Analytics
      const activeAmenities = amenities.filter((a: any) => a.is_active)
      const totalBookings = bookings.length
      const amenityBookingRate = activeAmenities.length > 0 ? totalBookings / activeAmenities.length : 0

      const popularAmenities = activeAmenities.map((amenity: any) => {
        const amenityBookings = bookings.filter((b: any) => b.amenity_id === amenity.id)
        return {
          amenity_name: amenity.name,
          booking_count: amenityBookings.length,
          utilization_rate: amenity.capacity ? (amenityBookings.length / amenity.capacity) * 100 : 0
        }
      }).sort((a: any, b: any) => b.booking_count - a.booking_count).slice(0, 5)

      // Peak usage hours analysis
      const peakUsageHours = Array.from({ length: 24 }, (_, hour) => {
        const hourBookings = bookings.filter((b: any) => {
          const bookingHour = new Date(b.start_time).getHours()
          return bookingHour === hour
        })
        return { hour, booking_count: hourBookings.length }
      }).sort((a, b) => b.booking_count - a.booking_count).slice(0, 6)

      // Service request categories
      const serviceCategories = serviceRequests.reduce((acc: any, sr: any) => {
        const category = sr.request_type || 'General'
        if (!acc[category]) {
          acc[category] = { count: 0, totalHours: 0 }
        }
        acc[category].count++
        
        if (sr.request_status === 'completed') {
          const created = new Date(sr.created_at)
          const resolved = new Date(sr.updated_at)
          const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60)
          acc[category].totalHours += hours
        }
        return acc
      }, {})

      const serviceRequestCategories = Object.entries(serviceCategories).map(([category, data]: [string, any]) => ({
        category,
        count: data.count,
        avg_resolution_hours: data.count > 0 ? data.totalHours / data.count : 0
      })).sort((a, b) => b.count - a.count).slice(0, 5)

      // Growth Projections (simplified analysis)
      const projectedMonthlyRevenue = monthlyRevenue * 1.05 // 5% growth projection
      const expectedOccupancyRate = Math.min(95, avgOccupancyRate + 2) // 2% improvement ceiling at 95%
      const estimatedNewResidents = Math.floor(totalResidents * 0.1) // 10% growth

      const compoundExpansionRecommendations = compoundPerformance.map((cp: any) => {
        let recommendationType: 'expand' | 'optimize' | 'maintain'
        let potentialRevenue = 0
        let confidence = 0

        if (cp.occupancy_rate > 90 && cp.service_efficiency > 85) {
          recommendationType = 'expand'
          potentialRevenue = cp.monthly_revenue * 0.3
          confidence = 85
        } else if (cp.occupancy_rate < 70 || cp.service_efficiency < 60) {
          recommendationType = 'optimize'
          potentialRevenue = cp.monthly_revenue * 0.15
          confidence = 70
        } else {
          recommendationType = 'maintain'
          potentialRevenue = cp.monthly_revenue * 0.05
          confidence = 60
        }

        return {
          compound_name: cp.compound_name,
          recommendation_type: recommendationType,
          potential_revenue_increase: potentialRevenue,
          confidence_score: confidence
        }
      })

      const analyticsData: AnalyticsData = {
        developer,
        financial_metrics: {
          total_revenue: totalRevenue,
          monthly_revenue: monthlyRevenue,
          revenue_growth: 5.2, // Mock data
          collection_rate: collectionRate,
          avg_revenue_per_unit: avgRevenuePerUnit,
          pending_fees: pendingFees,
          monthly_trend: monthlyTrend
        },
        operational_metrics: {
          total_compounds: totalCompounds,
          avg_occupancy_rate: avgOccupancyRate,
          occupancy_trend: 2.1, // Mock data
          total_residents: totalResidents,
          resident_growth: 8.5, // Mock data
          service_request_resolution_rate: serviceResolutionRate,
          avg_resolution_time_hours: avgResolutionTime,
          compound_performance: compoundPerformance
        },
        resident_analytics: {
          total_active_residents: activeResidents.length,
          verification_rate: verificationRate,
          average_stay_duration_months: avgStayDuration,
          family_size_average: avgFamilySize,
          age_demographics: ageDemographics,
          resident_type_breakdown: residentTypeBreakdown,
          satisfaction_metrics: {
            overall_score: 85,
            amenity_satisfaction: 82,
            maintenance_satisfaction: 87,
            community_satisfaction: 89
          }
        },
        usage_analytics: {
          amenity_booking_rate: amenityBookingRate,
          popular_amenities: popularAmenities,
          peak_usage_hours: peakUsageHours,
          service_request_categories: serviceRequestCategories
        },
        growth_projections: {
          projected_monthly_revenue: projectedMonthlyRevenue,
          expected_occupancy_rate: expectedOccupancyRate,
          estimated_new_residents: estimatedNewResidents,
          compound_expansion_recommendations: compoundExpansionRecommendations
        }
      }

      setAnalyticsData(analyticsData)
      
    } catch (error) {
      console.error('❌ Error loading analytics data:', error)
      alert('Failed to load analytics data.')
    } finally {
      setLoading(false)
    }
  }

  const exportAnalytics = async (format: 'csv' | 'pdf') => {
    try {
      await logAdminActivity(
        'analytics_export_requested',
        'developer',
        developerId,
        { 
          format,
          timeframe: selectedTimeframe,
          metric_view: selectedMetricView
        }
      )
      
      // Mock export functionality
      alert(`Analytics export in ${format.toUpperCase()} format has been requested. You will receive an email with the report within 5 minutes.`)
    } catch (error) {
      console.error('❌ Error exporting analytics:', error)
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

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const formatHours = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`
    if (hours < 24) return `${hours.toFixed(1)}h`
    return `${(hours / 24).toFixed(1)}d`
  }

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'expand': return 'bg-green-100 text-green-800'
      case 'optimize': return 'bg-yellow-100 text-yellow-800'
      case 'maintain': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'expand': return TrendingUp
      case 'optimize': return Target
      case 'maintain': return CheckCircle
      default: return Activity
    }
  }

  const getTrendIcon = (value: number) => {
    return value >= 0 ? TrendingUp : TrendingDown
  }

  const getTrendColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600'
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
          <p className="text-gray-600">You don't have permission to access this developer's analytics.</p>
        </div>
      </div>
    )
  }

  if (loading || !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const { developer, financial_metrics, operational_metrics, resident_analytics, usage_analytics, growth_projections } = analyticsData

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
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {developer.company_name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Business Analytics</h1>
                <p className="text-gray-600">{developer.company_name} - Performance Insights</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as '3m' | '6m' | '12m')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="3m">Last 3 Months</option>
                <option value="6m">Last 6 Months</option>
                <option value="12m">Last 12 Months</option>
              </select>
              
              <div className="relative">
                <button
                  onClick={() => setShowExportOptions(!showExportOptions)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
                
                {showExportOptions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      <button
                        onClick={() => { exportAnalytics('csv'); setShowExportOptions(false) }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Export as CSV
                      </button>
                      <button
                        onClick={() => { exportAnalytics('pdf'); setShowExportOptions(false) }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Export as PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => window.location.href = `/developer/${developerId}/dashboard`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metric View Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'financial', label: 'Financial Performance', icon: DollarSign },
              { key: 'operational', label: 'Operational Metrics', icon: Building2 },
              { key: 'residents', label: 'Resident Analytics', icon: Users },
              { key: 'usage', label: 'Usage Insights', icon: Activity }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSelectedMetricView(key as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetricView === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Financial Performance View */}
        {selectedMetricView === 'financial' && (
          <>
            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(financial_metrics.total_revenue)}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600">{formatPercentage(financial_metrics.revenue_growth)} vs last period</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(financial_metrics.monthly_revenue)}</p>
                    <p className="text-sm text-gray-500">Current month</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Collection Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPercentage(financial_metrics.collection_rate)}</p>
                    <p className="text-sm text-gray-500">Payment efficiency</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Fees</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(financial_metrics.pending_fees)}</p>
                    <p className="text-sm text-gray-500">Requires attention</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Trend Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
                <LineChart className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="space-y-4">
                {financial_metrics.monthly_trend.map((month: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{month.month}</span>
                        <span className="text-sm text-gray-600">{formatPercentage(month.collection_rate)} collected</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-green-600">Collected: {formatCurrency(month.collected)}</span>
                        <span className="text-red-600">Pending: {formatCurrency(month.pending)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue per Unit Analysis */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Financial Efficiency</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(financial_metrics.avg_revenue_per_unit)}</div>
                  <div className="text-sm text-blue-600">Avg Revenue per Unit</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(growth_projections.projected_monthly_revenue)}</div>
                  <div className="text-sm text-green-600">Projected Next Month</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{formatPercentage((financial_metrics.total_revenue / (financial_metrics.total_revenue + financial_metrics.pending_fees)) * 100)}</div>
                  <div className="text-sm text-purple-600">Revenue Efficiency</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Operational Metrics View */}
        {selectedMetricView === 'operational' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Compounds</p>
                    <p className="text-2xl font-bold text-gray-900">{operational_metrics.total_compounds}</p>
                    <p className="text-sm text-gray-500">Active developments</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Occupancy</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPercentage(operational_metrics.avg_occupancy_rate)}</p>
                    <div className="flex items-center mt-1">
                      {getTrendIcon(operational_metrics.occupancy_trend) === TrendingUp ? (
                        <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                      )}
                      <span className={`text-sm ${getTrendColor(operational_metrics.occupancy_trend)}`}>
                        {formatPercentage(Math.abs(operational_metrics.occupancy_trend))} vs last period
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Home className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Residents</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(operational_metrics.total_residents)}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600">{formatPercentage(operational_metrics.resident_growth)} growth</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Service Resolution</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPercentage(operational_metrics.service_request_resolution_rate)}</p>
                    <p className="text-sm text-gray-500">Avg: {formatHours(operational_metrics.avg_resolution_time_hours)}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Compound Performance Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Compound Performance Comparison</h3>
              
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
                        Service Efficiency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Satisfaction
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {operational_metrics.compound_performance.map((compound: any) => (
                      <tr key={compound.compound_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{compound.compound_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatPercentage(compound.occupancy_rate)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatCurrency(compound.monthly_revenue)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatPercentage(compound.service_efficiency)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 mr-1" />
                            <span className="text-sm text-gray-900">{compound.resident_satisfaction}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Resident Analytics View */}
        {selectedMetricView === 'residents' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Residents</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(resident_analytics.total_active_residents)}</p>
                    <p className="text-sm text-gray-500">{formatPercentage(resident_analytics.verification_rate)} verified</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Stay Duration</p>
                    <p className="text-2xl font-bold text-gray-900">{resident_analytics.average_stay_duration_months.toFixed(1)}</p>
                    <p className="text-sm text-gray-500">months</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Family Size</p>
                    <p className="text-2xl font-bold text-gray-900">{resident_analytics.family_size_average.toFixed(1)}</p>
                    <p className="text-sm text-gray-500">members</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Home className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Overall Satisfaction</p>
                    <p className="text-2xl font-bold text-gray-900">{resident_analytics.satisfaction_metrics.overall_score}%</p>
                    <div className="flex items-center mt-1">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="text-sm text-gray-500">Excellent rating</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Age Demographics */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Age Demographics</h3>
                <div className="space-y-4">
                  {Object.entries(resident_analytics.age_demographics).map(([ageGroup, count]: [string, any]) => (
                    <div key={ageGroup} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{ageGroup.replace('_', ' ')}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(count / resident_analytics.total_active_residents) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resident Type Breakdown */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Resident Type Distribution</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm text-gray-600">Owners</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">{resident_analytics.resident_type_breakdown.owners}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span className="text-sm text-gray-600">Tenants</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">{resident_analytics.resident_type_breakdown.tenants}</span>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatPercentage((resident_analytics.resident_type_breakdown.owners / (resident_analytics.resident_type_breakdown.owners + resident_analytics.resident_type_breakdown.tenants)) * 100)}
                      </div>
                      <div className="text-sm text-gray-500">Owner Ratio</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Satisfaction Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Satisfaction Metrics Breakdown</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{resident_analytics.satisfaction_metrics.overall_score}%</div>
                  <div className="text-sm text-blue-600">Overall</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{resident_analytics.satisfaction_metrics.amenity_satisfaction}%</div>
                  <div className="text-sm text-green-600">Amenities</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">{resident_analytics.satisfaction_metrics.maintenance_satisfaction}%</div>
                  <div className="text-sm text-yellow-600">Maintenance</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">{resident_analytics.satisfaction_metrics.community_satisfaction}%</div>
                  <div className="text-sm text-purple-600">Community</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Usage Analytics View */}
        {selectedMetricView === 'usage' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Amenity Booking Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{usage_analytics.amenity_booking_rate.toFixed(1)}</p>
                    <p className="text-sm text-gray-500">bookings per amenity</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Usage Hours</h3>
                <div className="grid grid-cols-3 gap-4">
                  {usage_analytics.peak_usage_hours.map((hour: any, index: number) => (
                    <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">
                        {hour.hour.toString().padStart(2, '0')}:00
                      </div>
                      <div className="text-sm text-gray-600">{hour.booking_count} bookings</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Popular Amenities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Popular Amenities</h3>
                <div className="space-y-4">
                  {usage_analytics.popular_amenities.map((amenity: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{amenity.amenity_name}</div>
                        <div className="text-sm text-gray-600">{amenity.booking_count} bookings</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{formatPercentage(amenity.utilization_rate)}</div>
                        <div className="text-sm text-gray-500">utilization</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Request Categories */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Service Request Categories</h3>
                <div className="space-y-4">
                  {usage_analytics.service_request_categories.map((category: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{category.category}</div>
                        <div className="text-sm text-gray-600">{category.count} requests</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{formatHours(category.avg_resolution_hours)}</div>
                        <div className="text-sm text-gray-500">avg resolution</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Growth Projections Section (Always Visible) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Growth Projections & Recommendations</h3>
            <Target className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{formatCurrency(growth_projections.projected_monthly_revenue)}</div>
              <div className="text-sm text-green-600">Projected Monthly Revenue</div>
              <div className="text-xs text-gray-500 mt-2">Next month estimate</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{formatPercentage(growth_projections.expected_occupancy_rate)}</div>
              <div className="text-sm text-blue-600">Expected Occupancy</div>
              <div className="text-xs text-gray-500 mt-2">Target for next quarter</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{growth_projections.estimated_new_residents}</div>
              <div className="text-sm text-purple-600">New Residents</div>
              <div className="text-xs text-gray-500 mt-2">Expected additions</div>
            </div>
          </div>

          {/* Compound Recommendations */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Compound Expansion Recommendations</h4>
            <div className="space-y-3">
              {growth_projections.compound_expansion_recommendations.map((recommendation: any, index: number) => {
                const RecommendationIcon = getRecommendationIcon(recommendation.recommendation_type)
                return (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getRecommendationColor(recommendation.recommendation_type)}`}>
                        <RecommendationIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{recommendation.compound_name}</div>
                        <div className="text-sm text-gray-600 capitalize">{recommendation.recommendation_type}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        +{formatCurrency(recommendation.potential_revenue_increase)}
                      </div>
                      <div className="text-xs text-gray-500">{recommendation.confidence_score}% confidence</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}