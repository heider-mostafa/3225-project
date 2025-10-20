'use client'
import { DollarSign, Calculator, Info } from 'lucide-react'

interface PricingTabProps {
  formData: any
  updateFormData: (field: string, value: any) => void
  errors: Record<string, string>
}

export default function PricingTab({ formData, updateFormData, errors }: PricingTabProps) {
  const formatNumber = (value: string) => {
    const num = value.replace(/[^\d]/g, '')
    return num ? parseInt(num, 10) : null
  }

  const calculatePlatformFee = (amount: number) => {
    return Math.round(amount * 0.12) // 12% platform fee
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Pricing Structure</h2>
        <p className="text-gray-600">Set competitive rates and fees for your rental property.</p>
      </div>

      {/* Base Rates */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Base Rates</h3>
        
        {(formData.rental_type === 'short_term' || formData.rental_type === 'both') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nightly Rate <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={formData.nightly_rate ? formData.nightly_rate.toLocaleString() : ''}
                onChange={(e) => updateFormData('nightly_rate', formatNumber(e.target.value))}
                className="w-full pl-10 pr-16 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter nightly rate"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">EGP</span>
              </div>
            </div>
            {errors.nightly_rate && (
              <p className="mt-1 text-sm text-red-600">{errors.nightly_rate}</p>
            )}
          </div>
        )}

        {(formData.rental_type === 'long_term' || formData.rental_type === 'both') && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Rate <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.monthly_rate ? formData.monthly_rate.toLocaleString() : ''}
                  onChange={(e) => updateFormData('monthly_rate', formatNumber(e.target.value))}
                  className="w-full pl-10 pr-16 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter monthly rate"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">EGP</span>
                </div>
              </div>
              {errors.monthly_rate && (
                <p className="mt-1 text-sm text-red-600">{errors.monthly_rate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yearly Rate (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.yearly_rate ? formData.yearly_rate.toLocaleString() : ''}
                  onChange={(e) => updateFormData('yearly_rate', formatNumber(e.target.value))}
                  className="w-full pl-10 pr-16 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter yearly rate"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">EGP</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Additional Fees */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Additional Fees</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cleaning Fee
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={formData.cleaning_fee ? formData.cleaning_fee.toLocaleString() : ''}
                onChange={(e) => updateFormData('cleaning_fee', formatNumber(e.target.value) || 0)}
                className="w-full pl-10 pr-16 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">EGP</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Security Deposit
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={formData.security_deposit ? formData.security_deposit.toLocaleString() : ''}
                onChange={(e) => updateFormData('security_deposit', formatNumber(e.target.value) || 0)}
                className="w-full pl-10 pr-16 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">EGP</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Extra Guest Fee
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={formData.extra_guest_fee ? formData.extra_guest_fee.toLocaleString() : ''}
                onChange={(e) => updateFormData('extra_guest_fee', formatNumber(e.target.value) || 0)}
                className="w-full pl-10 pr-16 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">EGP</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Per night, per extra guest</p>
          </div>
        </div>
      </div>

      {/* Pricing Calculator */}
      {(formData.nightly_rate || formData.monthly_rate) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Calculator className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-medium text-blue-900">Pricing Calculator</h3>
          </div>
          
          <div className="space-y-3 text-sm">
            {formData.nightly_rate && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-blue-700 font-medium">3-Night Booking</p>
                  <div className="space-y-1 text-blue-800">
                    <div className="flex justify-between">
                      <span>Nightly rate (×3):</span>
                      <span>{(formData.nightly_rate * 3).toLocaleString()} EGP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cleaning fee:</span>
                      <span>{formData.cleaning_fee.toLocaleString()} EGP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform fee (12%):</span>
                      <span>{calculatePlatformFee((formData.nightly_rate * 3) + formData.cleaning_fee).toLocaleString()} EGP</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-200 pt-1 font-medium">
                      <span>Total for guest:</span>
                      <span>{((formData.nightly_rate * 3) + formData.cleaning_fee + calculatePlatformFee((formData.nightly_rate * 3) + formData.cleaning_fee)).toLocaleString()} EGP</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-blue-700 font-medium">7-Night Booking</p>
                  <div className="space-y-1 text-blue-800">
                    <div className="flex justify-between">
                      <span>Nightly rate (×7):</span>
                      <span>{(formData.nightly_rate * 7).toLocaleString()} EGP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cleaning fee:</span>
                      <span>{formData.cleaning_fee.toLocaleString()} EGP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform fee (12%):</span>
                      <span>{calculatePlatformFee((formData.nightly_rate * 7) + formData.cleaning_fee).toLocaleString()} EGP</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-200 pt-1 font-medium">
                      <span>Total for guest:</span>
                      <span>{((formData.nightly_rate * 7) + formData.cleaning_fee + calculatePlatformFee((formData.nightly_rate * 7) + formData.cleaning_fee)).toLocaleString()} EGP</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {formData.monthly_rate && (
              <div>
                <p className="text-blue-700 font-medium">Monthly Booking</p>
                <div className="space-y-1 text-blue-800">
                  <div className="flex justify-between">
                    <span>Monthly rate:</span>
                    <span>{formData.monthly_rate.toLocaleString()} EGP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform fee (12%):</span>
                    <span>{calculatePlatformFee(formData.monthly_rate).toLocaleString()} EGP</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-200 pt-1 font-medium">
                    <span>Total for guest:</span>
                    <span>{(formData.monthly_rate + calculatePlatformFee(formData.monthly_rate)).toLocaleString()} EGP</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancellation Policy */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cancellation Policy
        </label>
        
        <div className="space-y-3">
          {[
            {
              value: 'strict',
              title: 'Strict',
              description: 'Full refund for 48 hours, then 50% refund up to 7 days before check-in',
              recommended: false
            },
            {
              value: 'moderate',
              title: 'Moderate',
              description: 'Full refund 5 days prior to check-in, 50% refund within 5 days',
              recommended: true
            },
            {
              value: 'flexible',
              title: 'Flexible',
              description: 'Full refund 1 day prior to check-in, 50% refund for same-day cancellations',
              recommended: false
            }
          ].map((policy) => (
            <div
              key={policy.value}
              onClick={() => updateFormData('cancellation_policy', policy.value)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.cancellation_policy === policy.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="font-medium text-gray-900">{policy.title}</h3>
                    {policy.recommended && (
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{policy.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Fee Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-yellow-800 font-medium">Platform Fee Information</p>
            <p className="text-yellow-700 mt-1">
              A 12% platform fee is automatically added to all bookings. This covers payment processing, 
              customer support, insurance, and platform maintenance. The fee is collected from guests 
              and you receive the full rental amount minus any applicable taxes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}