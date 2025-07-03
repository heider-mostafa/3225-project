'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  MessageSquare, 
  Eye, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Building2,
  User,
  Calendar,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  MoreVertical
} from 'lucide-react'
import { isCurrentUserAdmin, logAdminActivity } from '@/lib/auth/admin-client'
import { supabase } from '@/lib/supabase/config'

interface Inquiry {
  id: string
  user_id: string
  property_id: string
  name: string
  email: string
  phone: string
  message: string
  status: 'new' | 'contacted' | 'qualified' | 'closed'
  priority: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
  properties: {
    id: string
    title: string
    address: string
    city: string
    state: string
    price: number
    property_photos: Array<{
      url: string
      is_primary: boolean
    }>
  }
  auth_users?: {
    email: string
  }
}

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [filteredInquiries, setFilteredInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [statusUpdateInquiry, setStatusUpdateInquiry] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<string>('')

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      const isAdmin = await isCurrentUserAdmin()
      if (!isAdmin) {
        window.location.href = '/unauthorized'
        return
      }
      
      await loadInquiries()
    }

    checkAdminAndLoad()
  }, [])

  useEffect(() => {
    filterInquiries()
  }, [searchTerm, statusFilter, priorityFilter, inquiries])

  const loadInquiries = async () => {
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .select(`
          *,
          properties (
            id,
            title,
            address,
            city,
            state,
            price,
            property_photos (
              url,
              is_primary
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading inquiries:', error)
        return
      }

      setInquiries(data || [])
    } catch (error) {
      console.error('Error loading inquiries:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterInquiries = () => {
    let filtered = inquiries

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(inquiry =>
        inquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.properties?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inquiry => inquiry.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(inquiry => inquiry.priority === priorityFilter)
    }

    setFilteredInquiries(filtered)
  }

  const handleStatusUpdate = async (inquiryId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('inquiries')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', inquiryId)

      if (error) {
        console.error('Error updating inquiry status:', error)
        alert('Failed to update status')
        return
      }

      // Update local state
      setInquiries(prev => prev.map(inquiry =>
        inquiry.id === inquiryId 
          ? { ...inquiry, status: newStatus as any, updated_at: new Date().toISOString() }
          : inquiry
      ))

      setStatusUpdateInquiry(null)

      // Log admin activity
      await logAdminActivity(
        'inquiry_status_update',
        'inquiry',
        inquiryId,
        { 
          new_status: newStatus,
          inquiry_name: inquiries.find(i => i.id === inquiryId)?.name
        }
      )
    } catch (error) {
      console.error('Error updating inquiry:', error)
      alert('Failed to update status')
    }
  }

  const handleDeleteInquiry = async (inquiryId: string) => {
    if (!confirm('Are you sure you want to delete this inquiry?')) return

    try {
      const inquiry = inquiries.find(i => i.id === inquiryId)
      
      const { error } = await supabase
        .from('inquiries')
        .delete()
        .eq('id', inquiryId)

      if (error) {
        console.error('Error deleting inquiry:', error)
        alert('Failed to delete inquiry')
        return
      }

      // Update local state
      setInquiries(prev => prev.filter(i => i.id !== inquiryId))

      // Log admin activity
      await logAdminActivity(
        'inquiry_delete',
        'inquiry',
        inquiryId,
        { 
          inquiry_name: inquiry?.name,
          inquiry_email: inquiry?.email,
          property_title: inquiry?.properties?.title
        }
      )
    } catch (error) {
      console.error('Error deleting inquiry:', error)
      alert('Failed to delete inquiry')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    }
    
    return statusStyles[status as keyof typeof statusStyles] || statusStyles.new
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return AlertCircle
      case 'contacted':
        return Clock
      case 'qualified':
        return CheckCircle
      case 'closed':
        return XCircle
      default:
        return AlertCircle
    }
  }

  const getPriorityBadge = (priority: string) => {
    const priorityStyles = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    }
    
    return priorityStyles[priority as keyof typeof priorityStyles] || priorityStyles.medium
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
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

  const formatRelativeTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return formatDate(dateString)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inquiries Management</h1>
        <p className="text-gray-600">Manage and respond to property inquiries</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Inquiries</p>
              <p className="text-2xl font-bold text-gray-900">{inquiries.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">New Inquiries</p>
              <p className="text-2xl font-bold text-gray-900">
                {inquiries.filter(i => i.status === 'new').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Qualified</p>
              <p className="text-2xl font-bold text-gray-900">
                {inquiries.filter(i => i.status === 'qualified').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-gray-900">
                {inquiries.filter(i => i.priority === 'high').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search inquiries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="closed">Closed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredInquiries.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No inquiries found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message Preview
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInquiries.map((inquiry) => {
                  const StatusIcon = getStatusIcon(inquiry.status)
                  return (
                    <tr key={inquiry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{inquiry.name}</p>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Mail className="w-3 h-3" />
                            <span>{inquiry.email}</span>
                          </div>
                          {inquiry.phone && (
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Phone className="w-3 h-3" />
                              <span>{inquiry.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100">
                            {inquiry.properties?.property_photos?.[0]?.url ? (
                              <img
                                src={inquiry.properties.property_photos[0].url}
                                alt={inquiry.properties.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{inquiry.properties?.title}</p>
                            <p className="text-sm text-gray-500">
                              {formatPrice(inquiry.properties?.price || 0)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <StatusIcon className="w-4 h-4 text-gray-400" />
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(inquiry.status)}`}>
                            {inquiry.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(inquiry.priority)}`}>
                          {inquiry.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatRelativeTime(inquiry.created_at)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {inquiry.message}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedInquiry(inquiry)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setStatusUpdateInquiry(inquiry.id)
                              setNewStatus(inquiry.status)
                            }}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Update Status"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteInquiry(inquiry.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete Inquiry"
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
          </div>
        )}
      </div>

      {/* Inquiry Details Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Inquiry Details</h3>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Contact Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><span className="font-medium">Name:</span> {selectedInquiry.name}</p>
                  <p><span className="font-medium">Email:</span> {selectedInquiry.email}</p>
                  {selectedInquiry.phone && (
                    <p><span className="font-medium">Phone:</span> {selectedInquiry.phone}</p>
                  )}
                </div>
              </div>

              {/* Property Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Property</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
                      {selectedInquiry.properties?.property_photos?.[0]?.url ? (
                        <img
                          src={selectedInquiry.properties.property_photos[0].url}
                          alt={selectedInquiry.properties.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{selectedInquiry.properties?.title}</p>
                      <p className="text-sm text-gray-600">
                        {selectedInquiry.properties?.address}, {selectedInquiry.properties?.city}
                      </p>
                      <p className="text-sm font-medium text-green-600">
                        {formatPrice(selectedInquiry.properties?.price || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Message</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedInquiry.message}</p>
                </div>
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Status</h4>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedInquiry.status)}`}>
                    {selectedInquiry.status}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Priority</h4>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityBadge(selectedInquiry.priority)}`}>
                    {selectedInquiry.priority}
                  </span>
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Timeline</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-medium">Created:</span> {formatDate(selectedInquiry.created_at)}</p>
                  <p><span className="font-medium">Updated:</span> {formatDate(selectedInquiry.updated_at)}</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setSelectedInquiry(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
              >
                Close
              </button>
              <Link
                href={`/properties/${selectedInquiry.property_id}`}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors text-center"
              >
                View Property
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {statusUpdateInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
            
            <div className="space-y-3 mb-6">
              {['new', 'contacted', 'qualified', 'closed'].map((status) => (
                <label key={status} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={newStatus === status}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(status)}`}>
                    {status}
                  </span>
                </label>
              ))}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setStatusUpdateInquiry(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusUpdate(statusUpdateInquiry, newStatus)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 