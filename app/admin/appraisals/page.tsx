'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, 
  Download, 
  Eye, 
  MapPin, 
  User, 
  Calendar, 
  DollarSign,
  Filter,
  Search,
  MoreVertical,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import DownloadAnalyticsModal from '@/components/admin/DownloadAnalyticsModal'

interface Appraisal {
  id: string
  appraiser_name: string
  appraiser_email: string
  client_name: string
  property_address: string
  property_type: string
  area: string
  market_value_estimate: number
  appraisal_date: string
  status: 'pending' | 'in_progress' | 'completed' | 'rejected'
  appraisal_reference_number: string
  download_count: number
  total_revenue: number
  recent_downloads: Array<{
    user_email: string
    download_date: string
    amount_paid: number
    report_type: string
  }>
}

export default function AdminAppraisalsPage() {
  const [appraisals, setAppraisals] = useState<Appraisal[]>([])
  const [filteredAppraisals, setFilteredAppraisals] = useState<Appraisal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date_desc')
  
  // Analytics modal state
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false)
  const [selectedAppraisalForAnalytics, setSelectedAppraisalForAnalytics] = useState<Appraisal | null>(null)

  // Summary stats
  const [stats, setStats] = useState({
    total_appraisals: 0,
    completed_appraisals: 0,
    total_downloads: 0,
    total_revenue: 0,
    pending_appraisals: 0
  })

  useEffect(() => {
    fetchAppraisals()
  }, [])

  useEffect(() => {
    filterAndSortAppraisals()
  }, [appraisals, searchTerm, statusFilter, sortBy])

  const fetchAppraisals = async () => {
    try {
      console.log('🏛️ Admin Appraisals Page - Starting fetch...')
      setLoading(true)
      const response = await fetch('/api/admin/appraisals')
      console.log('📡 Admin Appraisals Page - Response status:', response.status)
      
      if (!response.ok) throw new Error('Failed to fetch appraisals')
      
      const data = await response.json()
      console.log('📊 Admin Appraisals Page - Received data:', {
        success: data.success,
        appraisalsCount: data.appraisals?.length || 0,
        stats: data.stats,
        firstAppraisal: data.appraisals?.[0]
      })
      
      setAppraisals(data.appraisals || [])
      setStats(data.stats || {})
    } catch (error) {
      console.error('❌ Admin Appraisals Page - Error fetching appraisals:', error)
      toast.error('Failed to load appraisals')
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortAppraisals = () => {
    console.log('🔍 Admin Appraisals Page - Filtering appraisals:', {
      totalAppraisals: appraisals.length,
      searchTerm,
      statusFilter,
      sortBy
    })
    
    let filtered = [...appraisals]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(appraisal => 
        appraisal.property_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appraisal.appraiser_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appraisal.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appraisal.area.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(appraisal => appraisal.status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.appraisal_date).getTime() - new Date(a.appraisal_date).getTime()
        case 'date_asc':
          return new Date(a.appraisal_date).getTime() - new Date(b.appraisal_date).getTime()
        case 'value_desc':
          return b.market_value_estimate - a.market_value_estimate
        case 'value_asc':
          return a.market_value_estimate - b.market_value_estimate
        case 'downloads_desc':
          return b.download_count - a.download_count
        case 'revenue_desc':
          return b.total_revenue - a.total_revenue
        default:
          return 0
      }
    })

    console.log('✅ Admin Appraisals Page - Filtering complete:', {
      filteredCount: filtered.length,
      firstFiltered: filtered[0] ? {
        id: filtered[0].id,
        appraiser_name: filtered[0].appraiser_name,
        status: filtered[0].status
      } : null
    })

    setFilteredAppraisals(filtered)
  }

  const handlePreviewAppraisal = async (appraisalId: string) => {
    try {
      // Open appraisal preview in new tab (admin can preview without payment)
      window.open(`/admin/appraisals/${appraisalId}/preview`, '_blank')
    } catch (error) {
      toast.error('Failed to open preview')
    }
  }

  const handleDownloadReport = async (appraisalId: string, reportType: string = 'standard') => {
    try {
      const response = await fetch(`/api/admin/appraisals/${appraisalId}/download?type=${reportType}`)
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `appraisal-${appraisalId}-${reportType}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Report downloaded successfully')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download report')
    }
  }

  const handleViewAnalytics = (appraisal: Appraisal) => {
    setSelectedAppraisalForAnalytics(appraisal)
    setAnalyticsModalOpen(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-red-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800', 
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    }
    
    return variants[status as keyof typeof variants] || variants.pending
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appraisal Management</h1>
          <p className="text-gray-600">Manage and monitor all property appraisals</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <FileText className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Appraisals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_appraisals}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed_appraisals}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending_appraisals}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Downloads</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total_downloads}</p>
              </div>
              <Download className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.total_revenue)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by address, appraiser, client, or area..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Newest First</SelectItem>
                <SelectItem value="date_asc">Oldest First</SelectItem>
                <SelectItem value="value_desc">Highest Value</SelectItem>
                <SelectItem value="value_asc">Lowest Value</SelectItem>
                <SelectItem value="downloads_desc">Most Downloads</SelectItem>
                <SelectItem value="revenue_desc">Highest Revenue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appraisals Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Appraisals ({filteredAppraisals.length})</CardTitle>
          <CardDescription>
            Comprehensive view of all property appraisals with download analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Appraiser</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppraisals.map((appraisal) => (
                  <TableRow key={appraisal.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{appraisal.property_address}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {appraisal.area} • {appraisal.property_type}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{appraisal.appraiser_name}</div>
                        <div className="text-sm text-gray-500">{appraisal.appraiser_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{appraisal.client_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-green-600">
                        {formatCurrency(appraisal.market_value_estimate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(appraisal.appraisal_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(appraisal.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(appraisal.status)}
                          {appraisal.status}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-semibold">{appraisal.download_count}</div>
                        {appraisal.download_count > 0 && (
                          <div className="text-xs text-gray-500">downloads</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-purple-600">
                        {formatCurrency(appraisal.total_revenue)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handlePreviewAppraisal(appraisal.id)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadReport(appraisal.id, 'standard')}>
                            <Download className="w-4 h-4 mr-2" />
                            Download Standard
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadReport(appraisal.id, 'detailed')}>
                            <Download className="w-4 h-4 mr-2" />
                            Download Detailed
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadReport(appraisal.id, 'comprehensive')}>
                            <Download className="w-4 h-4 mr-2" />
                            Download Comprehensive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleViewAnalytics(appraisal)}>
                            <Activity className="w-4 h-4 mr-2" />
                            View Analytics
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredAppraisals.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appraisals found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'No appraisals have been created yet'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Download Analytics Modal */}
      {selectedAppraisalForAnalytics && (
        <DownloadAnalyticsModal
          isOpen={analyticsModalOpen}
          onClose={() => {
            setAnalyticsModalOpen(false)
            setSelectedAppraisalForAnalytics(null)
          }}
          appraisalId={selectedAppraisalForAnalytics.id}
          propertyAddress={selectedAppraisalForAnalytics.property_address}
          downloadCount={selectedAppraisalForAnalytics.download_count}
          totalRevenue={selectedAppraisalForAnalytics.total_revenue}
          recentDownloads={selectedAppraisalForAnalytics.recent_downloads}
        />
      )}
    </div>
  )
}