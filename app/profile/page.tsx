"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  User, 
  Settings, 
  Heart, 
  Eye, 
  Search, 
  Bell, 
  Shield, 
  Edit3, 
  Camera, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase,
  Calendar,
  Activity,
  Save,
  X,
  Check,
  ChevronRight,
  Building2,
  Clock,
  Star,
  RotateCcw
} from 'lucide-react'
import { supabase } from '@/lib/supabase/config'
import { useAuth } from '@/components/providers'
import PhotoUpload from '@/components/profile/PhotoUpload'

interface UserProfile {
  id: string
  user_id: string
  full_name: string | null
  phone: string | null
  date_of_birth: string | null
  gender: string | null
  nationality: string | null
  occupation: string | null
  company: string | null
  bio: string | null
  profile_photo_url: string | null
  address: any
  emergency_contact: any
  preferences: any
  is_verified: boolean
  phone_verified: boolean
  email_verified: boolean
  created_at: string
  updated_at: string
}

interface UserSettings {
  id: string
  user_id: string
  email_notifications: any
  sms_notifications: any
  push_notifications: any
  theme: string
  language: string
  currency: string
  profile_visibility: string
  show_activity: boolean
  allow_contact: boolean
  default_search_radius: number
  default_property_types: string[]
  price_range_preference: any
}

// Updated interface to match existing saved properties API response
interface SavedProperty {
  id: string
  property_id: string
  created_at: string
  properties: {
    id: string
    title: string
    description: string
    price: number
    bedrooms: number
    bathrooms: number
    square_meters: number
    address: string
    city: string
    state: string
    property_type: string
    status: string
    property_photos: Array<{
      id: string
      url: string
      is_primary: boolean
    }>
  }
}

interface ViewingHistory {
  id: string
  property_id: string
  
  viewed_at: string
  view_source: string
  properties: {
    id: string
    title: string
    price: number
    address: string
    city: string
    state: string
    bedrooms: number
    bathrooms: number
    square_meters: number
    property_type: string
    status: string
    property_photos: Array<{
      url: string
      is_primary: boolean
      order_index: number
    }>
  } | null
}

interface SavedSearch {
  id: string
  name: string
  search_criteria: any
  search_url: string
  alert_frequency: string
  is_active: boolean
  created_at: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Data states
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([])
  const [viewingHistory, setViewingHistory] = useState<ViewingHistory[]>([])
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [stats, setStats] = useState({ savedProperties: 0, savedSearches: 0, activityCount: 0 })

  // Form states
  const [formData, setFormData] = useState<Partial<UserProfile>>({})

  useEffect(() => {
    if (!user) {
      router.push('/auth')
      return
    }
    
    loadUserData()
  }, [user, router])

