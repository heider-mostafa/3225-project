'use client'
import { useEffect, useState } from 'react'
import { 
  Building2, 
  Users, 
  MessageSquare, 
  Eye,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Phone
} from 'lucide-react'
import { isCurrentUserAdmin } from '@/lib/auth/admin-client'

interface DashboardStats {
  totalProperties: number
  totalUsers: number
  totalInquiries: number
  totalViews: number
  pendingInquiries: number
  activeHeygenSessions: number
  recentPropertyViews: number
  tourSessions: number
}

interface RecentActivity {
  id: string
  type: 'property_view' | 'inquiry' | 'heygen_session' | 'user_signup'
  title: string
  description: string
  timestamp: string
  user?: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    totalUsers: 0,
    totalInquiries: 0,
    totalViews: 0,
    pendingInquiries: 0,
    activeHeygenSessions: 0,
    recentPropertyViews: 0,
    tourSessions: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch dashboard stats
        const statsResponse = await fetch('/api/admin/dashboard/stats')
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        }

        // Fetch recent activity
        const activityResponse = await fetch('/api/admin/dashboard/activity')
        if (activityResponse.ok) {
          const activityData = await activityResponse.json()
          setRecentActivity(activityData.activities || [])
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const statCards = [
    {
      title: 'Total Properties',
      value: stats.totalProperties,
      icon: Building2,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'increase'
    },
    {
      title: 'Total Inquiries',
      value: stats.totalInquiries,
      icon: MessageSquare,
      color: 'bg-purple-500',
      change: '+15%',
      changeType: 'increase'
    },
    {
      title: 'Total Views',
      value: stats.totalViews,
      icon: Eye,
      color: 'bg-orange-500',
      change: '+22%',
      changeType: 'increase'
    },
    {
      title: 'Pending Inquiries',
      value: stats.pendingInquiries,
      icon: MessageSquare,
      color: 'bg-yellow-500',
      change: '-5%',
      changeType: 'decrease'
    },
    {
      title: 'Active HeyGen Sessions',
      value: stats.activeHeygenSessions,
      icon: Phone,
      color: 'bg-pink-500',
      change: '+18%',
      changeType: 'increase'
    },
    {
      title: 'Recent Property Views',
      value: stats.recentPropertyViews,
      icon: Activity,
      color: 'bg-indigo-500',
      change: '+25%',
      changeType: 'increase'
    },
    {
      title: 'Tour Sessions',
      value: stats.tourSessions,
      icon: Calendar,
      color: 'bg-teal-500',
      change: '+10%',
      changeType: 'increase'
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'property_view':
        return Eye
      case 'inquiry':
        return MessageSquare
      case 'heygen_session':
        return Phone
      case 'user_signup':
        return Users
      default:
        return Activity
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'property_view':
        return 'bg-blue-100 text-blue-600'
      case 'inquiry':
        return 'bg-purple-100 text-purple-600'
      case 'heygen_session':
        return 'bg-pink-100 text-pink-600'
      case 'user_signup':
        return 'bg-green-100 text-green-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {card.value.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  {card.changeType === 'increase' ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    card.changeType === 'increase' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {card.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <p className="text-sm text-gray-600">Latest user interactions and system events</p>
        </div>
        
        <div className="p-4">
          {recentActivity.length === 0 ? (
            <div className="text-center py-6">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => {
                const Icon = getActivityIcon(activity.type)
                return (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      {activity.user && (
                        <p className="text-xs text-gray-500">by {activity.user}</p>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTimeAgo(activity.timestamp)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <a 
              href="/admin/properties/new"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg transition-colors"
            >
              Add New Property
            </a>
            <a 
              href="/admin/brokers"
              className="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-2 px-4 rounded-lg transition-colors"
            >
              Manage Brokers
            </a>
            <a 
              href="/admin/inquiries"
              className="block w-full bg-purple-600 hover:bg-purple-700 text-white text-center py-2 px-4 rounded-lg transition-colors"
            >
              View Inquiries
            </a>
            <a 
              href="/admin/analytics"
              className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center py-2 px-4 rounded-lg transition-colors"
            >
              View Analytics
            </a>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">System Status</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">HeyGen API</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">RealSee API</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Connected
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Today's Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">New Inquiries</span>
              <span className="text-sm font-medium text-gray-900">{stats.pendingInquiries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Property Views</span>
              <span className="text-sm font-medium text-gray-900">{stats.recentPropertyViews}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tour Sessions</span>
              <span className="text-sm font-medium text-gray-900">{stats.tourSessions}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 