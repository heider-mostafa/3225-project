'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Save, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  DollarSign, 
  Search, 
  Eye, 
  User, 
  Lock,
  Check,
  X,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '@/components/providers'
import { supabase } from '@/lib/supabase/config'

interface UserSettings {
  id: string
  user_id: string
  email_notifications: {
    property_updates: boolean
    saved_search_alerts: boolean
    inquiry_responses: boolean
    newsletter: boolean
    marketing: boolean
  }
  sms_notifications: {
    property_updates: boolean
    saved_search_alerts: boolean
    urgent_only: boolean
  }
  push_notifications: {
    property_updates: boolean
    saved_search_alerts: boolean
    chat_messages: boolean
  }
  theme: string
  language: string
  currency: string
  profile_visibility: string
  show_activity: boolean
  allow_contact: boolean
  default_search_radius: number
  default_property_types: string[]
  price_range_preference: {
    min?: number
    max?: number
  }
}

const defaultSettings: Partial<UserSettings> = {
  email_notifications: {
    property_updates: true,
    saved_search_alerts: true,
    inquiry_responses: true,
    newsletter: false,
    marketing: false
  },
  sms_notifications: {
    property_updates: false,
    saved_search_alerts: false,
    urgent_only: true
  },
  push_notifications: {
    property_updates: true,
    saved_search_alerts: true,
    chat_messages: true
  },
  theme: 'light',
  language: 'en',
  currency: 'EGP',
  profile_visibility: 'private',
  show_activity: false,
  allow_contact: true,
  default_search_radius: 50,
  default_property_types: ['apartment', 'villa', 'townhouse']
}

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [activeSection, setActiveSection] = useState('notifications')

  useEffect(() => {
    if (!user) {
      router.push('/auth')
      return
    }
    
    loadSettings()
  }, [user, router])

  const loadSettings = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      const { data: settingsData, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error)
      }

      if (settingsData) {
        setSettings(settingsData)
      } else {
        // Create default settings if none exist
        setSettings({
          ...defaultSettings,
          user_id: user.id
        } as UserSettings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!user || !settings) return
    
    try {
      setSaving(true)
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          ...settings,
          user_id: user.id,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error saving settings:', error)
        alert('Failed to save settings. Please try again.')
        return
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)

    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const updateSettings = (updates: Partial<UserSettings>) => {
    if (!settings) return
    setSettings({ ...settings, ...updates })
  }

  const updateNestedSettings = (key: keyof UserSettings, nestedKey: string, value: any) => {
    if (!settings) return
    
    const currentValue = settings[key]
    if (typeof currentValue === 'object' && currentValue !== null) {
      setSettings({
        ...settings,
        [key]: {
          ...(currentValue as Record<string, any>),
          [nestedKey]: value
        }
      })
    }
  }

  const propertyTypes = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'villa', label: 'Villa' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'studio', label: 'Studio' },
    { value: 'duplex', label: 'Duplex' },
    { value: 'penthouse', label: 'Penthouse' }
  ]

  const sections = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'preferences', label: 'Preferences', icon: User },
    { id: 'search', label: 'Search Defaults', icon: Search }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Unable to load settings.</p>
          <button
            onClick={loadSettings}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account preferences and settings</p>
        </div>

        <div className="flex space-x-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <nav className="p-4">
                {sections.map((section) => {
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-50 text-blue-600 border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{section.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                {activeSection === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Preferences</h2>
                      
                      {/* Email Notifications */}
                      <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                          <Bell className="w-4 h-4 mr-2" />
                          Email Notifications
                        </h3>
                        <div className="space-y-3">
                          {Object.entries(settings.email_notifications).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                              <label className="text-gray-700 capitalize">
                                {key.replace(/_/g, ' ')}
                              </label>
                              <button
                                onClick={() => updateNestedSettings('email_notifications', key, !value)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  value ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    value ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* SMS Notifications */}
                      <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <h3 className="font-medium text-gray-900 mb-3">SMS Notifications</h3>
                        <div className="space-y-3">
                          {Object.entries(settings.sms_notifications).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                              <label className="text-gray-700 capitalize">
                                {key.replace(/_/g, ' ')}
                              </label>
                              <button
                                onClick={() => updateNestedSettings('sms_notifications', key, !value)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  value ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    value ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Push Notifications */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-900 mb-3">Push Notifications</h3>
                        <div className="space-y-3">
                          {Object.entries(settings.push_notifications).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                              <label className="text-gray-700 capitalize">
                                {key.replace(/_/g, ' ')}
                              </label>
                              <button
                                onClick={() => updateNestedSettings('push_notifications', key, !value)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  value ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    value ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'privacy' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Privacy & Security</h2>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Profile Visibility
                          </label>
                          <select
                            value={settings.profile_visibility}
                            onChange={(e) => updateSettings({ profile_visibility: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                            <option value="contacts_only">Contacts Only</option>
                          </select>
                          <p className="text-sm text-gray-500 mt-1">
                            Control who can see your profile information
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-medium text-gray-900">Show Activity</label>
                            <p className="text-sm text-gray-500">Allow others to see your property viewing activity</p>
                          </div>
                          <button
                            onClick={() => updateSettings({ show_activity: !settings.show_activity })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              settings.show_activity ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                settings.show_activity ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-medium text-gray-900">Allow Contact</label>
                            <p className="text-sm text-gray-500">Allow agents and other users to contact you</p>
                          </div>
                          <button
                            onClick={() => updateSettings({ allow_contact: !settings.allow_contact })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              settings.allow_contact ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                settings.allow_contact ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'appearance' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Appearance</h2>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Theme
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {['light', 'dark', 'auto'].map((theme) => (
                              <button
                                key={theme}
                                onClick={() => updateSettings({ theme })}
                                className={`p-3 border rounded-lg text-center capitalize transition-colors ${
                                  settings.theme === theme
                                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                              >
                                {theme}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Language
                          </label>
                          <select
                            value={settings.language}
                            onChange={(e) => updateSettings({ language: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="en">English</option>
                            <option value="ar">العربية</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Currency
                          </label>
                          <select
                            value={settings.currency}
                            onChange={(e) => updateSettings({ currency: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="EGP">Egyptian Pound (EGP)</option>
                            <option value="USD">US Dollar (USD)</option>
                            <option value="EUR">Euro (EUR)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'search' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Defaults</h2>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Default Search Radius (km)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="200"
                            value={settings.default_search_radius}
                            onChange={(e) => updateSettings({ default_search_radius: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Default Property Types
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {propertyTypes.map((type) => (
                              <label key={type.value} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={settings.default_property_types.includes(type.value)}
                                  onChange={(e) => {
                                    const types = [...settings.default_property_types]
                                    if (e.target.checked) {
                                      types.push(type.value)
                                    } else {
                                      const index = types.indexOf(type.value)
                                      if (index > -1) types.splice(index, 1)
                                    }
                                    updateSettings({ default_property_types: types })
                                  }}
                                  className="rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-gray-700">{type.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Default Price Range
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Minimum</label>
                              <input
                                type="number"
                                placeholder="Min price"
                                value={settings.price_range_preference?.min || ''}
                                onChange={(e) => updateSettings({
                                  price_range_preference: {
                                    ...settings.price_range_preference,
                                    min: e.target.value ? parseInt(e.target.value) : undefined
                                  }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Maximum</label>
                              <input
                                type="number"
                                placeholder="Max price"
                                value={settings.price_range_preference?.max || ''}
                                onChange={(e) => updateSettings({
                                  price_range_preference: {
                                    ...settings.price_range_preference,
                                    max: e.target.value ? parseInt(e.target.value) : undefined
                                  }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="border-t border-gray-200 pt-6 mt-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {saved && (
                        <div className="flex items-center space-x-2 text-green-600">
                          <Check className="w-4 h-4" />
                          <span className="text-sm">Settings saved successfully</span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={handleSaveSettings}
                      disabled={saving}
                      className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 