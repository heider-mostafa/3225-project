'use client'
import { useEffect, useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Building2, 
  Eye, 
  MessageSquare,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'
import { isCurrentUserAdmin } from '@/lib/auth/admin-client'

interface AnalyticsData {
  overview: {
    totalProperties: number
    totalUsers: number
    totalInquiries: number
    totalViews: number
    propertyGrowth: number
    userGrowth: number
    inquiryGrowth: number
    viewGrowth: number
  }
  propertyMetrics: {
    byType: Array<{ type: string; count: number; percentage: number }>
    byStatus: Array<{ status: string; count: number; percentage: number }>
    byLocation: Array<{ city: string; count: number; avgPrice: number }>
    priceRanges: Array<{ range: string; count: number; percentage: number }>
  }
  userMetrics: {
    registrationsOverTime: Array<{ date: string; count: number }>
    topCities: Array<{ city: string; users: number }>
    activityLevels: Array<{ level: string; count: number; percentage: number }>
  }
  inquiryMetrics: {
    byStatus: Array<{ status: string; count: number; percentage: number }>
    byPropertyType: Array<{ type: string; inquiries: number }>
    responseTime: {
      average: number
      median: number
      fastest: number
      slowest: number
    }
    conversionRate: number
  }
  viewMetrics: {
    totalViews: number
    uniqueViews: number
    averageSessionTime: number
    topProperties: Array<{ 
      id: string
      title: string
      views: number
      inquiries: number
      conversionRate: number
    }>
    viewsByHour: Array<{ hour: number; views: number }>
  }
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30d')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      const isAdmin = await isCurrentUserAdmin()
      if (!isAdmin) {
        window.location.href = '/unauthorized'
        return
      }
      
      await loadAnalytics()
    }

    checkAdminAndLoad()
  }, [dateRange])

  const loadAnalytics = async () => {
    try {
      setRefreshing(true)
      
      // Fetch real analytics data from API
      const response = await fetch(`/api/admin/analytics?range=${dateRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        console.error('Failed to fetch analytics:', response.statusText)
        // Fallback to empty/default data structure
        setAnalytics({
          overview: {
            totalProperties: 0,
            totalUsers: 0,
            totalInquiries: 0,
            totalViews: 0,
            propertyGrowth: 0,
            userGrowth: 0,
            inquiryGrowth: 0,
            viewGrowth: 0
          },
          propertyMetrics: {
            byType: [],
            byStatus: [],
            byLocation: [],
            priceRanges: []
          },
          userMetrics: {
            registrationsOverTime: [],
            topCities: [],
            activityLevels: []
          },
          inquiryMetrics: {
            byStatus: [],
            byPropertyType: [],
            responseTime: { average: 0, median: 0, fastest: 0, slowest: 0 },
            conversionRate: 0
          },
          viewMetrics: {
            totalViews: 0,
            uniqueViews: 0,
            averageSessionTime: 0,
            topProperties: [],
            viewsByHour: []
          }
        })
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    loadAnalytics()
  }

  const handleExport = () => {
    // Mock export functionality
    const data = JSON.stringify(analytics, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-8 h-8 mr-3" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-600">Comprehensive insights and metrics</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Properties</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalProperties}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500 font-medium">+{analytics.overview.propertyGrowth}%</span>
              </div>
            </div>
            <Building2 className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalUsers.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500 font-medium">+{analytics.overview.userGrowth}%</span>
              </div>
            </div>
            <Users className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Inquiries</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalInquiries}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500 font-medium">+{analytics.overview.inquiryGrowth}%</span>
              </div>
            </div>
            <MessageSquare className="w-12 h-12 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalViews.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500 font-medium">+{analytics.overview.viewGrowth}%</span>
              </div>
            </div>
            <Eye className="w-12 h-12 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Property Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Properties by Type</h3>
          <div className="space-y-3">
            {analytics.propertyMetrics.byType.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{item.type}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12">{item.count}</span>
                  <span className="text-sm text-gray-500 w-12">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Properties by Status</h3>
          <div className="space-y-3">
            {analytics.propertyMetrics.byStatus.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{item.status}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12">{item.count}</span>
                  <span className="text-sm text-gray-500 w-12">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Location & Price Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Top Locations
          </h3>
          <div className="space-y-3">
            {analytics.propertyMetrics.byLocation.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.city}</p>
                  <p className="text-sm text-gray-500">{item.count} properties</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    ${(item.avgPrice / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-sm text-gray-500">avg price</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Price Distribution
          </h3>
          <div className="space-y-3">
            {analytics.propertyMetrics.priceRanges.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{item.range}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12">{item.count}</span>
                  <span className="text-sm text-gray-500 w-12">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inquiry Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inquiry Status Distribution</h3>
          <div className="space-y-3">
            {analytics.inquiryMetrics.byStatus.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{item.status}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12">{item.count}</span>
                  <span className="text-sm text-gray-500 w-12">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Response Time Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Average Response</span>
              <span className="text-sm font-medium text-gray-900">{analytics.inquiryMetrics.responseTime.average}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Median Response</span>
              <span className="text-sm font-medium text-gray-900">{analytics.inquiryMetrics.responseTime.median}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Fastest Response</span>
              <span className="text-sm font-medium text-green-600">{analytics.inquiryMetrics.responseTime.fastest}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Slowest Response</span>
              <span className="text-sm font-medium text-red-600">{analytics.inquiryMetrics.responseTime.slowest}h</span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Conversion Rate</span>
                <span className="text-sm font-bold text-blue-600">{analytics.inquiryMetrics.conversionRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Properties */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Properties</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inquiries</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analytics.viewMetrics.topProperties.map((property, index) => (
                <tr key={property.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 text-xs font-medium rounded-full mr-3">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900">{property.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{property.views.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{property.inquiries}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {property.conversionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 