  // Refresh data when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        loadUserData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Also refresh when the page gains focus
    const handleFocus = () => {
      if (user) {
        loadUserData()
      }
    }
    
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [user])

  // Refresh saved properties when switching to saved tab
  useEffect(() => {
    if (activeTab === 'saved' && user) {
      const refreshSavedProperties = async () => {
        try {
          const savedResponse = await fetch('/api/users/saved')
          if (savedResponse.ok) {
            const savedData = await savedResponse.json()
            const savedProperties = savedData.savedProperties as SavedProperty[]
            setSavedProperties(savedProperties || [])
            setStats(prevStats => ({ 
              ...prevStats, 
              savedProperties: savedProperties?.length || 0 
            }))
          }
        } catch (error) {
          console.error('Error refreshing saved properties:', error)
        }
      }
      
      refreshSavedProperties()
    }
  }, [activeTab, user])

  // Listen for saved properties changes from other components
  useEffect(() => {
    const handleSavedPropertiesChanged = () => {
      if (user) {
        // Refresh saved properties data
        const refreshSavedProperties = async () => {
          try {
            const savedResponse = await fetch('/api/users/saved')
            if (savedResponse.ok) {
              const savedData = await savedResponse.json()
              const savedProperties = savedData.savedProperties as SavedProperty[]
              setSavedProperties(savedProperties || [])
              setStats(prevStats => ({ 
                ...prevStats, 
                savedProperties: savedProperties?.length || 0 
              }))
            }
          } catch (error) {
            console.error('Error refreshing saved properties:', error)
          }
        }
        
        refreshSavedProperties()
      }
    }

    window.addEventListener('savedPropertiesChanged', handleSavedPropertiesChanged)
    
    return () => {
      window.removeEventListener('savedPropertiesChanged', handleSavedPropertiesChanged)
    }
  }, [user])

  const loadUserData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      // Load user profile and settings from our new API
      const profileResponse = await fetch('/api/profile')
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setProfile(profileData.profile)
        setSettings(profileData.settings)
        setStats(prevStats => ({ 
          ...prevStats, 
          savedSearches: profileData.stats.savedSearches,
          activityCount: profileData.stats.activityCount 
        }))
        if (profileData.profile) {
          setFormData(profileData.profile)
        }
      }

      // Load saved properties using existing API
      const savedResponse = await fetch('/api/users/saved')
      if (savedResponse.ok) {
        const savedData = await savedResponse.json()
        const savedProperties = savedData.savedProperties as SavedProperty[]
        setSavedProperties(savedProperties || [])
        setStats(prevStats => ({ 
          ...prevStats, 
          savedProperties: savedProperties?.length || 0 
        }))
      }

      // Load saved searches using our new API
      const searchesResponse = await fetch('/api/saved-searches')
      if (searchesResponse.ok) {
        const searchesData = await searchesResponse.json()
        setSavedSearches(searchesData.savedSearches || [])
      }

      // Load viewing history using our new API
      const historyResponse = await fetch('/api/profile/viewing-history?limit=10')
      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        setViewingHistory(historyData.viewingHistory || [])
      }

    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    
    try {
      setSaving(true)
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save profile')
      }

      const result = await response.json()
      setProfile(result.profile)
      setEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to view your profile.</p>
          <Link href="/auth" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'saved', label: 'Saved Properties', icon: Heart },
    { id: 'history', label: 'Viewing History', icon: Eye },
    { id: 'searches', label: 'Saved Searches', icon: Search },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <PhotoUpload
                currentPhotoUrl={profile?.profile_photo_url}
                onPhotoUpdate={(photoUrl) => {
                  if (profile) {
                    setProfile({ ...profile, profile_photo_url: photoUrl })
                  }
                }}
              />
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile?.full_name || 'Complete your profile'}
                </h1>
                <p className="text-gray-600">{user.email}</p>
                <div className="flex items-center space-x-4 mt-2">
                  {profile?.email_verified && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Check className="w-3 h-3 mr-1" />
                      Email verified
                    </span>
                  )}
                  {profile?.phone_verified && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Check className="w-3 h-3 mr-1" />
                      Phone verified
                    </span>
                  )}
                  {profile?.is_verified && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Shield className="w-3 h-3 mr-1" />
                      Profile verified
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setEditing(!editing)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>{editing ? 'Cancel' : 'Edit Profile'}</span>
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {editing ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={formData.full_name || ''}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your full name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your phone number"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={formData.date_of_birth || ''}
                          onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Gender
                        </label>
                        <select
                          value={formData.gender || ''}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nationality
                        </label>
                        <input
                          type="text"
                          value={formData.nationality || ''}
                          onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your nationality"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Occupation
                        </label>
                        <input
                          type="text"
                          value={formData.occupation || ''}
                          onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your occupation"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company
                        </label>
                        <input
                          type="text"
                          value={formData.company || ''}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your company"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bio
                        </label>
                        <textarea
                          value={formData.bio || ''}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Tell us about yourself"
                        />
                      </div>
                    </div>
                    
                    <div className="lg:col-span-2">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => setEditing(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Personal Info</span>
                          </div>
                          <div className="space-y-2">
                            <p><span className="text-gray-600">Name:</span> {profile?.full_name || 'Not provided'}</p>
                            <p><span className="text-gray-600">Email:</span> {user.email}</p>
                            <p><span className="text-gray-600">Phone:</span> {profile?.phone || 'Not provided'}</p>
                            <p><span className="text-gray-600">Gender:</span> {profile?.gender || 'Not provided'}</p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Briefcase className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Professional</span>
                          </div>
                          <div className="space-y-2">
                            <p><span className="text-gray-600">Occupation:</span> {profile?.occupation || 'Not provided'}</p>
                            <p><span className="text-gray-600">Company:</span> {profile?.company || 'Not provided'}</p>
                            <p><span className="text-gray-600">Nationality:</span> {profile?.nationality || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>
                      
                      {profile?.bio && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">About</span>
                          </div>
                          <p className="text-gray-700">{profile.bio}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-900 mb-3">Quick Stats</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Saved Properties</span>
                            <span className="font-medium">{stats.savedProperties}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Saved Searches</span>
                            <span className="font-medium">{stats.savedSearches}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Activity Count</span>
                            <span className="font-medium">{stats.activityCount}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-900 mb-3">Account Status</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Email</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              profile?.email_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {profile?.email_verified ? 'Verified' : 'Pending'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Phone</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              profile?.phone_verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {profile?.phone_verified ? 'Verified' : 'Not verified'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Profile</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              profile?.is_verified ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {profile?.is_verified ? 'Verified' : 'Standard'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'saved' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Saved Properties</h2>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={async () => {
                        try {
                          const savedResponse = await fetch('/api/users/saved')
                          if (savedResponse.ok) {
                            const savedData = await savedResponse.json()
                            const savedProperties = savedData.savedProperties as SavedProperty[]
                            setSavedProperties(savedProperties || [])
                            setStats(prevStats => ({ 
                              ...prevStats, 
                              savedProperties: savedProperties?.length || 0 
                            }))
                          }
                        } catch (error) {
                          console.error('Error refreshing saved properties:', error)
                        }
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Refresh</span>
                    </button>
                    <Link 
                      href="/saved" 
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                    >
                      <span>View All</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
                
                {savedProperties.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No saved properties yet</p>
                    <Link 
                      href="/properties" 
                      className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                    >
                      Browse Properties
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedProperties.slice(0, 6).map((saved) => (
                      <div key={saved.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div className="aspect-video bg-gray-200 relative">
                          {saved.properties.property_photos?.[0]?.url ? (
                            <img
                              src={saved.properties.property_photos[0].url}
                              alt={saved.properties.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building2 className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{saved.properties.title}</h3>
                          <p className="text-blue-600 font-semibold text-lg mb-2">{formatPrice(saved.properties.price)}</p>
                          <p className="text-gray-600 text-sm mb-2">{saved.properties.address}, {saved.properties.city}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{saved.properties.bedrooms} beds</span>
                            <span>{saved.properties.bathrooms} baths</span>
                            <span>{saved.properties.square_meters} sqm</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Viewing History</h2>
                  <span className="text-sm text-gray-500">{viewingHistory.length} recent views</span>
                </div>
                
                {viewingHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No viewing history yet</p>
                    <Link 
                      href="/properties" 
                      className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                    >
                      Start Browsing Properties
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {viewingHistory.map((view) => (
                      <div key={`${view.property_id}-${view.viewed_at}`} className="flex items-center space-x-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {view.properties?.property_photos?.[0]?.url ? (
                            <img
                              src={view.properties.property_photos[0].url}
                              alt={view.properties.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{view.properties?.title || 'Property not found'}</h3>
                          {view.properties && (
                            <>
                              <p className="text-blue-600 font-semibold">{formatPrice(view.properties.price)}</p>
                              <p className="text-gray-600 text-sm">{view.properties.address}, {view.properties.city}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                <span>{view.properties.bedrooms} beds</span>
                                <span>{view.properties.bathrooms} baths</span>
                                <span>{view.properties.square_meters} sqm</span>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>Viewed</p>
                          <p>{new Date(view.viewed_at).toLocaleDateString()}</p>
                          <p className="text-xs">{new Date(view.viewed_at).toLocaleTimeString()}</p>
                        </div>
                        {view.properties && (
                          <Link
                            href={`/property/${view.property_id}`}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                          >
                            View Again
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'searches' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Saved Searches</h2>
                </div>
                
                {savedSearches.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No saved searches yet</p>
                    <Link 
                      href="/properties" 
                      className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                    >
                      Create Your First Search
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedSearches.map((search) => (
                      <div key={search.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">{search.name}</h3>
                            <p className="text-gray-600 text-sm">Alert frequency: {search.alert_frequency}</p>
                            <p className="text-gray-500 text-xs">Created {new Date(search.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              search.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {search.is_active ? 'Active' : 'Paused'}
                            </span>
                            <Link
                              href={search.search_url}
                              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                            >
                              Run Search
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Account Settings</h2>
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">For detailed settings management, visit the dedicated settings page.</p>
                  <Link
                    href="/settings"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Go to Settings</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}