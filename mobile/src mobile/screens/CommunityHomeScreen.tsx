import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../store/store';
import {
  checkResidentAccess,
  fetchResidentProfile,
  fetchResidentCompounds,
  fetchAnnouncements,
  fetchCommunityFees,
} from '../store/slices/communitySlice';
import AuthService from '../services/AuthService';
import { notificationService } from '../services/NotificationService';

const CommunityHomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  
  const user = AuthService.getCurrentUser();
  const {
    isResident,
    residentProfile,
    currentCompound,
    announcements,
    fees,
    loading,
    error,
  } = useSelector((state: RootState) => state.community);

  useEffect(() => {
    if (user?.id && currentCompound?.id) {
      loadCompoundData();
    }
  }, [user?.id, currentCompound?.id]);

  const loadCompoundData = async () => {
    if (!user?.id || !currentCompound?.id) return;

    try {
      // Load announcements and fees for the compound
      await dispatch(fetchAnnouncements({ compoundId: currentCompound.id }) as any);
      await dispatch(fetchCommunityFees({ userId: user.id }) as any);
    } catch (error) {
      console.error('Error loading compound data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCompoundData();
    setRefreshing(false);
  };

  const handleTestNotification = async () => {
    try {
      await notificationService.sendCommunityAnnouncementNotification({
        id: 'test-announcement',
        title: 'اختبار الإشعارات',
        content: 'هذا إشعار تجريبي لاختبار النظام',
        compound_name: currentCompound?.name || 'مجمعكم السكني',
        priority: 'medium'
      });
      
      Alert.alert('تم الإرسال', 'تم إرسال إشعار تجريبي بنجاح');
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء إرسال الإشعار');
    }
  };

  // If not a resident, show access request or information
  if (!loading.access && !isResident) {
    return (
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.nonResidentContainer}>
          <Text style={styles.nonResidentIcon}>🏘️</Text>
          <Text style={styles.nonResidentTitle}>مرحباً بك في خدمات المجتمع</Text>
          <Text style={styles.nonResidentText}>
            للوصول إلى خدمات المجتمع والكمبوند، يجب أن تكون مقيماً مسجلاً في أحد مجتمعاتنا.
          </Text>
          
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => Alert.alert('معلومات التواصل', 'يرجى التواصل مع إدارة الكمبوند لتسجيل إقامتك.')}
          >
            <Text style={styles.contactButtonText}>تواصل معنا للتسجيل</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Loading state
  if (loading.access || loading.profile || loading.compounds) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>جاري تحميل بيانات المجتمع...</Text>
      </View>
    );
  }

  // Error state
  if (error.access || error.profile) {
    return (
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>حدث خطأ</Text>
          <Text style={styles.errorText}>
            {error.access || error.profile || 'فشل في تحميل بيانات المجتمع'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const pendingFees = fees.filter(fee => fee.payment_status === 'pending').length;
  const overdueFeesAmount = fees
    .filter(fee => fee.payment_status === 'overdue')
    .reduce((total, fee) => total + fee.amount, 0);
  const unreadAnnouncements = announcements.filter(ann => ann.priority === 'high').length;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Welcome Section */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>مرحباً بك في</Text>
        <Text style={styles.compoundName}>
          {currentCompound?.name || 'مجتمعك السكني'}
        </Text>
        <Text style={styles.unitInfo}>
          {residentProfile?.resident_type === 'owner' ? 'مالك' : 'مستأجر'} - 
          وحدة {residentProfile?.community_units?.unit_number || 'غير محددة'}
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{pendingFees}</Text>
          <Text style={styles.statLabel}>فواتير معلقة</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{unreadAnnouncements}</Text>
          <Text style={styles.statLabel}>إعلانات مهمة</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {overdueFeesAmount > 0 ? `${overdueFeesAmount} ج.م` : '0'}
          </Text>
          <Text style={styles.statLabel}>مستحق الدفع</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>الخدمات السريعة</Text>
        
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('AmenityBooking' as never)}
          >
            <Text style={styles.actionIcon}>🏊</Text>
            <Text style={styles.actionTitle}>حجز المرافق</Text>
            <Text style={styles.actionSubtitle}>احجز الملاعب والمسابح</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('VisitorManagement' as never)}
          >
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionTitle}>إدارة الزوار</Text>
            <Text style={styles.actionSubtitle}>إنشاء تصاريح دخول</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('ServiceRequests' as never)}
          >
            <Text style={styles.actionIcon}>🔧</Text>
            <Text style={styles.actionTitle}>طلبات الصيانة</Text>
            <Text style={styles.actionSubtitle}>إبلاغ عن مشاكل الصيانة</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('CommunityFees' as never)}
          >
            <Text style={styles.actionIcon}>💳</Text>
            <Text style={styles.actionTitle}>دفع الفواتير</Text>
            <Text style={styles.actionSubtitle}>الرسوم والمستحقات</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={handleTestNotification}
          >
            <Text style={styles.actionIcon}>🔔</Text>
            <Text style={styles.actionTitle}>اختبار الإشعارات</Text>
            <Text style={styles.actionSubtitle}>إرسال إشعار تجريبي</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('VisitorQRScan' as never)}
          >
            <Text style={styles.actionIcon}>📱</Text>
            <Text style={styles.actionTitle}>فحص QR الزوار</Text>
            <Text style={styles.actionSubtitle}>تسجيل دخول الزوار</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Announcements */}
      {announcements.length > 0 && (
        <View style={styles.announcementsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>آخر الإعلانات</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Announcements' as never)}>
              <Text style={styles.seeAllText}>عرض الكل</Text>
            </TouchableOpacity>
          </View>

          {announcements.slice(0, 3).map((announcement) => (
            <View key={announcement.id} style={styles.announcementCard}>
              <View style={styles.announcementHeader}>
                <Text style={styles.announcementTitle}>{announcement.title}</Text>
                <View style={[
                  styles.priorityBadge,
                  announcement.priority === 'high' && styles.highPriorityBadge
                ]}>
                  <Text style={styles.priorityText}>
                    {announcement.priority === 'high' ? 'عاجل' : 'عادي'}
                  </Text>
                </View>
              </View>
              <Text style={styles.announcementContent} numberOfLines={2}>
                {announcement.content}
              </Text>
              <Text style={styles.announcementDate}>
                {new Date(announcement.created_at).toLocaleDateString('ar-EG')}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Pending Payments */}
      {pendingFees > 0 && (
        <View style={styles.paymentsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>المستحقات المعلقة</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CommunityFees' as never)}>
              <Text style={styles.seeAllText}>عرض الكل</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.paymentCard}>
            <Text style={styles.paymentTitle}>لديك {pendingFees} فاتورة معلقة</Text>
            <Text style={styles.paymentAmount}>
              إجمالي المبلغ: {fees
                .filter(fee => fee.payment_status === 'pending')
                .reduce((total, fee) => total + fee.amount, 0)} ج.م
            </Text>
            <TouchableOpacity 
              style={styles.payNowButton}
              onPress={() => navigation.navigate('CommunityFees' as never)}
            >
              <Text style={styles.payNowButtonText}>ادفع الآن</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  
  // Non-resident states
  nonResidentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginTop: 100,
  },
  nonResidentIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  nonResidentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#111827',
  },
  nonResidentText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 32,
  },
  contactButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Loading state
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

  // Error state
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

  // Header
  header: {
    backgroundColor: 'white',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  compoundName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  unitInfo: {
    fontSize: 14,
    color: '#6b7280',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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

  // Actions
  actionsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },

  // Announcements
  announcementsContainer: {
    padding: 16,
  },
  announcementCard: {
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
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  priorityBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  highPriorityBadge: {
    backgroundColor: '#fee2e2',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  announcementContent: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  announcementDate: {
    fontSize: 12,
    color: '#9ca3af',
  },

  // Payments
  paymentsContainer: {
    padding: 16,
  },
  paymentCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 14,
    color: '#dc2626',
    marginBottom: 16,
  },
  payNowButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  payNowButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CommunityHomeScreen;