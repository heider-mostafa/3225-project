'use client'
import { Shield, FileText, QrCode, AlertCircle, CheckCircle } from 'lucide-react'

interface ComplianceTabProps {
  formData: any
  updateFormData: (field: string, value: any) => void
  errors: Record<string, string>
}

export default function ComplianceTab({ formData, updateFormData, errors }: ComplianceTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Compliance & Legal Requirements</h2>
        <p className="text-gray-600">
          Ensure your rental meets Egyptian legal requirements and developer standards.
        </p>
      </div>

      {/* Tourism Permit */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tourism Permit Number
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={formData.tourism_permit_number || ''}
            onChange={(e) => updateFormData('tourism_permit_number', e.target.value)}
            className="w-full pl-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter tourism permit number"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Required for short-term rentals in tourist areas
        </p>
      </div>

      {/* Developer QR Code - Only show if already has bookings */}
      {formData.developer_qr_code && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Developer QR Code
          </label>
          <div className="bg-gray-50 p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-blue-600" />
              <span className="font-mono text-sm">{formData.developer_qr_code}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              QR code provided after guest booking confirmation
            </p>
          </div>
        </div>
      )}
      
      {/* Info about QR Code generation */}
      {!formData.developer_qr_code && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <QrCode className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">QR Code Generation</h4>
              <p className="text-sm text-blue-700 mt-1">
                Access QR codes are automatically generated and sent to guests 24-48 hours before check-in. 
                This includes developer QR codes (Emaar Misr, SODIC, Hyde Park) and building access codes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Compliance Status
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: 'pending', label: 'Pending Review', icon: AlertCircle, color: 'yellow' },
            { value: 'approved', label: 'Approved', icon: CheckCircle, color: 'green' },
            { value: 'rejected', label: 'Rejected', icon: AlertCircle, color: 'red' },
            { value: 'expired', label: 'Expired', icon: AlertCircle, color: 'gray' }
          ].map((status) => {
            const IconComponent = status.icon
            return (
              <div
                key={status.value}
                onClick={() => updateFormData('compliance_status', status.value)}
                className={`p-3 border-2 rounded-lg cursor-pointer transition-colors text-center ${
                  formData.compliance_status === status.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <IconComponent className={`w-5 h-5 mx-auto mb-1 ${
                  status.color === 'green' ? 'text-green-600' :
                  status.color === 'yellow' ? 'text-yellow-600' :
                  status.color === 'red' ? 'text-red-600' : 'text-gray-600'
                }`} />
                <div className="font-medium text-gray-900 text-sm">{status.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Compliance Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <Shield className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="font-medium text-blue-900">Compliance Status</h3>
        </div>
        
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-center justify-between">
            <span>Tourism Permit:</span>
            <span className={`px-2 py-1 rounded text-xs ${
              formData.tourism_permit_number ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {formData.tourism_permit_number ? 'Provided' : 'Missing'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>QR Code Access:</span>
            <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
              Generated after booking
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Status:</span>
            <span className="font-medium capitalize">{formData.compliance_status}</span>
          </div>
        </div>
      </div>
    </div>
  )
}