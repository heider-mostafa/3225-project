import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Modal,
  Platform
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useFocusEffect } from '@react-navigation/native'
import LinearGradient from 'react-native-linear-gradient'
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType, CameraOptions, ImageLibraryOptions } from 'react-native-image-picker'
import DateTimePicker from '@react-native-community/datetimepicker'

// Services
import ProfileService, { UserProfile, UserSettings, SavedProperty, ViewingHistory, SavedSearch, ProfileStats } from '../services/ProfileService'
import AuthService from '../services/AuthService'

// Icons
const UserIcon = (): React.ReactElement => (
  <View style={styles.iconContainer}>
    <Text style={styles.iconText}>👤</Text>
  </View>
)

const HeartIcon = (): React.ReactElement => (
  <View style={styles.iconContainer}>
    <Text style={styles.iconText}>❤️</Text>
  </View>
)

const EyeIcon = (): React.ReactElement => (
  <View style={styles.iconContainer}>
    <Text style={styles.iconText}>👁️</Text>
  </View>
)

const SearchIcon = (): React.ReactElement => (
  <View style={styles.iconContainer}>
    <Text style={styles.iconText}>🔍</Text>
  </View>
)

const SettingsIcon = (): React.ReactElement => (
  <View style={styles.iconContainer}>
    <Text style={styles.iconText}>⚙️</Text>
  </View>
)

const EditIcon = (): React.ReactElement => (
  <View style={styles.iconContainer}>
    <Text style={styles.iconText}>✏️</Text>
  </View>
)

const CameraIcon = (): React.ReactElement => (
  <View style={styles.iconContainer}>
    <Text style={styles.iconText}>📷</Text>
  </View>
)

const { width: screenWidth } = Dimensions.get('window')

interface Tab {
  id: string
  label: string
  icon: () => React.ReactElement
}

