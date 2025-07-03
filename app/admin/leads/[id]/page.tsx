'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  Clock, 
  Star,
  MessageCircle,
  PhoneCall,
  Calendar,
  Camera,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  Eye,
  TrendingUp,
  MessageSquare,
  Play,
  Pause,
  Edit,
  Save,
  X,
  Download,
  ExternalLink,
  RefreshCw,
  Timer,
  Home
} from 'lucide-react'
import { isCurrentUserAdmin } from '@/lib/auth/admin-client'
import { supabase } from '@/lib/supabase/config'

interface Lead {
  id: string
  lead_id: string
  name: string
  email?: string
  whatsapp_number: string
  location: string
  price_range: string
  property_type: string
  timeline: string
  initial_score: number
  final_score?: number
  status: string
  recommendation?: string
  call_completed_at?: string
  call_duration_seconds?: number
  property_size_sqm?: number
  property_condition?: string
  urgency_reason?: string
  decision_authority?: string
  previous_attempts?: string
  competing_agents?: boolean
  photographer_id?: string
  shoot_scheduled_at?: string
  shoot_completed_at?: string
  shoot_duration_minutes?: number
  virtual_tour_url?: string
  tour_processing_status?: string
  tour_completed_at?: string
  tour_views: number
  unique_visitors: number
  broker_inquiries: number
  viewing_requests: number
  followup_count: number
  source: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  metadata?: any
  created_at: string
  updated_at: string
}

interface WhatsAppMessage {
  id: string
  lead_id: string
  phone_number: string
  message_text: string
  direction: 'incoming' | 'outgoing'
  message_type: string
  whatsapp_message_id?: string
  timestamp: string
  metadata?: any
}

interface CallSchedule {
  id: string
  lead_id: string
  scheduled_time: string
  status: string
  call_type: string
  preferred_time_slot?: string
  phone_number: string
  max_retries: number
  retry_count: number
  metadata?: any
  created_at: string
}

interface CallLog {
  id: string
  lead_id: string
  call_schedule_id?: string
  phone_number: string
  call_status: string
  call_duration?: number
  call_started_at?: string
  call_ended_at?: string
  transcript?: string
  conversation_summary?: string
  key_information?: any
  lead_qualification_score?: number
  next_action?: string
  agent_notes?: string
  openai_session_id?: string
  metadata?: any
  created_at: string
}

interface PhotographerAssignment {
  id: string
  lead_id: string
  photographer_id: string
  assignment_date: string
  scheduled_time: string
  duration_minutes: number
  status: string
  preparation_notes?: string
  completion_notes?: string
  client_rating?: number
  photographer_rating?: number
  travel_distance_km?: number
  actual_duration_minutes?: number
  photos_count?: number
  photographer?: {
    name: string
    email: string
    phone: string
    rating: number
  }
}

