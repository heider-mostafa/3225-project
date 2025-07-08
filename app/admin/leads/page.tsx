'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  FileText, 
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
  MoreVertical,
  Bot,
  Shield,
  Zap,
  Download,
  Send,
  RefreshCw,
  Star,
  TrendingUp,
  Users,
  FileCheck,
  AlertTriangle,
  Target,
  Plus,
  Settings,
  ArrowRight,
  ChevronRight,
  Database,
  Layers,
  Play,
  PhoneCall,
  Timer,
  MessageSquare,
  Activity,
  Camera
} from 'lucide-react'
import { isCurrentUserAdmin, logAdminActivity } from '@/lib/auth/admin-client'
import { supabase } from '@/lib/supabase/config'
import ContractPreview from '@/components/ContractPreview'

// Enhanced Lead interface with contract automation
interface Lead {
  id: string
  lead_id: string
  name: string
  email: string
  whatsapp_number: string
  location: string
  price_range: string
  property_type: string
  timeline: string
  initial_score: number
  final_score: number
  recommendation: 'auto_book' | 'manual_review' | 'reject'
  status: 'new_lead' | 'qualified' | 'called' | 'booked' | 'rejected' | 'completed'
  
  // Contract automation fields
  contract_status: 'pending' | 'generating' | 'generated' | 'pending_review' | 'approved' | 'sent' | 'signed' | 'completed' | 'failed'
  contract_generated_at: string | null
  legal_risk_score: number
  manual_contract_review: boolean
  contract_signed_at: string | null
  expedited_contract: boolean
  property_legal_status: string
  
  // Call and automation data
  call_completed_at: string | null
  property_size_sqm: number | null
  property_condition: string | null
  urgency_reason: string | null
  decision_authority: string | null
  
  // Virtual tour data
  virtual_tour_url: string | null
  tour_processing_status: string
  tour_completed_at: string | null
  
  // Analytics
  tour_views: number
  unique_visitors: number
  broker_inquiries: number
  viewing_requests: number
  followup_count: number
  
  created_at: string
  updated_at: string
  
  // Related contract data
  lead_contracts?: Array<{
    id: string
    contract_type: string
    status: string
    ai_confidence_score: number
    document_url: string | null
    created_at: string
  }>
}

interface ContractMetrics {
  totalLeads: number
  pendingContracts: number
  generatedToday: number
  signed: number
  needsReview: number
  highRisk: number
  avgGenerationTime: number
  successRate: number
}

interface ContractTemplate {
  id: string
  name: string
  template_type: 'exclusive_listing' | 'sale_agreement' | 'marketing_authorization' | 'commission_agreement'
  property_type: string
  description: string
  success_rate: number
  recommended_for: string[]
}

interface ClientStage {
  stage: string
  status: 'completed' | 'current' | 'pending'
  completion_date?: string
  description: string
  next_action?: string
}

