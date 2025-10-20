'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Download, 
  MapPin, 
  User, 
  Calendar, 
  DollarSign,
  Building,
  Ruler,
  FileText,
  Eye,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import Link from 'next/link'

interface AppraisalPreview {
  id: string
  appraiser_name: string
  appraiser_email: string
  client_name: string
  property_address: string
  property_type: string
  area: string
  market_value_estimate: number
  appraisal_date: string
  status: string
  appraisal_reference_number: string
  form_data: any
  created_at: string
  updated_at: string
  download_count: number
  total_revenue: number
  recent_downloads: Array<{
    user_email: string
    download_date: string
    amount_paid: number
    report_type: string
  }>
}

export default function AppraisalPreviewPage() {
  const params = useParams()
  const appraisalId = params.id as string
  const [appraisal, setAppraisal] = useState<AppraisalPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetchAppraisalPreview()
  }, [appraisalId])

  const fetchAppraisalPreview = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/appraisals/${appraisalId}`)
      if (!response.ok) throw new Error('Failed to fetch appraisal')
      
      const data = await response.json()
      setAppraisal(data.appraisal)
    } catch (error) {
      console.error('Error fetching appraisal:', error)
      toast.error('Failed to load appraisal preview')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReport = async (reportType: string = 'standard') => {
    try {
      setDownloading(true)
      const response = await fetch(`/api/admin/appraisals/${appraisalId}/download?type=${reportType}`)
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `admin-appraisal-${appraisalId}-${reportType}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success(`${reportType} report downloaded successfully`)
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download report')
    } finally {
      setDownloading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount)
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-6">
            <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!appraisal) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Appraisal not found</h3>
        <p className="text-gray-500 mb-4">The requested appraisal could not be found.</p>
        <Link href="/admin/appraisals">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Appraisals
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/appraisals">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Appraisals
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appraisal Preview</h1>
            <p className="text-gray-600">Reference: {appraisal.appraisal_reference_number}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => handleDownloadReport('standard')} 
            disabled={downloading}
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Standard
          </Button>
          <Button 
            onClick={() => handleDownloadReport('detailed')} 
            disabled={downloading}
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Detailed
          </Button>
          <Button 
            onClick={() => handleDownloadReport('comprehensive')} 
            disabled={downloading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Comprehensive
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Property Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Address</label>
                  <p className="text-gray-900">{appraisal.property_address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Type</label>
                  <p className="text-gray-900">{appraisal.property_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Area</label>
                  <p className="text-gray-900 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {appraisal.area}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Market Value</label>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(appraisal.market_value_estimate)}
                  </p>
                </div>
              </div>
              
              {appraisal.form_data && (
                <div className="mt-6">
                  <label className="text-sm font-medium text-gray-600">Additional Details</label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(appraisal.form_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appraisal Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Appraisal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Appraiser</label>
                  <p className="text-gray-900 flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {appraisal.appraiser_name}
                  </p>
                  <p className="text-sm text-gray-500">{appraisal.appraiser_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Client</label>
                  <p className="text-gray-900">{appraisal.client_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Appraisal Date</label>
                  <p className="text-gray-900 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(appraisal.appraisal_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <Badge className={getStatusBadge(appraisal.status)}>
                    {appraisal.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Download Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Download Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Downloads</span>
                  <span className="font-semibold">{appraisal.download_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Revenue</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(appraisal.total_revenue)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Downloads */}
          {appraisal.recent_downloads.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="w-5 h-5 mr-2" />
                  Recent Downloads
                </CardTitle>
                <CardDescription>Last 5 purchases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {appraisal.recent_downloads.map((download, index) => (
                    <div key={index} className="border-b border-gray-100 pb-3 last:border-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium">{download.user_email}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(download.download_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {formatCurrency(download.amount_paid)}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {download.report_type}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created</span>
                  <span>{new Date(appraisal.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Updated</span>
                  <span>{new Date(appraisal.updated_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ID</span>
                  <span className="font-mono text-xs">{appraisal.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}