const ProfileScreen: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const isRTL = i18n.language === 'ar'

  // State
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Data states
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([])
  const [viewingHistory, setViewingHistory] = useState<ViewingHistory[]>([])
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [stats, setStats] = useState<ProfileStats>({
    savedProperties: 0,
    savedSearches: 0,
    activityCount: 0,
    viewingHistory: 0
  })

  // Form states
  const [formData, setFormData] = useState<Partial<UserProfile>>({})
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [photoModalVisible, setPhotoModalVisible] = useState(false)

  const tabs: Tab[] = [
    { id: 'overview', label: t('profile.overview'), icon: UserIcon },
    { id: 'saved', label: t('profile.savedProperties'), icon: HeartIcon },
    { id: 'history', label: t('profile.viewingHistory'), icon: EyeIcon },
    { id: 'searches', label: t('profile.savedSearches'), icon: SearchIcon },
    { id: 'settings', label: t('settings.title'), icon: SettingsIcon }
  ]

  // Load user data
  const loadUserData = async () => {
    try {
      setLoading(true)
      
      const profileResult = await ProfileService.getProfileData()
      if (profileResult.success && profileResult.data) {
        setProfile(profileResult.data.profile)
        setSettings(profileResult.data.settings)
        setStats(profileResult.data.stats)
        
        if (profileResult.data.profile) {
          setFormData(profileResult.data.profile)
        }
      }

      // Load additional data based on active tab
      if (activeTab === 'saved') {
        const savedResult = await ProfileService.getSavedProperties()
        if (savedResult.success) {
          setSavedProperties(savedResult.data || [])
        }
      } else if (activeTab === 'history') {
        const historyResult = await ProfileService.getViewingHistory(10)
        if (historyResult.success) {
          setViewingHistory(historyResult.data || [])
        }
      } else if (activeTab === 'searches') {
        const searchesResult = await ProfileService.getSavedSearches()
        if (searchesResult.success) {
          setSavedSearches(searchesResult.data || [])
        }
      }

    } catch (error) {
      console.error('Error loading user data:', error)
      Alert.alert(t('common.error'), t('errors.unknownError'))
    } finally {
      setLoading(false)
    }
  }

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true)
    await loadUserData()
    setRefreshing(false)
  }

  // Load data when screen focuses
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadUserData()
      }
    }, [user, activeTab])
  )

  // Handle save profile
  const handleSaveProfile = async () => {
    if (!user) return
    
    try {
      setSaving(true)
      
      const result = await ProfileService.updateProfile(formData)
      if (result.success && result.data) {
        setProfile(result.data.profile)
        setEditing(false)
        Alert.alert(t('common.success'), t('profile.updateSuccess'))
      } else {
        Alert.alert(t('common.error'), result.error || t('profile.updateFailed'))
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      Alert.alert(t('common.error'), t('profile.updateFailed'))
    } finally {
      setSaving(false)
    }
  }

  // Handle photo selection
  const handlePhotoSelection = () => {
    Alert.alert(
      t('media.selectPhoto'),
      '',
      [
        { text: t('media.camera'), onPress: () => openCamera() },
        { text: t('media.gallery'), onPress: () => openGallery() },
        { text: t('common.cancel'), style: 'cancel' }
      ]
    )
  }

  const openCamera = () => {
    const options: CameraOptions = {
      mediaType: 'photo' as MediaType,
      quality: 0.8 as any,
      maxWidth: 500,
      maxHeight: 500
    }

    launchCamera(options, handleImageResponse)
  }

  const openGallery = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo' as MediaType,
      quality: 0.8 as any,
      maxWidth: 500,
      maxHeight: 500
    }

    launchImageLibrary(options, handleImageResponse)
  }

  const handleImageResponse = async (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage) {
      return
    }

    if (response.assets && response.assets[0]) {
      const asset = response.assets[0]
      if (asset.uri) {
        try {
          setSaving(true)
          const result = await ProfileService.uploadProfilePhoto(asset.uri)
          if (result.success && result.url) {
            setFormData(prev => ({ ...prev, profile_photo_url: result.url }))
            if (profile) {
              setProfile({ ...profile, profile_photo_url: result.url })
            }
            Alert.alert(t('common.success'), t('profile.photoUpdated'))
          } else {
            Alert.alert(t('common.error'), result.error || t('profile.photoUpdateFailed'))
          }
        } catch (error) {
          console.error('Error uploading photo:', error)
          Alert.alert(t('common.error'), t('profile.photoUpdateFailed'))
        } finally {
          setSaving(false)
        }
      }
    }
  }

  // Handle sign out
  const handleSignOut = async () => {
    Alert.alert(
      t('auth.signOut'),
      t('auth.confirmSignOut'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.signOut'),
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.signOut()
            } catch (error) {
              console.error('Error signing out:', error)
            }
          }
        }
      ]
    )
  }

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings?.currency || 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.notAuthenticatedContainer}>
          <Text style={styles.notAuthenticatedText}>{t('auth.pleaseSignIn')}</Text>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e40af" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <LinearGradient
          colors={['#1e40af', '#3b82f6', '#60a5fa']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.profilePhotoContainer}>
              <TouchableOpacity onPress={handlePhotoSelection}>
                {profile?.profile_photo_url ? (
                  <Image
                    source={{ uri: profile.profile_photo_url }}
                    style={styles.profilePhoto}
                  />
                ) : (
                  <View style={styles.defaultProfilePhoto}>
                    <Text style={styles.defaultProfilePhotoText}>
                      {profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                <View style={styles.cameraIconContainer}>
                  <CameraIcon />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {profile?.full_name || t('profile.completeProfile')}
              </Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              
              <View style={styles.verificationBadges}>
                {profile?.email_verified && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>✓ {t('auth.emailVerified')}</Text>
                  </View>
                )}
                {profile?.phone_verified && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>✓ {t('auth.phoneVerified')}</Text>
                  </View>
                )}
                {profile?.is_verified && (
                  <View style={[styles.badge, styles.premiumBadge]}>
                    <Text style={styles.badgeText}>🛡️ {t('profile.verified')}</Text>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setEditing(!editing)}
            >
              <EditIcon />
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.savedProperties}</Text>
              <Text style={styles.statLabel}>{t('favorites.title')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.savedSearches}</Text>
              <Text style={styles.statLabel}>{t('searchFilters.savedSearches')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.viewingHistory}</Text>
              <Text style={styles.statLabel}>{t('profile.viewingHistory')}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.tabScrollView}
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  activeTab === tab.id && styles.activeTab
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <tab.icon />
                <Text style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'overview' && (
            <View style={styles.overviewContainer}>
              {editing ? (
                <EditProfileForm 
                  formData={formData}
                  setFormData={setFormData}
                  onSave={handleSaveProfile}
                  onCancel={() => setEditing(false)}
                  saving={saving}
                  t={t}
                  showDatePicker={showDatePicker}
                  setShowDatePicker={setShowDatePicker}
                />
              ) : (
                <ProfileOverview 
                  profile={profile}
                  user={user}
                  stats={stats}
                  t={t}
                  formatDate={formatDate}
                />
              )}
            </View>
          )}

          {activeTab === 'saved' && (
            <SavedPropertiesTab 
              savedProperties={savedProperties}
              formatPrice={formatPrice}
              formatDate={formatDate}
              t={t}
            />
          )}

          {activeTab === 'history' && (
            <ViewingHistoryTab 
              viewingHistory={viewingHistory}
              formatPrice={formatPrice}
              formatDate={formatDate}
              t={t}
            />
          )}

          {activeTab === 'searches' && (
            <SavedSearchesTab 
              savedSearches={savedSearches}
              formatDate={formatDate}
              t={t}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab 
              settings={settings}
              onSignOut={handleSignOut}
              t={t}
            />
          )}
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.date_of_birth ? new Date(formData.date_of_birth) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios')
            if (selectedDate) {
              setFormData(prev => ({ ...prev, date_of_birth: selectedDate.toISOString().split('T')[0] }))
            }
          }}
        />
      )}
    </View>
  )
}

