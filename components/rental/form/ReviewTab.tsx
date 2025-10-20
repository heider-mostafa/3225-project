'use client'
import { Eye, Save, CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface Property {
  id: string
  title: string
  address: string
  city: string
  property_type: string
  bedrooms: number
  bathrooms: number
  square_meters: number
  price: number
}

interface ReviewTabProps {
  formData: any
  properties: Property[]
  completedTabs: Set<string>
  onSave: (publish: boolean) => Promise<void>
  saving: boolean
}

export default function ReviewTab({ formData, properties, completedTabs, onSave, saving }: ReviewTabProps) {
  const selectedProperty = properties.find(p => p.id === formData.property_id)
  
  const requiredTabs = ['basic', 'pricing', 'booking']
  const isReadyToPublish = requiredTabs.every(tab => completedTabs.has(tab))
  
  const formatCurrency = (amount: number | null) => {
    return amount ? `${amount.toLocaleString()} EGP` : 'Not set'
  }

  const getCompletionPercentage = () => {
    const totalTabs = ['basic', 'pricing', 'booking', 'amenities', 'rules', 'compliance', 'media', 'availability']
    const completed = totalTabs.filter(tab => completedTabs.has(tab)).length
    return Math.round((completed / totalTabs.length) * 100)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Review & Publish</h2>
        <p className="text-gray-600">
          Review your rental listing details before publishing. You can always edit these later.
        </p>
        
        {/* Completion Status */}
        <div className="mt-4 flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Setup Progress</span>
              <span className="font-medium">{getCompletionPercentage()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getCompletionPercentage()}%` }}
              />
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isReadyToPublish 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {isReadyToPublish ? 'Ready to Publish' : 'Needs Required Info'}
          </div>
        </div>
      </div>

      {/* Property Summary */}
      {selectedProperty && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Property Overview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Property Details</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Title:</strong> {selectedProperty.title}</p>
                <p><strong>Location:</strong> {selectedProperty.address}, {selectedProperty.city}</p>
                <p><strong>Type:</strong> {selectedProperty.property_type}</p>
                <p><strong>Size:</strong> {selectedProperty.bedrooms} bed, {selectedProperty.bathrooms} bath, {selectedProperty.square_meters} m²</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Rental Configuration</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Type:</strong> {formData.rental_type.replace('_', '-')}</p>
                <p><strong>Status:</strong> {formData.is_active ? 'Active' : 'Inactive'}</p>
                <p><strong>Instant Book:</strong> {formData.instant_book ? 'Yes' : 'No'}</p>
                <p><strong>Compliance:</strong> {formData.compliance_status}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Pricing Structure</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Base Rates</h4>
            <div className="space-y-1 text-sm text-gray-600">
              {formData.nightly_rate && <p><strong>Nightly:</strong> {formatCurrency(formData.nightly_rate)}</p>}
              {formData.monthly_rate && <p><strong>Monthly:</strong> {formatCurrency(formData.monthly_rate)}</p>}
              {formData.yearly_rate && <p><strong>Yearly:</strong> {formatCurrency(formData.yearly_rate)}</p>}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Fees</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Cleaning Fee:</strong> {formatCurrency(formData.cleaning_fee)}</p>
              <p><strong>Security Deposit:</strong> {formatCurrency(formData.security_deposit)}</p>
              <p><strong>Extra Guest Fee:</strong> {formatCurrency(formData.extra_guest_fee)}</p>
              <p><strong>Cancellation:</strong> {formData.cancellation_policy}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Rules Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Booking Rules</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
          <div>
            <p className="font-medium text-gray-700">Stay Duration</p>
            <p>{formData.minimum_stay_nights}-{formData.maximum_stay_nights} nights</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Check Times</p>
            <p>{formData.check_in_time} - {formData.check_out_time}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Max Guests</p>
            <p>{formData.max_guests || 'Not set'}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Advance Notice</p>
            <p>{formData.advance_notice_days || 0} days</p>
          </div>
        </div>
      </div>

      {/* Amenities & Rules */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Amenities & House Rules</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Amenities</h4>
            <div className="text-sm text-gray-600">
              {formData.amenities && Object.keys(formData.amenities).length > 0 ? (
                <p>{Object.values(formData.amenities).filter(Boolean).length} amenities selected</p>
              ) : (
                <p className="text-yellow-600">No amenities selected</p>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">House Rules</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Smoking:</strong> {formData.house_rules?.smoking_allowed ? 'Allowed' : 'Not allowed'}</p>
              <p><strong>Pets:</strong> {formData.house_rules?.pets_allowed ? 'Allowed' : 'Not allowed'}</p>
              <p><strong>Parties:</strong> {formData.house_rules?.parties_allowed ? 'Allowed' : 'Not allowed'}</p>
              <p><strong>Quiet Hours:</strong> {formData.house_rules?.quiet_hours || 'Not set'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance */}
      {(formData.tourism_permit_number || formData.developer_qr_code) && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Compliance Information</h3>
          
          <div className="space-y-2 text-sm text-gray-600">
            {formData.tourism_permit_number && (
              <p><strong>Tourism Permit:</strong> {formData.tourism_permit_number}</p>
            )}
            {formData.developer_qr_code && (
              <p><strong>Developer QR:</strong> {formData.developer_qr_code}</p>
            )}
            <p><strong>Status:</strong> {formData.compliance_status}</p>
          </div>
        </div>
      )}

      {/* Validation Issues */}
      {!isReadyToPublish && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <h3 className="font-medium text-yellow-900">Required Information Missing</h3>
          </div>
          
          <div className="text-sm text-yellow-800 space-y-1">
            {!completedTabs.has('basic') && <p>• Complete basic information</p>}
            {!completedTabs.has('pricing') && <p>• Set pricing structure</p>}
            {!completedTabs.has('booking') && <p>• Configure booking rules</p>}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
        <button
          onClick={() => onSave(false)}
          disabled={saving}
          className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save as Draft'}
        </button>
        
        <button
          onClick={() => onSave(true)}
          disabled={saving || !isReadyToPublish}
          className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isReadyToPublish ? (
            <>
              <Eye className="w-4 h-4 mr-2" />
              {saving ? 'Publishing...' : 'Publish Rental'}
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 mr-2" />
              Complete Required Info First
            </>
          )}
        </button>
      </div>

      {/* Publishing Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">📋 What happens when you publish?</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Your rental will be <strong>live and bookable</strong> by guests</p>
          <p>• It will appear in search results with your specified rates</p>
          <p>• You can access the <strong>full calendar management</strong> system</p>
          <p>• Professional <strong>image management tools</strong> become available</p>
          <p>• <strong>Booking requests</strong> will start coming in based on your settings</p>
          <p>• You can always <strong>edit or deactivate</strong> the listing later</p>
        </div>
      </div>
    </div>
  )
}