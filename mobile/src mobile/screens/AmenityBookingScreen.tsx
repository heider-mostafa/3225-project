import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal 
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../store/store';
import AuthService from '../services/AuthService';
import CommunityService, { Amenity, AmenityBooking } from '../services/CommunityService';
import { AmenityCalendar } from '../components/calendar/AmenityCalendar';
import { notificationService } from '../services/NotificationService';
import {
  fetchCompoundAmenities,
  fetchUserBookings,
  setSelectedAmenity
} from '../store/slices/communitySlice';

const AmenityBookingScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<AmenityBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);

  const user = AuthService.getCurrentUser();
  const {
    amenities,
    currentCompound,
    loading,
    error,
  } = useSelector((state: RootState) => state.community);

  useEffect(() => {
    if (currentCompound?.id) {
      loadAmenities();
    }
    if (user?.id) {
      loadUserBookings();
    }
  }, [currentCompound?.id, user?.id]);

  const loadAmenities = async () => {
    if (!currentCompound?.id) return;
    try {
      await dispatch(fetchCompoundAmenities(currentCompound.id) as any);
    } catch (error) {
      console.error('Error loading amenities:', error);
    }
  };

  const loadUserBookings = async () => {
    if (!user?.id) return;
    try {
      setLoadingBookings(true);
      const response = await CommunityService.getAmenityBookings(user.id, {
        status: 'confirmed'
      });
      if (response.success) {
        setBookings(response.data);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadAmenities(), loadUserBookings()]);
    setRefreshing(false);
  };

  const handleBookAmenity = (amenity: Amenity) => {
    if (!amenity.is_active) {
      Alert.alert('غير متاح', 'هذا المرفق غير متاح حالياً للحجز');
      return;
    }

    setSelectedAmenity(amenity);
    setShowCalendarModal(true);
  };

  const handleBookingCreate = async (bookingData: {
    amenity_id: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    guest_count: number;
    booking_notes?: string;
  }) => {
    try {
      setIsCreatingBooking(true);
      
      const response = await CommunityService.createAmenityBooking(bookingData);
      
      if (response.success) {
        // Send booking confirmation notification
        await notificationService.sendBookingConfirmationNotification({
          amenity_name: selectedAmenity?.name || 'المرفق',
          booking_date: bookingData.booking_date,
          start_time: bookingData.start_time,
          compound_name: currentCompound?.name || 'المجمع'
        });

        Alert.alert(
          'تم الحجز بنجاح',
          `تم حجز ${selectedAmenity?.name} بنجاح في ${bookingData.booking_date} من ${bookingData.start_time} إلى ${bookingData.end_time}`,
          [
            {
              text: 'موافق',
              onPress: () => {
                setShowCalendarModal(false);
                setSelectedAmenity(null);
                loadUserBookings(); // Refresh bookings
              }
            }
          ]
        );
      } else {
        Alert.alert('خطأ في الحجز', response.error || 'حدث خطأ أثناء الحجز');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إنشاء الحجز');
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const handleCloseCalendar = () => {
    setShowCalendarModal(false);
    setSelectedAmenity(null);
  };

  const getAmenityIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'pool': '🏊',
      'gym': '💪',
      'tennis': '🎾',
      'basketball': '🏀',
      'football': '⚽',
      'playground': '🛝',
      'garden': '🌳',
      'hall': '🏛️',
      'parking': '🚗',
    };
    return icons[type.toLowerCase()] || '🏢';
  };

  if (loading.amenities) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>جاري تحميل المرافق...</Text>
      </View>
    );
  }

  if (error.amenities) {
    return (
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>حدث خطأ</Text>
          <Text style={styles.errorText}>{error.amenities}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>حجز المرافق</Text>
        <Text style={styles.subtitle}>
          {currentCompound?.name ? `مرافق ${currentCompound.name}` : 'احجز المسابح والملاعب والقاعات'}
        </Text>
      </View>

      {/* Current Bookings */}
      {bookings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>حجوزاتك الحالية</Text>
          {loadingBookings ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            bookings.slice(0, 3).map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <Text style={styles.bookingAmenity}>
                  {amenities.find(a => a.id === booking.amenity_id)?.name || 'مرفق غير محدد'}
                </Text>
                <Text style={styles.bookingDate}>
                  {new Date(booking.booking_date).toLocaleDateString('ar-EG')} | 
                  {booking.start_time} - {booking.end_time}
                </Text>
                <Text style={styles.bookingStatus}>
                  {booking.booking_status === 'confirmed' ? 'مؤكد' : 'معلق'}
                </Text>
              </View>
            ))
          )}
        </View>
      )}

      {/* Available Amenities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          المرافق المتاحة ({amenities.filter(a => a.is_active).length})
        </Text>
        
        {amenities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏢</Text>
            <Text style={styles.emptyTitle}>لا توجد مرافق متاحة</Text>
            <Text style={styles.emptyText}>
              لم يتم إضافة أي مرافق لهذا الكمبوند بعد
            </Text>
          </View>
        ) : (
          <View style={styles.amenityList}>
            {amenities.map((amenity) => (
              <TouchableOpacity
                key={amenity.id}
                style={[
                  styles.amenityCard,
                  !amenity.is_active && styles.amenityCardDisabled
                ]}
                onPress={() => handleBookAmenity(amenity)}
                disabled={!amenity.is_active}
              >
                <View style={styles.amenityInfo}>
                  <Text style={styles.amenityIcon}>
                    {getAmenityIcon(amenity.type)}
                  </Text>
                  <View style={styles.amenityDetails}>
                    <Text style={styles.amenityName}>{amenity.name}</Text>
                    <Text style={styles.amenityDescription} numberOfLines={2}>
                      {amenity.description || 'لا يوجد وصف'}
                    </Text>
                    <Text style={styles.amenityCapacity}>
                      السعة: {amenity.capacity} شخص
                    </Text>
                  </View>
                </View>
                
                <View style={styles.amenityPricing}>
                  <Text style={styles.amenityPrice}>
                    {amenity.price_per_hour 
                      ? `${amenity.price_per_hour} ج.م/ساعة` 
                      : 'مجاني'
                    }
                  </Text>
                  <Text style={styles.amenityStatus}>
                    {amenity.is_active ? 'متاح' : 'غير متاح'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Booking Rules */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>قواعد الحجز</Text>
        <View style={styles.rulesContainer}>
          <Text style={styles.ruleText}>• يجب الحجز قبل 24 ساعة على الأقل</Text>
          <Text style={styles.ruleText}>• الحد الأقصى للحجز 4 ساعات يومياً</Text>
          <Text style={styles.ruleText}>• يمكن إلغاء الحجز قبل ساعتين من الموعد</Text>
          <Text style={styles.ruleText}>• المرافق متاحة من 6 صباحاً حتى 10 مساءً</Text>
        </View>
      </View>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendarModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseCalendar}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={handleCloseCalendar}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {selectedAmenity && (
            <AmenityCalendar
              amenity={selectedAmenity}
              existingBookings={bookings.filter(b => 
                b.amenity_id === selectedAmenity.id && 
                b.booking_status === 'confirmed'
              )}
              onBookingCreate={handleBookingCreate}
              isLoading={isCreatingBooking}
            />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginTop: 100,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#dc2626',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: 'white',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  bookingCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingAmenity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  bookingStatus: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  amenityList: {
    gap: 16,
  },
  amenityCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  amenityCardDisabled: {
    opacity: 0.6,
    backgroundColor: '#f3f4f6',
  },
  amenityInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  amenityIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  amenityDetails: {
    flex: 1,
  },
  amenityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  amenityDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  amenityCapacity: {
    fontSize: 12,
    color: '#9ca3af',
  },
  amenityPricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amenityPrice: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  amenityStatus: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  rulesContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ruleText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: 'bold',
  },
});

export default AmenityBookingScreen;