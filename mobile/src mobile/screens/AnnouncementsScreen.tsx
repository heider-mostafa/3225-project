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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import AuthService from '../services/AuthService';
import CommunityService, { CommunityAnnouncement } from '../services/CommunityService';
import { fetchAnnouncements, markAnnouncementRead } from '../store/slices/communitySlice';

const AnnouncementsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState<CommunityAnnouncement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const user = AuthService.getCurrentUser();
  const { currentCompound } = useSelector((state: RootState) => state.community);

  const filterOptions = [
    { value: 'all', label: 'الكل' },
    { value: 'general', label: 'عام' },
    { value: 'maintenance', label: 'صيانة' },
    { value: 'event', label: 'فعاليات' },
    { value: 'emergency', label: 'طوارئ' },
    { value: 'billing', label: 'مالية' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'كل الأولويات' },
    { value: 'high', label: 'عالي' },
    { value: 'medium', label: 'متوسط' },
    { value: 'low', label: 'منخفض' },
  ];

  useEffect(() => {
    if (currentCompound?.id) {
      loadAnnouncements();
    }
  }, [currentCompound?.id, selectedFilter]);

  const loadAnnouncements = async () => {
    if (!currentCompound?.id) return;
    try {
      setLoadingAnnouncements(true);
      const filters = selectedFilter !== 'all' ? { type: selectedFilter } : undefined;
      const response = await CommunityService.getCommunityAnnouncements(currentCompound.id, filters);
      if (response.success) {
        setAnnouncements(response.data);
      } else {
        Alert.alert('خطأ', response.error || 'فشل في تحميل الإعلانات');
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل الإعلانات');
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnnouncements();
    setRefreshing(false);
  };

  const handleMarkAsRead = (announcementId: string) => {
    dispatch(markAnnouncementRead(announcementId));
    // Update local state
    setAnnouncements(prev => 
      prev.map(ann => 
        ann.id === announcementId 
          ? { ...ann, isRead: true } 
          : ann
      )
    );
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'general': '#3b82f6',
      'maintenance': '#f59e0b',
      'event': '#10b981',
      'emergency': '#ef4444',
      'billing': '#8b5cf6',
    };
    return colors[type] || '#6b7280';
  };

  const getTypeText = (type: string) => {
    const texts: { [key: string]: string } = {
      'general': 'عام',
      'maintenance': 'صيانة',
      'event': 'فعاليات',
      'emergency': 'طوارئ',
      'billing': 'مالية',
    };
    return texts[type] || type;
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      'low': '#10b981',
      'medium': '#f59e0b',
      'high': '#ef4444',
    };
    return colors[priority] || '#6b7280';
  };

  const getPriorityText = (priority: string) => {
    const texts: { [key: string]: string } = {
      'low': 'منخفض',
      'medium': 'متوسط',
      'high': 'عالي',
    };
    return texts[priority] || priority;
  };

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'general': '📢',
      'maintenance': '🔧',
      'event': '🎉',
      'emergency': '🚨',
      'billing': '💰',
    };
    return icons[type] || '📢';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) {
      return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
    } else if (hours > 0) {
      return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
    } else if (minutes > 0) {
      return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
    } else {
      return 'الآن';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>إعلانات المجتمع</Text>
          <Text style={styles.subtitle}>
            {currentCompound?.name ? `إعلانات ${currentCompound.name}` : 'آخر الأخبار والإعلانات المهمة'}
          </Text>
        </View>

        {/* Filter Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>نوع الإعلان</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterButtons}>
              {filterOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterButton,
                    selectedFilter === option.value && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedFilter(option.value)}
                >
                  <Text 
                    style={[
                      styles.filterButtonText,
                      selectedFilter === option.value && styles.filterButtonTextActive
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{announcements.length}</Text>
            <Text style={styles.statLabel}>إجمالي الإعلانات</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {announcements.filter(ann => ann.priority === 'high').length}
            </Text>
            <Text style={styles.statLabel}>إعلانات مهمة</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {announcements.filter(ann => {
                const today = new Date();
                const announcementDate = new Date(ann.created_at);
                return today.toDateString() === announcementDate.toDateString();
              }).length}
            </Text>
            <Text style={styles.statLabel}>اليوم</Text>
          </View>
        </View>

        {/* Announcements List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            الإعلانات ({announcements.length})
          </Text>
          
          {loadingAnnouncements ? (
            <ActivityIndicator size="large" color="#2563eb" />
          ) : announcements.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📢</Text>
              <Text style={styles.emptyTitle}>لا توجد إعلانات</Text>
              <Text style={styles.emptyText}>
                {selectedFilter === 'all' 
                  ? 'لا توجد إعلانات متاحة حالياً' 
                  : `لا توجد إعلانات من نوع ${filterOptions.find(f => f.value === selectedFilter)?.label}`
                }
              </Text>
            </View>
          ) : (
            <View style={styles.announcementsList}>
              {announcements.map((announcement) => {
                const isExpired = announcement.expiry_date && 
                  new Date(announcement.expiry_date) < new Date();
                
                return (
                  <TouchableOpacity
                    key={announcement.id}
                    style={[
                      styles.announcementCard,
                      isExpired && styles.expiredCard,
                      announcement.priority === 'high' && styles.highPriorityCard
                    ]}
                    onPress={() => handleMarkAsRead(announcement.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.announcementHeader}>
                      <View style={styles.announcementTitleRow}>
                        <Text style={styles.typeIcon}>
                          {getTypeIcon(announcement.announcement_type)}
                        </Text>
                        <Text style={styles.announcementTitle} numberOfLines={2}>
                          {announcement.title}
                        </Text>
                        {announcement.priority === 'high' && (
                          <View style={styles.urgentBadge}>
                            <Text style={styles.urgentText}>مهم</Text>
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.metaInfo}>
                        <View 
                          style={[
                            styles.typeBadge,
                            { backgroundColor: getTypeColor(announcement.announcement_type) }
                          ]}
                        >
                          <Text style={styles.typeText}>
                            {getTypeText(announcement.announcement_type)}
                          </Text>
                        </View>
                        <Text style={styles.timeAgo}>
                          {formatDate(announcement.created_at)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.announcementContent} numberOfLines={3}>
                      {announcement.content}
                    </Text>

                    {announcement.expiry_date && (
                      <View style={styles.expiryInfo}>
                        <Text style={[
                          styles.expiryText,
                          isExpired && styles.expiredText
                        ]}>
                          {isExpired 
                            ? 'منتهي الصلاحية' 
                            : `ينتهي في: ${new Date(announcement.expiry_date).toLocaleDateString('ar-EG')}`
                          }
                        </Text>
                      </View>
                    )}

                    <View style={styles.announcementFooter}>
                      <View style={styles.deliveryMethods}>
                        {announcement.is_push_notification && (
                          <View style={styles.deliveryBadge}>
                            <Text style={styles.deliveryText}>📱 إشعار</Text>
                          </View>
                        )}
                        {announcement.is_sms && (
                          <View style={styles.deliveryBadge}>
                            <Text style={styles.deliveryText}>📨 SMS</Text>
                          </View>
                        )}
                        {announcement.is_email && (
                          <View style={styles.deliveryBadge}>
                            <Text style={styles.deliveryText}>📧 إيميل</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات الإعلانات</Text>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>📢 الإعلانات العامة: معلومات عامة للمقيمين</Text>
            <Text style={styles.infoText}>🔧 إعلانات الصيانة: أعمال الصيانة والإصلاحات</Text>
            <Text style={styles.infoText}>🎉 إعلانات الفعاليات: أنشطة وفعاليات المجتمع</Text>
            <Text style={styles.infoText}>🚨 إعلانات الطوارئ: تنبيهات عاجلة ومهمة</Text>
            <Text style={styles.infoText}>💰 الإعلانات المالية: الرسوم والمدفوعات</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6b7280',
  },
  filterButtonTextActive: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
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
  announcementsList: {
    gap: 12,
  },
  announcementCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  expiredCard: {
    backgroundColor: '#f9fafb',
    opacity: 0.7,
  },
  highPriorityCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  announcementHeader: {
    marginBottom: 12,
  },
  announcementTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  typeIcon: {
    fontSize: 20,
    marginRight: 8,
    marginTop: 2,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    lineHeight: 24,
  },
  urgentBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  timeAgo: {
    fontSize: 12,
    color: '#9ca3af',
  },
  announcementContent: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 12,
  },
  expiryInfo: {
    marginBottom: 12,
  },
  expiryText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },
  expiredText: {
    color: '#ef4444',
  },
  announcementFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  deliveryMethods: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  deliveryBadge: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  deliveryText: {
    fontSize: 10,
    color: '#0369a1',
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
});

export default AnnouncementsScreen;