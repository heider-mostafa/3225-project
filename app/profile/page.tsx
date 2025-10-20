"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
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
  RotateCcw,
  FileText,
  Download
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

interface SavedAppraiser {
  favorite_id: string
  notes?: string
  favorited_at: string
  appraiser_id: string
  full_name: string
  profile_headline?: string
  standardized_headshot_url?: string
  average_rating?: number
  total_reviews?: number
  years_of_experience?: number
  response_time_hours?: number
  service_areas?: string[]
  property_types?: string[]
}

interface ClientAppraisal {
  id: string
  client_name: string
  appraiser_id: string
  appraisal_date: string
  market_value_estimate: number | null
  confidence_level: number | null
  status: string
  appraisal_reference_number: string | null
  property_address: string | null
  property_type: string | null
  reports_generated: any
  created_at: string
  brokers?: {
    id: string
    full_name: string
    email: string
  }
}

interface RentalBooking {
  id: string
  rental_listing_id: string
  check_in_date: string
  check_out_date: string
  number_of_guests: number
  booking_status: string
  total_amount: number
  qr_upload_status: string
  qr_uploaded_at: string | null
  rental_title: string
  address: string
  city: string
  rental_type: string
  active_qr_count: number
  total_qr_count: number
  created_at: string
}

interface BookingQRCode {
  id: string
  booking_id: string
  qr_image_url: string
  qr_type: string
  qr_label: string | null
  qr_description: string | null
  valid_from: string
  valid_until: string
  usage_limit: number | null
  times_used: number
  status: string
  metadata: any
}

