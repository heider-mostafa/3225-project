'use client'

import { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  FileText, 
  Download, 
  Edit3, 
  Check, 
  X, 
  Eye,
  AlertCircle,
  Building2,
  User,
  Calendar,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Clock,
  Shield,
  RefreshCw
} from 'lucide-react'

interface ContractPreviewData {
  leadData: {
    id: string
    name: string
    email: string
    whatsapp_number: string
    location: string
    price_range: string
    property_type: string
    timeline: string
    property_size_sqm?: number
    property_condition?: string
  }
  contractData: {
    owner_name: string
    property_address: string
    property_type: string
    property_size_sqm: string | number
    property_condition: string
    listing_price: number
    commission_rate: number
    contract_duration: number
    start_date: string
    end_date: string
    seller_phone: string
    seller_email: string
    termination_notice: number
    notice_period: number
  }
  template: {
    id: string
    name: string
    template_type: string
    property_type: string
    description: string
    success_rate: number
  }
  aiReview: {
    confidenceScore: number
    riskFactors: string[]
    recommendations: string[]
    warnings: string[]
  }
  htmlContent: string
}

interface ContractPreviewProps {
  isOpen: boolean
  onClose: () => void
  data: ContractPreviewData | null
  onConfirm: (editedData: any) => void
  onDownloadPreview: (format: 'pdf' | 'html') => void
  loading?: boolean
}

