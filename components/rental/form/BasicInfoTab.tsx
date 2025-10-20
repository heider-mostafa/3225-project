'use client'
import { Search, Home, MapPin } from 'lucide-react'

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

interface BasicInfoTabProps {
  formData: any
  properties: Property[]
  updateFormData: (field: string, value: any) => void
  errors: Record<string, string>
}

export default function BasicInfoTab({ formData, properties, updateFormData, errors }: BasicInfoTabProps) {
  const selectedProperty = properties.find(p => p.id === formData.property_id)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Basic Information</h2>
        <p className="text-gray-600">Select a property and configure basic rental settings.</p>
      </div>

      {/* Property Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Property <span className="text-red-500">*</span>
        </label>
        
        <div className="space-y-3">
          {properties.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Home className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No suitable properties found</p>
              <p className="text-sm text-gray-400">Properties must be available and furnished</p>
            </div>
          ) : (
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {properties.map((property) => (
                <div
                  key={property.id}
                  onClick={() => updateFormData('property_id', property.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.property_id === property.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{property.title}</h3>
                      <div className="flex items-center text-gray-500 text-sm mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        {property.address}, {property.city}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                        <span>{property.property_type}</span>
                        <span>•</span>
                        <span>{property.bedrooms} bed</span>
                        <span>•</span>
                        <span>{property.bathrooms} bath</span>
                        <span>•</span>
                        <span>{property.square_meters} m²</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {property.price?.toLocaleString()} EGP
                      </p>
                      <p className="text-sm text-gray-500">Property Value</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {errors.property_id && (
          <p className="mt-1 text-sm text-red-600">{errors.property_id}</p>
        )}
      </div>

      {/* Selected Property Details */}
      {selectedProperty && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Selected Property</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-blue-700 font-medium">Type</p>
              <p className="text-blue-800">{selectedProperty.property_type}</p>
            </div>
            <div>
              <p className="text-blue-700 font-medium">Bedrooms</p>
              <p className="text-blue-800">{selectedProperty.bedrooms}</p>
            </div>
            <div>
              <p className="text-blue-700 font-medium">Bathrooms</p>
              <p className="text-blue-800">{selectedProperty.bathrooms}</p>
            </div>
            <div>
              <p className="text-blue-700 font-medium">Size</p>
              <p className="text-blue-800">{selectedProperty.square_meters} m²</p>
            </div>
          </div>
        </div>
      )}

      {/* Rental Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rental Type <span className="text-red-500">*</span>
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              value: 'short_term',
              title: 'Short-term',
              description: 'Daily/weekly rentals (vacation, business)',
              icon: '🏖️'
            },
            {
              value: 'long_term',
              title: 'Long-term',
              description: 'Monthly/yearly rentals (residents)',
              icon: '🏠'
            },
            {
              value: 'both',
              title: 'Both',
              description: 'Flexible rental periods',
              icon: '🔄'
            }
          ].map((option) => (
            <div
              key={option.value}
              onClick={() => updateFormData('rental_type', option.value)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.rental_type === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{option.icon}</div>
                <h3 className="font-medium text-gray-900">{option.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{option.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        {errors.rental_type && (
          <p className="mt-1 text-sm text-red-600">{errors.rental_type}</p>
        )}
      </div>

      {/* Status Settings */}
      <div className="border-t pt-6">
        <h3 className="font-medium text-gray-900 mb-4">Initial Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Active Listing</label>
              <p className="text-sm text-gray-500">Make this rental available for bookings</p>
            </div>
            <button
              type="button"
              onClick={() => updateFormData('is_active', !formData.is_active)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.is_active ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.is_active ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Instant Book</label>
              <p className="text-sm text-gray-500">Allow guests to book without approval</p>
            </div>
            <button
              type="button"
              onClick={() => updateFormData('instant_book', !formData.instant_book)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.instant_book ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.instant_book ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">External Sync</label>
              <p className="text-sm text-gray-500">Sync with Airbnb and other platforms</p>
            </div>
            <button
              type="button"
              onClick={() => updateFormData('auto_sync_external', !formData.auto_sync_external)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.auto_sync_external ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.auto_sync_external ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}