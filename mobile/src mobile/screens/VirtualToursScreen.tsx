import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  Dimensions,
  Alert,
  Share,
  RefreshControl,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../config/api';
import { RootStackParamList } from '../navigation/AppNavigator';

// Get screen dimensions for responsive design
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Tour interfaces
interface VirtualTour {
  id: string;
  propertyId: string;
  title: string;
  description: string;
  tourUrl: string;
  thumbnailUrl?: string;
  duration?: number; // in minutes
  views: number;
  isFeatured: boolean;
  property: {
    id: string;
    title: string;
    price: number;
    city: string;
    address: string;
    bedrooms: number;
    bathrooms: number;
    square_meters?: number;
    property_type: string;
    property_photos?: Array<{
      id: string;
      url: string;
      is_primary: boolean;
      order_index: number;
    }>;
  };
}

interface BookmarkedTour {
  id: string;
  propertyId: string;
  title: string;
  tourUrl: string;
  timestamp: number;
}

// Virtual tour categories for filtering
const TOUR_CATEGORIES = [
  { id: 'all', name: 'جميع الجولات', nameEn: 'All Tours' },
  { id: 'featured', name: 'المميزة', nameEn: 'Featured' },
  { id: 'villa', name: 'الفلل', nameEn: 'Villas' },
  { id: 'apartment', name: 'الشقق', nameEn: 'Apartments' },
  { id: 'townhouse', name: 'تاون هاوس', nameEn: 'Townhouses' },
  { id: 'penthouse', name: 'بنت هاوس', nameEn: 'Penthouses' },
  { id: 'new_cairo', name: 'القاهرة الجديدة', nameEn: 'New Cairo' },
  { id: 'sheikh_zayed', name: 'الشيخ زايد', nameEn: 'Sheikh Zayed' },
];

// Helper functions for realistic tour data
const calculateTourDuration = (property: any): number => {
  // Base duration on property size and type
  const baseMinutes = 3;
  const sizeMultiplier = (property.square_meters || 100) / 100; // Scale based on area
  const roomsMultiplier = (property.bedrooms + property.bathrooms) * 0.5;
  
  const typeMultipliers: Record<string, number> = {
    'Villa': 1.5,
    'Townhouse': 1.3,
    'Apartment': 1.0,
    'Penthouse': 1.4,
    'Studio': 0.8,
    'Duplex': 1.2,
  };
  
  const typeMultiplier = typeMultipliers[property.property_type] || 1.0;
  const calculatedDuration = baseMinutes * sizeMultiplier * typeMultiplier + roomsMultiplier;
  
  return Math.round(Math.max(2, Math.min(15, calculatedDuration))); // 2-15 minutes range
};

const calculateTourViews = (property: any): number => {
  // Base views on property price tier and desirability factors
  const priceMillions = property.price / 1000000;
  const baseViews = 50;
  
  // Higher priced properties tend to get more views
  const priceMultiplier = Math.log10(priceMillions + 1) * 100;
  
  // Popular areas get more views
  const popularAreas = ['New Cairo', 'Sheikh Zayed', 'Zamalek', 'Maadi'];
  const areaMultiplier = popularAreas.includes(property.city) ? 1.5 : 1.0;
  
  // Property type popularity
  const typePopularity: Record<string, number> = {
    'Villa': 1.4,
    'Penthouse': 1.3,
    'Apartment': 1.0,
    'Townhouse': 1.2,
    'Duplex': 1.1,
    'Studio': 0.8,
  };
  
  const typeMultiplier = typePopularity[property.property_type] || 1.0;
  
  const calculatedViews = baseViews + priceMultiplier * areaMultiplier * typeMultiplier;
  return Math.round(Math.max(20, Math.min(2000, calculatedViews))); // 20-2000 views range
};

const determineIfFeatured = (property: any): boolean => {
  // Feature properties based on multiple criteria
  const hasVirtualTour = !!property.virtual_tour_url;
  const hasPhotos = property.property_photos && property.property_photos.length >= 3;
  const isExpensive = property.price >= 2000000; // 2M EGP and above
  const isInPremiumArea = ['New Cairo', 'Sheikh Zayed', 'Zamalek'].includes(property.city);
  const isPremiumType = ['Villa', 'Penthouse', 'Townhouse'].includes(property.property_type);
  
  // Count positive criteria
  const score = [hasVirtualTour, hasPhotos, isExpensive, isInPremiumArea, isPremiumType]
    .filter(Boolean).length;
  
  // Feature if 3 or more criteria are met
  return score >= 3;
};

const VirtualToursScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // State management
  const [tours, setTours] = useState<VirtualTour[]>([]);
  const [featuredTours, setFeaturedTours] = useState<VirtualTour[]>([]);
  const [filteredTours, setFilteredTours] = useState<VirtualTour[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bookmarkedTours, setBookmarkedTours] = useState<BookmarkedTour[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);
  const [selectedTour, setSelectedTour] = useState<VirtualTour | null>(null);
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadVirtualTours();
    loadBookmarkedTours();
  }, []);

  // Filter tours when category changes
  useEffect(() => {
    filterTours();
  }, [selectedCategory, tours]);

  // Format EGP currency
  const formatEGP = (price: number): string => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: price >= 1000000 ? 'compact' : 'standard',
    }).format(price);
  };

  // Load virtual tours from API
  const loadVirtualTours = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use the existing API like HomeScreen and PropertiesScreen
      const response = await apiClient.getProperties({ limit: 100 }); // Get more properties to find tours
      
      if (response.success && response.data) {
        // Filter properties that have virtual tours
        const propertiesWithTours = response.data.filter(property => property.virtual_tour_url);
        
        // Transform properties to virtual tours format
        const virtualTours: VirtualTour[] = propertiesWithTours.map(property => ({
          id: `tour_${property.id}`,
          propertyId: property.id,
          title: `جولة افتراضية - ${property.title}`,
          description: property.description || `استكشف ${property.title} من خلال جولة افتراضية ثلاثية الأبعاد مذهلة`,
          tourUrl: property.virtual_tour_url!,
          thumbnailUrl: property.property_photos?.find(p => p.is_primary)?.url,
          duration: calculateTourDuration(property), // Calculate based on property size
          views: calculateTourViews(property), // Calculate based on property price and age
          isFeatured: determineIfFeatured(property), // Determine based on property criteria
          property: {
            id: property.id,
            title: property.title,
            price: property.price,
            city: property.city,
            address: property.address,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            square_meters: property.square_meters,
            property_type: property.property_type,
            property_photos: property.property_photos,
          }
        }));

        setTours(virtualTours);
        setFeaturedTours(virtualTours.filter(tour => tour.isFeatured));
        
        console.log(`✅ Loaded ${virtualTours.length} virtual tours from ${response.data.length} total properties`);
      } else {
        setError(response.error || 'فشل في تحميل الجولات الافتراضية');
      }
    } catch (error: any) {
      console.error('❌ Error loading virtual tours:', error);
      setError(error.message || 'حدث خطأ أثناء تحميل الجولات');
    } finally {
      setIsLoading(false);
    }
  };

  // Load bookmarked tours from AsyncStorage
  const loadBookmarkedTours = async () => {
    try {
      const stored = await AsyncStorage.getItem('bookmarked_tours');
      if (stored) {
        const bookmarks = JSON.parse(stored);
        setBookmarkedTours(bookmarks);
      }
    } catch (error) {
      console.error('Failed to load bookmarked tours:', error);
    }
  };

  // Save tour bookmark
  const toggleBookmark = async (tour: VirtualTour) => {
    try {
      const isBookmarked = bookmarkedTours.some(b => b.id === tour.id);
      
      if (isBookmarked) {
        // Remove bookmark
        const updated = bookmarkedTours.filter(b => b.id !== tour.id);
        setBookmarkedTours(updated);
        await AsyncStorage.setItem('bookmarked_tours', JSON.stringify(updated));
        Alert.alert('تم', 'تم إزالة الجولة من المفضلة');
      } else {
        // Add bookmark
        const newBookmark: BookmarkedTour = {
          id: tour.id,
          propertyId: tour.propertyId,
          title: tour.title,
          tourUrl: tour.tourUrl,
          timestamp: Date.now(),
        };
        const updated = [newBookmark, ...bookmarkedTours];
        setBookmarkedTours(updated);
        await AsyncStorage.setItem('bookmarked_tours', JSON.stringify(updated));
        Alert.alert('تم', 'تم إضافة الجولة للمفضلة');
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      Alert.alert('خطأ', 'فشل في حفظ المفضلة');
    }
  };

  // Share virtual tour
  const shareTour = async (tour: VirtualTour) => {
    try {
      const message = `🏠 شاهد جولة افتراضية مذهلة لـ ${tour.property.title}

💰 السعر: ${formatEGP(tour.property.price)}
📍 الموقع: ${tour.property.address}, ${tour.property.city}
🛏️ ${tour.property.bedrooms} غرف نوم | 🚿 ${tour.property.bathrooms} حمام
${tour.property.square_meters ? `📐 ${tour.property.square_meters}م²` : ''}

👆 شاهد الجولة الافتراضية:
${tour.tourUrl}

#العقارات_المصرية #جولة_افتراضية`;

      await Share.share({
        message,
        url: tour.tourUrl,
        title: tour.title,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  // Filter tours by category
  const filterTours = () => {
    let filtered = tours;

    switch (selectedCategory) {
      case 'featured':
        filtered = tours.filter(tour => tour.isFeatured);
        break;
      case 'villa':
        filtered = tours.filter(tour => tour.property.property_type === 'Villa');
        break;
      case 'apartment':
        filtered = tours.filter(tour => tour.property.property_type === 'Apartment');
        break;
      case 'townhouse':
        filtered = tours.filter(tour => tour.property.property_type === 'Townhouse');
        break;
      case 'penthouse':
        filtered = tours.filter(tour => tour.property.property_type === 'Penthouse');
        break;
      case 'new_cairo':
        filtered = tours.filter(tour => tour.property.city === 'New Cairo');
        break;
      case 'sheikh_zayed':
        filtered = tours.filter(tour => tour.property.city === 'Sheikh Zayed');
        break;
      default:
        filtered = tours;
    }

    setFilteredTours(filtered);
  };

  // Open tour in modal
  const openTour = (tour: VirtualTour) => {
    setSelectedTour(tour);
    setWebViewLoading(true);
    setShowTourModal(true);
  };

  // Navigate to property details
  const navigateToProperty = (propertyId: string) => {
    navigation.navigate('PropertyDetails', { propertyId });
  };

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadVirtualTours();
    setIsRefreshing(false);
  };

  // Check if tour is bookmarked
  const isTourBookmarked = (tourId: string): boolean => {
    return bookmarkedTours.some(b => b.id === tourId);
  };

  // Get property type in Arabic
  const getPropertyTypeArabic = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      'Apartment': 'شقة',
      'Villa': 'فيلا', 
      'Townhouse': 'تاون هاوس',
      'Penthouse': 'بنت هاوس',
      'Studio': 'استديو',
      'Duplex': 'دوبلكس',
      'Chalet': 'شاليه',
    };
    return typeMap[type] || type;
  };

  // Render featured tour item
  const renderFeaturedTour = ({ item: tour }: { item: VirtualTour }) => (
    <TouchableOpacity
      style={styles.featuredTourCard}
      onPress={() => openTour(tour)}
      activeOpacity={0.8}
    >
      <View style={styles.featuredTourImage}>
        {tour.thumbnailUrl ? (
          <Text style={styles.tourImagePlaceholder}>🏠</Text>
        ) : (
          <Text style={styles.tourImagePlaceholder}>🏠</Text>
        )}
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredBadgeText}>مميزة</Text>
        </View>
        <View style={styles.tourOverlay}>
          <Text style={styles.tourDuration}>⏱️ {tour.duration} دقائق</Text>
          <Text style={styles.tourViews}>👁️ {tour.views.toLocaleString('ar-EG')}</Text>
        </View>
      </View>
      
      <View style={styles.featuredTourContent}>
        <Text style={styles.featuredTourTitle} numberOfLines={2}>
          {tour.title}
        </Text>
        <Text style={styles.featuredTourPrice}>
          {formatEGP(tour.property.price)}
        </Text>
        <Text style={styles.featuredTourLocation} numberOfLines={1}>
          📍 {tour.property.address}, {tour.property.city}
        </Text>
        <View style={styles.featuredTourDetails}>
          <Text style={styles.tourDetailText}>
            🛏️ {tour.property.bedrooms} | 🚿 {tour.property.bathrooms}
          </Text>
          <Text style={styles.propertyTypeChip}>
            {getPropertyTypeArabic(tour.property.property_type)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render tour item
  const renderTour = ({ item: tour }: { item: VirtualTour }) => (
    <TouchableOpacity
      style={styles.tourCard}
      onPress={() => openTour(tour)}
      activeOpacity={0.8}
    >
      <View style={styles.tourImageContainer}>
        <Text style={styles.tourImagePlaceholder}>🏠</Text>
        {tour.isFeatured && (
          <View style={styles.featuredTag}>
            <Text style={styles.featuredTagText}>⭐</Text>
          </View>
        )}
        <View style={styles.tourInfo}>
          <Text style={styles.tourDurationSmall}>⏱️ {tour.duration}د</Text>
          <Text style={styles.tourViewsSmall}>👁️ {tour.views}</Text>
        </View>
      </View>
      
      <View style={styles.tourContent}>
        <Text style={styles.tourTitle} numberOfLines={2}>
          {tour.property.title}
        </Text>
        <Text style={styles.tourPrice}>
          {formatEGP(tour.property.price)}
        </Text>
        <Text style={styles.tourLocation} numberOfLines={1}>
          📍 {tour.property.city}
        </Text>
        <View style={styles.tourDetails}>
          <Text style={styles.tourDetailText}>
            🛏️ {tour.property.bedrooms} | 🚿 {tour.property.bathrooms}
          </Text>
        </View>
        
        <View style={styles.tourActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              navigateToProperty(tour.propertyId);
            }}
          >
            <Text style={styles.actionButtonText}>تفاصيل</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              shareTour(tour);
            }}
          >
            <Text style={styles.actionButtonText}>مشاركة</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.actionButton,
              isTourBookmarked(tour.id) && styles.actionButtonActive
            ]}
            onPress={(e) => {
              e.stopPropagation();
              toggleBookmark(tour);
            }}
          >
            <Text style={[
              styles.actionButtonText,
              isTourBookmarked(tour.id) && styles.actionButtonTextActive
            ]}>
              {isTourBookmarked(tour.id) ? '💾' : '🔖'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render category filter
  const renderCategoryFilter = ({ item }: { item: typeof TOUR_CATEGORIES[0] }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item.id && styles.categoryChipActive,
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Text style={[
        styles.categoryChipText,
        selectedCategory === item.id && styles.categoryChipTextActive,
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // Virtual Tour Modal
  const VirtualTourModal: React.FC = () => (
    <Modal
      visible={showTourModal}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setShowTourModal(false)}
    >
      <View style={styles.tourModalContainer}>
        {/* Header */}
        <View style={styles.tourModalHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowTourModal(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
          <Text style={styles.tourModalTitle} numberOfLines={1}>
            {selectedTour?.title}
          </Text>
          
          <View style={styles.tourModalActions}>
            <TouchableOpacity
              style={styles.modalActionButton}
              onPress={() => selectedTour && shareTour(selectedTour)}
            >
              <Text style={styles.modalActionText}>📤</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalActionButton}
              onPress={() => selectedTour && toggleBookmark(selectedTour)}
            >
              <Text style={styles.modalActionText}>
                {selectedTour && isTourBookmarked(selectedTour.id) ? '💾' : '🔖'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* WebView for Virtual Tour */}
        <View style={styles.webViewContainer}>
          {webViewLoading && (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.webViewLoadingText}>جاري تحميل الجولة الافتراضية...</Text>
            </View>
          )}
          
          {selectedTour && (
            <WebView
              source={{ uri: selectedTour.tourUrl }}
              style={styles.webView}
              onLoadStart={() => setWebViewLoading(true)}
              onLoadEnd={() => setWebViewLoading(false)}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView error:', nativeEvent);
                Alert.alert('خطأ', 'فشل في تحميل الجولة الافتراضية');
              }}
              allowsFullscreenVideo={true}
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
            />
          )}
        </View>

        {/* Property Info Footer */}
        {selectedTour && (
          <View style={styles.tourModalFooter}>
            <TouchableOpacity
              style={styles.propertyInfoButton}
              onPress={() => {
                setShowTourModal(false);
                navigateToProperty(selectedTour.propertyId);
              }}
            >
              <Text style={styles.propertyInfoButtonText}>
                عرض تفاصيل العقار - {formatEGP(selectedTour.property.price)}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>جاري تحميل الجولات الافتراضية...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadVirtualTours}>
          <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#2563eb"
            title="جاري التحديث..."
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🏠 الجولات الافتراضية</Text>
          <Text style={styles.headerSubtitle}>
            استكشف العقارات بتقنية ثلاثية الأبعاد
          </Text>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {tours.length} جولة متاحة | {featuredTours.length} مميزة
            </Text>
          </View>
        </View>

        {/* Featured Tours */}
        {featuredTours.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌟 الجولات المميزة</Text>
            <FlatList
              data={featuredTours}
              renderItem={renderFeaturedTour}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredToursList}
            />
          </View>
        )}

        {/* Category Filters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 تصفية الجولات</Text>
          <FlatList
            data={TOUR_CATEGORIES}
            renderItem={renderCategoryFilter}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* All Tours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            📋 جميع الجولات ({filteredTours.length})
          </Text>
          
          {filteredTours.length > 0 ? (
            <FlatList
              data={filteredTours}
              renderItem={renderTour}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.toursList}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                لا توجد جولات افتراضية في هذه الفئة
              </Text>
              <TouchableOpacity
                style={styles.resetFilterButton}
                onPress={() => setSelectedCategory('all')}
              >
                <Text style={styles.resetFilterText}>عرض جميع الجولات</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Spacer for bottom navigation */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Virtual Tour Modal */}
      <VirtualTourModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  // Header
  header: {
    backgroundColor: '#2563eb',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#bfdbfe',
    textAlign: 'center',
    marginTop: 8,
  },
  statsContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    color: '#e0e7ff',
    textAlign: 'center',
  },
  
  // Sections
  section: {
    backgroundColor: '#ffffff',
    marginBottom: 8,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    paddingHorizontal: 20,
    textAlign: 'right',
  },
  
  // Featured Tours
  featuredToursList: {
    paddingHorizontal: 20,
  },
  featuredTourCard: {
    width: SCREEN_WIDTH * 0.8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuredTourImage: {
    height: 200,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  tourImagePlaceholder: {
    fontSize: 48,
    color: '#6b7280',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuredBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  tourOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tourDuration: {
    fontSize: 12,
    color: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tourViews: {
    fontSize: 12,
    color: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuredTourContent: {
    padding: 16,
  },
  featuredTourTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'right',
  },
  featuredTourPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 8,
    textAlign: 'right',
  },
  featuredTourLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'right',
  },
  featuredTourDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tourDetailText: {
    fontSize: 12,
    color: '#6b7280',
  },
  propertyTypeChip: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '600',
  },
  
  // Categories
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  
  // Tours List
  toursList: {
    paddingHorizontal: 20,
  },
  tourCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    margin: 4,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tourImageContainer: {
    height: 120,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  featuredTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredTagText: {
    fontSize: 12,
  },
  tourInfo: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tourDurationSmall: {
    fontSize: 10,
    color: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  tourViewsSmall: {
    fontSize: 10,
    color: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  tourContent: {
    padding: 12,
  },
  tourTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'right',
  },
  tourPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
    textAlign: 'right',
  },
  tourLocation: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'right',
  },
  tourDetails: {
    marginBottom: 8,
  },
  tourActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flex: 1,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  actionButtonText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  actionButtonTextActive: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  
  // Empty State
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  resetFilterButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  resetFilterText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Modal
  tourModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  tourModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  tourModalTitle: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  tourModalActions: {
    flexDirection: 'row',
  },
  modalActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalActionText: {
    fontSize: 20,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    zIndex: 1000,
  },
  webViewLoadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
  },
  tourModalFooter: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 16,
  },
  propertyInfoButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  propertyInfoButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  bottomSpacer: {
    height: 20,
  },
});

export default VirtualToursScreen; 