export default function AdminLeadsAndContracts() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [contractStatusFilter, setContractStatusFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [metrics, setMetrics] = useState<ContractMetrics | null>(null)
  const [contractGenerationLoading, setContractGenerationLoading] = useState<string | null>(null)
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [contractTemplates, setContractTemplates] = useState<ContractTemplate[]>([])
  const [showContractModal, setShowContractModal] = useState(false)
  const [selectedContractType, setSelectedContractType] = useState<string>('')
  const [leadStages, setLeadStages] = useState<ClientStage[]>([])
  const [showCRMModal, setShowCRMModal] = useState(false)
  const [showAICallModal, setShowAICallModal] = useState(false)
  const [selectedLeadForCall, setSelectedLeadForCall] = useState<Lead | null>(null)
  const [showPhotographyModal, setShowPhotographyModal] = useState(false)
  const [selectedLeadForPhoto, setSelectedLeadForPhoto] = useState<Lead | null>(null)
  const [availablePhotographers, setAvailablePhotographers] = useState<any[]>([])
  const [loadingPhotographers, setLoadingPhotographers] = useState(false)
  const [selectedPhotographer, setSelectedPhotographer] = useState<any>(null)
  const [leadCallLogs, setLeadCallLogs] = useState<any[]>([])
  const [leadCallSchedules, setLeadCallSchedules] = useState<any[]>([])
  const [loadingCallData, setLoadingCallData] = useState(false)
  
  // Contract Preview State
  const [showContractPreview, setShowContractPreview] = useState(false)
  const [contractPreviewData, setContractPreviewData] = useState<any>(null)
  const [contractPreviewLoading, setContractPreviewLoading] = useState(false)

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      const isAdmin = await isCurrentUserAdmin()
      if (!isAdmin) {
        window.location.href = '/unauthorized'
        return
      }
      
      await Promise.all([
        loadLeads(),
        loadMetrics(),
        loadContractTemplates()
      ])
    }

    checkAdminAndLoad()
  }, [])

  useEffect(() => {
    filterLeads()
  }, [searchTerm, statusFilter, contractStatusFilter, riskFilter, leads])

  const loadLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          lead_contracts (
            id,
            contract_type,
            status,
            ai_confidence_score,
            document_url,
            created_at
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading leads:', error)
        return
      }

      setLeads(data || [])
    } catch (error) {
      console.error('Error loading leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async () => {
    try {
      // Get contract metrics from the database
      const { data: contractData, error: contractError } = await supabase
        .from('lead_contracts')
        .select('status, ai_confidence_score, legal_risk_score, generation_time_ms, created_at')

      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('contract_status, legal_risk_score, created_at')

      if (contractError || leadsError) {
        console.error('Error loading metrics:', contractError || leadsError)
        return
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todayContracts = contractData?.filter(c => new Date(c.created_at) >= today) || []
      const signedContracts = contractData?.filter(c => c.status === 'signed') || []
      const needsReview = contractData?.filter(c => c.status === 'pending_review') || []
      const highRisk = leadsData?.filter(l => l.legal_risk_score > 70) || []
      
      const avgTime = contractData?.length > 0 
        ? contractData.reduce((sum, c) => sum + (c.generation_time_ms || 0), 0) / contractData.length / 1000 / 60 // Convert to minutes
        : 0

      const successRate = contractData?.length > 0
        ? (signedContracts.length / contractData.length) * 100
        : 0

      setMetrics({
        totalLeads: leadsData?.length || 0,
        pendingContracts: leadsData?.filter(l => l.contract_status === 'pending').length || 0,
        generatedToday: todayContracts.length,
        signed: signedContracts.length,
        needsReview: needsReview.length,
        highRisk: highRisk.length,
        avgGenerationTime: avgTime,
        successRate
      })
    } catch (error) {
      console.error('Error loading metrics:', error)
    }
  }

  const loadContractTemplates = async () => {
    try {
      // Mock contract templates - in production this would come from database
      const templates: ContractTemplate[] = [
        {
          id: '1',
          name: 'Exclusive Listing Agreement',
          template_type: 'exclusive_listing',
          property_type: 'all',
          description: 'Standard exclusive listing contract for property marketing',
          success_rate: 92,
          recommended_for: ['qualified', 'completed']
        },
        {
          id: '2',
          name: 'Sale Agreement',
          template_type: 'sale_agreement',
          property_type: 'all',
          description: 'Comprehensive property sale agreement with buyer protection',
          success_rate: 88,
          recommended_for: ['booked', 'completed']
        },
        {
          id: '3',
          name: 'Marketing Authorization',
          template_type: 'marketing_authorization',
          property_type: 'all',
          description: 'Authorization to market property on digital platforms',
          success_rate: 95,
          recommended_for: ['new_lead', 'qualified']
        },
        {
          id: '4',
          name: 'Commission Agreement',
          template_type: 'commission_agreement',
          property_type: 'all',
          description: 'Commission structure and payment terms agreement',
          success_rate: 89,
          recommended_for: ['qualified', 'booked', 'completed']
        }
      ]
      setContractTemplates(templates)
    } catch (error) {
      console.error('Error loading contract templates:', error)
    }
  }

  const calculateLeadStages = (lead: Lead): ClientStage[] => {
    const stages: ClientStage[] = [
      {
        stage: 'Lead Captured',
        status: 'completed',
        completion_date: lead.created_at,
        description: 'Initial lead information collected'
      },
      {
        stage: 'Qualification',
        status: lead.status === 'new_lead' ? 'current' : 'completed',
        completion_date: lead.status !== 'new_lead' ? lead.updated_at : undefined,
        description: 'Lead qualification and scoring process',
        next_action: lead.status === 'new_lead' ? 'Complete lead qualification' : undefined
      },
      {
        stage: 'Contact & Discussion',
        status: ['new_lead', 'qualified'].includes(lead.status) ? 
          (lead.status === 'qualified' ? 'current' : 'pending') : 'completed',
        completion_date: lead.call_completed_at || undefined,
        description: 'Initial call and property discussion',
        next_action: !lead.call_completed_at && lead.status === 'qualified' ? 'Schedule property call' : undefined
      },
      {
        stage: 'Property Assessment',
        status: ['new_lead', 'qualified', 'called'].includes(lead.status) ? 
          (lead.status === 'called' ? 'current' : 'pending') : 'completed',
        completion_date: lead.tour_completed_at || undefined,
        description: 'Virtual tour creation and property evaluation',
        next_action: !lead.tour_completed_at && lead.status === 'called' ? 'Create virtual tour' : undefined
      },
      {
        stage: 'Contract Generation',
        status: lead.contract_status === 'pending' ? 'current' : 
                lead.contract_status === 'generated' || lead.contract_status === 'approved' ? 'completed' : 'pending',
        completion_date: lead.contract_generated_at || undefined,
        description: 'Legal contract generation and review',
        next_action: lead.contract_status === 'pending' && lead.status === 'completed' ? 'Generate contract' : undefined
      },
      {
        stage: 'Contract Approval',
        status: lead.contract_status === 'approved' || lead.contract_status === 'sent' || lead.contract_status === 'signed' ? 'completed' :
                lead.contract_status === 'pending_review' ? 'current' : 'pending',
        description: 'Contract review and approval process'
      },
      {
        stage: 'Contract Execution',
        status: lead.contract_status === 'signed' || lead.contract_status === 'completed' ? 'completed' :
                lead.contract_status === 'sent' ? 'current' : 'pending',
        completion_date: lead.contract_signed_at || undefined,
        description: 'Contract signing and execution',
        next_action: lead.contract_status === 'approved' ? 'Send contract for signature' : undefined
      }
    ]

    return stages
  }

  const filterLeads = () => {
    let filtered = leads

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.property_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.lead_id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Lead status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter)
    }

    // Contract status filter
    if (contractStatusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.contract_status === contractStatusFilter)
    }

    // Risk filter
    if (riskFilter !== 'all') {
      if (riskFilter === 'high') {
        filtered = filtered.filter(lead => lead.legal_risk_score > 70)
      } else if (riskFilter === 'medium') {
        filtered = filtered.filter(lead => lead.legal_risk_score >= 40 && lead.legal_risk_score <= 70)
      } else if (riskFilter === 'low') {
        filtered = filtered.filter(lead => lead.legal_risk_score < 40)
      }
    }

    setFilteredLeads(filtered)
  }

  const openCRMModal = (lead: Lead) => {
    setSelectedLead(lead)
    setLeadStages(calculateLeadStages(lead))
    setShowCRMModal(true)
  }

  const openAICallModal = async (lead: Lead) => {
    setSelectedLeadForCall(lead)
    setShowAICallModal(true)
    await loadCallData(lead.lead_id)
  }

  const openPhotographyModal = async (lead: Lead) => {
    setSelectedLeadForPhoto(lead)
    setShowPhotographyModal(true)
    await loadPhotographers()
  }

  const loadCallData = async (leadId: string) => {
    setLoadingCallData(true)
    try {
      // Load call logs
      const { data: callLogsData, error: callLogsError } = await supabase
        .from('call_logs')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

      if (!callLogsError && callLogsData) {
        setLeadCallLogs(callLogsData)
      }

      // Load call schedules
      const { data: callSchedulesData, error: callSchedulesError } = await supabase
        .from('call_schedules')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

      if (!callSchedulesError && callSchedulesData) {
        setLeadCallSchedules(callSchedulesData)
      }
    } catch (error) {
      console.error('Error loading call data:', error)
    } finally {
      setLoadingCallData(false)
    }
  }

  const scheduleAICall = async (leadId: string, callType: 'qualification' | 'follow_up' = 'qualification') => {
    try {
      setLoadingCallData(true)
      
      // Calculate schedule time (5 minutes from now for immediate, or let user choose)
      const scheduleTime = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
      
      const response = await fetch('/api/calls/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_id: leadId,
          specific_time: scheduleTime.toISOString(),
          call_type: callType,
          admin_scheduled: true
        })
      })

      const result = await response.json()

      if (response.ok) {
        alert(`AI call scheduled successfully for ${result.formatted_time}`)
        // Reload call data to show the new schedule
        await loadCallData(leadId)
        // Refresh leads data
        await loadLeads()
      } else {
        alert(`Failed to schedule call: ${result.error}`)
      }
    } catch (error) {
      console.error('Error scheduling AI call:', error)
      alert('Failed to schedule AI call. Please try again.')
    } finally {
      setLoadingCallData(false)
    }
  }

  const executeAICall = async (scheduleId: string) => {
    if (!scheduleId) return
    
    try {
      setLoadingCallData(true)
      
      const response = await fetch('/api/calls/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schedule_id: scheduleId,
          force_execute: true
        })
      })

      const result = await response.json()

      if (response.ok) {
        alert(`AI call initiated successfully for ${result.lead_name}`)
        // Reload call data to show the execution
        if (selectedLeadForCall) {
          await loadCallData(selectedLeadForCall.lead_id)
        }
        // Refresh leads data
        await loadLeads()
      } else {
        alert(`Failed to execute call: ${result.error}`)
      }
    } catch (error) {
      console.error('Error executing AI call:', error)
      alert('Failed to execute AI call. Please try again.')
    } finally {
      setLoadingCallData(false)
    }
  }

  const loadPhotographers = async () => {
    setLoadingPhotographers(true)
    try {
      const response = await fetch('/api/admin/photographers')
      if (response.ok) {
        const data = await response.json()
        setAvailablePhotographers(data.photographers?.filter((p: any) => p.is_active) || [])
      } else {
        console.error('Failed to load photographers')
        setAvailablePhotographers([])
      }
    } catch (error) {
      console.error('Error loading photographers:', error)
      setAvailablePhotographers([])
    } finally {
      setLoadingPhotographers(false)
    }
  }

  const assignPhotographer = async (photographerId: string, leadId: string) => {
    if (!photographerId || !leadId) return

    try {
      setLoadingPhotographers(true)
      
      // Calculate default scheduled time (next business day at 10 AM)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(10, 0, 0, 0)

      const response = await fetch('/api/admin/photographer-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_id: leadId,
          photographer_id: photographerId,
          scheduled_time: tomorrow.toISOString(),
          duration_minutes: 120,
          preparation_notes: `Photography assignment for ${selectedLeadForPhoto?.property_type} in ${selectedLeadForPhoto?.location}. Client: ${selectedLeadForPhoto?.name}`
        })
      })

      const result = await response.json()

      if (response.ok) {
        const photographer = availablePhotographers.find(p => p.id === photographerId)
        alert(`${photographer?.name} has been assigned to ${selectedLeadForPhoto?.name}! 📷`)
        
        // Close modal and refresh data
        setShowPhotographyModal(false)
        setSelectedLeadForPhoto(null)
        setSelectedPhotographer(null)
        await loadLeads()
      } else {
        alert(`Failed to assign photographer: ${result.error}`)
      }
    } catch (error) {
      console.error('Error assigning photographer:', error)
      alert('Failed to assign photographer. Please try again.')
    } finally {
      setLoadingPhotographers(false)
    }
  }

  const openContractModal = (lead: Lead) => {
    setSelectedLead(lead)
    setSelectedContractType('')
    setShowContractModal(true)
  }

  const generateContractPreview = async (leadId: string, contractType: string = 'standard', expedited = false) => {
    setContractPreviewLoading(true)
    
    try {
      const response = await fetch('/api/admin/contracts/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId,
          contractType,
          expedited,
          manualReview: false
        })
      })

      const result = await response.json()

      if (result.success) {
        setContractPreviewData(result.data)
        setShowContractPreview(true)
        setShowContractModal(false)
      } else {
        // Handle specific error cases
        if (result.error?.includes('templates not found') || result.error?.includes('tables not found')) {
          alert(`Contract preview failed: ${result.error}\n\nPlease contact support to initialize the contract system.`)
        } else {
          alert(`Contract preview failed: ${result.error}`)
        }
      }
    } catch (error) {
      console.error('Error generating contract preview:', error)
      alert('Failed to generate contract preview. Please check your internet connection and try again.')
    } finally {
      setContractPreviewLoading(false)
    }
  }

  const generateContract = async (leadId: string, contractType: string = 'standard', expedited = false) => {
    setContractGenerationLoading(leadId)
    
    try {
      const response = await fetch('/api/admin/contracts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId,
          contractType,
          expedited,
          manualReview: false
        })
      })

      const result = await response.json()

      if (result.success) {
        // Refresh leads data
        await loadLeads()
        await loadMetrics()
        
        // Show success message with download option
        const downloadUrl = result.data.downloadUrl
        const contractId = result.data.contractId
        const autoApproved = result.data.autoApproved
        
        const message = `Contract generated successfully! ${autoApproved ? 'Auto-approved and ready to send.' : 'Pending review.'}\n\nWould you like to download the contract now?`
        
        if (confirm(message)) {
          // Download the contract
          window.open(downloadUrl, '_blank')
        }
        
        setShowContractModal(false)
      } else {
        // Handle specific error cases
        if (result.error?.includes('templates not found') || result.error?.includes('tables not found')) {
          alert(`Contract generation failed: ${result.error}\n\nPlease contact support to initialize the contract system.`)
        } else {
          alert(`Contract generation failed: ${result.error}`)
        }
      }
    } catch (error) {
      console.error('Error generating contract:', error)
      alert('Failed to generate contract. Please check your internet connection and try again.')
    } finally {
      setContractGenerationLoading(null)
    }
  }

  const handleContractPreviewConfirm = async (editedData: any) => {
    if (!contractPreviewData) return
    
    setContractPreviewLoading(true)
    
    try {
      const response = await fetch('/api/admin/contracts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: contractPreviewData.leadData.id,
          contractType: contractPreviewData.template.template_type,
          customVariables: editedData,
          expedited: false,
          manualReview: false
        })
      })

      const result = await response.json()

      if (result.success) {
        setShowContractPreview(false)
        setContractPreviewData(null)
        
        // Refresh leads data
        await loadLeads()
        await loadMetrics()
        
        // Show success message with download option
        const downloadUrl = result.data.downloadUrl
        const contractId = result.data.contractId
        const autoApproved = result.data.autoApproved
        
        const message = `Contract generated successfully! ${autoApproved ? 'Auto-approved and ready to send.' : 'Pending review.'}\n\nWould you like to download the contract now?`
        
        if (confirm(message)) {
          window.open(downloadUrl, '_blank')
        }
      } else {
        alert(`Contract generation failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Error generating final contract:', error)
      alert('Failed to generate contract. Please try again.')
    } finally {
      setContractPreviewLoading(false)
    }
  }

  const handleContractPreviewDownload = async (format: 'pdf' | 'html') => {
    if (!contractPreviewData) return
    
    try {
      const response = await fetch('/api/admin/contracts/preview-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent: contractPreviewData.htmlContent,
          format,
          fileName: `contract_preview_${contractPreviewData.leadData.name}_${Date.now()}`
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `contract_preview.${format}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        throw new Error('Download failed')
      }
    } catch (error) {
      console.error('Error downloading preview:', error)
      alert('Failed to download preview. Please try again.')
    }
  }

  const downloadContract = async (contractId: string, format: 'pdf' | 'json' = 'pdf') => {
    try {
      const url = `/api/admin/contracts/${contractId}/download?format=${format}`
      window.open(url, '_blank')
    } catch (error) {
      console.error('Error downloading contract:', error)
      alert('Failed to download contract')
    }
  }

  const getRecommendedTemplates = (lead: Lead): ContractTemplate[] => {
    return contractTemplates.filter(template => 
      template.recommended_for.includes(lead.status) ||
      (template.property_type === 'all' || template.property_type === lead.property_type)
    )
  }

  const generateBulkContracts = async () => {
    if (selectedLeadIds.length === 0) {
      alert('Please select leads first')
      return
    }

    setContractGenerationLoading('bulk')
    
    try {
      const response = await fetch('/api/admin/contracts/bulk-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadIds: selectedLeadIds,
          contractType: 'standard',
          batchSize: 5
        })
      })

      const result = await response.json()

      if (result.success) {
        const { successful, failed, totalRequested } = result.data
        alert(`Bulk generation completed!\nSuccessful: ${successful}/${totalRequested}\nFailed: ${failed}`)
        
        // Refresh data
        await loadLeads()
        await loadMetrics()
        setSelectedLeadIds([])
        setBulkMode(false)
      } else {
        alert(`Bulk generation failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Error in bulk generation:', error)
      alert('Failed to generate contracts')
    } finally {
      setContractGenerationLoading(null)
    }
  }

  const getLeadStatusBadge = (status: string) => {
    const statusStyles = {
      new_lead: 'bg-blue-100 text-blue-800',
      qualified: 'bg-green-100 text-green-800',
      called: 'bg-yellow-100 text-yellow-800',
      booked: 'bg-purple-100 text-purple-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-emerald-100 text-emerald-800'
    }
    
    return statusStyles[status as keyof typeof statusStyles] || statusStyles.new_lead
  }

  const getContractStatusBadge = (status: string) => {
    const statusStyles = {
      pending: 'bg-gray-100 text-gray-800',
      generating: 'bg-blue-100 text-blue-800',
      generated: 'bg-green-100 text-green-800',
      pending_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-emerald-100 text-emerald-800',
      sent: 'bg-purple-100 text-purple-800',
      signed: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-gray-900 text-white',
      failed: 'bg-red-100 text-red-800'
    }
    
    return statusStyles[status as keyof typeof statusStyles] || statusStyles.pending
  }

  const getRiskBadge = (riskScore: number) => {
    if (riskScore > 70) return 'bg-red-100 text-red-800'
    if (riskScore > 40) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const getRiskLevel = (riskScore: number) => {
    if (riskScore > 70) return 'High'
    if (riskScore > 40) return 'Medium'
    return 'Low'
  }

  const getAICallStatus = (lead: Lead, callLogs?: any[], callSchedules?: any[]) => {
    const logs = callLogs || leadCallLogs
    const schedules = callSchedules || leadCallSchedules
    
    // Check if call was completed successfully
    if (lead.call_completed_at || lead.status === 'called' || 
        logs.some(log => log.call_status === 'completed')) {
      return 'completed'
    }
    
    // Check if call failed
    if (logs.some(log => log.call_status === 'failed' || log.call_status === 'no_answer')) {
      return 'failed'
    }
    
    // Check if call is currently in progress
    if (logs.some(log => log.call_status === 'in_progress')) {
      return 'in_progress'
    }
    
    // Check if call is scheduled
    if (lead.status === 'call_scheduled' || 
        schedules.some(schedule => schedule.status === 'scheduled' || schedule.status === 'pending')) {
      return 'scheduled'
    }
    
    // Check if WhatsApp was sent (ready for call)
    if (lead.status === 'time_selected' || lead.status === 'whatsapp_sent') {
      return 'ready'
    }
    
    // No AI call activity yet
    return 'none'
  }

  const getAICallIconColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 hover:text-green-800'
      case 'scheduled': return 'text-blue-600 hover:text-blue-800'
      case 'in_progress': return 'text-purple-600 hover:text-purple-800'
      case 'failed': return 'text-red-600 hover:text-red-800'
      case 'ready': return 'text-orange-600 hover:text-orange-800'
      default: return 'text-gray-400 hover:text-gray-600'
    }
  }

  const formatPrice = (price: string) => {
    // Extract number from price range and format it
    const match = price.match(/[\d,.]+/)
    if (!match) return price
    
    const number = parseFloat(match[0].replace(/,/g, ''))
    if (price.toLowerCase().includes('m') || price.toLowerCase().includes('million')) {
      return `${number}M EGP`
    }
    return `${number.toLocaleString()} EGP`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads & Contract Automation</h1>
          <p className="text-gray-600">AI-powered lead management with automated contract generation</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setBulkMode(!bulkMode)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              bulkMode 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users className="w-4 h-4 mr-2 inline" />
            Bulk Mode
          </button>
          {bulkMode && selectedLeadIds.length > 0 && (
            <button
              onClick={generateBulkContracts}
              disabled={contractGenerationLoading === 'bulk'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {contractGenerationLoading === 'bulk' ? (
                <RefreshCw className="w-4 h-4 mr-2 inline animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2 inline" />
              )}
              Generate {selectedLeadIds.length} Contracts
            </button>
          )}
        </div>
      </div>

      {/* Contract Intelligence Dashboard */}
      {metrics && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">🤖 Contract Intelligence Dashboard</h3>
                <p className="text-sm text-gray-600">Real-time automation metrics and performance</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Updated {new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-gray-600 font-medium">Total Leads</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalLeads}</p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <p className="text-xs text-gray-600 font-medium">Pending</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics.pendingContracts}</p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="w-4 h-4 text-green-600" />
                <p className="text-xs text-gray-600 font-medium">Generated Today</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics.generatedToday}</p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <p className="text-xs text-gray-600 font-medium">Signed</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics.signed}</p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <Eye className="w-4 h-4 text-purple-600" />
                <p className="text-xs text-gray-600 font-medium">Needs Review</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics.needsReview}</p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <p className="text-xs text-gray-600 font-medium">High Risk</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics.highRisk}</p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <p className="text-xs text-gray-600 font-medium">Avg Time</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics.avgGenerationTime.toFixed(1)}m</p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-4 h-4 text-yellow-600" />
                <p className="text-xs text-gray-600 font-medium">Success Rate</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics.successRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search leads by name, email, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Lead Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Lead Status</option>
            <option value="new_lead">New Lead</option>
            <option value="qualified">Qualified</option>
            <option value="called">Called</option>
            <option value="booked">Booked</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Contract Status Filter */}
          <select
            value={contractStatusFilter}
            onChange={(e) => setContractStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Contract Status</option>
            <option value="pending">Pending</option>
            <option value="generated">Generated</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="sent">Sent</option>
            <option value="signed">Signed</option>
          </select>

          {/* Risk Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Risk Levels</option>
            <option value="high">High Risk (70+)</option>
            <option value="medium">Medium Risk (40-70)</option>
            <option value="low">Low Risk (&lt;40)</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No leads found matching your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {bulkMode && (
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.length === filteredLeads.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeadIds(filteredLeads.map(l => l.id))
                          } else {
                            setSelectedLeadIds([])
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property & Scoring
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contract Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    {bulkMode && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.includes(lead.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLeadIds([...selectedLeadIds, lead.id])
                            } else {
                              setSelectedLeadIds(selectedLeadIds.filter(id => id !== lead.id))
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Mail className="w-3 h-3" />
                          <span>{lead.email}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Phone className="w-3 h-3" />
                          <span>{lead.whatsapp_number}</span>
                        </div>
                        <div className="text-xs text-gray-400">ID: {lead.lead_id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{lead.location}</p>
                        <p className="text-sm text-gray-600">{lead.property_type}</p>
                        <p className="text-sm font-medium text-green-600">{formatPrice(lead.price_range)}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Initial: {lead.initial_score}
                          </span>
                          {lead.final_score > 0 && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Final: {lead.final_score}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLeadStatusBadge(lead.status)}`}>
                        {lead.status.replace('_', ' ')}
                      </span>
                      {lead.recommendation && (
                        <div className="mt-1">
                          <span className={`text-xs px-2 py-1 rounded ${
                            lead.recommendation === 'auto_book' ? 'bg-green-100 text-green-800' :
                            lead.recommendation === 'manual_review' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {lead.recommendation.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getContractStatusBadge(lead.contract_status)}`}>
                        {lead.contract_status.replace('_', ' ')}
                      </span>
                      {lead.contract_generated_at && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatRelativeTime(lead.contract_generated_at)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskBadge(lead.legal_risk_score)}`}>
                          {getRiskLevel(lead.legal_risk_score)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {lead.legal_risk_score.toFixed(1)}
                        </span>
                      </div>
                      {lead.manual_contract_review && (
                        <div className="mt-1">
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Manual Review
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatRelativeTime(lead.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openCRMModal(lead)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="View CRM Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => openAICallModal(lead)}
                          className={`p-1 ${getAICallIconColor(getAICallStatus(lead))}`}
                          title={`AI Call Status: ${getAICallStatus(lead)}`}
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => openPhotographyModal(lead)}
                          className="text-indigo-600 hover:text-indigo-800 p-1"
                          title="Photography Assignment"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => openContractModal(lead)}
                          className="text-purple-600 hover:text-purple-800 p-1"
                          title="Contract Options"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        
                        {lead.contract_status === 'pending' && lead.status === 'completed' && (
                          <button
                            onClick={() => generateContractPreview(lead.id)}
                            disabled={contractGenerationLoading === lead.id || contractPreviewLoading}
                            className="text-green-600 hover:text-green-800 p-1 disabled:opacity-50"
                            title="Preview & Generate Contract"
                          >
                            {(contractGenerationLoading === lead.id || contractPreviewLoading) ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        
                        {lead.contract_status === 'pending' && lead.status === 'completed' && lead.expedited_contract && (
                          <button
                            onClick={() => generateContract(lead.id, 'standard', true)}
                            disabled={contractGenerationLoading === lead.id}
                            className="text-purple-600 hover:text-purple-800 p-1 disabled:opacity-50"
                            title="Generate Expedited Contract"
                          >
                            <Zap className="w-4 h-4" />
                          </button>
                        )}
                        
                        {lead.lead_contracts && lead.lead_contracts.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => downloadContract(lead.lead_contracts![0].id, 'pdf')}
                              className="text-indigo-600 hover:text-indigo-800 p-1"
                              title="Download Contract as HTML"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => downloadContract(lead.lead_contracts![0].id, 'json')}
                              className="text-green-600 hover:text-green-800 p-1"
                              title="Download Contract as JSON"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CRM Modal */}
      {showCRMModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Client Journey - {selectedLead.name}</h3>
                  <p className="text-sm text-gray-600">{selectedLead.location} • {selectedLead.property_type}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCRMModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {/* Client Journey Pipeline */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-blue-600" />
                  Client Journey Pipeline
                </h4>
                <div className="relative">
                  <div className="flex items-center justify-between">
                    {leadStages.map((stage, index) => (
                      <div key={stage.stage} className="flex flex-col items-center relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                          stage.status === 'completed' ? 'bg-green-500 text-white' :
                          stage.status === 'current' ? 'bg-blue-500 text-white' :
                          'bg-gray-300 text-gray-600'
                        }`}>
                          {stage.status === 'completed' ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : stage.status === 'current' ? (
                            <Clock className="w-5 h-5" />
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-gray-500" />
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium text-gray-900">{stage.stage}</p>
                          {stage.completion_date && (
                            <p className="text-xs text-gray-500">{formatDate(stage.completion_date)}</p>
                          )}
                          {stage.next_action && (
                            <p className="text-xs text-blue-600 font-medium mt-1">{stage.next_action}</p>
                          )}
                        </div>
                        {index < leadStages.length - 1 && (
                          <div className={`absolute top-4 left-8 w-20 h-0.5 ${
                            leadStages[index + 1].status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Client Information */}
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <User className="w-4 h-4 mr-2 text-blue-600" />
                      Client Details
                    </h5>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Name:</span> {selectedLead.name}</p>
                      <p><span className="font-medium">Email:</span> {selectedLead.email}</p>
                      <p><span className="font-medium">Phone:</span> {selectedLead.whatsapp_number}</p>
                      <p><span className="font-medium">Lead ID:</span> {selectedLead.lead_id}</p>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Building2 className="w-4 h-4 mr-2 text-green-600" />
                      Property Info
                    </h5>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Location:</span> {selectedLead.location}</p>
                      <p><span className="font-medium">Type:</span> {selectedLead.property_type}</p>
                      <p><span className="font-medium">Price:</span> {formatPrice(selectedLead.price_range)}</p>
                      <p><span className="font-medium">Timeline:</span> {selectedLead.timeline}</p>
                    </div>
                  </div>
                </div>

                {/* Current Status & Actions */}
                <div className="space-y-4">
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 text-yellow-600" />
                      Current Status
                    </h5>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium">Lead Status: </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLeadStatusBadge(selectedLead.status)}`}>
                          {selectedLead.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Contract Status: </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getContractStatusBadge(selectedLead.contract_status)}`}>
                          {selectedLead.contract_status.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Risk Level: </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskBadge(selectedLead.legal_risk_score)}`}>
                          {getRiskLevel(selectedLead.legal_risk_score)} ({selectedLead.legal_risk_score.toFixed(1)})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Star className="w-4 h-4 mr-2 text-purple-600" />
                      Quick Actions
                    </h5>
                    <div className="space-y-2">
                      <button 
                        onClick={() => openContractModal(selectedLead)}
                        className="w-full bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 flex items-center justify-center"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Contract Options
                      </button>
                      {selectedLead.virtual_tour_url && (
                        <a
                          href={selectedLead.virtual_tour_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-purple-600 text-white py-2 px-3 rounded text-sm hover:bg-purple-700 flex items-center justify-center"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Virtual Tour
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recommended Contracts */}
                <div className="space-y-4">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Layers className="w-4 h-4 mr-2 text-indigo-600" />
                      Recommended Contracts
                    </h5>
                    <div className="space-y-3">
                      {getRecommendedTemplates(selectedLead).slice(0, 3).map((template) => (
                        <div key={template.id} className="bg-white p-3 rounded border border-indigo-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{template.name}</p>
                              <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                              <div className="flex items-center mt-2">
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  {template.success_rate}% Success Rate
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedContractType(template.template_type)
                                generateContractPreview(selectedLead.id, template.template_type)
                              }}
                              disabled={contractGenerationLoading === selectedLead.id || contractPreviewLoading}
                              className="ml-2 text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                              title="Preview Contract"
                            >
                              {(contractGenerationLoading === selectedLead.id || contractPreviewLoading) ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                Last updated: {formatDate(selectedLead.updated_at)}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCRMModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => openContractModal(selectedLead)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Contract Options
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contract Selection Modal */}
      {showContractModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Generate Contract</h3>
              <button
                onClick={() => setShowContractModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-2">VirtualEstate Standard Agreement</h4>
                <p className="text-sm text-gray-600">Generate a comprehensive property service agreement that covers all contract types including listing authorization, marketing rights, commission terms, and legal compliance.</p>
              </div>

              {/* Lead Summary */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h5 className="font-medium text-gray-900 mb-2">Client Information</h5>
                <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                  <div><strong>Name:</strong> {selectedLead.name}</div>
                  <div><strong>Email:</strong> {selectedLead.email}</div>
                  <div><strong>Phone:</strong> {selectedLead.whatsapp_number}</div>
                  <div><strong>Location:</strong> {selectedLead.location}</div>
                  <div><strong>Property Type:</strong> {selectedLead.property_type}</div>
                  <div><strong>Price Range:</strong> {selectedLead.price_range}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                Ready to generate contract for {selectedLead.name}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowContractModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => generateContract(selectedLead.id, 'standard')}
                  disabled={contractGenerationLoading === selectedLead.id || contractPreviewLoading}
                  className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center"
                  title="Generate contract directly"
                >
                  {(contractGenerationLoading === selectedLead.id) ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generate
                    </>
                  )}
                </button>
                <button
                  onClick={() => generateContractPreview(selectedLead.id, 'standard')}
                  disabled={contractGenerationLoading === selectedLead.id || contractPreviewLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center"
                >
                  {(contractGenerationLoading === selectedLead.id || contractPreviewLoading) ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Call Management Modal */}
      {showAICallModal && selectedLeadForCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">AI Call Management - {selectedLeadForCall.name}</h3>
                  <p className="text-sm text-gray-600">{selectedLeadForCall.whatsapp_number} • {selectedLeadForCall.location}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAICallModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {/* Call Status Overview */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Bot className="w-5 h-5 mr-2 text-blue-600" />
                    AI Call Overview
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      getAICallStatus(selectedLeadForCall) === 'completed' ? 'bg-green-100 text-green-800' :
                      getAICallStatus(selectedLeadForCall) === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      getAICallStatus(selectedLeadForCall) === 'ready' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getAICallStatus(selectedLeadForCall).charAt(0).toUpperCase() + getAICallStatus(selectedLeadForCall).slice(1)}
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <PhoneCall className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-gray-600 font-medium">Total Calls</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {leadCallLogs.length}
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <p className="text-xs text-gray-600 font-medium">Success Rate</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {leadCallLogs.length > 0 
                        ? `${Math.round((leadCallLogs.filter(log => log.call_status === 'completed').length / leadCallLogs.length) * 100)}%`
                        : 'N/A'
                      }
                    </p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Timer className="w-4 h-4 text-purple-600" />
                      <p className="text-xs text-gray-600 font-medium">Last Call</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {leadCallLogs.length > 0 && leadCallLogs[0].call_started_at 
                        ? formatRelativeTime(leadCallLogs[0].call_started_at) 
                        : 'None'
                      }
                    </p>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Star className="w-4 h-4 text-yellow-600" />
                      <p className="text-xs text-gray-600 font-medium">AI Score</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedLeadForCall.final_score || selectedLeadForCall.initial_score}
                    </p>
                  </div>
                </div>
              </div>

              {/* Call History & Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Call History */}
                <div>
                  <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-blue-600" />
                    Call History
                  </h5>
                  
                  {/* Call Timeline */}
                  <div className="space-y-4">
                    {loadingCallData ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-gray-600">Loading call history...</p>
                      </div>
                    ) : leadCallLogs.length > 0 ? (
                      leadCallLogs.map((log, index) => (
                        <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                log.call_status === 'completed' ? 'bg-green-100' :
                                log.call_status === 'failed' ? 'bg-red-100' :
                                log.call_status === 'no_answer' ? 'bg-yellow-100' :
                                'bg-blue-100'
                              }`}>
                                <PhoneCall className={`w-4 h-4 ${
                                  log.call_status === 'completed' ? 'text-green-600' :
                                  log.call_status === 'failed' ? 'text-red-600' :
                                  log.call_status === 'no_answer' ? 'text-yellow-600' :
                                  'text-blue-600'
                                }`} />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  AI Call #{leadCallLogs.length - index}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {log.call_started_at ? formatDate(log.call_started_at) : 'Not started'}
                                </p>
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${
                              log.call_status === 'completed' ? 'bg-green-100 text-green-800' :
                              log.call_status === 'failed' ? 'bg-red-100 text-red-800' :
                              log.call_status === 'no_answer' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {log.call_status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-2 text-sm">
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
                          </div>

                          {log.conversation_summary && (
                            <div className="text-sm text-gray-600 mt-2">
                              <p className="font-medium mb-1">Summary:</p>
                              <p className="text-xs bg-gray-50 p-2 rounded">{log.conversation_summary}</p>
                            </div>
                          )}

                          {log.next_action && (
                            <div className="text-sm mt-2">
                              <span className="text-gray-600">Next Action:</span>
                              <span className="ml-2 text-blue-600 font-medium capitalize">{log.next_action}</span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : leadCallSchedules.length > 0 ? (
                      leadCallSchedules.map((schedule, index) => (
                        <div key={schedule.id} className="bg-white border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Clock className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Call Scheduled</p>
                                <p className="text-sm text-gray-600">{formatDate(schedule.scheduled_time)}</p>
                              </div>
                            </div>
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{schedule.status}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>• Type: {schedule.call_type}</p>
                            <p>• Retries: {schedule.retry_count}/{schedule.max_retries}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                        <Phone className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">No AI calls completed yet</p>
                        <p className="text-sm text-gray-500">Schedule a call to begin AI qualification</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button 
                        onClick={() => scheduleAICall(selectedLeadForCall.lead_id, 'qualification')}
                        disabled={loadingCallData}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Schedule New AI Call
                      </button>
                      {leadCallLogs.some(log => log.call_status === 'completed') && (
                        <button 
                          onClick={() => scheduleAICall(selectedLeadForCall.lead_id, 'follow_up')}
                          disabled={loadingCallData}
                          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Schedule Follow-up Call
                        </button>
                      )}
                      {leadCallSchedules.some(schedule => schedule.status === 'scheduled') && (
                        <button 
                          onClick={() => executeAICall(leadCallSchedules.find(s => s.status === 'scheduled')?.id)}
                          disabled={loadingCallData}
                          className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Execute Call Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Call Analysis */}
                <div>
                  <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-purple-600" />
                    Call Analysis & Insights
                  </h5>

                  {leadCallLogs.length > 0 && leadCallLogs.some(log => log.call_status === 'completed') ? (
                    <div className="space-y-4">
                      {leadCallLogs.filter(log => log.call_status === 'completed').map((log, index) => (
                        <div key={log.id} className="space-y-4 border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
                          <div className="flex items-center justify-between mb-2">
                            <h6 className="font-medium text-gray-900">Call #{leadCallLogs.length - index} Analysis</h6>
                            <span className="text-xs text-gray-500">{formatDate(log.call_started_at)}</span>
                          </div>

                          {/* Conversation Summary */}
                          {log.conversation_summary && (
                            <div className="bg-purple-50 p-4 rounded-lg">
                              <h6 className="font-medium text-gray-900 mb-2 flex items-center">
                                <MessageSquare className="w-4 h-4 mr-2 text-purple-600" />
                                Conversation Summary
                              </h6>
                              <p className="text-sm text-gray-700">{log.conversation_summary}</p>
                            </div>
                          )}

                          {/* Key Information */}
                          {log.key_information && (
                            <div className="bg-green-50 p-4 rounded-lg">
                              <h6 className="font-medium text-gray-900 mb-2 flex items-center">
                                <Database className="w-4 h-4 mr-2 text-green-600" />
                                Key Information Extracted
                              </h6>
                              <div className="space-y-1 text-sm">
                                {typeof log.key_information === 'object' ? (
                                  Object.entries(log.key_information).map(([key, value]) => (
                                    <p key={key}>• {key}: {String(value)}</p>
                                  ))
                                ) : (
                                  <p>{log.key_information}</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* AI Agent Notes */}
                          {log.agent_notes && (
                            <div className="bg-yellow-50 p-4 rounded-lg">
                              <h6 className="font-medium text-gray-900 mb-2 flex items-center">
                                <Bot className="w-4 h-4 mr-2 text-yellow-600" />
                                AI Agent Notes
                              </h6>
                              <p className="text-sm text-gray-700">{log.agent_notes}</p>
                            </div>
                          )}

                          {/* Next Actions */}
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h6 className="font-medium text-gray-900 mb-2 flex items-center">
                              <ArrowRight className="w-4 h-4 mr-2 text-blue-600" />
                              Recommended Next Actions
                            </h6>
                            <div className="space-y-1 text-sm">
                              {log.next_action && (
                                <p className="text-blue-700 font-medium">• AI Recommendation: <span className="capitalize">{log.next_action}</span></p>
                              )}
                              {selectedLeadForCall.status === 'qualified' && (
                                <>
                                  <p>• Schedule property photography</p>
                                  <p>• Generate listing contract</p>
                                  <p>• Prepare marketing materials</p>
                                </>
                              )}
                              {selectedLeadForCall.status === 'called' && !log.next_action && (
                                <>
                                  <p>• Review call outcome</p>
                                  <p>• Update lead qualification</p>
                                  <p>• Plan follow-up strategy</p>
                                </>
                              )}
                              {selectedLeadForCall.status === 'property_approved' && (
                                <>
                                  <p>• Assign photographer</p>
                                  <p>• Schedule property shoot</p>
                                  <p>• Prepare listing materials</p>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Qualification Score */}
                          {log.lead_qualification_score && (
                            <div className="bg-indigo-50 p-4 rounded-lg">
                              <h6 className="font-medium text-gray-900 mb-2 flex items-center">
                                <Star className="w-4 h-4 mr-2 text-indigo-600" />
                                AI Qualification Score
                              </h6>
                              <div className="flex items-center space-x-4">
                                <div className="text-2xl font-bold text-indigo-600">{log.lead_qualification_score}/10</div>
                                <div className="flex-1">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-indigo-600 h-2 rounded-full" 
                                      style={{ width: `${(log.lead_qualification_score / 10) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                        <Bot className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <h6 className="font-medium text-gray-900 mb-2">No Call Data Available</h6>
                        <p className="text-sm text-gray-600 mb-4">
                          Schedule an AI call to see detailed conversation analysis, key insights, and automated recommendations.
                        </p>
                      </div>
                      
                      {/* General Workflow Recommendations */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h6 className="font-medium text-gray-900 mb-2 flex items-center">
                          <ArrowRight className="w-4 h-4 mr-2 text-blue-600" />
                          Current Stage Recommendations
                        </h6>
                        <div className="space-y-1 text-sm">
                          {selectedLeadForCall.status === 'new_lead' && (
                            <>
                              <p>• Schedule AI qualification call</p>
                              <p>• Send welcome WhatsApp message</p>
                              <p>• Confirm property details</p>
                            </>
                          )}
                          {selectedLeadForCall.status === 'qualified' && (
                            <>
                              <p>• Schedule property photography</p>
                              <p>• Generate listing contract</p>
                              <p>• Prepare marketing materials</p>
                            </>
                          )}
                          {selectedLeadForCall.status === 'called' && (
                            <>
                              <p>• Review call outcome</p>
                              <p>• Update lead qualification</p>
                              <p>• Plan follow-up strategy</p>
                            </>
                          )}
                          {selectedLeadForCall.status === 'property_approved' && (
                            <>
                              <p>• Assign photographer</p>
                              <p>• Schedule property shoot</p>
                              <p>• Prepare listing materials</p>
                            </>
                          )}
                          {(selectedLeadForCall.status === 'whatsapp_sent' || selectedLeadForCall.status === 'time_selected') && (
                            <>
                              <p>• Execute AI qualification call</p>
                              <p>• Collect detailed property information</p>
                              <p>• Assess lead quality and urgency</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                Lead Status: <span className="font-medium">{selectedLeadForCall.status.replace('_', ' ')}</span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAICallModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Open CRM modal for full lead details
                    setShowAICallModal(false)
                    openCRMModal(selectedLeadForCall)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Full Lead Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photography Assignment Modal */}
      {showPhotographyModal && selectedLeadForPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Photography Assignment - {selectedLeadForPhoto.name}</h3>
                  <p className="text-sm text-gray-600">{selectedLeadForPhoto.location} • {selectedLeadForPhoto.property_type}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPhotographyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-2">Available Photographers</h4>
                <p className="text-sm text-gray-600">Select a photographer to assign for this property shoot</p>
              </div>

              {loadingPhotographers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availablePhotographers.map((photographer) => (
                    <div 
                      key={photographer.id} 
                      className={`relative p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPhotographer?.id === photographer.id 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPhotographer(photographer)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          selectedPhotographer?.id === photographer.id ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <User className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{photographer.name}</h5>
                          <p className="text-sm text-gray-600">{photographer.email}</p>
                          <p className="text-sm text-gray-600">{photographer.phone}</p>
                          <div className="flex items-center space-x-3 mt-2">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 mr-1" />
                              <span className="text-xs text-gray-600">{photographer.rating.toFixed(1)}</span>
                            </div>
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {photographer.total_shoots} shoots
                            </span>
                          </div>
                          {photographer.preferred_areas && photographer.preferred_areas.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-gray-500">Areas: {photographer.preferred_areas.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {availablePhotographers.length === 0 && !loadingPhotographers && (
                <div className="text-center py-8 text-gray-500">
                  <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No active photographers available</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                {selectedPhotographer && (
                  <>Selected: {selectedPhotographer.name}</>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPhotographyModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (selectedPhotographer && selectedLeadForPhoto) {
                      await assignPhotographer(selectedPhotographer.id, selectedLeadForPhoto.id)
                      setShowPhotographyModal(false)
                      setSelectedPhotographer(null)
                      // Refresh leads data
                      await loadLeads()
                    }
                  }}
                  disabled={!selectedPhotographer || loadingPhotographers}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center"
                >
                  {loadingPhotographers ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Assign Photographer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contract Preview Modal */}
      <ContractPreview
        isOpen={showContractPreview}
        onClose={() => {
          setShowContractPreview(false)
          setContractPreviewData(null)
        }}
        data={contractPreviewData}
        onConfirm={handleContractPreviewConfirm}
        onDownloadPreview={handleContractPreviewDownload}
        loading={contractPreviewLoading}
      />
    </div>
  )
}