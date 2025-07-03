import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
  Dimensions,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../config/api';
import { RootStackParamList } from '../navigation/AppNavigator';

// Get screen dimensions for responsive design
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Search interfaces
interface SearchFilters {
  query: string;
  city: string;
  property_type: string;
  min_price: number;
  max_price: number;
  bedrooms: string;
  bathrooms: string;
  min_area: number;
  max_area: number;
  has_virtual_tour: boolean;
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in km
  };
}

interface RecentSearch {
  id: string;
  query: string;
  filters: SearchFilters;
  timestamp: number;
  resultsCount: number;
}

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_meters?: number;
  address: string;
  city: string;
  property_type: string;
  status: string;
  virtual_tour_url?: string;
  property_photos?: Array<{
    id: string;
    url: string;
    is_primary: boolean;
    order_index: number;
  }>;
}

// Egyptian cities and areas (expanded list)
const EGYPTIAN_CITIES = [
  { id: 'all', name: 'جميع المدن', nameEn: 'All Cities' },
  { id: 'new_cairo', name: 'القاهرة الجديدة', nameEn: 'New Cairo' },
  { id: 'sheikh_zayed', name: 'الشيخ زايد', nameEn: 'Sheikh Zayed' },
  { id: 'zamalek', name: 'الزمالك', nameEn: 'Zamalek' },
  { id: 'maadi', name: 'المعادي', nameEn: 'Maadi' },
  { id: 'heliopolis', name: 'مصر الجديدة', nameEn: 'Heliopolis' },
  { id: 'giza', name: 'الجيزة', nameEn: 'Giza' },
  { id: 'october', name: 'أكتوبر', nameEn: '6th of October' },
  { id: 'alexandria', name: 'الإسكندرية', nameEn: 'Alexandria' },
  { id: 'shorouk', name: 'الشروق', nameEn: 'Shorouk' },
  { id: 'rehab', name: 'الرحاب', nameEn: 'Rehab' },
  { id: 'tagamoa', name: 'التجمع الخامس', nameEn: 'Fifth Settlement' },
  { id: 'mokattam', name: 'المقطم', nameEn: 'Mokattam' },
  { id: 'nasr_city', name: 'مدينة نصر', nameEn: 'Nasr City' },
];

const PROPERTY_TYPES = [
  { id: 'all', name: 'جميع الأنواع', nameEn: 'All Types' },
  { id: 'apartment', name: 'شقة', nameEn: 'Apartment' },
  { id: 'villa', name: 'فيلا', nameEn: 'Villa' },
  { id: 'townhouse', name: 'تاون هاوس', nameEn: 'Townhouse' },
  { id: 'penthouse', name: 'بنت هاوس', nameEn: 'Penthouse' },
  { id: 'studio', name: 'استديو', nameEn: 'Studio' },
  { id: 'duplex', name: 'دوبلكس', nameEn: 'Duplex' },
  { id: 'chalet', name: 'شاليه', nameEn: 'Chalet' },
  { id: 'office', name: 'مكتب', nameEn: 'Office' },
  { id: 'shop', name: 'محل تجاري', nameEn: 'Shop' },
];

const BEDROOM_OPTIONS = [
  { id: 'any', name: 'أي عدد', value: '' },
  { id: '1', name: '1 غرفة', value: '1' },
  { id: '2', name: '2 غرفة', value: '2' },
  { id: '3', name: '3 غرف', value: '3' },
  { id: '4', name: '4 غرف', value: '4' },
  { id: '5+', name: '5+ غرف', value: '5' },
];

const BATHROOM_OPTIONS = [
  { id: 'any', name: 'أي عدد', value: '' },
  { id: '1', name: '1 حمام', value: '1' },
  { id: '2', name: '2 حمام', value: '2' },
  { id: '3', name: '3 حمامات', value: '3' },
  { id: '4+', name: '4+ حمامات', value: '4' },
];

