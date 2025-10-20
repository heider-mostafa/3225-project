import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { apiClient } from '../config/api';
import { RootStackParamList } from '../navigation/AppNavigator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75; // 75% of screen width

// Property interface (matching the main app)
interface Property {
  id: string;
  title: string;
  description?: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_meters: number;
  address: string;
  city: string;
  state?: string;
  neighborhood?: string;
  compound?: string;
  property_type: string;
  status: string;
  features?: string[];
  property_photos?: Array<{
    id: string;
    url: string;
    is_primary: boolean;
    order_index: number;
  }>;
  view_count?: number;
}

interface SimilarPropertiesProps {
  currentProperty: Property;
}

const SimilarProperties: React.FC<SimilarPropertiesProps> = ({ currentProperty }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  
  // State for similar properties
  const [areaProperties, setAreaProperties] = useState<Property[]>([]);
  const [compoundProperties, setCompoundProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'area' | 'compound'>('area');

  useEffect(() => {
    fetchSimilarProperties();
  }, [currentProperty.id]);

  useEffect(() => {
    // Set default tab based on whether property is in a compound
    if (currentProperty.compound && compoundProperties.length > 0) {
      setActiveTab('compound');
    } else {
      setActiveTab('area');
    }
  }, [currentProperty.compound, compoundProperties.length]);

  const fetchSimilarProperties = async () => {
    try {
      setLoading(true);
      
      // Fetch properties in the same area using the existing API client
      const areaParams = {
        city: currentProperty.city,
        property_type: currentProperty.property_type,
        limit: 10,
        exclude: currentProperty.id,
        min_bedrooms: Math.max(1, currentProperty.bedrooms - 1),
        max_bedrooms: (currentProperty.bedrooms + 1),
        min_price: Math.floor(currentProperty.price * 0.7),
        max_price: Math.ceil(currentProperty.price * 1.3)
      };

      console.log('🔍 Fetching similar area properties with params:', areaParams);
      const areaResponse = await apiClient.getProperties(areaParams);
      if (areaResponse.success && areaResponse.data) {
        console.log(`✅ Found ${areaResponse.data.length} area properties`);
        setAreaProperties(areaResponse.data);
      } else {
        console.log('❌ Failed to fetch area properties:', areaResponse.error);
        // Fallback: try a simpler search without price/bedroom filters
        const simpleParams = {
          city: currentProperty.city,
          property_type: currentProperty.property_type,
          limit: 10,
          exclude: currentProperty.id
        };
        const fallbackResponse = await apiClient.getProperties(simpleParams);
        if (fallbackResponse.success && fallbackResponse.data) {
          console.log(`✅ Fallback: Found ${fallbackResponse.data.length} area properties`);
          setAreaProperties(fallbackResponse.data);
        }
      }

      // If property is in a compound, fetch compound-specific properties
      if (currentProperty.compound) {
        const compoundParams = {
          compound: currentProperty.compound,
          limit: 10,
          exclude: currentProperty.id
        };

        console.log('🏘️ Fetching similar compound properties with params:', compoundParams);
        const compoundResponse = await apiClient.getProperties(compoundParams);
        if (compoundResponse.success && compoundResponse.data) {
          console.log(`✅ Found ${compoundResponse.data.length} compound properties`);
          setCompoundProperties(compoundResponse.data);
        } else {
          console.log('❌ Failed to fetch compound properties:', compoundResponse.error);
        }
      }
    } catch (error) {
      console.error('Error fetching similar properties:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const formatPropertyType = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      apartment: 'شقة',
      villa: 'فيلا',
      house: 'منزل',
      studio: 'استوديو',
      penthouse: 'بنتهاوس',
      townhouse: 'تاون هاوس',
      duplex: 'دوبلكس',
    };
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Get property image with fallback
  const getPropertyImage = (property: Property): string => {
    if (property.property_photos && property.property_photos.length > 0) {
      const primaryPhoto = property.property_photos.find(photo => photo.is_primary);
      return primaryPhoto?.url || property.property_photos[0]?.url || 'https://via.placeholder.com/300x200?text=عقار';
    }
    return 'https://via.placeholder.com/300x200?text=عقار';
  };

  // Navigate to property details
  const navigateToProperty = (propertyId: string) => {
    navigation.navigate('PropertyDetails', { propertyId });
  };

  // Property card component
  const PropertyCard: React.FC<{ property: Property }> = ({ property }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() => navigateToProperty(property.id)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: getPropertyImage(property) }}
        style={styles.propertyImage}
        resizeMode="cover"
      />
      
      {/* Property Type Badge */}
      <View style={styles.propertyTypeBadge}>
        <Text style={styles.propertyTypeText}>{formatPropertyType(property.property_type)}</Text>
      </View>
      
      {/* View Count Badge */}
      {property.view_count && (
        <View style={styles.viewCountBadge}>
          <Text style={styles.viewCountText}>👁️ {property.view_count}</Text>
        </View>
      )}
      
      <View style={styles.propertyContent}>
        <Text style={styles.propertyTitle} numberOfLines={2}>
          {property.title}
        </Text>
        
        <View style={styles.locationContainer}>
          <Text style={styles.locationText} numberOfLines={1}>
            📍 {property.address}, {property.city}
          </Text>
        </View>
        
        <View style={styles.propertySpecs}>
          <View style={styles.specItem}>
            <Text style={styles.specText}>🛏️ {property.bedrooms}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specText}>🚿 {property.bathrooms}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specText}>📐 {property.square_meters}م²</Text>
          </View>
        </View>
        
        {/* Features */}
        {property.features && property.features.length > 0 && (
          <View style={styles.featuresContainer}>
            {property.features.slice(0, 2).map((feature, index) => (
              <View key={index} style={styles.featureBadge}>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
            {property.features.length > 2 && (
              <View style={styles.featureBadge}>
                <Text style={styles.featureText}>+{property.features.length - 2} أخرى</Text>
              </View>
            )}
          </View>
        )}
        
        <View style={styles.priceContainer}>
          <Text style={styles.propertyPrice}>{formatEGP(property.price)}</Text>
          <View style={styles.viewButton}>
            <Text style={styles.viewButtonText}>عرض التفاصيل</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>🏘️ عقارات مشابهة</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>جاري تحميل العقارات المشابهة...</Text>
        </View>
      </View>
    );
  }

  const hasCompoundProperties = currentProperty.compound && compoundProperties.length > 0;
  const hasAreaProperties = areaProperties.length > 0;
  const currentProperties = activeTab === 'compound' ? compoundProperties : areaProperties;

  if (!hasCompoundProperties && !hasAreaProperties) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>🏘️ عقارات مشابهة</Text>
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsIcon}>🏢</Text>
          <Text style={styles.noResultsTitle}>لا توجد عقارات مشابهة</Text>
          <Text style={styles.noResultsSubtitle}>لم نعثر على عقارات مشابهة في هذه المنطقة</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>🏘️ عقارات مشابهة</Text>
        
        {/* Tabs for Area vs Compound properties */}
        {hasCompoundProperties && hasAreaProperties && (
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'area' && styles.activeTab]}
              onPress={() => setActiveTab('area')}
            >
              <Text style={[styles.tabText, activeTab === 'area' && styles.activeTabText]}>
                المنطقة
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'compound' && styles.activeTab]}
              onPress={() => setActiveTab('compound')}
            >
              <Text style={[styles.tabText, activeTab === 'compound' && styles.activeTabText]}>
                {currentProperty.compound}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Properties List */}
      <FlatList
        data={currentProperties.slice(0, 10)} // Limit to 10 properties
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PropertyCard property={item} />}
        contentContainerStyle={styles.propertiesList}
        ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
      />

      {/* Show total count */}
      {currentProperties.length > 0 && (
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            تم العثور على {currentProperties.length} عقار مشابه
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 8,
  },
  headerContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'right',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 4,
    alignSelf: 'flex-end',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noResultsIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  propertiesList: {
    paddingHorizontal: 4,
  },
  cardSeparator: {
    width: 12,
  },
  propertyCard: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  propertyImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#f3f4f6',
  },
  propertyTypeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  propertyTypeText: {
    fontSize: 10,
    color: '#1e293b',
    fontWeight: '600',
  },
  viewCountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewCountText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  propertyContent: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'right',
    lineHeight: 22,
  },
  locationContainer: {
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  propertySpecs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  specItem: {
    alignItems: 'center',
  },
  specText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    justifyContent: 'flex-end',
  },
  featureBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 9,
    color: '#3730a3',
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    textAlign: 'right',
  },
  viewButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  countContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  countText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default SimilarProperties;