'use client'
import { 
  Wifi, 
  Car, 
  Utensils, 
  Waves, 
  Dumbbell, 
  Shield, 
  Eye, 
  Building, 
  Snowflake, 
  Tv,
  WashingMachine,
  Camera,
  Mountain
} from 'lucide-react'

interface AmenitiesTabProps {
  formData: any
  updateFormData: (field: string, value: any) => void
  errors: Record<string, string>
}

const AMENITY_CATEGORIES = [
  {
    title: 'Essential Amenities',
    amenities: [
      { key: 'has_wifi', label: 'Wi-Fi', icon: Wifi, popular: true },
      { key: 'has_ac', label: 'Air Conditioning', icon: Snowflake, popular: true },
      { key: 'has_kitchen', label: 'Full Kitchen', icon: Utensils, popular: true },
      { key: 'has_tv', label: 'TV', icon: Tv, popular: true },
      { key: 'has_washing_machine', label: 'Washing Machine', icon: WashingMachine, popular: false },
      { key: 'has_heating', label: 'Heating', icon: Snowflake, popular: false }
    ]
  },
  {
    title: 'Egyptian Specialties',
    amenities: [
      { key: 'has_sea_view', label: 'Sea View', icon: Waves, popular: true },
      { key: 'has_nile_view', label: 'Nile View', icon: Waves, popular: true },
      { key: 'has_balcony', label: 'Balcony/Terrace', icon: Building, popular: true },
      { key: 'has_satellite_tv', label: 'Satellite TV', icon: Tv, popular: false }
    ]
  },
  {
    title: 'Luxury Features',
    amenities: [
      { key: 'has_swimming_pool', label: 'Swimming Pool', icon: Waves, popular: true },
      { key: 'has_gym', label: 'Gym/Fitness Center', icon: Dumbbell, popular: false },
      { key: 'has_spa', label: 'Spa Services', icon: Mountain, popular: false },
      { key: 'has_concierge', label: 'Concierge Service', icon: Shield, popular: false }
    ]
  },
  {
    title: 'Safety & Security',
    amenities: [
      { key: 'has_security_guard', label: '24/7 Security', icon: Shield, popular: true },
      { key: 'has_elevator', label: 'Elevator', icon: Building, popular: true },
      { key: 'has_cctv', label: 'Security Cameras', icon: Camera, popular: false },
      { key: 'has_safe', label: 'In-room Safe', icon: Shield, popular: false }
    ]
  },
  {
    title: 'Location & Access',
    amenities: [
      { key: 'has_parking', label: 'Free Parking', icon: Car, popular: true },
      { key: 'has_valet_parking', label: 'Valet Parking', icon: Car, popular: false },
      { key: 'has_beach_access', label: 'Beach Access', icon: Waves, popular: true },
      { key: 'has_city_view', label: 'City View', icon: Building, popular: false }
    ]
  }
]

export default function AmenitiesTab({ formData, updateFormData, errors }: AmenitiesTabProps) {
  const amenities = formData.amenities || {}

  const updateAmenity = (key: string, value: boolean) => {
    const updatedAmenities = {
      ...amenities,
      [key]: value
    }
    updateFormData('amenities', updatedAmenities)
  }

  const getSelectedCount = () => {
    return Object.values(amenities).filter(Boolean).length
  }

  const getPopularCount = () => {
    return AMENITY_CATEGORIES.flatMap(cat => cat.amenities)
      .filter(amenity => amenity.popular && amenities[amenity.key])
      .length
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Property Amenities</h2>
        <p className="text-gray-600">
          Highlight your property's best features. Popular amenities help attract more bookings.
        </p>
        
        {getSelectedCount() > 0 && (
          <div className="mt-3 flex items-center space-x-4 text-sm">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
              {getSelectedCount()} amenities selected
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
              {getPopularCount()} popular features
            </span>
          </div>
        )}
      </div>

      {AMENITY_CATEGORIES.map((category) => (
        <div key={category.title} className="space-y-4">
          <h3 className="font-medium text-gray-900 border-b border-gray-200 pb-2">
            {category.title}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {category.amenities.map((amenity) => {
              const IconComponent = amenity.icon
              const isSelected = amenities[amenity.key]
              
              return (
                <div
                  key={amenity.key}
                  onClick={() => updateAmenity(amenity.key, !isSelected)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <IconComponent className={`w-5 h-5 ${
                        isSelected ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${
                          isSelected ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {amenity.label}
                        </span>
                        
                        {amenity.popular && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      
                      {isSelected && (
                        <div className="flex items-center mt-1">
                          <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="ml-2 text-sm text-blue-700">Selected</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Custom Amenities */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900 border-b border-gray-200 pb-2">
          Additional Amenities
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Amenities (one per line)
          </label>
          <textarea
            value={formData.custom_amenities || ''}
            onChange={(e) => updateFormData('custom_amenities', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Rooftop garden&#10;Private chef available&#10;PlayStation 5&#10;Baby crib available"
          />
          <p className="text-xs text-gray-500 mt-1">
            List any additional amenities not covered above
          </p>
        </div>
      </div>

      {/* Amenities Summary */}
      {getSelectedCount() > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-900 mb-3">Amenities Summary</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {AMENITY_CATEGORIES.flatMap(cat => cat.amenities)
              .filter(amenity => amenities[amenity.key])
              .map(amenity => {
                const IconComponent = amenity.icon
                return (
                  <div key={amenity.key} className="flex items-center space-x-2 text-sm text-green-800">
                    <IconComponent className="w-4 h-4" />
                    <span>{amenity.label}</span>
                    {amenity.popular && (
                      <span className="text-yellow-600">★</span>
                    )}
                  </div>
                )
              })}
          </div>
          
          {formData.custom_amenities && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-sm text-green-800 font-medium mb-1">Custom amenities:</p>
              <div className="text-sm text-green-700">
                {formData.custom_amenities.split('\n').filter(Boolean).map((amenity: string, index: number) => (
                  <div key={index} className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2"></span>
                    {amenity.trim()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">💡 Amenity Tips</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>Popular amenities</strong> (marked with ★) increase booking rates by up to 40%</p>
          <p>• <strong>Wi-Fi and AC</strong> are essential for most Egyptian guests</p>
          <p>• <strong>Sea/Nile views</strong> command premium pricing in coastal and riverside properties</p>
          <p>• <strong>Security features</strong> are highly valued by international guests</p>
          <p>• <strong>Parking</strong> is crucial in urban areas like Cairo and Alexandria</p>
        </div>
      </div>
    </div>
  )
}