// Price ranges in EGP (Egyptian Pounds)
const PRICE_RANGES = {
  min: 50000,
  max: 50000000,
  step: 50000,
};

const AREA_RANGES = {
  min: 50,
  max: 1000,
  step: 10,
};

const SearchScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Search state
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    city: 'all',
    property_type: 'all',
    min_price: PRICE_RANGES.min,
    max_price: PRICE_RANGES.max,
    bedrooms: '',
    bathrooms: '',
    min_area: AREA_RANGES.min,
    max_area: AREA_RANGES.max,
    has_virtual_tour: false,
  });

  // UI state
  const [showCityModal, setShowCityModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Load recent searches on component mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

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

  // Load recent searches from AsyncStorage
  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem('recent_searches');
      if (stored) {
        const searches = JSON.parse(stored);
        setRecentSearches(searches.slice(0, 10)); // Keep only 10 most recent
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  };

  // Save search to recent searches
  const saveRecentSearch = async (searchFilters: SearchFilters, resultsCount: number) => {
    try {
      const newSearch: RecentSearch = {
        id: Date.now().toString(),
        query: searchFilters.query,
        filters: { ...searchFilters },
        timestamp: Date.now(),
        resultsCount,
      };

      const updatedSearches = [newSearch, ...recentSearches.filter(s => 
        s.query !== searchFilters.query || 
        s.filters.city !== searchFilters.city ||
        s.filters.property_type !== searchFilters.property_type
      )].slice(0, 10);

      setRecentSearches(updatedSearches);
      await AsyncStorage.setItem('recent_searches', JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  };

  // Clear recent searches
  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem('recent_searches');
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  };

  // Perform search
  const performSearch = async () => {
    if (!filters.query.trim() && filters.city === 'all' && filters.property_type === 'all') {
      Alert.alert('تنبيه', 'يرجى إدخال كلمة بحث أو اختيار فلتر واحد على الأقل');
      return;
    }

    try {
      setIsSearching(true);

      // Prepare search parameters
      const searchParams: any = {};
      
      if (filters.query.trim()) {
        searchParams.q = filters.query.trim();
      }
      
      if (filters.city !== 'all') {
        const selectedCity = EGYPTIAN_CITIES.find(c => c.id === filters.city);
        searchParams.city = selectedCity?.nameEn || filters.city;
      }
      
      if (filters.property_type !== 'all') {
        const selectedType = PROPERTY_TYPES.find(t => t.id === filters.property_type);
        searchParams.property_type = selectedType?.nameEn || filters.property_type;
      }
      
      if (filters.min_price > PRICE_RANGES.min) {
        searchParams.min_price = filters.min_price;
      }
      
      if (filters.max_price < PRICE_RANGES.max) {
        searchParams.max_price = filters.max_price;
      }
      
      if (filters.bedrooms) {
        searchParams.bedrooms = filters.bedrooms;
      }
      
      if (filters.bathrooms) {
        searchParams.bathrooms = filters.bathrooms;
      }
      
      if (filters.min_area > AREA_RANGES.min) {
        searchParams.min_area = filters.min_area;
      }
      
      if (filters.max_area < AREA_RANGES.max) {
        searchParams.max_area = filters.max_area;
      }
      
      if (filters.has_virtual_tour) {
        searchParams.has_virtual_tour = true;
      }

      // Add location-based search if available
      if (filters.location) {
        searchParams.latitude = filters.location.latitude;
        searchParams.longitude = filters.location.longitude;
        searchParams.radius = filters.location.radius;
      }

      console.log('🔍 Performing search with params:', searchParams);

      // Use search API if query exists, otherwise use regular properties API
      const response = filters.query.trim() 
        ? await apiClient.searchProperties(filters.query, searchParams)
        : await apiClient.getProperties(searchParams);

      if (response.success && response.data) {
        console.log(`✅ Search successful: ${response.data.length} results`);
        
        // Save to recent searches
        await saveRecentSearch(filters, response.data.length);
        
        // Navigate to Properties screen with search results
        navigation.navigate('Properties', { 
          searchResults: response.data,
          searchQuery: filters.query,
          searchFilters: searchParams 
        });
      } else {
        Alert.alert('خطأ', response.error || 'فشل في البحث');
      }
    } catch (error: any) {
      console.error('❌ Search error:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء البحث');
    } finally {
      setIsSearching(false);
    }
  };

  // Apply recent search
  const applyRecentSearch = (recentSearch: RecentSearch) => {
    setFilters(recentSearch.filters);
    performSearch();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      query: '',
      city: 'all',
      property_type: 'all',
      min_price: PRICE_RANGES.min,
      max_price: PRICE_RANGES.max,
      bedrooms: '',
      bathrooms: '',
      min_area: AREA_RANGES.min,
      max_area: AREA_RANGES.max,
      has_virtual_tour: false,
    });
  };

  // Get location for map-based search (placeholder - can be enhanced with actual geolocation)
  const getCurrentLocation = () => {
    // Placeholder for geolocation - can be implemented with react-native-geolocation-service
    Alert.alert(
      'البحث بالموقع',
      'هذه الميزة ستمكنك من البحث عن العقارات القريبة من موقعك الحالي',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'تفعيل', 
          onPress: () => {
            // Simulate Cairo coordinates
            setFilters(prev => ({
              ...prev,
              location: {
                latitude: 30.0444,
                longitude: 31.2357,
                radius: 10, // 10km radius
              }
            }));
            Alert.alert('تم', 'تم تحديد موقعك في القاهرة (تجريبي)');
          }
        }
      ]
    );
  };

  // City Selection Modal
  const CitySelectionModal: React.FC = () => (
    <Modal
      visible={showCityModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCityModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>اختر المدينة</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCityModal(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={EGYPTIAN_CITIES}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  filters.city === item.id && styles.modalItemSelected,
                ]}
                onPress={() => {
                  setFilters(prev => ({ ...prev, city: item.id }));
                  setShowCityModal(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  filters.city === item.id && styles.modalItemTextSelected,
                ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  // Property Type Selection Modal
  const PropertyTypeModal: React.FC = () => (
    <Modal
      visible={showTypeModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowTypeModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>اختر نوع العقار</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTypeModal(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={PROPERTY_TYPES}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  filters.property_type === item.id && styles.modalItemSelected,
                ]}
                onPress={() => {
                  setFilters(prev => ({ ...prev, property_type: item.id }));
                  setShowTypeModal(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  filters.property_type === item.id && styles.modalItemTextSelected,
                ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  // Get display name for selected city
  const getSelectedCityName = () => {
    const selected = EGYPTIAN_CITIES.find(c => c.id === filters.city);
    return selected?.name || 'جميع المدن';
  };

  // Get display name for selected property type
  const getSelectedTypeName = () => {
    const selected = PROPERTY_TYPES.find(t => t.id === filters.property_type);
    return selected?.name || 'جميع الأنواع';
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🔍 البحث المتقدم</Text>
          <Text style={styles.headerSubtitle}>ابحث عن العقار المثالي في مصر</Text>
        </View>

        {/* Main Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="ابحث عن عقار... (مثال: فيلا في الشيخ زايد)"
              placeholderTextColor="#9ca3af"
              value={filters.query}
              onChangeText={(text) => setFilters(prev => ({ ...prev, query: text }))}
              textAlign="right"
            />
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={performSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.searchButtonText}>🔍</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Filters */}
        <View style={styles.quickFiltersSection}>
          <Text style={styles.sectionTitle}>فلاتر سريعة</Text>
          
          <View style={styles.quickFiltersRow}>
            <TouchableOpacity
              style={styles.quickFilterButton}
              onPress={() => setShowCityModal(true)}
            >
              <Text style={styles.quickFilterText}>📍 {getSelectedCityName()}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickFilterButton}
              onPress={() => setShowTypeModal(true)}
            >
              <Text style={styles.quickFilterText}>🏠 {getSelectedTypeName()}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Price Range */}
        <View style={styles.priceRangeSection}>
          <Text style={styles.sectionTitle}>نطاق السعر</Text>
          <View style={styles.priceRangeInfo}>
            <Text style={styles.priceRangeText}>
              من {formatEGP(filters.min_price)} إلى {formatEGP(filters.max_price)}
            </Text>
          </View>
          
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>الحد الأدنى</Text>
            <Slider
              style={styles.slider}
              minimumValue={PRICE_RANGES.min}
              maximumValue={PRICE_RANGES.max}
              step={PRICE_RANGES.step}
              value={filters.min_price}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                min_price: value,
                max_price: Math.max(value, prev.max_price)
              }))}
              minimumTrackTintColor="#2563eb"
              maximumTrackTintColor="#e2e8f0"
            />
          </View>
          
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>الحد الأقصى</Text>
            <Slider
              style={styles.slider}
              minimumValue={PRICE_RANGES.min}
              maximumValue={PRICE_RANGES.max}
              step={PRICE_RANGES.step}
              value={filters.max_price}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                max_price: value,
                min_price: Math.min(value, prev.min_price)
              }))}
              minimumTrackTintColor="#2563eb"
              maximumTrackTintColor="#e2e8f0"
            />
          </View>
        </View>

        {/* Advanced Filters Toggle */}
        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          <Text style={styles.advancedToggleText}>
            {showAdvancedFilters ? '▼' : '▶'} فلاتر متقدمة
          </Text>
        </TouchableOpacity>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <View style={styles.advancedFiltersSection}>
            {/* Bedrooms & Bathrooms */}
            <View style={styles.filterRow}>
              <View style={styles.filterColumn}>
                <Text style={styles.filterLabel}>عدد الغرف</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {BEDROOM_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.filterChip,
                        filters.bedrooms === option.value && styles.filterChipActive,
                      ]}
                      onPress={() => setFilters(prev => ({ ...prev, bedrooms: option.value }))}
                    >
                      <Text style={[
                        styles.filterChipText,
                        filters.bedrooms === option.value && styles.filterChipTextActive,
                      ]}>
                        {option.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.filterRow}>
              <View style={styles.filterColumn}>
                <Text style={styles.filterLabel}>عدد الحمامات</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {BATHROOM_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.filterChip,
                        filters.bathrooms === option.value && styles.filterChipActive,
                      ]}
                      onPress={() => setFilters(prev => ({ ...prev, bathrooms: option.value }))}
                    >
                      <Text style={[
                        styles.filterChipText,
                        filters.bathrooms === option.value && styles.filterChipTextActive,
                      ]}>
                        {option.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Area Range */}
            <View style={styles.areaRangeSection}>
              <Text style={styles.filterLabel}>المساحة (متر مربع)</Text>
              <Text style={styles.areaRangeText}>
                من {filters.min_area}م² إلى {filters.max_area}م²
              </Text>
              
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>الحد الأدنى</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={AREA_RANGES.min}
                  maximumValue={AREA_RANGES.max}
                  step={AREA_RANGES.step}
                  value={filters.min_area}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    min_area: value,
                    max_area: Math.max(value, prev.max_area)
                  }))}
                  minimumTrackTintColor="#2563eb"
                  maximumTrackTintColor="#e2e8f0"
                />
              </View>
              
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>الحد الأقصى</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={AREA_RANGES.min}
                  maximumValue={AREA_RANGES.max}
                  step={AREA_RANGES.step}
                  value={filters.max_area}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    max_area: value,
                    min_area: Math.min(value, prev.min_area)
                  }))}
                  minimumTrackTintColor="#2563eb"
                  maximumTrackTintColor="#e2e8f0"
                />
              </View>
            </View>

            {/* Special Features */}
            <View style={styles.specialFeaturesSection}>
              <Text style={styles.filterLabel}>مميزات خاصة</Text>
              
              <TouchableOpacity
                style={[
                  styles.featureToggle,
                  filters.has_virtual_tour && styles.featureToggleActive,
                ]}
                onPress={() => setFilters(prev => ({ 
                  ...prev, 
                  has_virtual_tour: !prev.has_virtual_tour 
                }))}
              >
                <Text style={[
                  styles.featureToggleText,
                  filters.has_virtual_tour && styles.featureToggleTextActive,
                ]}>
                  🏠 عقارات بجولة افتراضية فقط
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.locationButton}
                onPress={getCurrentLocation}
              >
                <Text style={styles.locationButtonText}>
                  📍 البحث بالقرب من موقعي
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <View style={styles.recentSearchesSection}>
            <View style={styles.recentSearchesHeader}>
              <Text style={styles.sectionTitle}>عمليات البحث الأخيرة</Text>
              <TouchableOpacity onPress={clearRecentSearches}>
                <Text style={styles.clearText}>مسح الكل</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={recentSearches}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.recentSearchCard}
                  onPress={() => applyRecentSearch(item)}
                >
                  <Text style={styles.recentSearchQuery} numberOfLines={2}>
                    {item.query || 'بحث مخصص'}
                  </Text>
                  <Text style={styles.recentSearchDetails}>
                    {item.resultsCount} نتيجة
                  </Text>
                  <Text style={styles.recentSearchTime}>
                    {new Date(item.timestamp).toLocaleDateString('ar-EG')}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsSection}>
          <TouchableOpacity
            style={styles.searchMainButton}
            onPress={performSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.searchMainButtonText}>🔍 بحث عن العقارات</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetFilters}
          >
            <Text style={styles.resetButtonText}>🔄 إعادة تعيين الفلاتر</Text>
          </TouchableOpacity>
        </View>

        {/* Spacer for bottom navigation */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modals */}
      <CitySelectionModal />
      <PropertyTypeModal />
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
  
  // Search Section
  searchSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchInputContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
    textAlign: 'right',
  },
  searchButton: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    minWidth: 50,
  },
  searchButtonText: {
    fontSize: 18,
  },
  
  // Quick Filters
  quickFiltersSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'right',
  },
  quickFiltersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  quickFilterButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  quickFilterText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  
  // Price Range
  priceRangeSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 8,
  },
  priceRangeInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  priceRangeText: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '600',
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'right',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#2563eb',
    width: 20,
    height: 20,
  },
  
  // Advanced Filters
  advancedToggle: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  advancedToggleText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  advancedFiltersSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 8,
  },
  filterRow: {
    marginBottom: 20,
  },
  filterColumn: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'right',
  },
  filterChip: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  
  // Area Range
  areaRangeSection: {
    marginBottom: 20,
  },
  areaRangeText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  
  // Special Features
  specialFeaturesSection: {
    marginBottom: 20,
  },
  featureToggle: {
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    alignItems: 'center',
  },
  featureToggleActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  featureToggleText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  featureToggleTextActive: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  locationButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  locationButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  
  // Recent Searches
  recentSearchesSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 8,
  },
  recentSearchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
  },
  recentSearchCard: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    width: 120,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  recentSearchQuery: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'right',
  },
  recentSearchDetails: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
    textAlign: 'right',
  },
  recentSearchTime: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'right',
  },
  
  // Action Buttons
  actionButtonsSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 8,
  },
  searchMainButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  searchMainButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resetButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#6b7280',
  },
  modalItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalItemSelected: {
    backgroundColor: '#f0f9ff',
  },
  modalItemText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'right',
  },
  modalItemTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  
  bottomSpacer: {
    height: 20,
  },
});

export default SearchScreen; 