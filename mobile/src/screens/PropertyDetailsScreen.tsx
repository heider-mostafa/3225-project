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
import ProfileService from '../services/ProfileService';

// Components
import BrokerCard from '../components/BrokerCard';
import BrokerBookingModal from '../components/BrokerBookingModal';
import MortgageCalculator from '../components/MortgageCalculator';
import SimilarProperties from '../components/SimilarProperties';

// Get screen dimensions for responsive design
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Enhanced Property interface with all details (matching web version)
interface PropertyDetails {
  id: string;
  title: string;
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_meters?: number;
  lot_size?: number;
  address: string;
  city: string;
  state?: string;
  zip_code?: string;
  neighborhood?: string;
  compound?: string;
  property_type: string;
  property_condition?: string;
  status: string;
  year_built?: number;
  furnished?: boolean;
  virtual_tour_url?: string;
  video_tour_url?: string;
  created_at?: string;
  updated_at?: string;
  view_count?: number;
  
  // Property specifications
  floor_level?: number;
  total_floors?: number;
  balconies?: number;
  parking_spaces?: number;
  
  // Financial information
  monthly_hoa_fee?: number;
  annual_property_tax?: number;
  insurance_cost?: number;
  
  // Distances (km)
  distance_to_metro?: number;
  distance_to_airport?: number;
  distance_to_mall?: number;
  distance_to_hospital?: number;
  
  // Infrastructure
  heating_type?: string;
  cooling_type?: string;
  water_source?: string;
  sewer_type?: string;
  internet_speed?: string;
  infrastructure_analysis?: any;
  
  // Availability
  available_date?: string;
  lease_terms?: string[];
  pet_policy?: string;
  
  // Photos
  property_photos?: Array<{
    id: string;
    url: string;
    is_primary: boolean;
    order_index: number;
    source?: string;
    appraisal_id?: string;
    original_category?: string;
    document_page?: number;
  }>;
  
  // Arrays
  amenities?: string[];
  features?: string[];
  key_features?: string[];
  nearest_schools?: Array<{
    name: string;
    type: string;
    distance: number;
  }>;
  
  // Location
  latitude?: number;
  longitude?: number;
  
  // Amenity Booleans
  has_pool?: boolean;
  has_garden?: boolean;
  has_security?: boolean;
  has_parking?: boolean;
  has_gym?: boolean;
  has_playground?: boolean;
  has_community_center?: boolean;
  has_elevator?: boolean;
  has_balcony?: boolean;
  has_terrace?: boolean;
  has_storage?: boolean;
  has_maid_room?: boolean;
  has_driver_room?: boolean;
  
  // Additional fields for compatibility
  nearbyServices?: Array<{
    name: string;
    type: string;
    distance: string;
  }>;
  yearBuilt?: string;
  agent?: {
    name: string;
    email: string;
    image: string;
  };
  tourId?: string;
  location?: string;
  images?: string[];
  
  // Appraiser data (matching web version)
  property_appraisals?: Array<{
    id: string;
    form_data?: any;
    calculation_results?: any;
    appraiser?: any;
    market_value_estimate?: number;
    appraisal_date?: string;
    status?: string;
  }>;
  appraisal_calculation_results?: any;
}

interface Broker {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company?: string;
  photo_url?: string;
  specialties?: string[];
  languages?: string[];
  rating?: number;
  total_reviews?: number;
  years_experience?: number;
  is_primary?: boolean;
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
  
  // Appraiser data state
  const [propertyAppraiser, setPropertyAppraiser] = useState<any>(null);
  const [appraisalData, setAppraisalData] = useState<any>(null);
  
  // Image gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageGallery, setShowImageGallery] = useState(false);
  
  // Virtual tour state
  const [showVirtualTour, setShowVirtualTour] = useState(false);
  
  // Broker booking state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  
  // Mortgage calculator state
  const [showMortgageCalculator, setShowMortgageCalculator] = useState(false);

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
        
