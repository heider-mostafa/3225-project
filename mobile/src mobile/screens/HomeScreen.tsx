import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { apiClient } from '../config/api';
import { RootStackParamList } from '../navigation/AppNavigator';

// Egyptian area type
interface EgyptianArea {
  name: string;
  arabicName: string;
  properties: number;
  image: string;
}

// Use the API client's Property type to avoid conflicts
type Property = {
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
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Egyptian areas matching your web app
  const egyptianAreas: EgyptianArea[] = [
    { name: 'New Cairo', arabicName: 'القاهرة الجديدة', properties: 245, image: '/areas/new-cairo.jpg' },
    { name: 'Sheikh Zayed', arabicName: 'الشيخ زايد', properties: 189, image: '/areas/sheikh-zayed.jpg' },
    { name: 'Zamalek', arabicName: 'الزمالك', properties: 156, image: '/areas/zamalek.jpg' },
    { name: 'Maadi', arabicName: 'المعادي', properties: 234, image: '/areas/maadi.jpg' },
    { name: 'Heliopolis', arabicName: 'مصر الجديدة', properties: 167, image: '/areas/heliopolis.jpg' },
    { name: 'Giza', arabicName: 'الجيزة', properties: 298, image: '/areas/giza.jpg' },
  ];

  useEffect(() => {
    loadFeaturedProperties();
  }, []);

  const loadFeaturedProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the working API endpoint like PropertiesScreen
      const response = await apiClient.getProperties({ limit: 10 });
      
      if (response.success && response.data) {
        setProperties(response.data);
        console.log(`🏠 Loaded ${response.data.length} featured properties for home`);
      } else {
        throw new Error(response.error || 'فشل في تحميل العقارات');
      }
    } catch (err: any) {
      console.error('❌ Failed to load featured properties:', err);
      setError(err.message || 'فشل في تحميل العقارات');
      Alert.alert('خطأ', 'فشل في تحميل العقارات المميزة');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFeaturedProperties();
    setRefreshing(false);
  };

  // Format EGP currency like your web app
  const formatEGP = (price: number): string => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Search', { query: searchQuery.trim() });
    }
  };

  const handleAreaPress = (area: EgyptianArea) => {
    navigation.navigate('Properties', { city: area.name });
  };

  const handlePropertyPress = (property: Property) => {
    navigation.navigate('PropertyDetails', { propertyId: property.id });
  };

  const getPrimaryImage = (property: Property): string => {
    if (property.property_photos && property.property_photos.length > 0) {
      const primaryPhoto = property.property_photos.find(photo => photo.is_primary);
      return primaryPhoto?.url || property.property_photos[0]?.url || 'https://via.placeholder.com/300x200';
    }
    return 'https://via.placeholder.com/300x200';
  };

  const renderProperty = ({ item: property }: { item: Property }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() => handlePropertyPress(property)}
    >
      <Image
        source={{ uri: getPrimaryImage(property) }}
        style={styles.propertyImage}
        defaultSource={{ uri: 'https://via.placeholder.com/300x200' }}
      />
      {property.virtual_tour_url && (
        <View style={styles.virtualTourBadge}>
          <Text style={styles.virtualTourText}>🏠 جولة افتراضية</Text>
        </View>
      )}
      <View style={styles.propertyContent}>
        <Text style={styles.propertyTitle} numberOfLines={2}>
          {property.title}
        </Text>
        <Text style={styles.propertyLocation}>📍 {property.address}, {property.city}</Text>
        
        <View style={styles.propertyDetails}>
          <Text style={styles.propertyDetail}>🛏️ {property.bedrooms} غرف</Text>
          <Text style={styles.propertyDetail}>🚿 {property.bathrooms} حمام</Text>
          <Text style={styles.propertyDetail}>📐 {property.square_meters}م²</Text>
        </View>
        
        <View style={styles.propertyMeta}>
          <Text style={styles.propertyPrice}>
            {formatEGP(property.price)}
          </Text>
          <View style={styles.propertyTypeContainer}>
            <Text style={styles.propertyType}>{property.property_type}</Text>
            <Text style={styles.propertyStatus}>{property.status}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderArea = ({ item: area }: { item: EgyptianArea }) => (
    <TouchableOpacity
      style={styles.areaCard}
      onPress={() => handleAreaPress(area)}
    >
      <Image
        source={{ uri: `http://localhost:3000${area.image}` }}
        style={styles.areaImage}
        defaultSource={{ uri: 'https://via.placeholder.com/200x120' }}
      />
      <View style={styles.areaOverlay}>
        <Text style={styles.areaName}>{area.name}</Text>
        <Text style={styles.areaNameArabic}>{area.arabicName}</Text>
        <Text style={styles.areaProperties}>{area.properties} عقار</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>🔄 جاري تحميل العقارات المصرية...</Text>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadFeaturedProperties}>
          <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#2563eb"
          title="جاري التحديث..."
        />
      }
    >
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>🏠 العقارات المصرية</Text>
        <Text style={styles.heroSubtitle}>
          اكتشف أفضل العقارات في مصر مع الجولات الافتراضية ثلاثية الأبعاد
        </Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن العقارات في مصر..."
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
      </View>

      {/* Featured Properties */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>العقارات المميزة</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Properties')}
            style={styles.viewAllButton}
          >
            <Text style={styles.viewAllText}>عرض الكل</Text>
          </TouchableOpacity>
        </View>
        
        {properties.length > 0 ? (
          <FlatList
            data={properties}
            renderItem={renderProperty}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.propertiesList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>لا توجد عقارات مميزة متاحة حالياً</Text>
          </View>
        )}
      </View>

      {/* Egyptian Areas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>المناطق في مصر</Text>
        <FlatList
          data={egyptianAreas}
          renderItem={renderArea}
          keyExtractor={(item) => item.name}
          numColumns={2}
          contentContainerStyle={styles.areasList}
          scrollEnabled={false}
        />
      </View>

      {/* Quick Actions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الخدمات</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('VirtualTours')}
          >
            <Text style={styles.actionIcon}>🏠</Text>
            <Text style={styles.actionText}>الجولات الافتراضية</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Brokers')}
          >
            <Text style={styles.actionIcon}>👨‍💼</Text>
            <Text style={styles.actionText}>السماسرة</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Properties')}
          >
            <Text style={styles.actionIcon}>🔍</Text>
            <Text style={styles.actionText}>البحث المتقدم</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Areas')}
          >
            <Text style={styles.actionIcon}>📍</Text>
            <Text style={styles.actionText}>المناطق</Text>
          </TouchableOpacity>
        </View>
        
        {/* Info about Calculator and AI Assistant */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            💡 لاستخدام حاسبة القرض والمساعد الذكي، اختر عقار أولاً لتحصل على المساعدة المخصصة
          </Text>
        </View>
      </View>

      {/* Stats Footer */}
      <View style={styles.statsSection}>
        <Text style={styles.statsTitle}>📊 إحصائيات العقارات</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{properties.length}+</Text>
            <Text style={styles.statLabel}>عقار مميز</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>6</Text>
            <Text style={styles.statLabel}>منطقة رئيسية</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>100%</Text>
            <Text style={styles.statLabel}>جولات افتراضية</Text>
          </View>
        </View>
      </View>
    </ScrollView>
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
  heroSection: {
    padding: 20,
    backgroundColor: '#2563eb',
    paddingTop: 50,
    paddingBottom: 30,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#dbeafe',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    marginHorizontal: 4,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginRight: 8,
    textAlign: 'right',
  },
  searchButton: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  viewAllButton: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewAllText: {
    color: '#0369a1',
    fontWeight: '600',
    fontSize: 14,
  },
  propertiesList: {
    paddingHorizontal: 16,
  },
  propertyCard: {
    width: 300,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  propertyImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  virtualTourBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#10b981',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  virtualTourText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  propertyContent: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'right',
  },
  propertyLocation: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    textAlign: 'right',
  },
  propertyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  propertyDetail: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  propertyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  propertyPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  propertyTypeContainer: {
    alignItems: 'flex-end',
  },
  propertyType: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  propertyStatus: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  areasList: {
    paddingHorizontal: 16,
  },
  areaCard: {
    flex: 1,
    height: 140,
    margin: 6,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  areaImage: {
    width: '100%',
    height: '100%',
  },
  areaOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
  },
  areaName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  areaNameArabic: {
    fontSize: 13,
    color: '#d1d5db',
    marginTop: 2,
  },
  areaProperties: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 4,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    margin: '1%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  statsSection: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default HomeScreen; 