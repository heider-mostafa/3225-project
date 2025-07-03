import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { apiClient } from '../config/api';
import { RootStackParamList } from '../navigation/AppNavigator';

// Types based on your working API (matching the updated interface)
interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_meters?: number; // Optional to match API response
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

// Egyptian cities from your working web app
const EGYPTIAN_CITIES = [
  'New Cairo',
  'Sheikh Zayed',
  'Zamalek',
  'Maadi',
  'Heliopolis',
  'Giza',
  '6th of October',
  'Alexandria',
];

const PROPERTY_TYPES = [
  'All Types',
  'Apartment',
  'Villa',
  'Townhouse',
  'Penthouse',
  'Studio',
  'Duplex',
];

const SORT_OPTIONS = [
  { key: 'newest', label: 'الأحدث' },
  { key: 'price_low', label: 'السعر: الأقل أولاً' },
  { key: 'price_high', label: 'السعر: الأعلى أولاً' },
  { key: 'bedrooms', label: 'عدد الغرف' },
  { key: 'area', label: 'المساحة' },
];

const BEDROOM_OPTIONS = ['Any', '1', '2', '3', '4', '5+'];
const BATHROOM_OPTIONS = ['Any', '1', '2', '3', '4+'];

const PropertiesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedBedrooms, setSelectedBedrooms] = useState('Any');
  const [selectedBathrooms, setSelectedBathrooms] = useState('Any');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Format EGP currency like your web app
  const formatEGP = (price: number): string => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Sort properties locally
  const sortProperties = (properties: Property[], sortKey: string): Property[] => {
    const sorted = [...properties];
    switch (sortKey) {
      case 'price_low':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price_high':
        return sorted.sort((a, b) => b.price - a.price);
      case 'bedrooms':
        return sorted.sort((a, b) => b.bedrooms - a.bedrooms);
      case 'area':
        return sorted.sort((a, b) => (b.square_meters || 0) - (a.square_meters || 0));
      case 'newest':
      default:
        return sorted; // Keep original order (newest first from API)
    }
  };

  // Load properties using your working API
  const loadProperties = async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      // Build search parameters with all filters
      const hasFilters = searchQuery || selectedCity !== 'All Cities' || 
                        selectedType !== 'All Types' || selectedBedrooms !== 'Any' ||
                        selectedBathrooms !== 'Any' || priceRange.min || priceRange.max;

      let response;
      if (hasFilters) {
        const searchParams: any = {};
        if (searchQuery) searchParams.search_query = searchQuery;
        if (selectedCity !== 'All Cities') searchParams.city = selectedCity;
        if (selectedType !== 'All Types') searchParams.property_type = selectedType;
        if (selectedBedrooms !== 'Any') searchParams.bedrooms = selectedBedrooms === '5+' ? '5' : selectedBedrooms;
        if (selectedBathrooms !== 'Any') searchParams.bathrooms = selectedBathrooms === '4+' ? '4' : selectedBathrooms;
        if (priceRange.min) searchParams.min_price = priceRange.min;
        if (priceRange.max) searchParams.max_price = priceRange.max;
        searchParams.page = pageNum;
        searchParams.pageSize = 20;

        response = await apiClient.searchProperties(searchQuery, searchParams);
      } else {
        response = await apiClient.getProperties({
          page: pageNum,
          limit: 20,
        });
      }

      if (response.success && response.data) {
        let newProperties = response.data;
        
        // Apply local sorting
        newProperties = sortProperties(newProperties, sortBy);
        
        console.log(`📱 Loaded ${newProperties.length} properties (page ${pageNum}, sorted by ${sortBy})`);
        
        if (isRefresh || pageNum === 1) {
          setProperties(newProperties);
        } else {
          setProperties(prev => sortProperties([...prev, ...newProperties], sortBy));
        }
        
        // Check if we have more data (if we got less than 20, probably no more)
        setHasMoreData(newProperties.length === 20);
        setPage(pageNum);
      } else {
        throw new Error(response.error || 'فشل في تحميل العقارات');
      }
    } catch (err: any) {
      console.error('❌ Error loading properties:', err);
      setError(err.message || 'حدث خطأ أثناء تحميل العقارات');
      if (pageNum === 1) {
        Alert.alert('خطأ', err.message || 'حدث خطأ أثناء تحميل العقارات');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadProperties();
  }, []);

  // Reload when filters change
  useEffect(() => {
    if (!loading) {
      loadProperties(1, true);
    }
  }, [selectedCity, selectedType, selectedBedrooms, selectedBathrooms, priceRange.min, priceRange.max, sortBy]);

  // Handle search
  const handleSearch = () => {
    loadProperties(1, true);
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    setError(null);
    loadProperties(1, true);
  };

  // Load more data
  const loadMore = () => {
    if (!loadingMore && hasMoreData && !error) {
      loadProperties(page + 1);
    }
  };

  // Navigate to property details
  const navigateToDetails = (propertyId: string) => {
    navigation.navigate('PropertyDetails', { propertyId });
  };

  // Get primary image or fallback
  const getPropertyImage = (property: Property): string => {
    if (property.property_photos && property.property_photos.length > 0) {
      const primaryPhoto = property.property_photos.find(photo => photo.is_primary);
      return primaryPhoto?.url || property.property_photos[0]?.url || 'https://via.placeholder.com/300x200?text=عقار';
    }
    return 'https://via.placeholder.com/300x200?text=عقار';
  };

  // Property card component
  const PropertyCard: React.FC<{ property: Property }> = ({ property }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() => navigateToDetails(property.id)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: getPropertyImage(property) }}
        style={styles.propertyImage}
        resizeMode="cover"
        defaultSource={{ uri: 'https://via.placeholder.com/300x200?text=عقار' }}
      />
      
      {/* Virtual Tour Badge */}
      {property.virtual_tour_url && (
        <View style={styles.virtualTourBadge}>
          <Text style={styles.virtualTourText}>🏠 جولة افتراضية</Text>
        </View>
      )}
      
      <View style={styles.propertyContent}>
        <Text style={styles.propertyTitle} numberOfLines={2}>
          {property.title}
        </Text>
        
        <Text style={styles.propertyPrice}>
          {formatEGP(property.price)}
        </Text>
        
        <Text style={styles.propertyLocation} numberOfLines={1}>
          📍 {property.address}, {property.city}
        </Text>
        
        <View style={styles.propertyDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailText}>🛏️ {property.bedrooms} غرف</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailText}>🚿 {property.bathrooms} حمام</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailText}>📐 {property.square_meters || 0}م²</Text>
          </View>
        </View>
        
        <View style={styles.propertyMeta}>
          <Text style={styles.propertyType}>{property.property_type}</Text>
          <Text style={styles.propertyStatus}>{property.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Enhanced Filter row component with all filters
  const FilterRow: React.FC = () => (
    <View style={styles.filterSection}>
      {/* Sort Options */}
      <Text style={styles.filterLabel}>ترتيب حسب</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {SORT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.filterChip,
              sortBy === option.key && styles.activeFilterChip,
            ]}
            onPress={() => setSortBy(option.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                sortBy === option.key && styles.activeFilterChipText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* City Filter */}
      <Text style={styles.filterLabel}>المدينة</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {['All Cities', ...EGYPTIAN_CITIES].map((city) => (
          <TouchableOpacity
            key={city}
            style={[
              styles.filterChip,
              selectedCity === city && styles.activeFilterChip,
            ]}
            onPress={() => setSelectedCity(city)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCity === city && styles.activeFilterChipText,
              ]}
            >
              {city === 'All Cities' ? 'جميع المدن' : city}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Property Type Filter */}
      <Text style={styles.filterLabel}>نوع العقار</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {PROPERTY_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterChip,
              selectedType === type && styles.activeFilterChip,
            ]}
            onPress={() => setSelectedType(type)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedType === type && styles.activeFilterChipText,
              ]}
            >
              {type === 'All Types' ? 'جميع الأنواع' : type}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bedrooms Filter */}
      <Text style={styles.filterLabel}>عدد الغرف</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {BEDROOM_OPTIONS.map((bedrooms) => (
          <TouchableOpacity
            key={bedrooms}
            style={[
              styles.filterChip,
              selectedBedrooms === bedrooms && styles.activeFilterChip,
            ]}
            onPress={() => setSelectedBedrooms(bedrooms)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedBedrooms === bedrooms && styles.activeFilterChipText,
              ]}
            >
              {bedrooms === 'Any' ? 'أي عدد' : bedrooms}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bathrooms Filter */}
      <Text style={styles.filterLabel}>عدد الحمامات</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {BATHROOM_OPTIONS.map((bathrooms) => (
          <TouchableOpacity
            key={bathrooms}
            style={[
              styles.filterChip,
              selectedBathrooms === bathrooms && styles.activeFilterChip,
            ]}
            onPress={() => setSelectedBathrooms(bathrooms)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedBathrooms === bathrooms && styles.activeFilterChipText,
              ]}
            >
              {bathrooms === 'Any' ? 'أي عدد' : bathrooms}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Price Range Filter */}
      <Text style={styles.filterLabel}>نطاق السعر (جنيه مصري)</Text>
      <View style={styles.priceRangeContainer}>
        <TextInput
          style={styles.priceInput}
          placeholder="من"
          placeholderTextColor="#9ca3af"
          value={priceRange.min}
          onChangeText={(text) => setPriceRange(prev => ({ ...prev, min: text }))}
          keyboardType="numeric"
        />
        <Text style={styles.priceRangeSeparator}>إلى</Text>
        <TextInput
          style={styles.priceInput}
          placeholder="إلى"
          placeholderTextColor="#9ca3af"
          value={priceRange.max}
          onChangeText={(text) => setPriceRange(prev => ({ ...prev, max: text }))}
          keyboardType="numeric"
        />
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>🔄 جاري تحميل العقارات...</Text>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadProperties()}>
          <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Search */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔍 استكشف العقارات</Text>
        <Text style={styles.headerSubtitle}>ابحث عن منزل أحلامك في مصر</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن العقارات..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Access to Areas */}
        <TouchableOpacity 
          style={styles.areasButton}
          onPress={() => navigation.navigate('Areas')}
        >
          <Text style={styles.areasButtonText}>🏛️ استكشف المناطق المصرية</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Row */}
      <FilterRow />

      {/* Properties List */}
      <FlatList
        data={properties}
        renderItem={({ item }) => <PropertyCard property={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.propertiesList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563eb"
            title="جاري التحديث..."
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.loadingMoreText}>جاري تحميل المزيد...</Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  searchContainer: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  },
  searchButtonText: {
    fontSize: 18,
  },
  filterSection: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginHorizontal: 16,
    marginBottom: 8,
    textAlign: 'right',
  },
  filterScroll: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterChip: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activeFilterChip: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  propertiesList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  propertyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  propertyImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#f3f4f6',
  },
  virtualTourBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  virtualTourText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  propertyContent: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'right',
  },
  propertyPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 8,
    textAlign: 'right',
  },
  propertyLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    textAlign: 'right',
  },
  propertyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  propertyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  propertyType: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  propertyStatus: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  areasButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  areasButtonText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 16,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 4,
  },
  priceRangeSeparator: {
    fontSize: 14,
    color: '#6b7280',
    marginHorizontal: 8,
  },
});

export default PropertiesScreen; 