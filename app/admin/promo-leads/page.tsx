'use client'
import { useEffect, useState } from 'react'
import { 
  Mail, 
  Search, 
  Filter, 
  Download, 
  Send,
  RefreshCw,
  Calendar,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Trash2,
  Eye,
  ExternalLink
} from 'lucide-react'
import { isCurrentUserAdmin, logAdminActivity } from '@/lib/auth/admin-client'
import { supabase } from '@/lib/supabase/config'

interface PromoLead {
  id: string
  email: string
  source: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  user_agent?: string
  ip_address?: string
  referrer_url?: string
  subscribed_at: string
  notified_at?: string
  created_at: string
  updated_at: string
}

interface PromoLeadStats {
  total: number
  today: number
  thisWeek: number
  thisMonth: number
  notified: number
  pending: number
}

export default function PromoLeadsPage() {
  const [leads, setLeads] = useState<PromoLead[]>([])
  const [stats, setStats] = useState<PromoLeadStats>({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    notified: 0,
    pending: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [filterSource, setFilterSource] = useState<string>('all')

  useEffect(() => {
    fetchPromoLeads()
    fetchStats()
  }, [])

  const fetchPromoLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_leads')
        .select('*')
        .order('subscribed_at', { ascending: false })

      if (error) {
        console.error('Error fetching promo leads:', error)
        return
      }

      setLeads(data || [])
    } catch (error) {
      console.error('Error fetching promo leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

      // Get total count
      const { count: total } = await supabase
        .from('promo_leads')
        .select('*', { count: 'exact', head: true })

      // Get today's count
      const { count: todayCount } = await supabase
        .from('promo_leads')
        .select('*', { count: 'exact', head: true })
        .gte('subscribed_at', today)

      // Get this week's count
      const { count: weekCount } = await supabase
        .from('promo_leads')
        .select('*', { count: 'exact', head: true })
        .gte('subscribed_at', weekAgo)

      // Get this month's count
      const { count: monthCount } = await supabase
        .from('promo_leads')
        .select('*', { count: 'exact', head: true })
        .gte('subscribed_at', monthAgo)

      // Get notified count
      const { count: notifiedCount } = await supabase
        .from('promo_leads')
        .select('*', { count: 'exact', head: true })
        .not('notified_at', 'is', null)

      // Get pending count
      const { count: pendingCount } = await supabase
        .from('promo_leads')
        .select('*', { count: 'exact', head: true })
        .is('notified_at', null)

      setStats({
        total: total || 0,
        today: todayCount || 0,
        thisWeek: weekCount || 0,
        thisMonth: monthCount || 0,
        notified: notifiedCount || 0,
        pending: pendingCount || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSource = filterSource === 'all' || lead.source === filterSource
    return matchesSearch && matchesSource
  })

  const markAsNotified = async (leadIds: string[]) => {
    try {
      const { error } = await supabase
        .from('promo_leads')
        .update({ notified_at: new Date().toISOString() })
        .in('id', leadIds)

      if (error) {
        console.error('Error marking as notified:', error)
        return
      }

      await fetchPromoLeads()
      await fetchStats()
      setSelectedLeads([])
      
      // Log admin activity
      await logAdminActivity({
        action: 'mark_notified',
        resource_type: 'promo_leads',
        resource_id: leadIds.join(','),
        details: { count: leadIds.length }
      })
    } catch (error) {
      console.error('Error marking as notified:', error)
    }
  }

  const exportLeads = async () => {
    try {
      const csvContent = [
        ['Email', 'Source', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Subscribed At', 'Notified At'],
        ...filteredLeads.map(lead => [
          lead.email,
          lead.source,
          lead.utm_source || '',
          lead.utm_medium || '',
          lead.utm_campaign || '',
          new Date(lead.subscribed_at).toLocaleDateString(),
          lead.notified_at ? new Date(lead.notified_at).toLocaleDateString() : 'Not notified'
        ])
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `promo-leads-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      // Log admin activity  
      await logAdminActivity({
        action: 'export',
        resource_type: 'promo_leads',
        details: { count: filteredLeads.length }
      })
    } catch (error) {
      console.error('Error exporting leads:', error)
    }
  }

  const deleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return

    try {
      const { error } = await supabase
        .from('promo_leads')
        .delete()
        .eq('id', leadId)

      if (error) {
        console.error('Error deleting lead:', error)
        return
      }

      await fetchPromoLeads()
      await fetchStats()
      
      // Log admin activity
      await logAdminActivity({
        action: 'delete',
        resource_type: 'promo_leads',
        resource_id: leadId
      })
    } catch (error) {
      console.error('Error deleting lead:', error)
    }
  }

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return Monitor
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return Smartphone
    }
    return Monitor
  }

  const statCards = [
    {
      title: 'Total Subscribers',
      value: stats.total,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Today',
      value: stats.today,
      icon: Calendar,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'This Week',
      value: stats.thisWeek,
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+15%'
    },
    {
      title: 'This Month',
      value: stats.thisMonth,
      icon: Mail,
      color: 'bg-orange-500',
      change: '+22%'
    },
    {
      title: 'Notified',
      value: stats.notified,
      icon: CheckCircle,
      color: 'bg-emerald-500',
      change: `${stats.total > 0 ? Math.round((stats.notified / stats.total) * 100) : 0}%`
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'bg-yellow-500',
      change: `${stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%`
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Promo Leads</h1>
          <p className="text-gray-600">Manage coming soon email subscribers</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchPromoLeads()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportLeads}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {card.value.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">{card.change}</p>
              </div>
              <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Actions */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Sources</option>
              <option value="coming_soon_page">Coming Soon Page</option>
              <option value="tiktok_ad">TikTok Ad</option>
              <option value="social_media">Social Media</option>
            </select>
          </div>
          
          {selectedLeads.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => markAsNotified(selectedLeads)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
                Mark as Notified ({selectedLeads.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Subscribers ({filteredLeads.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLeads(filteredLeads.map(lead => lead.id))
                      } else {
                        setSelectedLeads([])
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UTM Data
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscribed
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead) => {
                const DeviceIcon = getDeviceIcon(lead.user_agent)
                return (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeads([...selectedLeads, lead.id])
                          } else {
                            setSelectedLeads(selectedLeads.filter(id => id !== lead.id))
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{lead.email}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {lead.source.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.utm_source && (
                        <div className="space-y-1">
                          {lead.utm_source && <div>Source: {lead.utm_source}</div>}
                          {lead.utm_medium && <div>Medium: {lead.utm_medium}</div>}
                          {lead.utm_campaign && <div>Campaign: {lead.utm_campaign}</div>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <DeviceIcon className="w-4 h-4 text-gray-400" />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(lead.subscribed_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {lead.notified_at ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Notified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {!lead.notified_at && (
                          <button
                            onClick={() => markAsNotified([lead.id])}
                            className="text-blue-600 hover:text-blue-900"
                            title="Mark as notified"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteLead(lead.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          
          {filteredLeads.length === 0 && (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No promo leads found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}