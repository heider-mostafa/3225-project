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
  TextInput
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import LinearGradient from 'react-native-linear-gradient'

// Services
import ProfileService, { SavedProperty } from '../services/ProfileService'

// Icons
const HeartIcon = () => (
  <View style={styles.iconContainer}>
    <Text style={styles.iconText}>❤️</Text>
  </View>
)

const SearchIcon = () => (
  <View style={styles.iconContainer}>
    <Text style={styles.iconText}>🔍</Text>
  </View>
)

const FilterIcon = () => (
  <View style={styles.iconContainer}>
    <Text style={styles.iconText}>🔽</Text>
  </View>
)

const { width: screenWidth } = Dimensions.get('window')

const FavoritesScreen: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const navigation = useNavigation()
  const isRTL = i18n.language === 'ar'

  // State
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([])
  const [filteredProperties, setFilteredProperties] = useState<SavedProperty[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_low' | 'price_high'>('newest')
  const [filterBy, setFilterBy] = useState<'all' | 'apartment' | 'villa' | 'house'>('all')

  // Load saved properties
  const loadSavedProperties = async () => {
    try {
      setLoading(true)
      
      const result = await ProfileService.getSavedProperties()
      if (result.success && result.data) {
        setSavedProperties(result.data)
        setFilteredProperties(result.data)
      } else {
        console.error('Failed to load saved properties:', result.error)
        Alert.alert(t('common.error'), result.error || t('errors.unknownError'))
      }
    } catch (error) {
      console.error('Error loading saved properties:', error)
      Alert.alert(t('common.error'), t('errors.unknownError'))
    } finally {
      setLoading(false)
    }
  }

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true)
    await loadSavedProperties()
    setRefreshing(false)
  }

  // Load data when screen focuses
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadSavedProperties()
      }
    }, [user])
  )

  // Filter and sort properties
  useEffect(() => {
    let filtered = [...savedProperties]

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.properties.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.properties.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.properties.city.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply property type filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(item => 
        item.properties.property_type.toLowerCase() === filterBy.toLowerCase()
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'price_low':
          return a.properties.price - b.properties.price
        case 'price_high':
          return b.properties.price - a.properties.price
        default:
          return 0
      }
    })

    setFilteredProperties(filtered)
  }, [savedProperties, searchQuery, sortBy, filterBy])

  // Handle property tap
  const handlePropertyTap = (property: SavedProperty) => {
    // Navigate to property details
    // navigation.navigate('PropertyDetails', { propertyId: property.property_id })
  }

  // Handle remove from favorites
  const handleRemoveFromFavorites = async (propertyId: string) => {
    Alert.alert(
      t('favorites.removeFromFavorites'),
      t('favorites.confirmRemove'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await ProfileService.toggleSaveProperty(propertyId)
              if (result.success) {
                await loadSavedProperties() // Refresh the list
                Alert.alert(t('common.success'), t('favorites.favoriteRemoved'))
              } else {
                Alert.alert(t('common.error'), result.error || t('favorites.removeFailed'))
              }
            } catch (error) {
              console.error('Error removing from favorites:', error)
              Alert.alert(t('common.error'), t('favorites.removeFailed'))
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
      currency: 'EGP',
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
          <HeartIcon />
          <Text style={styles.notAuthenticatedText}>{t('auth.pleaseSignIn')}</Text>
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={() => navigation.navigate('Auth' as never)}
          >
            <Text style={styles.signInButtonText}>{t('auth.signIn')}</Text>
          </TouchableOpacity>
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
      {/* Header */}
      <LinearGradient
        colors={['#1e40af', '#3b82f6', '#60a5fa']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <HeartIcon />
            <Text style={styles.headerTitle}>{t('favorites.title')}</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {filteredProperties.length} {t('properties.properties')}
          </Text>
        </View>
      </LinearGradient>

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder={t('properties.search')}
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
          <TouchableOpacity
            style={[styles.filterChip, sortBy === 'newest' && styles.activeFilterChip]}
            onPress={() => setSortBy('newest')}
          >
            <Text style={[styles.filterChipText, sortBy === 'newest' && styles.activeFilterChipText]}>
              {t('searchFilters.newest')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, sortBy === 'price_low' && styles.activeFilterChip]}
            onPress={() => setSortBy('price_low')}
          >
            <Text style={[styles.filterChipText, sortBy === 'price_low' && styles.activeFilterChipText]}>
              {t('searchFilters.priceLowToHigh')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterBy === 'apartment' && styles.activeFilterChip]}
            onPress={() => setFilterBy(filterBy === 'apartment' ? 'all' : 'apartment')}
          >
            <Text style={[styles.filterChipText, filterBy === 'apartment' && styles.activeFilterChipText]}>
              {t('properties.apartment')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterBy === 'villa' && styles.activeFilterChip]}
            onPress={() => setFilterBy(filterBy === 'villa' ? 'all' : 'villa')}
          >
            <Text style={[styles.filterChipText, filterBy === 'villa' && styles.activeFilterChipText]}>
              {t('properties.villa')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Properties List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredProperties.length === 0 ? (
          <View style={styles.emptyState}>
            <HeartIcon />
            <Text style={styles.emptyStateTitle}>
              {searchQuery || filterBy !== 'all' 
                ? t('properties.noResults') 
                : t('favorites.noFavorites')
              }
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery || filterBy !== 'all'
                ? t('favorites.tryDifferentFilters')
                : t('favorites.startSavingProperties')
              }
            </Text>
            {(!searchQuery && filterBy === 'all') && (
              <TouchableOpacity 
                style={styles.browseButton}
                onPress={() => navigation.navigate('Properties' as never)}
              >
                <Text style={styles.browseButtonText}>{t('favorites.browseProperties')}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.propertiesContainer}>
            {filteredProperties.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.propertyCard}
                onPress={() => handlePropertyTap(item)}
                activeOpacity={0.7}
              >
                {/* Property Image */}
                <View style={styles.imageContainer}>
                  {item.properties.property_photos?.[0] ? (
                    <Image
                      source={{ uri: item.properties.property_photos[0].url }}
                      style={styles.propertyImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.noImageContainer}>
                      <Text style={styles.noImageText}>📷</Text>
                    </View>
                  )}
                  
                  {/* Favorite Button */}
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => handleRemoveFromFavorites(item.property_id)}
                  >
                    <Text style={styles.favoriteButtonText}>❤️</Text>
                  </TouchableOpacity>

                  {/* Property Type Badge */}
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{item.properties.property_type}</Text>
                  </View>
                </View>

                {/* Property Info */}
                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyTitle} numberOfLines={2}>
                    {item.properties.title}
                  </Text>
                  
                  <Text style={styles.propertyPrice}>
                    {formatPrice(item.properties.price)}
                  </Text>
                  
                  <Text style={styles.propertyLocation} numberOfLines={1}>
                    📍 {item.properties.address}, {item.properties.city}
                  </Text>
                  
                  <View style={styles.propertyFeatures}>
                    <View style={styles.feature}>
                      <Text style={styles.featureText}>🛏️ {item.properties.bedrooms}</Text>
                    </View>
                    <View style={styles.feature}>
                      <Text style={styles.featureText}>🚿 {item.properties.bathrooms}</Text>
                    </View>
                    <View style={styles.feature}>
                      <Text style={styles.featureText}>📐 {item.properties.square_meters}m²</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.savedDate}>
                    💾 {t('favorites.savedOn')}: {formatDate(item.created_at)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    marginVertical: 16,
  },
  signInButton: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e5e7eb',
    opacity: 0.9,
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
  },
  filterScrollView: {
    flexGrow: 0,
  },
  filterChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#1e40af',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  browseButton: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  browseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  propertiesContainer: {
    padding: 16,
    gap: 16,
  },
  propertyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 40,
    opacity: 0.5,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteButtonText: {
    fontSize: 16,
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(30, 64, 175, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  propertyInfo: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 24,
  },
  propertyPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  propertyLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  propertyFeatures: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  savedDate: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 20,
  },
})

export default FavoritesScreen 