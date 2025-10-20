'use client'
import { AlertTriangle, Volume2, Users, Clock } from 'lucide-react'

interface HouseRulesTabProps {
  formData: any
  updateFormData: (field: string, value: any) => void
  errors: Record<string, string>
}

export default function HouseRulesTab({ formData, updateFormData, errors }: HouseRulesTabProps) {
  const houseRules = formData.house_rules || {
    smoking_allowed: false,
    pets_allowed: false,
    parties_allowed: false,
    quiet_hours: '22:00-08:00',
    maximum_occupancy: null,
    additional_rules: []
  }

  const updateHouseRule = (key: string, value: any) => {
    const updatedRules = {
      ...houseRules,
      [key]: value
    }
    updateFormData('house_rules', updatedRules)
  }

  const addCustomRule = (rule: string) => {
    if (rule.trim()) {
      const updatedRules = {
        ...houseRules,
        additional_rules: [...(houseRules.additional_rules || []), rule.trim()]
      }
      updateFormData('house_rules', updatedRules)
    }
  }

  const removeCustomRule = (index: number) => {
    const updatedRules = {
      ...houseRules,
      additional_rules: houseRules.additional_rules.filter((_: any, i: number) => i !== index)
    }
    updateFormData('house_rules', updatedRules)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">House Rules & Policies</h2>
        <p className="text-gray-600">
          Set clear expectations for your guests to ensure a positive experience for everyone.
        </p>
      </div>

      {/* Core Rules */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Basic Policies</h3>
        
        <div className="space-y-4">
          {/* Smoking */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <label className="font-medium text-gray-900">Smoking</label>
              <p className="text-sm text-gray-600">Allow smoking inside the property</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => updateHouseRule('smoking_allowed', false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !houseRules.smoking_allowed
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Not Allowed
              </button>
              <button
                type="button"
                onClick={() => updateHouseRule('smoking_allowed', true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  houseRules.smoking_allowed
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Allowed
              </button>
            </div>
          </div>

          {/* Pets */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <label className="font-medium text-gray-900">Pets</label>
              <p className="text-sm text-gray-600">Allow guests to bring pets</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => updateHouseRule('pets_allowed', false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !houseRules.pets_allowed
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Not Allowed
              </button>
              <button
                type="button"
                onClick={() => updateHouseRule('pets_allowed', true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  houseRules.pets_allowed
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
              Allowed
              </button>
            </div>
          </div>

          {/* Parties/Events */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <label className="font-medium text-gray-900">Parties & Events</label>
              <p className="text-sm text-gray-600">Allow gatherings and celebrations</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => updateHouseRule('parties_allowed', false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !houseRules.parties_allowed
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Not Allowed
              </button>
              <button
                type="button"
                onClick={() => updateHouseRule('parties_allowed', true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  houseRules.parties_allowed
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Allowed
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quiet Hours */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quiet Hours
        </label>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: '22:00-08:00', label: '10 PM - 8 AM', description: 'Standard quiet hours' },
            { value: '23:00-07:00', label: '11 PM - 7 AM', description: 'Relaxed quiet hours' },
            { value: '21:00-08:00', label: '9 PM - 8 AM', description: 'Extended quiet hours' },
            { value: 'none', label: 'No quiet hours', description: 'No restrictions' }
          ].map((option) => (
            <div
              key={option.value}
              onClick={() => updateHouseRule('quiet_hours', option.value)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors text-center ${
                houseRules.quiet_hours === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Clock className="w-5 h-5 mx-auto mb-2 text-gray-600" />
              <div className="font-medium text-gray-900 text-sm">{option.label}</div>
              <div className="text-xs text-gray-600 mt-1">{option.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Rules */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Additional Rules</h3>
        
        {/* Pre-defined Common Rules */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Common Additional Rules (optional)</h4>
          
          {[
            'No shoes inside the property',
            'No food or drinks in bedrooms',
            'No loud music after quiet hours',
            'Clean dishes after use',
            'Take trash out before checkout',
            'No guests beyond registered number',
            'Lock doors when leaving',
            'Turn off AC/lights when not in room'
          ].map((rule, index) => (
            <label key={index} className="flex items-center">
              <input
                type="checkbox"
                checked={houseRules.additional_rules?.includes(rule)}
                onChange={(e) => {
                  if (e.target.checked) {
                    addCustomRule(rule)
                  } else {
                    const ruleIndex = houseRules.additional_rules?.indexOf(rule)
                    if (ruleIndex !== -1) {
                      removeCustomRule(ruleIndex)
                    }
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{rule}</span>
            </label>
          ))}
        </div>

        {/* Custom Rules */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Rules
          </label>
          
          <div className="space-y-2">
            <textarea
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  addCustomRule(e.currentTarget.value)
                  e.currentTarget.value = ''
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add custom rule and press Enter"
              rows={2}
            />
            <p className="text-xs text-gray-500">Press Enter to add each rule</p>
          </div>
        </div>

        {/* Display Added Rules */}
        {houseRules.additional_rules && houseRules.additional_rules.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Added Rules:</h4>
            <div className="space-y-2">
              {houseRules.additional_rules.map((rule: string, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-800">{rule}</span>
                  <button
                    type="button"
                    onClick={() => removeCustomRule(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rules Summary */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
          <h3 className="font-medium text-yellow-900">House Rules Summary</h3>
        </div>
        
        <div className="text-sm text-yellow-800 space-y-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
            <div>
              <p className="font-medium">Smoking:</p>
              <p className={houseRules.smoking_allowed ? 'text-green-700' : 'text-red-700'}>
                {houseRules.smoking_allowed ? '✓ Allowed' : '✗ Not allowed'}
              </p>
            </div>
            <div>
              <p className="font-medium">Pets:</p>
              <p className={houseRules.pets_allowed ? 'text-green-700' : 'text-red-700'}>
                {houseRules.pets_allowed ? '✓ Allowed' : '✗ Not allowed'}
              </p>
            </div>
            <div>
              <p className="font-medium">Parties:</p>
              <p className={houseRules.parties_allowed ? 'text-green-700' : 'text-red-700'}>
                {houseRules.parties_allowed ? '✓ Allowed' : '✗ Not allowed'}
              </p>
            </div>
          </div>
          
          <p><strong>Quiet Hours:</strong> {houseRules.quiet_hours === 'none' ? 'No restrictions' : houseRules.quiet_hours}</p>
          
          {houseRules.additional_rules && houseRules.additional_rules.length > 0 && (
            <div>
              <p className="font-medium">Additional Rules ({houseRules.additional_rules.length}):</p>
              <ul className="list-disc list-inside pl-2">
                {houseRules.additional_rules.slice(0, 3).map((rule: string, index: number) => (
                  <li key={index} className="text-yellow-700">{rule}</li>
                ))}
                {houseRules.additional_rules.length > 3 && (
                  <li className="text-yellow-600">...and {houseRules.additional_rules.length - 3} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">💡 House Rules Tips</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>Clear rules</strong> reduce conflicts and misunderstandings</p>
          <p>• <strong>Reasonable policies</strong> attract respectful guests</p>
          <p>• <strong>Cultural considerations</strong> are important in Egypt (prayer times, family values)</p>
          <p>• <strong>Communicate rules</strong> during booking confirmation</p>
          <p>• <strong>Be flexible</strong> for genuine requests when possible</p>
        </div>
      </div>
    </div>
  )
}