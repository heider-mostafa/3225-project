import { supabase } from '../config/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface UserProfile {
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

export interface UserSettings {
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
  created_at: string
  updated_at: string
}

export interface SavedProperty {
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
      order_index?: number
    }>
  }
}

export interface ViewingHistory {
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

export interface SavedSearch {
  id: string
  name: string
  search_criteria: any
  search_url: string
  alert_frequency: string
  is_active: boolean
  created_at: string
}

export interface ProfileStats {
  savedProperties: number
  savedSearches: number
  activityCount: number
  viewingHistory: number
}

export interface ProfileResponse {
  success: boolean
  data?: {
    user: any
    profile: UserProfile | null
    settings: UserSettings | null
    stats: ProfileStats
  }
  error?: string
}

export interface PropertyResponse {
  success: boolean
  data?: SavedProperty[]
  error?: string
}

export interface HistoryResponse {
  success: boolean
  data?: ViewingHistory[]
  error?: string
}

export interface SearchResponse {
  success: boolean
  data?: SavedSearch[]
  error?: string
}

class ProfileService {
  private static instance: ProfileService
  private currentProfile: UserProfile | null = null
  private currentSettings: UserSettings | null = null

  static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService()
    }
    return ProfileService.instance
  }

  // Get comprehensive profile data
  async getProfileData(): Promise<ProfileResponse> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return { success: false, error: 'Not authenticated' }
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      // Get user settings
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      // Get stats
      const [savedPropsCount, savedSearchesCount, activityCount, historyCount] = await Promise.all([
        supabase
          .from('saved_properties')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('saved_searches')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('user_activity_log')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('property_views')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
      ])

      const stats: ProfileStats = {
        savedProperties: savedPropsCount.count || 0,
        savedSearches: savedSearchesCount.count || 0,
        activityCount: activityCount.count || 0,
        viewingHistory: historyCount.count || 0
      }

      // Cache the data
      this.currentProfile = profile
      this.currentSettings = settings

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            email_confirmed_at: user.email_confirmed_at,
            created_at: user.created_at,
            updated_at: user.updated_at
          },
          profile: profile || null,
          settings: settings || null,
          stats
        }
      }
    } catch (error) {
      console.error('❌ Error fetching profile data:', error)
      return { success: false, error: 'Failed to fetch profile data' }
    }
  }

  // Update user profile
  async updateProfile(profileData: Partial<UserProfile>): Promise<ProfileResponse> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return { success: false, error: 'Not authenticated' }
      }

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Profile update error:', error)
        return { success: false, error: 'Failed to update profile' }
      }

      // Log activity
      await this.logActivity('profile_update', 'profile', user.id, {
        updated_fields: Object.keys(profileData)
      })

      this.currentProfile = profile

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            email_confirmed_at: user.email_confirmed_at,
            created_at: user.created_at,
            updated_at: user.updated_at
          },
          profile,
          settings: this.currentSettings,
          stats: { savedProperties: 0, savedSearches: 0, activityCount: 0, viewingHistory: 0 }
        }
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Update user settings
  async updateSettings(settingsData: Partial<UserSettings>): Promise<ProfileResponse> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return { success: false, error: 'Not authenticated' }
      }

      const { data: settings, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settingsData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Settings update error:', error)
        return { success: false, error: 'Failed to update settings' }
      }

      // Log activity
      await this.logActivity('settings_update', 'settings', user.id, {
        updated_fields: Object.keys(settingsData)
      })

      this.currentSettings = settings

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            email_confirmed_at: user.email_confirmed_at,
            created_at: user.created_at,
            updated_at: user.updated_at
          },
          profile: this.currentProfile,
          settings,
          stats: { savedProperties: 0, savedSearches: 0, activityCount: 0, viewingHistory: 0 }
        }
      }
    } catch (error) {
      console.error('❌ Error updating settings:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Get saved properties
  async getSavedProperties(): Promise<PropertyResponse> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return { success: false, error: 'Not authenticated' }
      }

      const { data: savedProperties, error } = await supabase
        .from('saved_properties')
        .select(`
          id,
          property_id,
          created_at,
          properties (
            id,
            title,
            description,
            price,
            bedrooms,
            bathrooms,
            square_meters,
            address,
            city,
            state,
            property_type,
            status,
            property_photos (
              id,
              url,
              is_primary,
              order_index
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching saved properties:', error)
        return { success: false, error: 'Failed to fetch saved properties' }
      }

      // Transform the data to match our interface
      const transformedData: SavedProperty[] = (savedProperties || []).map((item: any) => ({
        id: item.id,
        property_id: item.property_id,
        created_at: item.created_at,
        properties: item.properties
      }))

      return { success: true, data: transformedData }
    } catch (error) {
      console.error('❌ Error fetching saved properties:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Save/unsave property
  async toggleSaveProperty(propertyId: string): Promise<{ success: boolean; saved: boolean; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return { success: false, saved: false, error: 'Not authenticated' }
      }

      // Check if already saved
      const { data: existing } = await supabase
        .from('saved_properties')
        .select('id')
        .eq('user_id', user.id)
        .eq('property_id', propertyId)
        .single()

      if (existing) {
        // Remove from saved
        const { error } = await supabase
          .from('saved_properties')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', propertyId)

        if (error) {
          return { success: false, saved: true, error: 'Failed to remove from saved' }
        }

        await this.logActivity('property_unsaved', 'property', propertyId)
        return { success: true, saved: false }
      } else {
        // Add to saved
        const { error } = await supabase
          .from('saved_properties')
          .insert({
            user_id: user.id,
            property_id: propertyId
          })

        if (error) {
          return { success: false, saved: false, error: 'Failed to save property' }
        }

        await this.logActivity('property_saved', 'property', propertyId)
        return { success: true, saved: true }
      }
    } catch (error) {
      console.error('❌ Error toggling save property:', error)
      return { success: false, saved: false, error: 'An unexpected error occurred' }
    }
  }

  // Check if property is saved
  async isPropertySaved(propertyId: string): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return false
      }

      const { data } = await supabase
        .from('saved_properties')
        .select('id')
        .eq('user_id', user.id)
        .eq('property_id', propertyId)
        .single()

      return !!data
    } catch (error) {
      return false
    }
  }

  // Get viewing history
  async getViewingHistory(limit: number = 20): Promise<HistoryResponse> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return { success: false, error: 'Not authenticated' }
      }

      const { data: viewingHistory, error } = await supabase
        .from('property_views')
        .select(`
          id,
          property_id,
          viewed_at,
          view_source,
          properties (
            id,
            title,
            price,
            address,
            city,
            state,
            bedrooms,
            bathrooms,
            square_meters,
            property_type,
            status,
            property_photos (
              url,
              is_primary,
              order_index
            )
          )
        `)
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ Error fetching viewing history:', error)
        return { success: false, error: 'Failed to fetch viewing history' }
      }

      // Transform the data to match our interface
      const transformedData: ViewingHistory[] = (viewingHistory || []).map((item: any) => ({
        id: item.id,
        property_id: item.property_id,
        viewed_at: item.viewed_at,
        view_source: item.view_source,
        properties: item.properties
      }))

      return { success: true, data: transformedData }
    } catch (error) {
      console.error('❌ Error fetching viewing history:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Get saved searches
  async getSavedSearches(): Promise<SearchResponse> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return { success: false, error: 'Not authenticated' }
      }

      const { data: savedSearches, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching saved searches:', error)
        return { success: false, error: 'Failed to fetch saved searches' }
      }

      return { success: true, data: savedSearches || [] }
    } catch (error) {
      console.error('❌ Error fetching saved searches:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Save a search
  async saveSearch(searchData: {
    name: string
    search_criteria: any
    search_url: string
    alert_frequency: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return { success: false, error: 'Not authenticated' }
      }

      const { error } = await supabase
        .from('saved_searches')
        .insert({
          user_id: user.id,
          ...searchData,
          is_active: true
        })

      if (error) {
        console.error('❌ Error saving search:', error)
        return { success: false, error: 'Failed to save search' }
      }

      await this.logActivity('search_saved', 'search', user.id, searchData)

      return { success: true }
    } catch (error) {
      console.error('❌ Error saving search:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Upload profile photo
  async uploadProfilePhoto(uri: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return { success: false, error: 'Not authenticated' }
      }

      // Create a unique filename
      const fileExt = uri.split('.').pop()
      const fileName = `${user.id}_${Date.now()}.${fileExt}`
      const filePath = `profiles/${fileName}`

      // Read file as blob
      const response = await fetch(uri)
      const blob = await response.blob()

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('❌ Error uploading photo:', uploadError)
        return { success: false, error: 'Failed to upload photo' }
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath)

      // Update profile with new photo URL
      const updateResult = await this.updateProfile({ profile_photo_url: publicUrl })
      if (!updateResult.success) {
        return { success: false, error: 'Failed to update profile with new photo' }
      }

      await this.logActivity('profile_photo_updated', 'profile', user.id, { photo_url: publicUrl })

      return { success: true, url: publicUrl }
    } catch (error) {
      console.error('❌ Error uploading profile photo:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Log user activity
  private async logActivity(
    activityType: string,
    entityType: string,
    entityId: string,
    activityData?: any
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('user_activity_log')
        .insert({
          user_id: user.id,
          activity_type: activityType,
          entity_type: entityType,
          entity_id: entityId,
          activity_data: activityData || {}
        })
    } catch (error) {
      console.error('❌ Error logging activity (non-critical):', error)
    }
  }

  // Get cached profile
  getCurrentProfile(): UserProfile | null {
    return this.currentProfile
  }

  // Get cached settings
  getCurrentSettings(): UserSettings | null {
    return this.currentSettings
  }

  // Clear cache
  clearCache(): void {
    this.currentProfile = null
    this.currentSettings = null
  }
}

export default ProfileService.getInstance() 