import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Share,
  Linking,
  Dimensions,
  FlatList,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WebView } from 'react-native-webview';
import { apiClient } from '../config/api';
import { RootStackParamList } from '../navigation/AppNavigator';

// Get screen dimensions for responsive design
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Enhanced Property interface with all details
interface PropertyDetails {
  id: string;
  title: string;
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_meters?: number;
  address: string;
  city: string;
  state?: string;
  property_type: string;
  status: string;
  year_built?: number;
  furnished?: boolean;
  virtual_tour_url?: string;
  video_tour_url?: string;
  property_photos?: Array<{
    id: string;
    url: string;
    is_primary: boolean;
    order_index: number;
  }>;
  amenities?: string[];
  features?: string[];
  compound?: string;
  nearest_schools?: Array<{
    name: string;
    type: string;
    distance: number;
  }>;
  distance_to_metro?: number;
  distance_to_airport?: number;
  distance_to_mall?: number;
  distance_to_hospital?: number;
  has_pool?: boolean;
  has_garden?: boolean;
  has_security?: boolean;
  has_parking?: boolean;
  has_gym?: boolean;
}

interface Broker {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  avatar?: string;
}

type PropertyDetailsRouteProp = RouteProp<RootStackParamList, 'PropertyDetails'>;
type PropertyDetailsNavigationProp = StackNavigationProp<RootStackParamList, 'PropertyDetails'>;