// Helper Components
const EditProfileForm: React.FC<{
  formData: Partial<UserProfile>
  setFormData: (data: Partial<UserProfile>) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  t: any
  showDatePicker: boolean
  setShowDatePicker: (show: boolean) => void
}> = ({ formData, setFormData, onSave, onCancel, saving, t, showDatePicker, setShowDatePicker }) => (
  <View style={styles.formContainer}>
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>{t('profile.personalInfo')}</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('auth.fullName')}</Text>
        <TextInput
          style={styles.textInput}
          value={formData.full_name || ''}
          onChangeText={(text) => setFormData({ ...formData, full_name: text })}
          placeholder={t('auth.fullNamePlaceholder')}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('auth.phone')}</Text>
        <TextInput
          style={styles.textInput}
          value={formData.phone || ''}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          placeholder={t('auth.phonePlaceholder')}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('profile.dateOfBirth')}</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateInputText}>
            {formData.date_of_birth ? new Date(formData.date_of_birth).toLocaleDateString() : t('profile.selectDate')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('profile.bio')}</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.bio || ''}
          onChangeText={(text) => setFormData({ ...formData, bio: text })}
          placeholder={t('profile.bioPlaceholder')}
          multiline
          numberOfLines={4}
        />
      </View>
    </View>

    <View style={styles.formActions}>
      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.saveButton, saving && styles.disabledButton]} 
        onPress={onSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>{t('common.save')}</Text>
        )}
      </TouchableOpacity>
    </View>
  </View>
)

const ProfileOverview: React.FC<{
  profile: UserProfile | null
  user: any
  stats: ProfileStats
  t: any
  formatDate: (date: string) => string
}> = ({ profile, user, stats, t, formatDate }) => (
  <View style={styles.overviewGrid}>
    <View style={styles.overviewCard}>
      <Text style={styles.cardTitle}>{t('profile.personalInfo')}</Text>
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('profile.name')}:</Text>
          <Text style={styles.infoValue}>{profile?.full_name || t('profile.notProvided')}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('profile.email')}:</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('profile.phone')}:</Text>
          <Text style={styles.infoValue}>{profile?.phone || t('profile.notProvided')}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('profile.dateOfBirth')}:</Text>
          <Text style={styles.infoValue}>
            {profile?.date_of_birth ? formatDate(profile.date_of_birth) : t('profile.notProvided')}
          </Text>
        </View>
      </View>
    </View>

    {profile?.bio && (
      <View style={styles.overviewCard}>
        <Text style={styles.cardTitle}>{t('profile.about')}</Text>
        <Text style={styles.bioText}>{profile.bio}</Text>
      </View>
    )}
  </View>
)

const SavedPropertiesTab: React.FC<{
  savedProperties: SavedProperty[]
  formatPrice: (price: number) => string
  formatDate: (date: string) => string
  t: any
}> = ({ savedProperties, formatPrice, formatDate, t }) => (
  <View style={styles.listContainer}>
    {savedProperties.length === 0 ? (
      <View style={styles.emptyState}>
        <HeartIcon />
        <Text style={styles.emptyStateText}>{t('favorites.noFavorites')}</Text>
      </View>
    ) : (
      savedProperties.map((item) => (
        <View key={item.id} style={styles.propertyCard}>
          {item.properties.property_photos?.[0] && (
            <Image
              source={{ uri: item.properties.property_photos[0].url }}
              style={styles.propertyImage}
            />
          )}
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyTitle}>{item.properties.title}</Text>
            <Text style={styles.propertyPrice}>{formatPrice(item.properties.price)}</Text>
            <Text style={styles.propertyLocation}>{item.properties.address}, {item.properties.city}</Text>
            <Text style={styles.propertySaved}>{t('favorites.savedOn')}: {formatDate(item.created_at)}</Text>
          </View>
        </View>
      ))
    )}
  </View>
)