        // Extract appraiser data if available (matching web version)
        if (response.data.property_appraisals && response.data.property_appraisals.length > 0) {
          const appraisal = response.data.property_appraisals[0]; // Get the first appraisal
          setAppraisalData(appraisal);
          if (appraisal.appraiser) {
            console.log('🔍 Appraiser data received:', appraisal.appraiser);
            setPropertyAppraiser(appraisal.appraiser);
          } else {
            setPropertyAppraiser(null);
          }
        } else {
          setAppraisalData(null);
          setPropertyAppraiser(null);
        }
        
        // Check if property is already saved
        const isSaved = await ProfileService.isPropertySaved(response.data.id);
        setIsFavorite(isSaved);
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
        // Map API broker data to component broker interface
        const mappedBrokers = response.data.map((broker: any) => ({
          id: broker.id,
          full_name: broker.name || broker.full_name || 'غير محدد',
          email: broker.email,
          phone: broker.phone,
          company: broker.company,
          photo_url: broker.avatar || broker.photo_url,
          specialties: broker.specialties || [],
          languages: broker.languages || ['العربية'],
          rating: broker.rating || 0,
          total_reviews: broker.total_reviews || 0,
          years_experience: broker.years_experience || 0,
          is_primary: broker.is_primary || false
        }));
        setBrokers(mappedBrokers);
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
      
      // Use ProfileService for save/unsave functionality
      const result = await ProfileService.toggleSaveProperty(property.id);
      
