'use client'
import { Clock, Calendar, Users, CheckCircle } from 'lucide-react'

interface BookingRulesTabProps {
  formData: any
  updateFormData: (field: string, value: any) => void
  errors: Record<string, string>
}

export default function BookingRulesTab({ formData, updateFormData, errors }: BookingRulesTabProps) {
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0')
    return { value: `${hour}:00`, label: `${hour}:00` }
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Booking Rules & Policies</h2>
        <p className="text-gray-600">Configure booking requirements and check-in/out procedures.</p>
      </div>

      {/* Stay Duration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Stay <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              max="365"
              value={formData.minimum_stay_nights}
              onChange={(e) => updateFormData('minimum_stay_nights', parseInt(e.target.value) || 1)}
              className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm">nights</span>
            </div>
          </div>
          {errors.minimum_stay_nights && (
            <p className="mt-1 text-sm text-red-600">{errors.minimum_stay_nights}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Recommended: 2-3 nights for short-term rentals</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Stay <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              max="365"
              value={formData.maximum_stay_nights}
              onChange={(e) => updateFormData('maximum_stay_nights', parseInt(e.target.value) || 365)}
              className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="365"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm">nights</span>
            </div>
          </div>
          {errors.maximum_stay_nights && (
            <p className="mt-1 text-sm text-red-600">{errors.maximum_stay_nights}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Maximum booking duration allowed</p>
        </div>
      </div>

      {/* Check-in/out Times */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Check-in Time
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <select
              value={formData.check_in_time}
              onChange={(e) => updateFormData('check_in_time', e.target.value)}
              className="w-full pl-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              {timeOptions.map((time) => (
                <option key={time.value} value={time.value}>
                  {time.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-500 mt-1">Standard check-in is usually 15:00 (3 PM)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Check-out Time
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <select
              value={formData.check_out_time}
              onChange={(e) => updateFormData('check_out_time', e.target.value)}
              className="w-full pl-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              {timeOptions.map((time) => (
                <option key={time.value} value={time.value}>
                  {time.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-500 mt-1">Standard check-out is usually 11:00 (11 AM)</p>
        </div>
      </div>

      {/* Advance Notice */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Advance Notice Required
        </label>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: 0, label: 'Same day', description: 'Book today for today' },
            { value: 1, label: '1 day', description: 'Book 1 day ahead' },
            { value: 2, label: '2 days', description: 'Book 2 days ahead' },
            { value: 7, label: '1 week', description: 'Book 1 week ahead' }
          ].map((option) => (
            <div
              key={option.value}
              onClick={() => updateFormData('advance_notice_days', option.value)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors text-center ${
                formData.advance_notice_days === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900">{option.label}</div>
              <div className="text-sm text-gray-600 mt-1">{option.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Window */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Booking Window (How far in advance)
        </label>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: 90, label: '3 months', description: 'Book up to 90 days ahead' },
            { value: 180, label: '6 months', description: 'Book up to 6 months ahead' },
            { value: 365, label: '1 year', description: 'Book up to 1 year ahead' },
            { value: 730, label: '2 years', description: 'Book up to 2 years ahead' }
          ].map((option) => (
            <div
              key={option.value}
              onClick={() => updateFormData('booking_window_days', option.value)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors text-center ${
                formData.booking_window_days === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900">{option.label}</div>
              <div className="text-sm text-gray-600 mt-1">{option.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Guest Capacity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Maximum Guests
        </label>
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[1, 2, 4, 6, 8, 10, 12, 16].map((capacity) => (
            <div
              key={capacity}
              onClick={() => updateFormData('max_guests', capacity)}
              className={`p-3 border-2 rounded-lg cursor-pointer transition-colors text-center ${
                formData.max_guests === capacity
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Users className="w-5 h-5 mx-auto mb-1 text-gray-600" />
              <div className="font-medium text-gray-900">{capacity}</div>
            </div>
          ))}
        </div>
        
        <div className="mt-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.allow_extra_guests}
              onChange={(e) => updateFormData('allow_extra_guests', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Allow extra guests (additional fee applies)
            </span>
          </label>
        </div>
      </div>

      {/* Special Booking Rules */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Special Rules</h3>
        
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.require_verification}
              onChange={(e) => updateFormData('require_verification', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Require government ID verification for bookings
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.require_profile_photo}
              onChange={(e) => updateFormData('require_profile_photo', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Require guests to have profile photo
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.allow_business_travelers}
              onChange={(e) => updateFormData('allow_business_travelers', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Welcome business travelers (flexible cancellation)
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.weekend_pricing}
              onChange={(e) => updateFormData('weekend_pricing', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Enable weekend pricing (Friday-Saturday +20%)
            </span>
          </label>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <h3 className="font-medium text-green-900">Booking Rules Summary</h3>
        </div>
        
        <div className="text-sm text-green-800 space-y-1">
          <p>• Minimum stay: <strong>{formData.minimum_stay_nights} nights</strong></p>
          <p>• Maximum stay: <strong>{formData.maximum_stay_nights} nights</strong></p>
          <p>• Check-in: <strong>{formData.check_in_time}</strong> | Check-out: <strong>{formData.check_out_time}</strong></p>
          <p>• Maximum guests: <strong>{formData.max_guests || 'Not set'}</strong></p>
          <p>• Advance notice: <strong>{formData.advance_notice_days || 0} days</strong></p>
          <p>• Booking window: <strong>{formData.booking_window_days || 365} days</strong></p>
        </div>
      </div>
    </div>
  )
}