const PropertyDetailsScreen: React.FC = () => {
  const navigation = useNavigation<PropertyDetailsNavigationProp>();
  const route = useRoute<PropertyDetailsRouteProp>();
  const { propertyId } = route.params;

  // State management
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  
  // Image gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageGallery, setShowImageGallery] = useState(false);
  
  // Virtual tour state
  const [showVirtualTour, setShowVirtualTour] = useState(false);

  // Load property details
  useEffect(() => {
    loadPropertyDetails();
    loadPropertyBrokers();
  }, [propertyId]);

  const loadPropertyDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getProperty(propertyId);
      
      if (response.success && response.data) {
        setProperty(response.data);
        console.log(`📱 Loaded property details for: ${response.data.title}`);
      } else {
        throw new Error(response.error || 'فشل في تحميل تفاصيل العقار');
      }
    } catch (err: any) {
      console.error('❌ Error loading property details:', err);
      setError(err.message || 'حدث خطأ أثناء تحميل تفاصيل العقار');
      Alert.alert('خطأ', err.message || 'حدث خطأ أثناء تحميل تفاصيل العقار');
    } finally {
      setLoading(false);
    }
  };

  const loadPropertyBrokers = async () => {
    try {
      const response = await apiClient.getPropertyBrokers(propertyId);
      
      if (response.success && response.data) {
        setBrokers(response.data);
        console.log(`📱 Loaded ${response.data.length} brokers for property`);
      }
    } catch (err: any) {
      console.error('⚠️ Error loading brokers:', err);
      // Don't show error for brokers, it's not critical
    }
  };

  // Format EGP currency
  const formatEGP = (price: number): string => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Handle save to favorites
  const handleToggleFavorite = async () => {
    if (!property) return;
    
    try {
      setSavingFavorite(true);
      
      if (isFavorite) {
        const response = await apiClient.unsaveProperty(property.id);
        if (response.success) {
          setIsFavorite(false);
          Alert.alert('تم', 'تم إزالة العقار من المفضلة');
        }
      } else {
        const response = await apiClient.saveProperty(property.id);
        if (response.success) {
          setIsFavorite(true);
          Alert.alert('تم', 'تم إضافة العقار إلى المفضلة');
        }
      }
    } catch (err: any) {
      Alert.alert('خطأ', 'فشل في حفظ العقار في المفضلة');
    } finally {
      setSavingFavorite(false);
    }
  };

  // Handle share property
  const handleShareProperty = async () => {
    if (!property) return;
    
    try {
      const shareMessage = `🏠 ${property.title}\n💰 ${formatEGP(property.price)}\n📍 ${property.address}, ${property.city}\n\n🛏️ ${property.bedrooms} غرف | 🚿 ${property.bathrooms} حمام | 📐 ${property.square_meters || 0}م²\n\nشاهد العقار على تطبيق العقارات المصرية`;
      
      await Share.share({
        message: shareMessage,
        title: property.title,
      });
    } catch (err: any) {
      console.error('Share error:', err);
    }
  };

  // Handle broker contact
  const handleContactBroker = (broker: Broker) => {
    Alert.alert(
      `الاتصال بـ ${broker.name}`,
      `${broker.company ? broker.company + '\n' : ''}اختر طريقة التواصل:`,
      [
        {
          text: '📞 اتصال',
          onPress: () => Linking.openURL(`tel:${broker.phone}`),
        },
        {
          text: '✉️ إيميل',
          onPress: () => Linking.openURL(`mailto:${broker.email}`),
        },
        {
          text: 'إلغاء',
          style: 'cancel',
        },
      ]
    );
  };

  // Navigate to Calculator with property price
  const handleCalculateMortgage = () => {
    navigation.navigate('Calculator', { 
      initialPropertyPrice: property?.price 
    });
  };

  const handleAIAssistant = () => {
    navigation.navigate('AIAssistant', { 
      propertyId: property?.id,
      currentRoom: 'property-details',
      tourContext: {
        visitedRooms: ['property-details'],
        timeInRoom: 60, // Default 1 minute
        totalTimeSpent: 60,
      }
    });
  };

  // Get images for gallery
  const getPropertyImages = (): Array<{id: string, url: string}> => {
    if (!property?.property_photos) return [];
    return property.property_photos
      .sort((a, b) => a.order_index - b.order_index)
      .map(photo => ({ id: photo.id, url: photo.url }));
  };

  // Image Gallery Component
  const ImageGallery: React.FC = () => {
    const images = getPropertyImages();
    
    if (images.length === 0) return null;

    return (
      <View style={styles.imageGalleryContainer}>
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setSelectedImageIndex(index);
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.imageContainer}
              onPress={() => setShowImageGallery(true)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: item.url }}
                style={styles.propertyImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
        />
        
        {/* Image indicators */}
        <View style={styles.imageIndicators}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.imageIndicator,
                selectedImageIndex === index && styles.activeImageIndicator,
              ]}
            />
          ))}
        </View>
        
        {/* Image counter */}
        <View style={styles.imageCounter}>
          <Text style={styles.imageCounterText}>
            {selectedImageIndex + 1} / {images.length}
          </Text>
        </View>
      </View>
    );
  };

  // Property Specifications Component
  const PropertySpecs: React.FC = () => {
    if (!property) return null;

    const specs = [
      { icon: '🛏️', label: 'غرف النوم', value: property.bedrooms },
      { icon: '🚿', label: 'الحمامات', value: property.bathrooms },
      { icon: '📐', label: 'المساحة', value: `${property.square_meters || 0}م²` },
      { icon: '🏗️', label: 'سنة البناء', value: property.year_built || 'غير محدد' },
      { icon: '🪑', label: 'مفروش', value: property.furnished ? 'نعم' : 'لا' },
    ];

    return (
      <View style={styles.specsContainer}>
        <Text style={styles.sectionTitle}>مواصفات العقار</Text>
        <View style={styles.specsGrid}>
          {specs.map((spec, index) => (
            <View key={index} style={styles.specItem}>
              <Text style={styles.specIcon}>{spec.icon}</Text>
              <Text style={styles.specLabel}>{spec.label}</Text>
              <Text style={styles.specValue}>{spec.value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Amenities Component
  const Amenities: React.FC = () => {
    if (!property?.amenities || property.amenities.length === 0) return null;

    return (
      <View style={styles.amenitiesContainer}>
        <Text style={styles.sectionTitle}>المرافق والخدمات</Text>
        <View style={styles.amenitiesGrid}>
          {property.amenities.map((amenity, index) => (
            <View key={index} style={styles.amenityItem}>
              <Text style={styles.amenityText}>✅ {amenity}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Location Info Component
  const LocationInfo: React.FC = () => {
    if (!property) return null;

    const distances = [
      { icon: '🚇', label: 'المترو', value: property.distance_to_metro ? `${property.distance_to_metro.toFixed(1)} كم` : null },
      { icon: '✈️', label: 'المطار', value: property.distance_to_airport ? `${property.distance_to_airport.toFixed(1)} كم` : null },
      { icon: '🛒', label: 'المول', value: property.distance_to_mall ? `${property.distance_to_mall.toFixed(1)} كم` : null },
      { icon: '🏥', label: 'المستشفى', value: property.distance_to_hospital ? `${property.distance_to_hospital.toFixed(1)} كم` : null },
    ].filter(item => item.value !== null);

    return (
      <View style={styles.locationContainer}>
        <Text style={styles.sectionTitle}>الموقع والمسافات</Text>
        <Text style={styles.locationAddress}>
          📍 {property.address}, {property.city}
          {property.compound && ` - ${property.compound}`}
        </Text>
        
        {distances.length > 0 && (
          <View style={styles.distancesGrid}>
            {distances.map((distance, index) => (
              <View key={index} style={styles.distanceItem}>
                <Text style={styles.distanceIcon}>{distance.icon}</Text>
                <Text style={styles.distanceLabel}>{distance.label}</Text>
                <Text style={styles.distanceValue}>{distance.value}</Text>
              </View>
            ))}
          </View>
        )}

        {property.nearest_schools && property.nearest_schools.length > 0 && (
          <View style={styles.schoolsContainer}>
            <Text style={styles.schoolsTitle}>🎓 المدارس القريبة</Text>
            {property.nearest_schools.map((school, index) => (
              <Text key={index} style={styles.schoolItem}>
                • {school.name} ({school.type}) - {school.distance} كم
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Brokers Component
  const BrokersSection: React.FC = () => {
    if (brokers.length === 0) return null;

    return (
      <View style={styles.brokersContainer}>
        <Text style={styles.sectionTitle}>👨‍💼 السماسرة المسؤولون</Text>
        {brokers.map((broker) => (
          <TouchableOpacity
            key={broker.id}
            style={styles.brokerCard}
            onPress={() => handleContactBroker(broker)}
          >
            <View style={styles.brokerInfo}>
              <Text style={styles.brokerName}>{broker.name}</Text>
              {broker.company && (
                <Text style={styles.brokerCompany}>{broker.company}</Text>
              )}
              <Text style={styles.brokerContact}>📞 {broker.phone}</Text>
              <Text style={styles.brokerContact}>📧 {broker.email}</Text>
            </View>
            <View style={styles.contactButton}>
              <Text style={styles.contactButtonText}>اتصال</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>🔄 جاري تحميل تفاصيل العقار...</Text>
      </View>
    );
  }

  // Error state
  if (error || !property) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>❌ {error || 'لم يتم العثور على العقار'}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={loadPropertyDetails}
        >
          <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <ImageGallery />

        {/* Property Header */}
        <View style={styles.headerContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.propertyTitle}>{property.title}</Text>
            <Text style={styles.propertyPrice}>{formatEGP(property.price)}</Text>
          </View>
          
          <View style={styles.statusContainer}>
            <Text style={styles.propertyType}>{property.property_type}</Text>
            <Text style={styles.propertyStatus}>{property.status}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {property.virtual_tour_url && (
            <TouchableOpacity
              style={styles.virtualTourButton}
              onPress={() => setShowVirtualTour(true)}
            >
              <Text style={styles.virtualTourButtonText}>🏠 جولة افتراضية ثلاثية الأبعاد</Text>
            </TouchableOpacity>
          )}
          
          {/* Calculate Mortgage Button */}
          <TouchableOpacity
            style={styles.calculateMortgageButton}
            onPress={handleCalculateMortgage}
          >
            <Text style={styles.calculateMortgageButtonText}>🏦 احسب التمويل العقاري</Text>
            <Text style={styles.buttonSubtitle}>احسب الدفعة الشهرية لهذا العقار</Text>
          </TouchableOpacity>
          
          {/* AI Assistant Button */}
          <TouchableOpacity
            style={styles.aiAssistantButton}
            onPress={handleAIAssistant}
          >
            <Text style={styles.aiAssistantButtonText}>🤖 اسأل المساعد الذكي</Text>
            <Text style={styles.buttonSubtitle}>احصل على إجابات فورية حول العقار</Text>
          </TouchableOpacity>
          
          <View style={styles.secondaryButtons}>
            <TouchableOpacity
              style={[styles.actionButton, isFavorite && styles.favoriteActive]}
              onPress={handleToggleFavorite}
              disabled={savingFavorite}
            >
              <Text style={styles.actionButtonText}>
                {savingFavorite ? '⏳' : isFavorite ? '❤️' : '🤍'} مفضلة
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShareProperty}
            >
              <Text style={styles.actionButtonText}>📤 مشاركة</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Property Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.sectionTitle}>وصف العقار</Text>
          <Text style={styles.propertyDescription}>{property.description}</Text>
        </View>

        {/* Property Specifications */}
        <PropertySpecs />

        {/* Amenities */}
        <Amenities />

        {/* Location Information */}
        <LocationInfo />

        {/* Brokers */}
        <BrokersSection />

        {/* Spacer for bottom navigation */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Full Screen Image Gallery Modal */}
      <Modal
        visible={showImageGallery}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageGallery(false)}
      >
        <View style={styles.fullScreenImageContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowImageGallery(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
          <FlatList
            data={getPropertyImages()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            initialScrollIndex={selectedImageIndex}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            renderItem={({ item }) => (
              <View style={styles.fullScreenImageWrapper}>
                <Image
                  source={{ uri: item.url }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              </View>
            )}
          />
        </View>
      </Modal>

      {/* Virtual Tour Modal */}
      <Modal
        visible={showVirtualTour}
        animationType="slide"
        onRequestClose={() => setShowVirtualTour(false)}
      >
        <View style={styles.virtualTourContainer}>
          <View style={styles.virtualTourHeader}>
            <Text style={styles.virtualTourTitle}>🏠 الجولة الافتراضية</Text>
            <TouchableOpacity
              style={styles.closeVirtualTourButton}
              onPress={() => setShowVirtualTour(false)}
            >
              <Text style={styles.closeButtonText}>✕ إغلاق</Text>
            </TouchableOpacity>
          </View>
          
          {property.virtual_tour_url && (
            <WebView
              source={{ uri: property.virtual_tour_url }}
              style={styles.webView}
              allowsFullscreenVideo={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color="#2563eb" />
                  <Text style={styles.webViewLoadingText}>جاري تحميل الجولة الافتراضية...</Text>
                </View>
              )}
            />
          )}
        </View>
      </Modal>
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
  
  // Image Gallery Styles
  imageGalleryContainer: {
    height: 300,
    position: 'relative',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeImageIndicator: {
    backgroundColor: '#ffffff',
  },
  imageCounter: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Header Styles
  headerContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  titleContainer: {
    marginBottom: 12,
  },
  propertyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'right',
    marginBottom: 8,
  },
  propertyPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#059669',
    textAlign: 'right',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyType: {
    fontSize: 14,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  propertyStatus: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  
  // Action Buttons Styles
  actionButtonsContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  virtualTourButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  virtualTourButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  calculateMortgageButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  calculateMortgageButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  aiAssistantButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  aiAssistantButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  secondaryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  favoriteActive: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  
  // Content Sections
  descriptionContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'right',
  },
  propertyDescription: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    textAlign: 'right',
  },
  
  // Specifications Styles
  specsContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 8,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  specItem: {
    width: '48%',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  specIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  specLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  specValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
  },
  
  // Amenities Styles
  amenitiesContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 8,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityItem: {
    width: '50%',
    paddingVertical: 4,
  },
  amenityText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'right',
  },
  
  // Location Styles
  locationContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 8,
  },
  locationAddress: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 16,
    textAlign: 'right',
  },
  distancesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  distanceItem: {
    width: '48%',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  distanceIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  distanceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  distanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  schoolsContainer: {
    marginTop: 8,
  },
  schoolsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'right',
  },
  schoolItem: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
    textAlign: 'right',
  },
  
  // Brokers Styles
  brokersContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 8,
  },
  brokerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  brokerInfo: {
    flex: 1,
  },
  brokerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'right',
  },
  brokerCompany: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'right',
  },
  brokerContact: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 2,
    textAlign: 'right',
  },
  contactButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Modal Styles
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fullScreenImageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  
  // Virtual Tour Modal Styles
  virtualTourContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  virtualTourHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  virtualTourTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeVirtualTourButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
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
    backgroundColor: '#ffffff',
  },
  webViewLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  
  bottomSpacer: {
    height: 20,
  },
  
  buttonSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});

export default PropertyDetailsScreen; 