const ViewingHistoryTab: React.FC<{
  viewingHistory: ViewingHistory[]
  formatPrice: (price: number) => string
  formatDate: (date: string) => string
  t: any
}> = ({ viewingHistory, formatPrice, formatDate, t }) => (
  <View style={styles.listContainer}>
    {viewingHistory.length === 0 ? (
      <View style={styles.emptyState}>
        <EyeIcon />
        <Text style={styles.emptyStateText}>{t('profile.noViewingHistory')}</Text>
      </View>
    ) : (
      viewingHistory.map((item) => (
        <View key={item.id} style={styles.propertyCard}>
          {item.properties?.property_photos?.[0] && (
            <Image
              source={{ uri: item.properties.property_photos[0].url }}
              style={styles.propertyImage}
            />
          )}
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyTitle}>{item.properties?.title}</Text>
            <Text style={styles.propertyPrice}>{formatPrice(item.properties?.price || 0)}</Text>
            <Text style={styles.propertyLocation}>{item.properties?.address}, {item.properties?.city}</Text>
            <Text style={styles.propertyViewed}>{t('profile.viewedOn')}: {formatDate(item.viewed_at)}</Text>
          </View>
        </View>
      ))
    )}
  </View>
)

const SavedSearchesTab: React.FC<{
  savedSearches: SavedSearch[]
  formatDate: (date: string) => string
  t: any
}> = ({ savedSearches, formatDate, t }) => (
  <View style={styles.listContainer}>
    {savedSearches.length === 0 ? (
      <View style={styles.emptyState}>
        <SearchIcon />
        <Text style={styles.emptyStateText}>{t('searchFilters.noSavedSearches')}</Text>
      </View>
    ) : (
      savedSearches.map((search) => (
        <View key={search.id} style={styles.searchCard}>
          <Text style={styles.searchName}>{search.name}</Text>
          <Text style={styles.searchFrequency}>{search.alert_frequency}</Text>
          <Text style={styles.searchDate}>{t('profile.savedOn')}: {formatDate(search.created_at)}</Text>
          <View style={[styles.statusBadge, search.is_active ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={styles.statusText}>
              {search.is_active ? t('common.active') : t('common.inactive')}
            </Text>
          </View>
        </View>
      ))
    )}
  </View>
)

const SettingsTab: React.FC<{
  settings: UserSettings | null
  onSignOut: () => void
  t: any
}> = ({ settings, onSignOut, t }) => (
  <View style={styles.settingsContainer}>
    <View style={styles.settingsSection}>
      <Text style={styles.sectionTitle}>{t('settings.preferences')}</Text>
      
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>{t('settings.language')}</Text>
        <Text style={styles.settingValue}>{settings?.language === 'ar' ? 'العربية' : 'English'}</Text>
      </View>
      
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>{t('settings.currency')}</Text>
        <Text style={styles.settingValue}>{settings?.currency || 'EGP'}</Text>
      </View>
      
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>{t('settings.theme')}</Text>
        <Text style={styles.settingValue}>{settings?.theme || 'light'}</Text>
      </View>
    </View>

    <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
      <Text style={styles.signOutButtonText}>{t('auth.signOut')}</Text>
    </TouchableOpacity>
  </View>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  notAuthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notAuthenticatedText: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePhotoContainer: {
    position: 'relative',
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  defaultProfilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  defaultProfilePhotoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 5,
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#e5e7eb',
    marginBottom: 8,
  },
  verificationBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  premiumBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.3)',
  },
  badgeText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#e5e7eb',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
  tabContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabScrollView: {
    flexGrow: 0,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1e40af',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#1e40af',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  iconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 16,
  },
  overviewContainer: {
    flex: 1,
  },
  overviewGrid: {
    gap: 16,
  },
  overviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  cardContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  bioText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  formContainer: {
    gap: 16,
  },
  formSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  dateInputText: {
    fontSize: 16,
    color: '#374151',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  saveButton: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  listContainer: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },
  propertyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  propertyImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  propertyInfo: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  propertyPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  propertySaved: {
    fontSize: 12,
    color: '#9ca3af',
  },
  propertyViewed: {
    fontSize: 12,
    color: '#9ca3af',
  },
  searchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  searchFrequency: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  searchDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#d1fae5',
  },
  inactiveBadge: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  settingsContainer: {
    gap: 16,
  },
  settingsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
  },
  settingValue: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  signOutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  signOutButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
})

export default ProfileScreen 