export default function LeadDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const leadId = params.id as string

  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [lead, setLead] = useState<Lead | null>(null)
  const [whatsappMessages, setWhatsappMessages] = useState<WhatsAppMessage[]>([])
  const [callSchedules, setCallSchedules] = useState<CallSchedule[]>([])
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [photographerAssignments, setPhotographerAssignments] = useState<PhotographerAssignment[]>([])
  
  const [activeTab, setActiveTab] = useState<'overview' | 'messages' | 'calls' | 'photos'>('overview')
  const [editingStatus, setEditingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [statusNotes, setStatusNotes] = useState('')
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationType, setValidationType] = useState<'approve' | 'reject'>('approve')
  const [validationReason, setValidationReason] = useState('')
  const [validationNotes, setValidationNotes] = useState('')
  const [validating, setValidating] = useState(false)

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const isAdmin = await isCurrentUserAdmin()
        if (!isAdmin) {
          router.push('/unauthorized')
          return
        }
        
        setAuthorized(true)
        await loadLeadData()
      } catch (error) {
        console.error('Error checking authorization:', error)
        router.push('/unauthorized')
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndLoad()
  }, [leadId, router])

  const loadLeadData = async () => {
    try {
      // Load lead details
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('lead_id', leadId)
        .single()

      if (leadError) throw leadError
      setLead(leadData)
      setNewStatus(leadData.status)

      // Load WhatsApp messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('timestamp', { ascending: true })

      if (!messagesError) {
        setWhatsappMessages(messagesData || [])
      }

      // Load call schedules
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('call_schedules')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

      if (!schedulesError) {
        setCallSchedules(schedulesData || [])
      }

      // Load call logs
      const { data: logsData, error: logsError } = await supabase
        .from('call_logs')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

      if (!logsError) {
        setCallLogs(logsData || [])
      }

      // Load photographer assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('photographer_assignments')
        .select(`
          *,
          photographers (
            name,
            email,
            phone,
            rating
          )
        `)
        .eq('lead_id', leadData.id)
        .order('created_at', { ascending: false })

      if (!assignmentsError) {
        setPhotographerAssignments(assignmentsData || [])
      }

    } catch (error) {
      console.error('Error loading lead data:', error)
    }
  }

  const updateLeadStatus = async () => {
    if (!lead || !newStatus) return

    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          metadata: {
            ...lead.metadata,
            admin_status_change: {
              previous_status: lead.status,
              new_status: newStatus,
              notes: statusNotes,
              changed_at: new Date().toISOString()
            }
          }
        })
        .eq('lead_id', leadId)

      if (error) throw error

      setLead({ ...lead, status: newStatus })
      setEditingStatus(false)
      setStatusNotes('')
    } catch (error) {
      console.error('Error updating lead status:', error)
      alert('Failed to update lead status')
    }
  }

  const handlePropertyValidation = async () => {
    if (!lead) return

    setValidating(true)
    try {
      const response = await fetch('/api/admin/property-approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_id: leadId,
          action: validationType,
          reason: validationReason,
          admin_notes: validationNotes,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to validate property')
      }

      // Update local state
      setLead(result.lead)
      setShowValidationModal(false)
      setValidationReason('')
      setValidationNotes('')
      
      // Show success message
      alert(`Property ${validationType}d successfully!`)
      
      // Reload data to get latest assignments
      await loadLeadData()
    } catch (error) {
      console.error('Error validating property:', error)
      alert(`Failed to ${validationType} property: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setValidating(false)
    }
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

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      new_lead: 'bg-blue-100 text-blue-800',
      whatsapp_sent: 'bg-indigo-100 text-indigo-800',
      time_selected: 'bg-purple-100 text-purple-800',
      call_scheduled: 'bg-yellow-100 text-yellow-800',
      called: 'bg-orange-100 text-orange-800',
      qualified: 'bg-green-100 text-green-800',
      property_approved: 'bg-emerald-100 text-emerald-800',
      photographer_assigned: 'bg-teal-100 text-teal-800',
      photos_completed: 'bg-cyan-100 text-cyan-800',
      completed: 'bg-gray-100 text-gray-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new_lead': return User
      case 'whatsapp_sent': return MessageCircle
      case 'time_selected': return Clock
      case 'call_scheduled': return Calendar
      case 'called': return PhoneCall
      case 'qualified': return CheckCircle
      case 'property_approved': return Home
      case 'photographer_assigned': return Camera
      case 'photos_completed': return Eye
      case 'completed': return CheckCircle
      case 'rejected': return XCircle
      default: return AlertCircle
    }
  }

  const renderAutomationTimeline = () => {
    const phases = [
      {
        phase: 'Phase 1: Lead Capture',
        status: 'new_lead',
        description: 'Lead submitted form and entered system',
        completed: true,
        timestamp: lead?.created_at
      },
      {
        phase: 'Phase 1: WhatsApp Sent',
        status: 'whatsapp_sent',
        description: 'Welcome message sent via WhatsApp',
        completed: whatsappMessages.some(m => m.direction === 'outgoing'),
        timestamp: whatsappMessages.find(m => m.direction === 'outgoing')?.timestamp
      },
      {
        phase: 'Phase 2: Time Selection',
        status: 'time_selected',
        description: 'User responded with preferred call time',
        completed: whatsappMessages.some(m => m.direction === 'incoming'),
        timestamp: whatsappMessages.find(m => m.direction === 'incoming')?.timestamp
      },
      {
        phase: 'Phase 2: Call Scheduled',
        status: 'call_scheduled',
        description: 'AI voice call scheduled in system',
        completed: callSchedules.length > 0,
        timestamp: callSchedules[0]?.created_at
      },
      {
        phase: 'Phase 3: AI Call Executed',
        status: 'called',
        description: 'OpenAI voice agent called lead',
        completed: callLogs.length > 0,
        timestamp: callLogs[0]?.call_started_at
      },
      {
        phase: 'Phase 3: Lead Qualified',
        status: 'qualified',
        description: 'Lead qualified through AI conversation',
        completed: callLogs.some(log => log.next_action === 'qualified'),
        timestamp: callLogs.find(log => log.next_action === 'qualified')?.call_ended_at
      },
      {
        phase: 'Phase 4: Property Approved',
        status: 'property_approved',
        description: 'Admin approved property for listing',
        completed: lead?.status === 'property_approved' || lead?.status === 'photographer_assigned' || lead?.status === 'completed',
        timestamp: lead?.status === 'property_approved' ? lead?.updated_at : null
      },
      {
        phase: 'Phase 4: Photographer Assigned',
        status: 'photographer_assigned',
        description: 'Photographer scheduled for property shoot',
        completed: photographerAssignments.length > 0,
        timestamp: photographerAssignments[0]?.created_at
      },
      {
        phase: 'Phase 4: Photos Completed',
        status: 'photos_completed',
        description: 'Property photos taken and processed',
        completed: photographerAssignments.some(a => a.status === 'completed'),
        timestamp: photographerAssignments.find(a => a.status === 'completed')?.scheduled_time
      }
    ]

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Automation Timeline</h3>
        <div className="flow-root">
          <ul className="-mb-8">
            {phases.map((phase, index) => {
              const Icon = getStatusIcon(phase.status)
              return (
                <li key={index}>
                  <div className="relative pb-8">
                    {index !== phases.length - 1 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                          phase.completed ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          <Icon className={`h-4 w-4 ${phase.completed ? 'text-white' : 'text-gray-500'}`} />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className={`text-sm font-medium ${phase.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                            {phase.phase}
                          </p>
                          <p className="text-sm text-gray-500">{phase.description}</p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          {phase.timestamp ? formatDate(phase.timestamp) : 'Pending'}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Lead Details</h2>
          <p className="text-gray-600">Fetching automation data...</p>
        </div>
      </div>
    )
  }

  if (!authorized || !lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Lead Not Found</h2>
          <p className="text-gray-600">The requested lead could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/users')}
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Lead Details</h1>
                <p className="text-sm text-gray-500">{lead.lead_id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadLeadData}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              
              {/* Property Validation Buttons - Only show for qualified leads */}
              {lead?.status === 'qualified' && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setValidationType('approve')
                      setShowValidationModal(true)
                    }}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve Property
                  </button>
                  <button
                    onClick={() => {
                      setValidationType('reject')
                      setShowValidationModal(true)
                    }}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject Property
                  </button>
                </div>
              )}
              
              {editingStatus ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={updateLeadStatus}
                    className="p-2 text-green-600 hover:text-green-800"
                  >
                    <Save className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setEditingStatus(false)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingStatus(true)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <Edit className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Lead Overview */}
          <div className="lg:col-span-1 space-y-6">
            {/* Lead Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {lead.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{lead.name}</h2>
                  <div className="flex items-center space-x-2">
                    {editingStatus ? (
                      <div className="space-y-2">
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="new_lead">New Lead</option>
                          <option value="whatsapp_sent">WhatsApp Sent</option>
                          <option value="time_selected">Time Selected</option>
                          <option value="call_scheduled">Call Scheduled</option>
                          <option value="called">Called</option>
                          <option value="qualified">Qualified</option>
                          <option value="property_approved">Property Approved</option>
                          <option value="photographer_assigned">Photographer Assigned</option>
                          <option value="photos_completed">Photos Completed</option>
                          <option value="completed">Completed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Status change notes..."
                          value={statusNotes}
                          onChange={(e) => setStatusNotes(e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 w-full"
                        />
                      </div>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(lead.status)}`}>
                        {lead.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{lead.whatsapp_number}</span>
                </div>
                {lead.email && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{lead.email}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{lead.location}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span>{lead.price_range}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Home className="w-4 h-4" />
                  <span>{lead.property_type}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{lead.timeline}</span>
                </div>
              </div>
            </div>

            {/* Scores Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Scores</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Initial Score</span>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">{lead.initial_score}</span>
                  </div>
                </div>
                {lead.final_score && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Final Score</span>
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">{lead.final_score}</span>
                    </div>
                  </div>
                )}
                {callLogs.length > 0 && callLogs[0].lead_qualification_score && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">AI Qualification Score</span>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{callLogs[0].lead_qualification_score}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{lead.tour_views}</div>
                  <div className="text-sm text-gray-600">Tour Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{lead.unique_visitors}</div>
                  <div className="text-sm text-gray-600">Unique Visitors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{lead.broker_inquiries}</div>
                  <div className="text-sm text-gray-600">Broker Inquiries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{lead.followup_count}</div>
                  <div className="text-sm text-gray-600">Follow-ups</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Detailed Data */}
          <div className="lg:col-span-2 space-y-6">
            {/* Automation Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              {renderAutomationTimeline()}
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  {[
                    { id: 'overview', label: 'Overview', icon: Activity },
                    { id: 'messages', label: `WhatsApp (${whatsappMessages.length})`, icon: MessageCircle },
                    { id: 'calls', label: `Calls (${callLogs.length})`, icon: PhoneCall },
                    { id: 'photos', label: `Photos (${photographerAssignments.length})`, icon: Camera }
                  ].map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`py-3 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                        </div>
                      </button>
                    )
                  })}
                </nav>
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Property Details */}
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-3">Property Details</h4>
                        <div className="space-y-2 text-sm">
                          {lead.property_size_sqm && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Size:</span>
                              <span>{lead.property_size_sqm} sqm</span>
                            </div>
                          )}
                          {lead.property_condition && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Condition:</span>
                              <span className="capitalize">{lead.property_condition}</span>
                            </div>
                          )}
                          {lead.decision_authority && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Decision Authority:</span>
                              <span className="capitalize">{lead.decision_authority}</span>
                            </div>
                          )}
                          {lead.urgency_reason && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Urgency:</span>
                              <span>{lead.urgency_reason}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Competing Agents:</span>
                            <span>{lead.competing_agents ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Source & Tracking */}
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-3">Source & Tracking</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Source:</span>
                            <span className="capitalize">{lead.source}</span>
                          </div>
                          {lead.utm_source && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">UTM Source:</span>
                              <span>{lead.utm_source}</span>
                            </div>
                          )}
                          {lead.utm_medium && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">UTM Medium:</span>
                              <span>{lead.utm_medium}</span>
                            </div>
                          )}
                          {lead.utm_campaign && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">UTM Campaign:</span>
                              <span>{lead.utm_campaign}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Created:</span>
                            <span>{formatDate(lead.created_at)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Updated:</span>
                            <span>{formatDate(lead.updated_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Virtual Tour */}
                    {lead.virtual_tour_url && (
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-3">Virtual Tour</h4>
                        <div className="flex items-center space-x-4">
                          <a
                            href={lead.virtual_tour_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>View Virtual Tour</span>
                          </a>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            lead.tour_processing_status === 'completed' ? 'bg-green-100 text-green-800' :
                            lead.tour_processing_status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            lead.tour_processing_status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {lead.tour_processing_status}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* WhatsApp Messages Tab */}
                {activeTab === 'messages' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900">WhatsApp Conversation</h4>
                    {whatsappMessages.length === 0 ? (
                      <p className="text-gray-500">No WhatsApp messages found.</p>
                    ) : (
                      <div className="space-y-3">
                        {whatsappMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.direction === 'outgoing'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}>
                              <p className="text-sm">{message.message_text}</p>
                              <p className={`text-xs mt-1 ${
                                message.direction === 'outgoing' ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {formatDate(message.timestamp)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Calls Tab */}
                {activeTab === 'calls' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-medium text-gray-900">Call History</h4>
                    
                    {/* Call Schedules */}
                    {callSchedules.length > 0 && (
                      <div>
                        <h5 className="text-md font-medium text-gray-700 mb-3">Scheduled Calls</h5>
                        <div className="space-y-3">
                          {callSchedules.map((schedule) => (
                            <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{schedule.call_type} Call</span>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  schedule.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  schedule.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                  schedule.status === 'failed' ? 'bg-red-100 text-red-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {schedule.status}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div>Scheduled: {formatDate(schedule.scheduled_time)}</div>
                                {schedule.preferred_time_slot && (
                                  <div>Preferred: {schedule.preferred_time_slot}</div>
                                )}
                                <div>Retries: {schedule.retry_count}/{schedule.max_retries}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Call Logs */}
                    {callLogs.length > 0 && (
                      <div>
                        <h5 className="text-md font-medium text-gray-700 mb-3">Call Logs</h5>
                        <div className="space-y-4">
                          {callLogs.map((log) => (
                            <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <PhoneCall className="w-4 h-4 text-gray-500" />
                                  <span className="font-medium">Call to {log.phone_number}</span>
                                </div>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  log.call_status === 'completed' ? 'bg-green-100 text-green-800' :
                                  log.call_status === 'failed' ? 'bg-red-100 text-red-800' :
                                  log.call_status === 'no_answer' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {log.call_status}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                                <div>
                                  <span className="text-gray-600">Started:</span>
                                  <span className="ml-2">{log.call_started_at ? formatDate(log.call_started_at) : 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Duration:</span>
                                  <span className="ml-2">{formatDuration(log.call_duration)}</span>
                                </div>
                                {log.lead_qualification_score && (
                                  <div>
                                    <span className="text-gray-600">AI Score:</span>
                                    <span className="ml-2 font-medium">{log.lead_qualification_score}/10</span>
                                  </div>
                                )}
                                {log.next_action && (
                                  <div>
                                    <span className="text-gray-600">Next Action:</span>
                                    <span className="ml-2 capitalize">{log.next_action}</span>
                                  </div>
                                )}
                              </div>

                              {log.conversation_summary && (
                                <div className="mb-3">
                                  <h6 className="text-sm font-medium text-gray-700 mb-1">Summary:</h6>
                                  <p className="text-sm text-gray-600">{log.conversation_summary}</p>
                                </div>
                              )}

                              {log.agent_notes && (
                                <div className="mb-3">
                                  <h6 className="text-sm font-medium text-gray-700 mb-1">AI Agent Notes:</h6>
                                  <p className="text-sm text-gray-600">{log.agent_notes}</p>
                                </div>
                              )}

                              {log.transcript && (
                                <div>
                                  <h6 className="text-sm font-medium text-gray-700 mb-1">Transcript:</h6>
                                  <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 max-h-40 overflow-y-auto">
                                    {log.transcript}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {callSchedules.length === 0 && callLogs.length === 0 && (
                      <p className="text-gray-500">No call history found.</p>
                    )}
                  </div>
                )}

                {/* Photos Tab */}
                {activeTab === 'photos' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900">Photographer Assignments</h4>
                    {photographerAssignments.length === 0 ? (
                      <p className="text-gray-500">No photographer assignments found.</p>
                    ) : (
                      <div className="space-y-4">
                        {photographerAssignments.map((assignment) => (
                          <div key={assignment.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <Camera className="w-4 h-4 text-gray-500" />
                                <span className="font-medium">
                                  {assignment.photographer?.name || 'Unknown Photographer'}
                                </span>
                              </div>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                assignment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                assignment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {assignment.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                              <div>
                                <span className="text-gray-600">Scheduled:</span>
                                <span className="ml-2">{formatDate(assignment.scheduled_time)}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Duration:</span>
                                <span className="ml-2">{assignment.duration_minutes} min</span>
                              </div>
                              {assignment.photographer?.email && (
                                <div>
                                  <span className="text-gray-600">Email:</span>
                                  <span className="ml-2">{assignment.photographer.email}</span>
                                </div>
                              )}
                              {assignment.photographer?.phone && (
                                <div>
                                  <span className="text-gray-600">Phone:</span>
                                  <span className="ml-2">{assignment.photographer.phone}</span>
                                </div>
                              )}
                            </div>

                            {assignment.photos_count && (
                              <div className="mb-3">
                                <span className="text-sm text-gray-600">Photos taken:</span>
                                <span className="ml-2 font-medium">{assignment.photos_count}</span>
                              </div>
                            )}

                            {assignment.client_rating && (
                              <div className="flex items-center space-x-1 mb-3">
                                <span className="text-sm text-gray-600">Client Rating:</span>
                                <div className="flex space-x-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < (assignment.client_rating || 0)
                                          ? 'text-yellow-500 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            {assignment.preparation_notes && (
                              <div className="mb-3">
                                <h6 className="text-sm font-medium text-gray-700 mb-1">Preparation Notes:</h6>
                                <p className="text-sm text-gray-600">{assignment.preparation_notes}</p>
                              </div>
                            )}

                            {assignment.completion_notes && (
                              <div>
                                <h6 className="text-sm font-medium text-gray-700 mb-1">Completion Notes:</h6>
                                <p className="text-sm text-gray-600">{assignment.completion_notes}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Property Validation Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center space-x-2 mb-4">
                {validationType === 'approve' ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
                <h3 className="text-lg font-medium text-gray-900">
                  {validationType === 'approve' ? 'Approve Property' : 'Reject Property'}
                </h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for {validationType === 'approve' ? 'approval' : 'rejection'}
                  </label>
                  <select
                    value={validationReason}
                    onChange={(e) => setValidationReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a reason...</option>
                    {validationType === 'approve' ? (
                      <>
                        <option value="high_value_property">High Value Property</option>
                        <option value="prime_location">Prime Location</option>
                        <option value="motivated_seller">Motivated Seller</option>
                        <option value="good_condition">Good Property Condition</option>
                        <option value="quick_timeline">Quick Sale Timeline</option>
                      </>
                    ) : (
                      <>
                        <option value="incomplete_information">Incomplete Information</option>
                        <option value="unrealistic_expectations">Unrealistic Expectations</option>
                        <option value="poor_property_condition">Poor Property Condition</option>
                        <option value="difficult_location">Difficult Location</option>
                        <option value="low_qualification_score">Low Qualification Score</option>
                        <option value="unresponsive_lead">Unresponsive Lead</option>
                      </>
                    )}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    value={validationNotes}
                    onChange={(e) => setValidationNotes(e.target.value)}
                    placeholder="Add any additional notes about your decision..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowValidationModal(false)
                    setValidationReason('')
                    setValidationNotes('')
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  disabled={validating}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePropertyValidation}
                  disabled={validating || !validationReason}
                  className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    validationType === 'approve'
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {validating ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    `${validationType === 'approve' ? 'Approve' : 'Reject'} Property`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}