'use client'

import { useState } from 'react'
import { 
  Download, 
  User, 
  Calendar, 
  DollarSign,
  X,
  TrendingUp,
  Activity,
  CreditCard,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DownloadRecord {
  user_email: string;
  download_date: string;
  amount_paid: number;
  report_type: string;
}

interface DownloadAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appraisalId: string;
  propertyAddress: string;
  downloadCount: number;
  totalRevenue: number;
  recentDownloads: DownloadRecord[];
}

export default function DownloadAnalyticsModal({
  isOpen,
  onClose,
  appraisalId,
  propertyAddress,
  downloadCount,
  totalRevenue,
  recentDownloads
}: DownloadAnalyticsModalProps) {
  const [expandedDownloads, setExpandedDownloads] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getReportTypeBadge = (reportType: string) => {
    const variants = {
      standard: 'bg-blue-100 text-blue-800',
      detailed: 'bg-purple-100 text-purple-800',
      comprehensive: 'bg-green-100 text-green-800'
    }
    
    return variants[reportType as keyof typeof variants] || variants.standard
  }

  const averagePerDownload = downloadCount > 0 ? totalRevenue / downloadCount : 0

  // Group downloads by report type for analytics
  const reportTypeBreakdown = recentDownloads.reduce((acc, download) => {
    const type = download.report_type
    if (!acc[type]) {
      acc[type] = { count: 0, revenue: 0 }
    }
    acc[type].count += 1
    acc[type].revenue += download.amount_paid
    return acc
  }, {} as { [key: string]: { count: number; revenue: number } })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Download Analytics
          </DialogTitle>
          <DialogDescription>
            Detailed download statistics for: {propertyAddress}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Downloads</p>
                    <p className="text-2xl font-bold text-blue-600">{downloadCount}</p>
                  </div>
                  <Download className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(totalRevenue)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg per Download</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(averagePerDownload)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Unique Users</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {new Set(recentDownloads.map(d => d.user_email)).size}
                    </p>
                  </div>
                  <User className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Type Breakdown */}
          {Object.keys(reportTypeBreakdown).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Report Type Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(reportTypeBreakdown).map(([type, data]) => (
                    <div key={type} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getReportTypeBadge(type)}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Badge>
                        <span className="text-sm text-gray-600">{data.count} downloads</span>
                      </div>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(data.revenue)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Downloads Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Download History</CardTitle>
                  <CardDescription>
                    {expandedDownloads ? 'All downloads' : 'Recent 5 downloads'} 
                    {recentDownloads.length > 5 && !expandedDownloads && (
                      <span className="text-blue-600"> ({recentDownloads.length} total)</span>
                    )}
                  </CardDescription>
                </div>
                {recentDownloads.length > 5 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setExpandedDownloads(!expandedDownloads)}
                  >
                    {expandedDownloads ? 'Show Less' : 'Show All'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {recentDownloads.length === 0 ? (
                <div className="text-center py-8">
                  <Download className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No downloads yet</h3>
                  <p className="text-gray-500">This appraisal hasn't been purchased yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Report Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(expandedDownloads ? recentDownloads : recentDownloads.slice(0, 5)).map((download, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="font-medium">{download.user_email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getReportTypeBadge(download.report_type)}>
                              {download.report_type.charAt(0).toUpperCase() + download.report_type.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <CreditCard className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="font-semibold text-green-600">
                                {formatCurrency(download.amount_paid)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {new Date(download.download_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
            <Button 
              onClick={() => {
                // Export functionality can be implemented here
                console.log('Export analytics for appraisal:', appraisalId)
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}