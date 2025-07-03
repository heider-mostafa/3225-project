import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { apiClient } from '../config/api';
import { RootStackParamList } from '../navigation/AppNavigator';

// Get screen dimensions for responsive design
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Egyptian Area interfaces
interface EgyptianArea {
  id: string;
  name: string;
  arabicName: string;
  properties: number;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  image: string;
  description: string;
  amenities: string[];
  transportation: {
    metro: boolean;
    airport: number; // distance in km
    highway: boolean;
  };
  schools: Array<{
    name: string;
    type: string;
    distance: number;
  }>;
  landmarks: string[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
  statistics: {
    growth: number; // percentage
    demand: 'high' | 'medium' | 'low';
    pricetrend: 'up' | 'stable' | 'down';
  };
}

interface AreaStats {
  totalProperties: number;
  averagePrice: number;
  mostPopularType: string;
  priceGrowth: number;
}

// Area categories for filtering
const AREA_CATEGORIES = [
  { id: 'all', name: 'جميع المناطق', nameEn: 'All Areas' },
  { id: 'new_developments', name: 'التطويرات الجديدة', nameEn: 'New Developments' },
  { id: 'luxury', name: 'المناطق الراقية', nameEn: 'Luxury Areas' },
  { id: 'affordable', name: 'المناطق الاقتصادية', nameEn: 'Affordable Areas' },
  { id: 'compounds', name: 'المجمعات السكنية', nameEn: 'Residential Compounds' },
  { id: 'coastal', name: 'المناطق الساحلية', nameEn: 'Coastal Areas' },
];

const AreasScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // State management
  const [areas, setAreas] = useState<EgyptianArea[]>([]);
  const [filteredAreas, setFilteredAreas] = useState<EgyptianArea[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [areaStats, setAreaStats] = useState<AreaStats | null>(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<EgyptianArea | null>(null);
  
  // Comparison state
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparisonAreas, setComparisonAreas] = useState<EgyptianArea[]>([]);

  // Load data on component mount
  useEffect(() => {
    loadAreasData();
  }, []);

  // Filter areas when category changes
  useEffect(() => {
    filterAreasByCategory();
  }, [selectedCategory, areas]);

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

  // Load areas data using existing API
  const loadAreasData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get properties from existing API to calculate area statistics
      const response = await apiClient.getProperties({ limit: 100 });
      
      if (response.success && response.data) {
        const properties = response.data;
        
        // Process properties to create area statistics
        const areaData = generateAreaData(properties);
        setAreas(areaData);
        
        // Calculate overall statistics
        const stats = calculateAreaStats(properties);
        setAreaStats(stats);
        
        console.log(`✅ Loaded ${areaData.length} Egyptian areas with statistics`);
      } else {
        setError(response.error || 'فشل في تحميل بيانات المناطق');
      }
    } catch (error: any) {
      console.error('❌ Error loading areas data:', error);
      setError(error.message || 'حدث خطأ أثناء تحميل المناطق');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate comprehensive area data from properties
  const generateAreaData = (properties: any[]): EgyptianArea[] => {
    const areaMap = new Map();

    // Process each property to build area statistics
    properties.forEach(property => {
      const cityKey = property.city;
      if (!areaMap.has(cityKey)) {
        areaMap.set(cityKey, {
          properties: [],
          totalPrice: 0,
          priceList: [],
        });
      }
      
      const areaInfo = areaMap.get(cityKey);
      areaInfo.properties.push(property);
      areaInfo.totalPrice += property.price;
      areaInfo.priceList.push(property.price);
    });

    // Convert to structured area data
    const egyptianAreasData: EgyptianArea[] = Array.from(areaMap.entries()).map(([cityName, data]: [string, any]) => {
      const averagePrice = data.totalPrice / data.properties.length;
      const sortedPrices = data.priceList.sort((a: number, b: number) => a - b);
      const minPrice = sortedPrices[0];
      const maxPrice = sortedPrices[sortedPrices.length - 1];

      // Get area-specific data
      const areaInfo = getAreaInfo(cityName);
      
      return {
        id: cityName.toLowerCase().replace(/\s+/g, '_'),
        name: cityName,
        arabicName: areaInfo.arabicName,
        properties: data.properties.length,
        averagePrice,
        priceRange: { min: minPrice, max: maxPrice },
        image: areaInfo.image,
        description: areaInfo.description,
        amenities: areaInfo.amenities,
        transportation: areaInfo.transportation,
        schools: areaInfo.schools,
        landmarks: areaInfo.landmarks,
        coordinates: areaInfo.coordinates,
        statistics: areaInfo.statistics,
      };
    });

    return egyptianAreasData.sort((a, b) => b.properties - a.properties);
  };

  // Get detailed information for each area
  const getAreaInfo = (cityName: string) => {
    const areaInfoMap: { [key: string]: any } = {
      'New Cairo': {
        arabicName: 'القاهرة الجديدة',
        image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
        description: 'منطقة حديثة مخططة تضم أرقى المجمعات السكنية والجامعات العالمية',
        amenities: ['مراكز تسوق', 'مدارس دولية', 'نوادي رياضية', 'حدائق', 'مستشفيات خاصة'],
        transportation: { metro: false, airport: 45, highway: true },
        schools: [
          { name: 'الجامعة الأمريكية', type: 'جامعة', distance: 2 },
          { name: 'مدرسة نيو كايرو البريطانية', type: 'مدرسة دولية', distance: 1.5 }
        ],
        landmarks: ['التجمع الخامس', 'مدينتي', 'الرحاب', 'القاهرة الجديدة'],
        coordinates: { latitude: 30.0330, longitude: 31.4913 },
        statistics: { growth: 15, demand: 'high', pricetrend: 'up' }
      },
      'Sheikh Zayed': {
        arabicName: 'الشيخ زايد',
        image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
        description: 'مدينة متكاملة تجمع بين الرقي والحداثة مع أفضل المرافق والخدمات',
        amenities: ['أليجريا جولف', 'بيفرلي هيلز', 'مول مصر', 'أركان مول', 'حدائق الأهرام'],
        transportation: { metro: false, airport: 60, highway: true },
        schools: [
          { name: 'مدرسة الشويفات الدولية', type: 'مدرسة دولية', distance: 2 },
          { name: 'الأكاديمية البريطانية', type: 'مدرسة دولية', distance: 3 }
        ],
        landmarks: ['أليجريا', 'بيفرلي هيلز', 'كومباوند الخمائل', 'دريم لاند'],
        coordinates: { latitude: 30.0771, longitude: 30.9876 },
        statistics: { growth: 12, demand: 'high', pricetrend: 'up' }
      },
      'Zamalek': {
        arabicName: 'الزمالك',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
        description: 'قلب القاهرة النابض، جزيرة الهدوء والثقافة على ضفاف النيل',
        amenities: ['إطلالات النيل', 'نادي الجزيرة', 'دار الأوبرا', 'مطاعم راقية', 'مقاهي تراثية'],
        transportation: { metro: true, airport: 25, highway: false },
        schools: [
          { name: 'مدرسة الزمالك للغات', type: 'مدرسة لغات', distance: 0.5 },
          { name: 'كلية القاهرة للفنون الجميلة', type: 'كلية', distance: 1 }
        ],
        landmarks: ['برج القاهرة', 'نادي الجزيرة', 'دار الأوبرا المصرية'],
        coordinates: { latitude: 30.0647, longitude: 31.2221 },
        statistics: { growth: 8, demand: 'high', pricetrend: 'stable' }
      },
      'Maadi': {
        arabicName: 'المعادي',
        image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
        description: 'الحي الهادئ المفضل للعائلات والمجتمع الدولي في القاهرة',
        amenities: ['شوارع مشجرة', 'مدارس دولية', 'نادي المعادي', 'كورنيش النيل', 'مترو الأنفاق'],
        transportation: { metro: true, airport: 35, highway: false },
        schools: [
          { name: 'مدرسة المعادي البريطانية', type: 'مدرسة دولية', distance: 1 },
          { name: 'الجامعة الكندية', type: 'جامعة', distance: 2 }
        ],
        landmarks: ['كورنيش المعادي', 'محطة مترو المعادي', 'نادي المعادي الرياضي'],
        coordinates: { latitude: 29.9596, longitude: 31.2548 },
        statistics: { growth: 10, demand: 'medium', pricetrend: 'stable' }
      },
      'Heliopolis': {
        arabicName: 'مصر الجديدة',
        image: 'https://images.unsplash.com/photo-1590642916589-592bca10dfbf?w=800&q=80',
        description: 'المنطقة التاريخية الراقية قريباً من المطار ومعالم القاهرة',
        amenities: ['قصر البارون', 'مطار القاهرة', 'مستشفى الماظة', 'شارع العروبة', 'النادي الأهلي'],
        transportation: { metro: true, airport: 15, highway: true },
        schools: [
          { name: 'مدرسة الليسيه الفرنسية', type: 'مدرسة دولية', distance: 2 },
          { name: 'جامعة عين شمس', type: 'جامعة', distance: 3 }
        ],
        landmarks: ['قصر البارون إمبان', 'مطار القاهرة الدولي', 'النادي الأهلي'],
        coordinates: { latitude: 30.0880, longitude: 31.3242 },
        statistics: { growth: 6, demand: 'medium', pricetrend: 'stable' }
      },
      'Giza': {
        arabicName: 'الجيزة',
        image: 'https://images.unsplash.com/photo-1589484488681-abf81c07c527?w=800&q=80',
        description: 'موطن الأهرامات وأبو الهول، منطقة تجمع التاريخ والحداثة',
        amenities: ['أهرامات الجيزة', 'جامعة القاهرة', 'حديقة الحيوان', 'الأوبرا الجديدة'],
        transportation: { metro: true, airport: 40, highway: true },
        schools: [
          { name: 'جامعة القاهرة', type: 'جامعة', distance: 1 },
          { name: 'مدرسة الجيزة الأمريكية', type: 'مدرسة دولية', distance: 2 }
        ],
        landmarks: ['الأهرامات', 'أبو الهول', 'جامعة القاهرة'],
        coordinates: { latitude: 30.0131, longitude: 31.2089 },
        statistics: { growth: 5, demand: 'medium', pricetrend: 'stable' }
      },
      'Alexandria': {
        arabicName: 'الإسكندرية',
        image: 'https://images.unsplash.com/photo-1544413164-bb392a88da67?w=800&q=80',
        description: 'عروس البحر المتوسط، المدينة الساحلية الجميلة بتاريخها العريق',
        amenities: ['شواطئ متوسطية', 'مكتبة الإسكندرية', 'قلعة قايتباي', 'كورنيش الإسكندرية'],
        transportation: { metro: false, airport: 50, highway: true },
        schools: [
          { name: 'جامعة الإسكندرية', type: 'جامعة', distance: 2 },
          { name: 'مدرسة الإسكندرية الدولية', type: 'مدرسة دولية', distance: 3 }
        ],
        landmarks: ['قلعة قايتباي', 'مكتبة الإسكندرية', 'عمود السواري'],
        coordinates: { latitude: 31.2001, longitude: 29.9187 },
        statistics: { growth: 7, demand: 'medium', pricetrend: 'stable' }
      }
    };

    return areaInfoMap[cityName] || {
      arabicName: cityName,
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      description: `منطقة مميزة في ${cityName}`,
      amenities: ['مرافق حديثة', 'موقع متميز'],
      transportation: { metro: false, airport: 30, highway: true },
      schools: [{ name: 'مدارس محلية', type: 'عامة', distance: 2 }],
      landmarks: [cityName],
      coordinates: { latitude: 30.0, longitude: 31.0 },
      statistics: { growth: 5, demand: 'medium', pricetrend: 'stable' }
    };
  };

  // Calculate comprehensive area statistics from property data
  const calculateAreaStats = (properties: any[]): AreaStats => {
    const totalProperties = properties.length;
    const totalPrice = properties.reduce((sum: number, p: any) => sum + p.price, 0);
    const averagePrice = totalProperties > 0 ? totalPrice / totalProperties : 0;
    
    // Calculate most popular property type
    const typeCount: Record<string, number> = {};
    properties.forEach(p => {
      typeCount[p.property_type] = (typeCount[p.property_type] || 0) + 1;
    });
    const mostPopularType = Object.entries(typeCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Apartment';
    
    // Calculate realistic price growth based on market factors
    const priceGrowth = calculatePriceGrowth(properties, averagePrice);
    
    return {
      totalProperties,
      averagePrice,
      mostPopularType,
      priceGrowth,
    };
  };

  // Calculate realistic price growth percentage
  const calculatePriceGrowth = (properties: any[], averagePrice: number): number => {
    // Base growth on Egyptian real estate market factors
    let growthPercentage = 5.0; // Base growth rate for Egyptian market
    
    // Premium areas tend to have higher growth
    const premiumAreas = ['New Cairo', 'Sheikh Zayed', 'Zamalek', 'Maadi'];
    const hasPremiumProperties = properties.some(p => premiumAreas.includes(p.city));
    if (hasPremiumProperties) {
      growthPercentage += 3.0;
    }
    
    // High-value properties indicate stronger market
    const highValueCount = properties.filter(p => p.price >= 3000000).length;
    const highValueRatio = highValueCount / properties.length;
    growthPercentage += (highValueRatio * 4.0); // Up to 4% additional growth
    
    // Property type diversity indicates healthy market
    const uniqueTypes = new Set(properties.map(p => p.property_type)).size;
    if (uniqueTypes >= 4) {
      growthPercentage += 1.5; // Diverse market bonus
    }
    
    // Properties with virtual tours indicate modern market
    const virtualTourCount = properties.filter(p => p.virtual_tour_url).length;
    const virtualTourRatio = virtualTourCount / properties.length;
    growthPercentage += (virtualTourRatio * 2.0); // Up to 2% for modern features
    
    // Cap the growth rate realistically (3% to 15% range)
    return Math.round(Math.max(3.0, Math.min(15.0, growthPercentage)) * 10) / 10;
  };

  // Filter areas by category
  const filterAreasByCategory = () => {
    let filtered = areas;

    switch (selectedCategory) {
      case 'new_developments':
        filtered = areas.filter(area => 
          ['New Cairo', 'Sheikh Zayed'].includes(area.name)
        );
        break;
      case 'luxury':
        filtered = areas.filter(area => 
          area.averagePrice > 5000000
        );
        break;
      case 'affordable':
        filtered = areas.filter(area => 
          area.averagePrice <= 3000000
        );
        break;
      case 'compounds':
        filtered = areas.filter(area => 
          ['New Cairo', 'Sheikh Zayed', '6th of October'].includes(area.name)
        );
        break;
      case 'coastal':
        filtered = areas.filter(area => 
          ['Alexandria', 'New Alamein'].includes(area.name)
        );
        break;
      default:
        filtered = areas;
    }

    setFilteredAreas(filtered);
  };

  // Navigate to properties in area
  const navigateToAreaProperties = (areaName: string) => {
    navigation.navigate('Properties', { city: areaName });
  };

  // Enhanced area comparison system
  const toggleAreaForComparison = (area: EgyptianArea) => {
    if (comparisonAreas.find(a => a.id === area.id)) {
      // Remove from comparison
      setComparisonAreas(comparisonAreas.filter(a => a.id !== area.id));
    } else if (comparisonAreas.length < 3) {
      // Add to comparison (max 3 areas)
      setComparisonAreas([...comparisonAreas, area]);
    } else {
      Alert.alert('حد أقصى للمقارنة', 'يمكنك مقارنة 3 مناطق كحد أقصى');
    }
  };

  const showAreaComparisonModal = () => {
    if (comparisonAreas.length < 2) {
      Alert.alert('اختر مناطق للمقارنة', 'يجب اختيار منطقتين على الأقل للمقارنة');
      return;
    }
    setShowComparisonModal(true);
  };

  const clearComparison = () => {
    setComparisonAreas([]);
    setShowComparisonModal(false);
  };

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAreasData();
    setIsRefreshing(false);
  };

  // Get demand color
  const getDemandColor = (demand: string): string => {
    switch (demand) {
      case 'high': return '#059669';
      case 'medium': return '#f59e0b';
      case 'low': return '#6b7280';
      default: return '#6b7280';
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  // Render area item
  const renderArea = ({ item: area }: { item: EgyptianArea }) => {
    const isSelected = comparisonAreas.find(a => a.id === area.id);
    
    return (
      <TouchableOpacity
        style={[styles.areaCard, isSelected && styles.areaCardSelected]}
        onPress={() => navigateToAreaProperties(area.name)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: area.image }}
          style={styles.areaImage}
          defaultSource={{ uri: 'https://via.placeholder.com/300x200' }}
        />
        
        <View style={styles.areaOverlay}>
          <View style={styles.areaStats}>
            <Text style={styles.areaStatText}>{area.properties} عقار</Text>
            <Text style={styles.areaStatText}>{area.statistics.growth}% نمو</Text>
          </View>
          
          {/* Comparison Toggle Button */}
          <TouchableOpacity
            style={[styles.comparisonButton, isSelected && styles.comparisonButtonSelected]}
            onPress={() => toggleAreaForComparison(area)}
          >
            <Text style={[styles.comparisonButtonText, isSelected && styles.comparisonButtonTextSelected]}>
              {isSelected ? '✓' : '+'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.areaContent}>
          <View style={styles.areaHeader}>
            <Text style={styles.areaName}>{area.name}</Text>
            <Text style={styles.areaNameArabic}>{area.arabicName}</Text>
          </View>
          
          <Text style={styles.areaDescription} numberOfLines={2}>
            {area.description}
          </Text>
          
          <View style={styles.areaPriceInfo}>
            <Text style={styles.averagePrice}>
              متوسط السعر: {formatEGP(area.averagePrice)}
            </Text>
            <Text style={styles.priceRange}>
              {formatEGP(area.priceRange.min)} - {formatEGP(area.priceRange.max)}
            </Text>
          </View>
          
          <View style={styles.areaIndicators}>
            <View style={[styles.demandIndicator, { backgroundColor: getDemandColor(area.statistics.demand) }]}>
              <Text style={styles.indicatorText}>
                الطلب: {area.statistics.demand === 'high' ? 'عالي' : area.statistics.demand === 'medium' ? 'متوسط' : 'منخفض'}
              </Text>
            </View>
            <View style={styles.trendIndicator}>
              <Text style={styles.trendText}>
                {getTrendIcon(area.statistics.pricetrend)} الاتجاه
              </Text>
            </View>
          </View>
          
          <View style={styles.areaFeatures}>
            <Text style={styles.featuresTitle}>المميزات:</Text>
            <View style={styles.featuresContainer}>
              {area.amenities.slice(0, 3).map((amenity, index) => (
                <Text key={index} style={styles.featureItem}>• {amenity}</Text>
              ))}
            </View>
          </View>
          
          <View style={styles.transportationInfo}>
            <Text style={styles.transportationText}>
              🚇 {area.transportation.metro ? 'متوفر' : 'غير متوفر'} | 
              ✈️ {area.transportation.airport} كم | 
              🛣️ {area.transportation.highway ? 'طرق سريعة' : 'طرق عادية'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render category filter
  const renderCategoryFilter = ({ item }: { item: typeof AREA_CATEGORIES[0] }) => (
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

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>جاري تحميل المناطق المصرية...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAreasData}>
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
          <Text style={styles.headerTitle}>🏛️ المناطق المصرية</Text>
          <Text style={styles.headerSubtitle}>
            اكتشف أفضل المناطق السكنية في مصر
          </Text>
        </View>

        {/* Statistics Overview */}
        {areaStats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>📊 إحصائيات عامة</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{areaStats.totalProperties}</Text>
                <Text style={styles.statLabel}>إجمالي العقارات</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{formatEGP(areaStats.averagePrice)}</Text>
                <Text style={styles.statLabel}>متوسط الأسعار</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{areaStats.priceGrowth}%</Text>
                <Text style={styles.statLabel}>نمو الأسعار</Text>
              </View>
            </View>
          </View>
        )}

        {/* Category Filters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 تصفية المناطق</Text>
          <FlatList
            data={AREA_CATEGORIES}
            renderItem={renderCategoryFilter}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Areas Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🏘️ جميع المناطق ({filteredAreas.length})
          </Text>
          
          {filteredAreas.length > 0 ? (
            <FlatList
              data={filteredAreas}
              renderItem={renderArea}
              keyExtractor={(item) => item.id}
              numColumns={1}
              contentContainerStyle={styles.areasList}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                لا توجد مناطق في هذه الفئة
              </Text>
              <TouchableOpacity
                style={styles.resetFilterButton}
                onPress={() => setSelectedCategory('all')}
              >
                <Text style={styles.resetFilterText}>عرض جميع المناطق</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Spacer for bottom navigation */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
      
      {/* Floating Comparison Bar */}
      {comparisonAreas.length > 0 && (
        <View style={styles.comparisonBar}>
          <View style={styles.comparisonInfo}>
            <Text style={styles.comparisonCount}>
              {comparisonAreas.length} مناطق محددة للمقارنة
            </Text>
            <Text style={styles.comparisonHint}>
              {comparisonAreas.length >= 2 ? 'اضغط للمقارنة' : 'اختر منطقة أخرى'}
            </Text>
          </View>
          <View style={styles.comparisonActions}>
            <TouchableOpacity
              style={[styles.comparisonActionButton, { backgroundColor: '#ef4444' }]}
              onPress={clearComparison}
            >
              <Text style={styles.comparisonActionText}>مسح</Text>
            </TouchableOpacity>
            {comparisonAreas.length >= 2 && (
              <TouchableOpacity
                style={[styles.comparisonActionButton, { backgroundColor: '#2563eb' }]}
                onPress={showAreaComparisonModal}
              >
                <Text style={styles.comparisonActionText}>مقارنة</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Area Comparison Modal */}
      <Modal
        visible={showComparisonModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>مقارنة المناطق</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowComparisonModal(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.comparisonGrid}>
              {comparisonAreas.map((area, index) => (
                <View key={area.id} style={styles.comparisonColumn}>
                  <Text style={styles.comparisonAreaName}>{area.name}</Text>
                  <Text style={styles.comparisonAreaNameAr}>{area.arabicName}</Text>
                  
                  <View style={styles.comparisonSection}>
                    <Text style={styles.comparisonSectionTitle}>📊 الإحصائيات</Text>
                    <Text style={styles.comparisonItem}>العقارات: {area.properties}</Text>
                    <Text style={styles.comparisonItem}>متوسط السعر: {formatEGP(area.averagePrice)}</Text>
                    <Text style={styles.comparisonItem}>النمو: {area.statistics.growth}%</Text>
                    <Text style={styles.comparisonItem}>الطلب: {area.statistics.demand === 'high' ? 'عالي' : area.statistics.demand === 'medium' ? 'متوسط' : 'منخفض'}</Text>
                  </View>
                  
                  <View style={styles.comparisonSection}>
                    <Text style={styles.comparisonSectionTitle}>🚇 المواصلات</Text>
                    <Text style={styles.comparisonItem}>المترو: {area.transportation.metro ? 'متوفر' : 'غير متوفر'}</Text>
                    <Text style={styles.comparisonItem}>المطار: {area.transportation.airport} كم</Text>
                    <Text style={styles.comparisonItem}>الطرق السريعة: {area.transportation.highway ? 'متوفر' : 'غير متوفر'}</Text>
                  </View>
                  
                  <View style={styles.comparisonSection}>
                    <Text style={styles.comparisonSectionTitle}>🏢 المرافق</Text>
                    {area.amenities.slice(0, 4).map((amenity, i) => (
                      <Text key={i} style={styles.comparisonItem}>• {amenity}</Text>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
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
  
  // Statistics Section
  statsSection: {
    backgroundColor: '#ffffff',
    marginBottom: 8,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
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
  
  // Areas List
  areasList: {
    paddingHorizontal: 20,
  },
  areaCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  areaCardSelected: {
    borderColor: '#2563eb',
    borderWidth: 2,
  },
  areaImage: {
    height: 200,
    width: '100%',
    backgroundColor: '#f3f4f6',
  },
  areaOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    left: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  areaStats: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  areaStatText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  areaContent: {
    padding: 16,
  },
  areaHeader: {
    marginBottom: 8,
  },
  areaName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'right',
  },
  areaNameArabic: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 2,
  },
  areaDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 12,
    lineHeight: 20,
  },
  areaPriceInfo: {
    marginBottom: 12,
  },
  averagePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    textAlign: 'right',
  },
  priceRange: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 2,
  },
  areaIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  demandIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  indicatorText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  trendIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  trendText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  areaFeatures: {
    marginBottom: 12,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'right',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureItem: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 12,
    marginBottom: 2,
  },
  transportationInfo: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
  },
  transportationText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
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
  
  bottomSpacer: {
    height: 20,
  },
  
  // Comparison Toggle Button
  comparisonButton: {
    backgroundColor: '#f8fafc',
    padding: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  comparisonButtonSelected: {
    backgroundColor: '#2563eb',
  },
  comparisonButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  comparisonButtonTextSelected: {
    color: '#ffffff',
  },
  
  // Floating Comparison Bar
  comparisonBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comparisonInfo: {
    flex: 1,
  },
  comparisonCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  comparisonHint: {
    fontSize: 14,
    color: '#6b7280',
  },
  comparisonActions: {
    flexDirection: 'row',
  },
  comparisonActionButton: {
    padding: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  comparisonActionText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  
  // Area Comparison Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginRight: 16,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalContent: {
    flex: 1,
  },
  comparisonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  comparisonColumn: {
    flex: 1,
    padding: 16,
  },
  comparisonAreaName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  comparisonAreaNameAr: {
    fontSize: 16,
    color: '#6b7280',
  },
  comparisonSection: {
    marginBottom: 16,
  },
  comparisonSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  comparisonItem: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
});

export default AreasScreen; 