export default function ContractPreview({ 
  isOpen, 
  onClose, 
  data, 
  onConfirm, 
  onDownloadPreview,
  loading = false 
}: ContractPreviewProps) {
  const [editMode, setEditMode] = useState(false)
  const [editedData, setEditedData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'preview' | 'details' | 'review'>('preview')

  if (!data) return null

  const handleEdit = () => {
    setEditedData({ ...data.contractData })
    setEditMode(true)
  }

  const handleSaveEdit = () => {
    setEditMode(false)
  }

  const handleConfirm = () => {
    onConfirm(editedData || data.contractData)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price).replace('EGP', 'EGP ')
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-50'
    if (score >= 40) return 'text-orange-600 bg-orange-50'
    return 'text-green-600 bg-green-50'
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50'
    if (score >= 70) return 'text-orange-600 bg-orange-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Contract Preview - {data.template.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'preview'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="w-4 h-4 mr-2 inline" />
              Preview
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'details'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Edit3 className="w-4 h-4 mr-2 inline" />
              Details
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'review'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield className="w-4 h-4 mr-2 inline" />
              AI Review
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'preview' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Contract Preview</h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownloadPreview('html')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      HTML
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownloadPreview('pdf')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>
                
                {data.htmlContent ? (
                  <div className="border rounded-lg p-4 bg-white max-h-96 overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: data.htmlContent }} />
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 bg-red-50 text-red-800">
                    <p>No HTML content available. Check the console for errors.</p>
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium">Debug Info</summary>
                      <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Contract Details</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={editMode ? handleSaveEdit : handleEdit}
                  >
                    {editMode ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Client Information */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                      <User className="w-4 h-4" />
                      <span>Client Information</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="owner_name">Client Name</Label>
                        {editMode ? (
                          <Input
                            id="owner_name"
                            value={editedData?.owner_name || ''}
                            onChange={(e) => setEditedData({...editedData, owner_name: e.target.value})}
                          />
                        ) : (
                          <p className="text-sm text-gray-900">{data.contractData.owner_name}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="seller_email">Email</Label>
                        {editMode ? (
                          <Input
                            id="seller_email"
                            value={editedData?.seller_email || ''}
                            onChange={(e) => setEditedData({...editedData, seller_email: e.target.value})}
                          />
                        ) : (
                          <p className="text-sm text-gray-900">{data.contractData.seller_email}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="seller_phone">Phone</Label>
                        {editMode ? (
                          <Input
                            id="seller_phone"
                            value={editedData?.seller_phone || ''}
                            onChange={(e) => setEditedData({...editedData, seller_phone: e.target.value})}
                          />
                        ) : (
                          <p className="text-sm text-gray-900">{data.contractData.seller_phone}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Property Information */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                      <Building2 className="w-4 h-4" />
                      <span>Property Information</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="property_address">Address</Label>
                        {editMode ? (
                          <Input
                            id="property_address"
                            value={editedData?.property_address || ''}
                            onChange={(e) => setEditedData({...editedData, property_address: e.target.value})}
                          />
                        ) : (
                          <p className="text-sm text-gray-900">{data.contractData.property_address}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="property_type">Type</Label>
                        {editMode ? (
                          <Input
                            id="property_type"
                            value={editedData?.property_type || ''}
                            onChange={(e) => setEditedData({...editedData, property_type: e.target.value})}
                          />
                        ) : (
                          <p className="text-sm text-gray-900">{data.contractData.property_type}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="property_size_sqm">Size (sqm)</Label>
                        {editMode ? (
                          <Input
                            id="property_size_sqm"
                            value={editedData?.property_size_sqm || ''}
                            onChange={(e) => setEditedData({...editedData, property_size_sqm: e.target.value})}
                          />
                        ) : (
                          <p className="text-sm text-gray-900">{data.contractData.property_size_sqm}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="property_condition">Condition</Label>
                        {editMode ? (
                          <Input
                            id="property_condition"
                            value={editedData?.property_condition || ''}
                            onChange={(e) => setEditedData({...editedData, property_condition: e.target.value})}
                          />
                        ) : (
                          <p className="text-sm text-gray-900">{data.contractData.property_condition}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financial Terms */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                      <DollarSign className="w-4 h-4" />
                      <span>Financial Terms</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="listing_price">Listing Price</Label>
                        {editMode ? (
                          <Input
                            id="listing_price"
                            type="number"
                            value={editedData?.listing_price || ''}
                            onChange={(e) => setEditedData({...editedData, listing_price: parseFloat(e.target.value)})}
                          />
                        ) : (
                          <p className="text-sm text-gray-900">{formatPrice(data.contractData.listing_price)}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                        {editMode ? (
                          <Input
                            id="commission_rate"
                            type="number"
                            step="0.1"
                            value={editedData?.commission_rate || ''}
                            onChange={(e) => setEditedData({...editedData, commission_rate: parseFloat(e.target.value)})}
                          />
                        ) : (
                          <p className="text-sm text-gray-900">{data.contractData.commission_rate}%</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contract Terms */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                      <Calendar className="w-4 h-4" />
                      <span>Contract Terms</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="contract_duration">Duration (months)</Label>
                        {editMode ? (
                          <Input
                            id="contract_duration"
                            type="number"
                            value={editedData?.contract_duration || ''}
                            onChange={(e) => setEditedData({...editedData, contract_duration: parseInt(e.target.value)})}
                          />
                        ) : (
                          <p className="text-sm text-gray-900">{data.contractData.contract_duration} months</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="start_date">Start Date</Label>
                        {editMode ? (
                          <Input
                            id="start_date"
                            type="date"
                            value={editedData?.start_date || ''}
                            onChange={(e) => setEditedData({...editedData, start_date: e.target.value})}
                          />
                        ) : (
                          <p className="text-sm text-gray-900">{data.contractData.start_date}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="end_date">End Date</Label>
                        {editMode ? (
                          <Input
                            id="end_date"
                            type="date"
                            value={editedData?.end_date || ''}
                            onChange={(e) => setEditedData({...editedData, end_date: e.target.value})}
                          />
                        ) : (
                          <p className="text-sm text-gray-900">{data.contractData.end_date}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'review' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">AI Legal Review</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Confidence Score</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(data.aiReview.confidenceScore)}`}>
                          {data.aiReview.confidenceScore}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${data.aiReview.confidenceScore}%` }}
                        />
                      </div>
                    </div>

                    {data.aiReview.riskFactors.length > 0 && (
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Risk Factors
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {data.aiReview.riskFactors.map((factor, index) => (
                            <li key={index} className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {data.aiReview.recommendations.length > 0 && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">Recommendations</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          {data.aiReview.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {data.aiReview.warnings.length > 0 && (
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h4 className="font-medium text-red-800 mb-2">Warnings</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          {data.aiReview.warnings.map((warning, index) => (
                            <li key={index} className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Generate Contract
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}