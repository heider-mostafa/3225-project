'use client'
import { Calendar, DollarSign, Clock } from 'lucide-react'

interface AvailabilityTabProps {
  formData: any
  updateFormData: (field: string, value: any) => void
  errors: Record<string, string>
}

export default function AvailabilityTab({ formData, updateFormData, errors }: AvailabilityTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Availability & Calendar</h2>
        <p className="text-gray-600">
          Configure your rental calendar and availability settings. Detailed calendar management will be available after creating the listing.
        </p>
      </div>

      {/* Calendar Placeholder */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rental Calendar
        </label>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Calendar Coming Soon</h3>
          <p className="text-gray-600 mb-4">
            Full calendar management with pricing and availability controls will be available after creating your rental listing.
          </p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>✓ Block specific dates</p>
            <p>✓ Set seasonal pricing</p>
            <p>✓ Manage booking windows</p>
            <p>✓ Sync with external platforms</p>
          </div>
        </div>
      </div>

      {/* Initial Availability Settings */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Initial Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available From
            </label>
            <input
              type="date"
              value={formData.available_from || ''}
              onChange={(e) => updateFormData('available_from', e.target.value)}
              className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Until (Optional)
            </label>
            <input
              type="date"
              value={formData.available_until || ''}
              onChange={(e) => updateFormData('available_until', e.target.value)}
              className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Default Availability */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Default Availability
        </label>
        
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <div
              key={day}
              onClick={() => {
                const currentDays = formData.default_available_days || [0, 1, 2, 3, 4, 5, 6]
                const updatedDays = currentDays.includes(index)
                  ? currentDays.filter((d: number) => d !== index)
                  : [...currentDays, index]
                updateFormData('default_available_days', updatedDays.sort())
              }}
              className={`p-3 text-center border-2 rounded-lg cursor-pointer transition-colors ${
                (formData.default_available_days || [0, 1, 2, 3, 4, 5, 6]).includes(index)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">{day}</div>
            </div>
          ))}
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Select which days of the week your rental is typically available
        </p>
      </div>

      {/* Calendar Preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <Clock className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="font-medium text-blue-900">Calendar Summary</h3>
        </div>
        
        <div className="text-sm text-blue-800 space-y-2">
          <div className="flex items-center justify-between">
            <span>Available from:</span>
            <span className="font-medium">
              {formData.available_from ? new Date(formData.available_from).toLocaleDateString() : 'Not set'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Available until:</span>
            <span className="font-medium">
              {formData.available_until ? new Date(formData.available_until).toLocaleDateString() : 'No end date'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Available days:</span>
            <span className="font-medium">
              {(formData.default_available_days || [0, 1, 2, 3, 4, 5, 6]).length} days/week
            </span>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-medium text-green-900 mb-2">🗓️ After Creating Your Rental</h3>
        <div className="text-sm text-green-800 space-y-1">
          <p>• <strong>Access advanced calendar</strong> with day-by-day availability control</p>
          <p>• <strong>Set seasonal pricing</strong> for holidays and peak periods</p>
          <p>• <strong>Block maintenance days</strong> and personal use dates</p>
          <p>• <strong>Sync with Airbnb and Booking.com</strong> to prevent double bookings</p>
          <p>• <strong>Set minimum stays</strong> for specific date ranges</p>
        </div>
      </div>
    </div>
  )
}