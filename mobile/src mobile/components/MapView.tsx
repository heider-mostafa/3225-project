import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Property interface (matching the main app)
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
  latitude?: number;
  longitude?: number;
}

interface MapViewComponentProps {
  properties: Property[];
  onPropertySelect?: (property: Property) => void;
  onClose: () => void;
  visible: boolean;
}

// Egyptian map themes (similar to web)
const mapStyles = {
  standard: [],
  silver: [
    {
      elementType: 'geometry',
      stylers: [{ color: '#f5f5f5' }],
    },
    {
      elementType: 'labels.icon',
      stylers: [{ visibility: 'off' }],
    },
    {
      elementType: 'labels.text.fill',
      stylers: [{ color: '#616161' }],
    },
    {
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#f5f5f5' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#c9c9c9' }],
    },
  ],
  retro: [
    {
      elementType: 'geometry',
      stylers: [{ color: '#ebe3cd' }],
    },
    {
      elementType: 'labels.text.fill',
      stylers: [{ color: '#523735' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry.fill',
      stylers: [{ color: '#7dd3c0' }],
    },
  ],
};

const MapViewComponent: React.FC<MapViewComponentProps> = ({
  properties,
  onPropertySelect,
  onClose,
  visible,
}) => {
  const mapRef = useRef<MapView>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [currentStyle, setCurrentStyle] = useState<keyof typeof mapStyles>('standard');
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000000 });

  // Filter properties with coordinates
  const filteredProperties = properties.filter((property) => {
    const hasCoordinates = property.latitude !== undefined && property.longitude !== undefined;
    const matchesType = typeFilter.length === 0 || typeFilter.includes(property.property_type);
    const matchesPrice = property.price >= priceRange.min && property.price <= priceRange.max;
    return hasCoordinates && matchesType && matchesPrice;
  });

  // Egypt center (Cairo)
  const initialRegion: Region = {
    latitude: 30.0444,
    longitude: 31.2357,
    latitudeDelta: 2.0,
    longitudeDelta: 2.0,
  };

  // Property type colors and counts
  const propertyTypes = [
    {
      type: 'apartment',
      label: 'شقق',
      color: '#3B82F6',
      count: filteredProperties.filter((p) => p.property_type === 'apartment').length,
    },
    {
      type: 'villa',
      label: 'فيلات',
      color: '#10B981',
      count: filteredProperties.filter((p) => p.property_type === 'villa').length,
    },
    {
      type: 'penthouse',
      label: 'بنتهاوس',
      color: '#8B5CF6',
      count: filteredProperties.filter((p) => p.property_type === 'penthouse').length,
    },
    {
      type: 'townhouse',
      label: 'تاون هاوس',
      color: '#F59E0B',
      count: filteredProperties.filter((p) => p.property_type === 'townhouse').length,
    },
  ];

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

  // Get marker color based on property type
  const getMarkerColor = (propertyType: string): string => {
    switch (propertyType) {
      case 'villa':
        return '#10B981'; // green
      case 'apartment':
        return '#3B82F6'; // blue
      case 'penthouse':
        return '#8B5CF6'; // purple
      case 'townhouse':
        return '#F59E0B'; // amber
      default:
        return '#6B7280'; // gray
    }
  };

  // Fit map to show all properties
  const fitToProperties = () => {
    if (mapRef.current && filteredProperties.length > 0) {
      const coordinates = filteredProperties
        .filter((p) => p.latitude && p.longitude)
        .map((p) => ({
          latitude: p.latitude!,
          longitude: p.longitude!,
        }));

      if (coordinates.length > 0) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: {
            top: 100,
            right: 50,
            bottom: 100,
            left: 50,
          },
          animated: true,
        });
      }
    }
  };

  // Reset map view
  const resetView = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(initialRegion, 1000);
      setSelectedProperty(null);
    }
  };

  // Handle property marker press
  const handleMarkerPress = (property: Property) => {
    setSelectedProperty(property);
    onPropertySelect?.(property);

    // Animate to property location
    if (mapRef.current && property.latitude && property.longitude) {
      mapRef.current.animateToRegion(
        {
          latitude: property.latitude,
          longitude: property.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }
  };

  // Toggle property type filter
  const toggleTypeFilter = (type: string) => {
    setTypeFilter((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Property Info Card Component
  const PropertyInfoCard = ({ property }: { property: Property }) => {
    const primaryImage = property.property_photos?.find((photo) => photo.is_primary)?.url ||
      property.property_photos?.[0]?.url;

    return (
      <View style={styles.propertyCard}>
        {primaryImage && (
          <Image source={{ uri: primaryImage }} style={styles.propertyImage} resizeMode="cover" />
        )}
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyTitle} numberOfLines={1}>
            {property.title}
          </Text>
          <Text style={styles.propertyPrice}>{formatEGP(property.price)}</Text>
          <View style={styles.propertySpecs}>
            <Text style={styles.specText}>🛏️ {property.bedrooms}</Text>
            <Text style={styles.specText}>🚿 {property.bathrooms}</Text>
            {property.square_meters && (
              <Text style={styles.specText}>📐 {property.square_meters}م²</Text>
            )}
          </View>
          <Text style={styles.propertyAddress} numberOfLines={1}>
            📍 {property.address}
          </Text>
          <Text style={styles.propertyType}>{property.property_type}</Text>
        </View>
      </View>
    );
  };

  // Filters Component
  const FiltersPanel = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}
      transparent={true}
    >
      <View style={styles.filtersModal}>
        <View style={styles.filtersContainer}>
          <View style={styles.filtersHeader}>
            <Text style={styles.filtersTitle}>فلاتر الخريطة</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filtersContent}>
            {/* Map Style */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>نمط الخريطة</Text>
              <View style={styles.styleButtons}>
                {Object.keys(mapStyles).map((style) => (
                  <TouchableOpacity
                    key={style}
                    style={[
                      styles.styleButton,
                      currentStyle === style && styles.activeStyleButton,
                    ]}
                    onPress={() => setCurrentStyle(style as keyof typeof mapStyles)}
                  >
                    <Text
                      style={[
                        styles.styleButtonText,
                        currentStyle === style && styles.activeStyleButtonText,
                      ]}
                    >
                      {style === 'standard' ? 'عادي' : style === 'silver' ? 'فضي' : 'كلاسيكي'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Property Types */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>نوع العقار</Text>
              {propertyTypes.map(({ type, label, color, count }) => (
                <TouchableOpacity
                  key={type}
                  style={styles.typeFilterItem}
                  onPress={() => toggleTypeFilter(type)}
                >
                  <View style={styles.typeFilterLeft}>
                    <View style={[styles.typeColorDot, { backgroundColor: color }]} />
                    <Text style={styles.typeFilterText}>
                      {label} ({count})
                    </Text>
                  </View>
                  <View style={styles.typeFilterCheckbox}>
                    {typeFilter.includes(type) && <Text style={styles.typeFilterCheck}>✓</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.actionButton} onPress={fitToProperties}>
                <Text style={styles.actionButtonText}>🔍 عرض جميع العقارات</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={resetView}>
                <Text style={styles.actionButtonText}>🔄 إعادة تعيين</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setTypeFilter([]);
                  setPriceRange({ min: 0, max: 10000000 });
                }}
              >
                <Text style={styles.clearButtonText}>🗑️ مسح الفلاتر</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🗺️ خريطة العقارات</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.headerButton} onPress={() => setShowFilters(true)}>
              <Text style={styles.headerButtonText}>🔧</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={onClose}>
              <Text style={styles.headerButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
            customMapStyle={mapStyles[currentStyle]}
            onMapReady={() => setMapReady(true)}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={false}
            toolbarEnabled={false}
          >
            {filteredProperties.map((property) => {
              if (!property.latitude || !property.longitude) return null;

              return (
                <Marker
                  key={property.id}
                  coordinate={{
                    latitude: property.latitude,
                    longitude: property.longitude,
                  }}
                  title={property.title}
                  description={formatEGP(property.price)}
                  pinColor={getMarkerColor(property.property_type)}
                  onPress={() => handleMarkerPress(property)}
                />
              );
            })}
          </MapView>

          {/* Map Loading */}
          {!mapReady && (
            <View style={styles.mapLoading}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.mapLoadingText}>جاري تحميل الخريطة...</Text>
            </View>
          )}

          {/* Map Controls */}
          {mapReady && (
            <View style={styles.mapControls}>
              <TouchableOpacity style={styles.controlButton} onPress={fitToProperties}>
                <Text style={styles.controlButtonText}>🔍</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={resetView}>
                <Text style={styles.controlButtonText}>🏠</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Property Legend */}
          {mapReady && (
            <View style={styles.legend}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.legendContent}>
                  <Text style={styles.legendTitle}>أنواع العقارات:</Text>
                  {propertyTypes.map(({ type, label, color, count }) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.legendItem,
                        typeFilter.includes(type) && styles.selectedLegendItem,
                      ]}
                      onPress={() => toggleTypeFilter(type)}
                    >
                      <View style={[styles.legendDot, { backgroundColor: color }]} />
                      <Text style={styles.legendText}>
                        {label} ({count})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>

        {/* Selected Property Info */}
        {selectedProperty && (
          <View style={styles.selectedPropertyContainer}>
            <PropertyInfoCard property={selectedProperty} />
            <TouchableOpacity
              style={styles.clearSelectionButton}
              onPress={() => setSelectedProperty(null)}
            >
              <Text style={styles.clearSelectionText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Property Count */}
        <View style={styles.propertyCount}>
          <Text style={styles.propertyCountText}>
            📍 {filteredProperties.length} عقار على الخريطة
          </Text>
        </View>

        <FiltersPanel />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 16,
    color: '#64748b',
  },

  // Map
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
  },
  mapLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },

  // Map Controls
  mapControls: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  controlButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  controlButtonText: {
    fontSize: 18,
  },

  // Legend
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 12,
  },
  legendContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginRight: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  selectedLegendItem: {
    backgroundColor: '#e0e7ff',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#374151',
  },

  // Property Info Card
  selectedPropertyContainer: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  propertyCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  propertyImage: {
    width: '100%',
    height: 120,
  },
  propertyInfo: {
    padding: 12,
  },
  propertyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'right',
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 6,
    textAlign: 'right',
  },
  propertySpecs: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  specText: {
    fontSize: 11,
    color: '#64748b',
    marginLeft: 8,
  },
  propertyAddress: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 4,
    textAlign: 'right',
  },
  propertyType: {
    fontSize: 10,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  clearSelectionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  clearSelectionText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: 'bold',
  },

  // Property Count
  propertyCount: {
    position: 'absolute',
    top: 80,
    left: 20,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  propertyCountText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },

  // Filters Modal
  filtersModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: 'bold',
  },
  filtersContent: {
    maxHeight: SCREEN_HEIGHT * 0.6,
  },

  // Filter Sections
  filterSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'right',
  },

  // Style Buttons
  styleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  styleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeStyleButton: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  styleButtonText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  activeStyleButtonText: {
    color: '#ffffff',
  },

  // Type Filters
  typeFilterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  typeFilterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  typeFilterText: {
    fontSize: 14,
    color: '#374151',
  },
  typeFilterCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeFilterCheck: {
    fontSize: 12,
    color: '#059669',
    fontWeight: 'bold',
  },

  // Filter Actions
  filterActions: {
    padding: 20,
  },
  actionButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  clearButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MapViewComponent;