export default function ProfilePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [savedSubTab, setSavedSubTab] = useState('properties') // 'properties' or 'appraisers'
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Data states
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([])
  const [savedAppraisers, setSavedAppraisers] = useState<SavedAppraiser[]>([])
  const [clientAppraisals, setClientAppraisals] = useState<ClientAppraisal[]>([])
  const [viewingHistory, setViewingHistory] = useState<ViewingHistory[]>([])
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [rentalBookings, setRentalBookings] = useState<RentalBooking[]>([])
  const [bookingQRCodes, setBookingQRCodes] = useState<Record<string, BookingQRCode[]>>({})
  const [stats, setStats] = useState({ savedProperties: 0, savedAppraisers: 0, clientAppraisals: 0, savedSearches: 0, activityCount: 0, rentalBookings: 0 })

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

  // Refresh saved items when switching to saved tab
  useEffect(() => {
    if (activeTab === 'saved' && user) {
      const refreshSavedItems = async () => {
        try {
          // Refresh properties
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

          // Refresh appraisers
          const appraisersResponse = await fetch('/api/appraisers/favorites')
          if (appraisersResponse.ok) {
            const appraisersData = await appraisersResponse.json()
            const savedAppraisers = appraisersData.favorites as SavedAppraiser[]
            setSavedAppraisers(savedAppraisers || [])
            setStats(prevStats => ({ 
              ...prevStats, 
              savedAppraisers: savedAppraisers?.length || 0 
            }))
          }
        } catch (error) {
          console.error('Error refreshing saved items:', error)
        }
      }
      
      refreshSavedItems()
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

      // Load saved appraisers
      const appraisersResponse = await fetch('/api/appraisers/favorites')
      if (appraisersResponse.ok) {
        const appraisersData = await appraisersResponse.json()
        const savedAppraisers = appraisersData.favorites as SavedAppraiser[]
        setSavedAppraisers(savedAppraisers || [])
        setStats(prevStats => ({ 
          ...prevStats, 
          savedAppraisers: savedAppraisers?.length || 0 
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

      // Load rental bookings
      const rentalsResponse = await fetch('/api/rentals/my-bookings')
      if (rentalsResponse.ok) {
        const rentalsData = await rentalsResponse.json()
        const bookings = rentalsData.bookings || []
        setRentalBookings(bookings)
        setStats(prevStats => ({ 
          ...prevStats, 
          rentalBookings: bookings.length 
        }))
      }

      // Load client appraisals
      const appraisalsResponse = await fetch('/api/user/appraisals')
      if (appraisalsResponse.ok) {
        const appraisalsData = await appraisalsResponse.json()
        const appraisals = appraisalsData.appraisals || []
        setClientAppraisals(appraisals)
        setStats(prevStats => ({ 
          ...prevStats, 
          clientAppraisals: appraisals.length 
        }))
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
      alert(t('profile.failedToSave'))
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
          <p className="text-gray-600 mb-4">{t('profile.pleaseSignIn')}</p>
          <Link href="/auth" className="text-blue-600 hover:text-blue-700 font-medium">
            {t('profile.signIn')}
          </Link>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: t('profile.overview'), icon: User },
    { id: 'saved', label: t('profile.savedItems'), icon: Heart },
    { id: 'appraisals', label: t('profile.myAppraisals'), icon: FileText },
    { id: 'rentals', label: t('profile.myRentals'), icon: Calendar },
    { id: 'history', label: t('profile.viewingHistory'), icon: Eye },
    { id: 'searches', label: t('profile.savedSearches'), icon: Search },
    { id: 'settings', label: t('profile.settings'), icon: Settings }
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
                  {profile?.full_name || t('profile.completeProfile')}
                </h1>
                <p className="text-gray-600">{user.email}</p>
                <div className="flex items-center space-x-4 mt-2">
                  {profile?.email_verified && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Check className="w-3 h-3 mr-1" />
                      {t('profile.emailVerified')}
                    </span>
                  )}
                  {profile?.phone_verified && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Check className="w-3 h-3 mr-1" />
                      {t('profile.phoneVerified')}
                    </span>
                  )}
                  {profile?.is_verified && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Shield className="w-3 h-3 mr-1" />
                      {t('profile.profileVerified')}
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
                <span>{editing ? t('profile.cancel') : t('profile.editProfile')}</span>
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                {t('profile.signOut')}
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
                          {t('profile.fullName')}
                        </label>
                        <input
                          type="text"
                          value={formData.full_name || ''}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t('profile.enterFullName')}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('profile.phoneNumber')}
                        </label>
                        <input
                          type="tel"
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t('profile.enterPhoneNumber')}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('profile.dateOfBirth')}
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
                          {t('profile.gender')}
                        </label>
                        <select
                          value={formData.gender || ''}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">{t('profile.selectGender')}</option>
                          <option value="male">{t('profile.male')}</option>
                          <option value="female">{t('profile.female')}</option>
                          <option value="other">{t('profile.other')}</option>
                          <option value="prefer_not_to_say">{t('profile.preferNotToSay')}</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('profile.nationality')}
                        </label>
                        <input
                          type="text"
                          value={formData.nationality || ''}
                          onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t('profile.enterNationality')}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('profile.occupation')}
                        </label>
                        <input
                          type="text"
                          value={formData.occupation || ''}
                          onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t('profile.enterOccupation')}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('profile.company')}
                        </label>
                        <input
                          type="text"
                          value={formData.company || ''}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t('profile.enterCompany')}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('profile.bio')}
                        </label>
                        <textarea
                          value={formData.bio || ''}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t('profile.tellUsAbout')}
                        />
                      </div>
                    </div>
                    
                    <div className="lg:col-span-2">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => setEditing(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {t('profile.cancel')}
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          <span>{saving ? t('profile.saving') : t('profile.saveChanges')}</span>
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
                            <span className="text-sm font-medium text-gray-700">{t('profile.personalInfo')}</span>
                          </div>
                          <div className="space-y-2">
                            <p><span className="text-gray-600">{t('profile.name')}:</span> {profile?.full_name || t('profile.notProvided')}</p>
                            <p><span className="text-gray-600">{t('profile.email')}:</span> {user.email}</p>
                            <p><span className="text-gray-600">{t('profile.phone')}:</span> {profile?.phone || t('profile.notProvided')}</p>
                            <p><span className="text-gray-600">{t('profile.gender')}:</span> {profile?.gender || t('profile.notProvided')}</p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Briefcase className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">{t('profile.professional')}</span>
                          </div>
                          <div className="space-y-2">
                            <p><span className="text-gray-600">{t('profile.occupation')}:</span> {profile?.occupation || t('profile.notProvided')}</p>
                            <p><span className="text-gray-600">{t('profile.company')}:</span> {profile?.company || t('profile.notProvided')}</p>
                            <p><span className="text-gray-600">{t('profile.nationality')}:</span> {profile?.nationality || t('profile.notProvided')}</p>
                          </div>
                        </div>
                      </div>
                      
                      {profile?.bio && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">{t('profile.about')}</span>
                          </div>
                          <p className="text-gray-700">{profile.bio}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-900 mb-3">{t('profile.quickStats')}</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('profile.savedProperties')}</span>
                            <span className="font-medium">{stats.savedProperties}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('profile.rentalBookings')}</span>
                            <span className="font-medium">{stats.rentalBookings}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('profile.savedSearches')}</span>
                            <span className="font-medium">{stats.savedSearches}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('profile.activityCount')}</span>
                            <span className="font-medium">{stats.activityCount}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-900 mb-3">{t('profile.accountStatus')}</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">{t('profile.email')}</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              profile?.email_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {profile?.email_verified ? t('profile.verified') : t('profile.pending')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">{t('profile.phone')}</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              profile?.phone_verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {profile?.phone_verified ? t('profile.verified') : t('profile.notVerified')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">{t('profile.profile')}</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              profile?.is_verified ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {profile?.is_verified ? t('profile.verified') : t('profile.standard')}
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
                {/* Sub-tabs for Saved Items */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="flex space-x-8">
                    <button
                      onClick={() => setSavedSubTab('properties')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        savedSubTab === 'properties'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {t('profile.properties')} ({stats.savedProperties})
                    </button>
                    <button
                      onClick={() => setSavedSubTab('appraisers')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        savedSubTab === 'appraisers'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {t('profile.appraisers')} ({stats.savedAppraisers})
                    </button>
                  </nav>
                </div>

                {/* Properties Tab */}
                {savedSubTab === 'properties' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">{t('profile.savedProperties')}</h2>
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
                          <span>{t('profile.refresh')}</span>
                        </button>
                        <Link 
                          href="/saved" 
                          className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                        >
                          <span>{t('profile.viewAll')}</span>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                    
                    {savedProperties.length === 0 ? (
                      <div className="text-center py-8">
                        <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">{t('profile.noSavedPropertiesYet')}</p>
                        <Link 
                          href="/properties" 
                          className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                        >
                          {t('profile.browseProperties')}
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
                                <span>{saved.properties.bedrooms} {t('profile.beds')}</span>
                                <span>{saved.properties.bathrooms} {t('profile.baths')}</span>
                                <span>{saved.properties.square_meters} {t('profile.sqm')}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Appraisers Tab */}
                {savedSubTab === 'appraisers' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">{t('profile.savedAppraisers')}</h2>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={async () => {
                            try {
                              const appraisersResponse = await fetch('/api/appraisers/favorites')
                              if (appraisersResponse.ok) {
                                const appraisersData = await appraisersResponse.json()
                                const savedAppraisers = appraisersData.favorites as SavedAppraiser[]
                                setSavedAppraisers(savedAppraisers || [])
                                setStats(prevStats => ({ 
                                  ...prevStats, 
                                  savedAppraisers: savedAppraisers?.length || 0 
                                }))
                              }
                            } catch (error) {
                              console.error('Error refreshing saved appraisers:', error)
                            }
                          }}
                          className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>{t('profile.refresh')}</span>
                        </button>
                        <Link 
                          href="/find-appraisers" 
                          className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                        >
                          <span>{t('profile.findMore')}</span>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                    
                    {savedAppraisers.length === 0 ? (
                      <div className="text-center py-8">
                        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">{t('profile.noSavedAppraisersYet')}</p>
                        <Link 
                          href="/find-appraisers" 
                          className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                        >
                          {t('profile.browseAppraisers')}
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {savedAppraisers.slice(0, 6).map((appraiser) => (
                          <div key={appraiser.favorite_id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex gap-6">
                              {/* Profile Image */}
                              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                {appraiser.standardized_headshot_url ? (
                                  <img
                                    src={appraiser.standardized_headshot_url}
                                    alt={`${appraiser.full_name} - Professional Headshot`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <User className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h3 className="text-lg font-semibold">{appraiser.full_name}</h3>
                                    {appraiser.profile_headline && (
                                      <p className="text-gray-700 text-sm">{appraiser.profile_headline}</p>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">
                                      {t('profile.saved')} {new Date(appraiser.favorited_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>

                                {/* Rating and Stats */}
                                <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                                  {appraiser.average_rating && appraiser.total_reviews ? (
                                    <div className="flex items-center gap-1">
                                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                      <span className="font-medium">{appraiser.average_rating.toFixed(1)}</span>
                                      <span className="text-gray-500">({appraiser.total_reviews})</span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500">{t('profile.noReviewsYet')}</span>
                                  )}
                                  
                                  {appraiser.years_of_experience && (
                                    <>
                                      <span>•</span>
                                      <span>{appraiser.years_of_experience} {t('profile.yearsExp')}</span>
                                    </>
                                  )}
                                  
                                  {appraiser.response_time_hours && (
                                    <>
                                      <span>•</span>
                                      <span>{t('profile.respondsIn')} {appraiser.response_time_hours}h</span>
                                    </>
                                  )}
                                </div>

                                {/* Property Types */}
                                <div className="flex items-center justify-between">
                                  <div className="flex flex-wrap gap-1">
                                    {appraiser.property_types?.slice(0, 3).map((type, index) => (
                                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md capitalize">
                                        {type.replace('_', ' ')}
                                      </span>
                                    ))}
                                    {appraiser.property_types && appraiser.property_types.length > 3 && (
                                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                                        +{appraiser.property_types.length - 3} more
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex gap-2">
                                    <button 
                                      onClick={async () => {
                                        try {
                                          const response = await fetch(`/api/appraisers/favorites/${appraiser.appraiser_id}`, {
                                            method: 'DELETE',
                                          });
                                          if (response.ok) {
                                            setSavedAppraisers(savedAppraisers.filter(a => a.favorite_id !== appraiser.favorite_id));
                                            setStats(prevStats => ({ 
                                              ...prevStats, 
                                              savedAppraisers: prevStats.savedAppraisers - 1 
                                            }));
                                          }
                                        } catch (error) {
                                          console.error('Error removing favorite:', error);
                                        }
                                      }}
                                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                                    >
                                      Remove
                                    </button>
                                    <Link 
                                      href={`/appraisers/${appraiser.appraiser_id}`}
                                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                    >
                                      View Profile
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'rentals' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">{t('profile.myRentalBookings')}</h2>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={async () => {
                        try {
                          const rentalsResponse = await fetch('/api/rentals/my-bookings')
                          if (rentalsResponse.ok) {
                            const rentalsData = await rentalsResponse.json()
                            const bookings = rentalsData.bookings || []
                            setRentalBookings(bookings)
                            setStats(prevStats => ({ 
                              ...prevStats, 
                              rentalBookings: bookings.length 
                            }))
                          }
                        } catch (error) {
                          console.error('Error refreshing rental bookings:', error)
                        }
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{t('profile.refresh')}</span>
                    </button>
                  </div>
                </div>
                
                {rentalBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{t('profile.noRentalBookingsYet')}</p>
                    <Link 
                      href="/rentals" 
                      className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                    >
                      {t('profile.browseRentals')}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {rentalBookings.map((booking) => (
                      <div key={booking.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6">
                          {/* Booking Header */}
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{booking.rental_title}</h3>
                              <p className="text-gray-600">{booking.address}, {booking.city}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span className="capitalize">{booking.rental_type}</span>
                                <span>•</span>
                                <span>{booking.number_of_guests} {t('profile.guests')}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                booking.booking_status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                booking.booking_status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                                booking.booking_status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {booking.booking_status}
                              </span>
                            </div>
                          </div>

                          {/* Booking Details */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">{t('profile.checkIn')}</label>
                              <p className="text-sm text-gray-900">{new Date(booking.check_in_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">{t('profile.checkOut')}</label>
                              <p className="text-sm text-gray-900">{new Date(booking.check_out_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">{t('profile.totalAmount')}</label>
                              <p className="text-sm text-gray-900 font-semibold">{new Intl.NumberFormat('en-EG', {
                                style: 'currency',
                                currency: 'EGP'
                              }).format(booking.total_amount)}</p>
                            </div>
                          </div>

                          {/* QR Codes Section */}
                          <div className="border-t pt-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                                <span>{t('profile.qrCodes')}</span>
                                {booking.qr_upload_status === 'uploaded' && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <Check className="w-3 h-3 mr-1" />
                                    {t('profile.available')}
                                  </span>
                                )}
                                {booking.qr_upload_status === 'pending' && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {t('profile.pending')}
                                  </span>
                                )}
                              </h4>
                              <div className="text-sm text-gray-500">
                                {booking.active_qr_count} {t('profile.activeCodes')}
                              </div>
                            </div>

                            {booking.qr_upload_status === 'uploaded' ? (
                              <div className="bg-green-50 p-4 rounded-lg">
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                      <Check className="w-5 h-5 text-green-600" />
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="text-sm font-medium text-green-800 mb-1">{t('profile.qrCodesReady')}</h5>
                                    <p className="text-sm text-green-700">
                                      {t('profile.qrCodesReadyMessage', { count: booking.active_qr_count })}
                                    </p>
                                    <button className="mt-2 text-sm font-medium text-green-800 hover:text-green-900 underline">
                                      {t('profile.viewQrCodes')}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : booking.qr_upload_status === 'pending' ? (
                              <div className="bg-yellow-50 p-4 rounded-lg">
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                      <Clock className="w-5 h-5 text-yellow-600" />
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="text-sm font-medium text-yellow-800 mb-1">{t('profile.qrCodesPending')}</h5>
                                    <p className="text-sm text-yellow-700">
                                      {t('profile.qrCodesPendingMessage')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                      <X className="w-5 h-5 text-gray-500" />
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="text-sm font-medium text-gray-800 mb-1">{t('profile.qrCodesExpired')}</h5>
                                    <p className="text-sm text-gray-600">
                                      {t('profile.qrCodesExpiredMessage')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Booking Actions */}
                          <div className="border-t pt-4 mt-4">
                            <div className="flex justify-between items-center">
                              <div className="text-sm text-gray-500">
                                {t('profile.bookedOn')} {new Date(booking.created_at).toLocaleDateString()}
                              </div>
                              <div className="flex space-x-2">
                                <Link
                                  href={`/rentals/${booking.rental_listing_id}`}
                                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                  {t('profile.viewProperty')}
                                </Link>
                                {booking.booking_status === 'completed' && (
                                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                    {t('profile.leaveReview')}
                                  </button>
                                )}
                              </div>
                            </div>
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
                  <h2 className="text-lg font-semibold text-gray-900">{t('profile.recentViewingHistory')}</h2>
                  <span className="text-sm text-gray-500">{viewingHistory.length} {t('profile.recentViews')}</span>
                </div>
                
                {viewingHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{t('profile.noViewingHistoryYet')}</p>
                    <Link 
                      href="/properties" 
                      className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                    >
                      {t('profile.startBrowsingProperties')}
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
                          <h3 className="font-medium text-gray-900">{view.properties?.title || t('profile.propertyNotFound')}</h3>
                          {view.properties && (
                            <>
                              <p className="text-blue-600 font-semibold">{formatPrice(view.properties.price)}</p>
                              <p className="text-gray-600 text-sm">{view.properties.address}, {view.properties.city}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                <span>{view.properties.bedrooms} {t('profile.beds')}</span>
                                <span>{view.properties.bathrooms} {t('profile.baths')}</span>
                                <span>{view.properties.square_meters} {t('profile.sqm')}</span>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>{t('profile.viewed')}</p>
                          <p>{new Date(view.viewed_at).toLocaleDateString()}</p>
                          <p className="text-xs">{new Date(view.viewed_at).toLocaleTimeString()}</p>
                        </div>
                        {view.properties && (
                          <Link
                            href={`/property/${view.property_id}`}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                          >
                            {t('profile.viewAgain')}
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
                  <h2 className="text-lg font-semibold text-gray-900">{t('profile.savedSearches')}</h2>
                </div>
                
                {savedSearches.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{t('profile.noSavedSearchesYet')}</p>
                    <Link 
                      href="/properties" 
                      className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                    >
                      {t('profile.createYourFirstSearch')}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedSearches.map((search) => (
                      <div key={search.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">{search.name}</h3>
                            <p className="text-gray-600 text-sm">{t('profile.alertFrequency')}: {search.alert_frequency}</p>
                            <p className="text-gray-500 text-xs">{t('profile.created')} {new Date(search.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              search.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {search.is_active ? t('profile.active') : t('profile.paused')}
                            </span>
                            <Link
                              href={search.search_url}
                              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                            >
                              {t('profile.runSearch')}
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'appraisals' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">{t('profile.myAppraisals')}</h2>
                  <span className="text-sm text-gray-500">{stats.clientAppraisals} {t('profile.appraisals')}</span>
                </div>
                
                {clientAppraisals.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">{t('profile.noAppraisalsYet')}</p>
                    <p className="text-gray-400 text-sm mb-4">
                      {t('profile.bookAppraiserMessage')}
                    </p>
                    <Link 
                      href="/find-appraisers" 
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {t('profile.findAppraisers')}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clientAppraisals.map((appraisal) => (
                      <div key={appraisal.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-medium text-gray-900">
                                {appraisal.property_address || t('profile.propertyAppraisal')}
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                appraisal.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {appraisal.status.charAt(0).toUpperCase() + appraisal.status.slice(1)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                              <div>
                                <span className="font-medium">{t('profile.appraiser')}:</span> {appraisal.brokers?.full_name}
                              </div>
                              <div>
                                <span className="font-medium">{t('profile.date')}:</span> {new Date(appraisal.appraisal_date).toLocaleDateString()}
                              </div>
                              <div>
                                <span className="font-medium">{t('profile.reference')}:</span> {appraisal.appraisal_reference_number || t('profile.na')}
                              </div>
                            </div>
                            
                            {appraisal.market_value_estimate && (
                              <div className="flex items-center gap-6 mb-4">
                                <div>
                                  <span className="text-sm text-gray-600">{t('profile.marketValue')}</span>
                                  <div className="text-xl font-bold text-green-600">
                                    {appraisal.market_value_estimate.toLocaleString()} EGP
                                  </div>
                                </div>
                                {appraisal.confidence_level && (
                                  <div>
                                    <span className="text-sm text-gray-600">{t('profile.confidence')}</span>
                                    <div className="text-lg font-medium">
                                      {appraisal.confidence_level}%
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => {
                                // Download appraisal report
                                window.open(`/api/appraisals/${appraisal.id}/download`, '_blank');
                              }}
                              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              {t('profile.download')}
                            </button>
                            
                            <button
                              onClick={() => {
                                // TODO: Open review modal
                                console.log('Review appraisal:', appraisal.id);
                              }}
                              className="flex items-center gap-2 px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm rounded-lg transition-colors"
                            >
                              <Star className="w-4 h-4" />
                              Review
                            </button>
                          </div>
                        </div>
                        
                        {appraisal.property_type && (
                          <div className="text-sm text-gray-500">
                            Property Type: {appraisal.property_type.replace('_', ' ')}
                          </div>
                        )}
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