      if (result.success) {
        setIsFavorite(result.saved);
        const message = result.saved 
          ? 'تم إضافة العقار إلى المفضلة' 
          : 'تم إزالة العقار من المفضلة';
        Alert.alert('تم', message);
      } else {
        Alert.alert('خطأ', result.error || 'فشل في حفظ العقار في المفضلة');
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

  // Handle broker booking
  const handleScheduleShowing = (brokerId: string) => {
    const broker = brokers.find(b => b.id === brokerId);
    if (broker) {
      setSelectedBroker(broker);
      setShowBookingModal(true);
    }
  };

  // Open embedded mortgage calculator
  const handleCalculateMortgage = () => {
    setShowMortgageCalculator(true);
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

  // Handle appraiser booking
  const handleBookAppraiser = (appraiser: any) => {
    if (!appraiser) return;
    
    Alert.alert(
      'حجز تقييم عقاري',
      `هل تريد حجز تقييم مع ${appraiser.full_name}؟\n\nخبرة: ${appraiser.years_of_experience || 0}+ سنوات\nالتقييم: ${appraiser.average_rating || 0}/5`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'تواصل', 
          onPress: () => {
            // Open contact options for appraiser
            // Note: This uses direct contact (phone/email) as the full booking system is still in development
            const phone = appraiser.phone_number || appraiser.contact_phone;
            const email = appraiser.email || appraiser.contact_email;
            
            if (phone || email) {
              Alert.alert(
                'تواصل مع المقيم',
                'اختر طريقة التواصل:',
                [
                  ...(phone ? [{ 
                    text: `📞 ${phone}`,
                    onPress: () => Linking.openURL(`tel:${phone}`)
                  }] : []),
                  ...(email ? [{ 
                    text: `📧 ${email}`,
                    onPress: () => Linking.openURL(`mailto:${email}?subject=استفسار عن تقييم العقار`)
                  }] : []),
                  { text: 'إلغاء', style: 'cancel' }
                ]
              );
            } else {
              Alert.alert(
                'معلومات التواصل',
                'لا توجد معلومات تواصل متاحة للمقيم. يرجى المحاولة لاحقاً أو التواصل مع فريق الدعم.'
              );
            }
          }
        }
      ]
    );
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

  // Enhanced Property Specifications Component
  const PropertySpecs: React.FC = () => {
    if (!property) return null;

    // Basic specs
    const basicSpecs = [
      { icon: '🛏️', label: 'غرف النوم', value: property.bedrooms },
      { icon: '🚿', label: 'الحمامات', value: property.bathrooms },
      { icon: '📐', label: 'المساحة', value: `${property.square_meters || 0}م²` },
      { icon: '🏗️', label: 'سنة البناء', value: property.year_built || 'غير محدد' },
    ];

    // Enhanced specs from web version
    const enhancedSpecs = [
      ...(property.floor_level ? [{ icon: '🏢', label: 'الطابق', value: `${property.floor_level}${property.total_floors ? ` من ${property.total_floors}` : ''}` }] : []),
      ...(property.balconies ? [{ icon: '🌅', label: 'البلكونات', value: property.balconies }] : []),
      ...(property.parking_spaces ? [{ icon: '🚗', label: 'مواقف السيارات', value: property.parking_spaces }] : []),
      ...(property.furnished !== undefined ? [{ icon: '🪑', label: 'مفروش', value: property.furnished ? 'نعم' : 'لا' }] : []),
    ];

    // Financial information
    const financialSpecs = [
      ...(property.monthly_hoa_fee ? [{ icon: '💰', label: 'رسوم الصيانة الشهرية', value: `${property.monthly_hoa_fee.toLocaleString()} جنيه` }] : []),
      ...(property.annual_property_tax ? [{ icon: '📋', label: 'الضرائب السنوية', value: `${property.annual_property_tax.toLocaleString()} جنيه` }] : []),
      ...(property.insurance_cost ? [{ icon: '🛡️', label: 'تأمين العقار', value: `${property.insurance_cost.toLocaleString()} جنيه` }] : []),
    ];

    // Infrastructure specs
    const infrastructureSpecs = [
      ...(property.heating_type ? [{ icon: '🔥', label: 'نوع التدفئة', value: property.heating_type }] : []),
      ...(property.cooling_type ? [{ icon: '❄️', label: 'نوع التبريد', value: property.cooling_type }] : []),
      ...(property.water_source ? [{ icon: '💧', label: 'مصدر المياه', value: property.water_source }] : []),
      ...(property.internet_speed ? [{ icon: '📡', label: 'سرعة الإنترنت', value: property.internet_speed }] : []),
    ];

    // Boolean amenities as specs
    const booleanAmineties = [
      ...(property.has_elevator !== undefined ? [{ icon: '🛗', label: 'مصعد', value: property.has_elevator ? 'متوفر' : 'غير متوفر' }] : []),
      ...(property.has_pool !== undefined ? [{ icon: '🏊', label: 'حمام سباحة', value: property.has_pool ? 'متوفر' : 'غير متوفر' }] : []),
      ...(property.has_garden !== undefined ? [{ icon: '🌺', label: 'حديقة', value: property.has_garden ? 'متوفر' : 'غير متوفر' }] : []),
      ...(property.has_security !== undefined ? [{ icon: '🔒', label: 'أمن', value: property.has_security ? 'متوفر' : 'غير متوفر' }] : []),
      ...(property.has_gym !== undefined ? [{ icon: '💪', label: 'صالة رياضية', value: property.has_gym ? 'متوفر' : 'غير متوفر' }] : []),
      ...(property.has_playground !== undefined ? [{ icon: '🎪', label: 'ملعب أطفال', value: property.has_playground ? 'متوفر' : 'غير متوفر' }] : []),
      ...(property.has_storage !== undefined ? [{ icon: '📦', label: 'مخزن', value: property.has_storage ? 'متوفر' : 'غير متوفر' }] : []),
      ...(property.has_maid_room !== undefined ? [{ icon: '🧹', label: 'غرفة خادمة', value: property.has_maid_room ? 'متوفر' : 'غير متوفر' }] : []),
      ...(property.has_driver_room !== undefined ? [{ icon: '🚗', label: 'غرفة سائق', value: property.has_driver_room ? 'متوفر' : 'غير متوفر' }] : []),
    ];

    const allSpecs = [...basicSpecs, ...enhancedSpecs];
    const allFinancialSpecs = financialSpecs;
    const allInfrastructureSpecs = infrastructureSpecs;
    const allBooleanSpecs = booleanAmineties;

    return (
      <View style={styles.specsContainer}>
        {/* Basic Specifications */}
        <Text style={styles.sectionTitle}>مواصفات العقار</Text>
        <View style={styles.specsGrid}>
          {allSpecs.map((spec, index) => (
            <View key={`basic-${index}`} style={styles.specItem}>
              <Text style={styles.specIcon}>{spec.icon}</Text>
              <Text style={styles.specLabel}>{spec.label}</Text>
              <Text style={styles.specValue}>{spec.value}</Text>
            </View>
          ))}
        </View>

        {/* Financial Information */}
        {allFinancialSpecs.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>💰 المعلومات المالية</Text>
            <View style={styles.specsGrid}>
              {allFinancialSpecs.map((spec, index) => (
                <View key={`financial-${index}`} style={styles.specItem}>
                  <Text style={styles.specIcon}>{spec.icon}</Text>
                  <Text style={styles.specLabel}>{spec.label}</Text>
                  <Text style={styles.specValue}>{spec.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Infrastructure */}
        {allInfrastructureSpecs.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>🏗️ البنية التحتية</Text>
            <View style={styles.specsGrid}>
              {allInfrastructureSpecs.map((spec, index) => (
                <View key={`infrastructure-${index}`} style={styles.specItem}>
                  <Text style={styles.specIcon}>{spec.icon}</Text>
                  <Text style={styles.specLabel}>{spec.label}</Text>
                  <Text style={styles.specValue}>{spec.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Boolean Amenities */}
        {allBooleanSpecs.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>🏠 المرافق والخدمات</Text>
            <View style={styles.specsGrid}>
              {allBooleanSpecs.map((spec, index) => (
                <View key={`boolean-${index}`} style={styles.specItem}>
                  <Text style={styles.specIcon}>{spec.icon}</Text>
                  <Text style={styles.specLabel}>{spec.label}</Text>
                  <Text style={[styles.specValue, { 
                    color: spec.value === 'متوفر' ? '#059669' : '#dc2626'
                  }]}>{spec.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}
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
          <BrokerCard
            key={broker.id}
            broker={broker}
            onScheduleShowing={handleScheduleShowing}
            propertyId={propertyId}
          />
        ))}
      </View>
    );
  };

  // Professional Appraiser Component
  const AppraiserSection: React.FC = () => {
    return (
      <View style={styles.appraiserContainer}>
        <Text style={styles.sectionTitle}>🏗️ المقيم العقاري المحترف</Text>
        
        {propertyAppraiser ? (
          <TouchableOpacity 
            style={styles.appraiserCard}
            onPress={() => handleBookAppraiser(propertyAppraiser)}
            activeOpacity={0.7}
          >
            <View style={styles.appraiserHeader}>
              <Image
                source={{ 
                  uri: propertyAppraiser.professional_headshot_url || 
                       'https://via.placeholder.com/60x60.png?text=👨‍💼' 
                }}
                style={styles.appraiserImage}
                defaultSource={{ uri: 'https://via.placeholder.com/60x60.png?text=👨‍💼' }}
              />
              <View style={styles.appraiserInfo}>
                <View style={styles.appraiserNameRow}>
                  <Text style={styles.appraiserName}>{propertyAppraiser.full_name}</Text>
                  {propertyAppraiser.valify_status === 'verified' && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✓ موثق</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.appraiserTitle}>مقيم عقاري مرخص</Text>
                {propertyAppraiser.average_rating && (
                  <View style={styles.appraiserRating}>
                    <Text style={styles.ratingText}>
                      ⭐ {propertyAppraiser.average_rating.toFixed(1)} ({propertyAppraiser.total_reviews || 0} تقييم)
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Appraiser Details */}
            <View style={styles.appraiserDetails}>
              {propertyAppraiser.years_of_experience && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>الخبرة:</Text>
                  <Text style={styles.detailValue}>{propertyAppraiser.years_of_experience}+ سنوات</Text>
                </View>
              )}
              
              {propertyAppraiser.property_specialties && propertyAppraiser.property_specialties.length > 0 && (
                <View style={styles.specialtiesContainer}>
                  <Text style={styles.detailLabel}>التخصصات:</Text>
                  <View style={styles.specialtiesRow}>
                    {propertyAppraiser.property_specialties.slice(0, 2).map((specialty: string, index: number) => (
                      <View key={index} style={styles.specialtyTag}>
                        <Text style={styles.specialtyText}>{specialty.replace('_', ' ')}</Text>
                      </View>
                    ))}
                    {propertyAppraiser.property_specialties.length > 2 && (
                      <View style={styles.specialtyTag}>
                        <Text style={styles.specialtyText}>+{propertyAppraiser.property_specialties.length - 2} أخرى</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {propertyAppraiser.service_areas && propertyAppraiser.service_areas.length > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>مناطق الخدمة:</Text>
                  <Text style={styles.detailValue}>{propertyAppraiser.service_areas.join(', ')}</Text>
                </View>
              )}
            </View>

            {/* Appraisal Data */}
            {appraisalData && (
              <View style={styles.appraisalData}>
                <Text style={styles.appraisalDataTitle}>بيانات التقييم:</Text>
                
                {appraisalData.market_value_estimate && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>القيمة السوقية:</Text>
                    <Text style={styles.marketValue}>
                      {new Intl.NumberFormat('ar-EG', {
                        style: 'currency',
                        currency: 'EGP',
                        minimumFractionDigits: 0
                      }).format(appraisalData.market_value_estimate)}
                    </Text>
                  </View>
                )}
                
                {appraisalData.appraisal_date && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>تاريخ التقييم:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(appraisalData.appraisal_date).toLocaleDateString('ar-EG')}
                    </Text>
                  </View>
                )}
                
                {appraisalData.status && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>الحالة:</Text>
                    <View style={[
                      styles.statusBadge,
                      appraisalData.status === 'completed' ? styles.completedStatus : styles.pendingStatus
                    ]}>
                      <Text style={styles.statusText}>{appraisalData.status}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Book Appraiser Button */}
            <View style={styles.bookAppraiserButtonContainer}>
              <View style={styles.bookAppraiserButton}>
                <Text style={styles.bookAppraiserButtonText}>📅 حجز تقييم عقاري</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.noAppraiserContainer}>
            <Text style={styles.noAppraiserIcon}>🏗️</Text>
            <Text style={styles.noAppraiserTitle}>لا يوجد مقيم مخصص</Text>
            <Text style={styles.noAppraiserSubtitle}>تواصل معنا لترتيب تقييم عقاري</Text>
          </View>
        )}
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

        {/* Appraiser Section */}
        <AppraiserSection />

        {/* Brokers */}
        <BrokersSection />

        {/* Similar Properties */}
        <SimilarProperties currentProperty={property} />

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

      {/* Broker Booking Modal */}
      <BrokerBookingModal
        visible={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        broker={selectedBroker}
        propertyId={propertyId}
        propertyTitle={property?.title || ''}
      />

      {/* Mortgage Calculator Modal */}
      <MortgageCalculator
        visible={showMortgageCalculator}
        onClose={() => setShowMortgageCalculator(false)}
        initialPropertyPrice={property?.price}
      />
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
  
  // Appraiser Section Styles
  appraiserContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 8,
  },
  appraiserCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  appraiserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  appraiserImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  appraiserInfo: {
    flex: 1,
  },
  appraiserNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  appraiserName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'right',
    flex: 1,
  },
  verifiedBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  verifiedText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  appraiserTitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 4,
  },
  appraiserRating: {
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#f59e0b',
    textAlign: 'right',
  },
  appraiserDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'right',
  },
  specialtiesContainer: {
    marginBottom: 8,
  },
  specialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  specialtyTag: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 4,
    marginBottom: 4,
  },
  specialtyText: {
    fontSize: 10,
    color: '#3730a3',
    fontWeight: '500',
  },
  appraisalData: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 16,
  },
  appraisalDataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'right',
  },
  marketValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedStatus: {
    backgroundColor: '#dcfce7',
  },
  pendingStatus: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  bookAppraiserButtonContainer: {
    marginTop: 8,
  },
  bookAppraiserButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookAppraiserButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noAppraiserContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noAppraiserIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noAppraiserTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  noAppraiserSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default PropertyDetailsScreen; 