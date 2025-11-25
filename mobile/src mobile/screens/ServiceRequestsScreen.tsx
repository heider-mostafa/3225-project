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
  TextInput,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import AuthService from '../services/AuthService';
import CommunityService, { ServiceRequest } from '../services/CommunityService';
import { fetchServiceRequests } from '../store/slices/communitySlice';

const ServiceRequestsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  });

  const user = AuthService.getCurrentUser();
  const { currentCompound } = useSelector((state: RootState) => state.community);

  const categories = [
    { value: 'plumbing', label: 'سباكة' },
    { value: 'electrical', label: 'كهرباء' },
    { value: 'ac', label: 'تكييف' },
    { value: 'maintenance', label: 'صيانة عامة' },
    { value: 'security', label: 'أمن' },
    { value: 'cleaning', label: 'نظافة' },
    { value: 'elevator', label: 'مصاعد' },
    { value: 'parking', label: 'مواقف' },
    { value: 'other', label: 'أخرى' },
  ];

  const priorities = [
    { value: 'low', label: 'عادي', color: '#10b981' },
    { value: 'medium', label: 'متوسط', color: '#f59e0b' },
    { value: 'high', label: 'عالي', color: '#ef4444' },
    { value: 'urgent', label: 'عاجل', color: '#dc2626' },
  ];

  useEffect(() => {
    if (user?.id) {
      loadServiceRequests();
    }
  }, [user?.id]);

  const loadServiceRequests = async () => {
    if (!user?.id) return;
    try {
      setLoadingRequests(true);
      const response = await CommunityService.getServiceRequests(user.id);
      if (response.success) {
        setServiceRequests(response.data);
      } else {
        Alert.alert('خطأ', response.error || 'فشل في تحميل طلبات الصيانة');
      }
    } catch (error) {
      console.error('Error loading service requests:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل طلبات الصيانة');
    } finally {
      setLoadingRequests(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServiceRequests();
    setRefreshing(false);
  };

  const handleCreateRequest = async () => {
    if (!formData.category || !formData.title || !formData.description) {
      Alert.alert('بيانات ناقصة', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const response = await CommunityService.createServiceRequest(formData);
      if (response.success) {
        Alert.alert('تم بنجاح', 'تم إرسال طلب الصيانة بنجاح');
        setShowCreateModal(false);
        setFormData({
          category: '',
          title: '',
          description: '',
          priority: 'medium',
        });
        await loadServiceRequests();
      } else {
        Alert.alert('فشل', response.error || 'فشل في إرسال طلب الصيانة');
      }
    } catch (error) {
      console.error('Error creating service request:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إرسال طلب الصيانة');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'submitted': '#f59e0b',
      'acknowledged': '#3b82f6',
      'in_progress': '#8b5cf6',
      'completed': '#10b981',
      'cancelled': '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      'submitted': 'مرسل',
      'acknowledged': 'قيد المراجعة',
      'in_progress': 'قيد التنفيذ',
      'completed': 'مكتمل',
      'cancelled': 'ملغي',
    };
    return texts[status] || status;
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'plumbing': '🔧',
      'electrical': '⚡',
      'ac': '❄️',
      'maintenance': '🛠️',
      'security': '🔒',
      'cleaning': '🧹',
      'elevator': '🛗',
      'parking': '🚗',
      'other': '📋',
    };
    return icons[category] || '📋';
  };

  const getPriorityLabel = (priority: string) => {
    return priorities.find(p => p.value === priority)?.label || priority;
  };

  const getPriorityColor = (priority: string) => {
    return priorities.find(p => p.value === priority)?.color || '#6b7280';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>طلبات الصيانة</Text>
          <Text style={styles.subtitle}>
            {currentCompound?.name ? `صيانة ${currentCompound.name}` : 'إبلاغ عن مشاكل الصيانة وتتبع الحلول'}
          </Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.createButtonText}>طلب صيانة جديد</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الفلتر</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterButtons}>
              <TouchableOpacity style={[styles.filterButton, styles.filterButtonActive]}>
                <Text style={styles.filterButtonTextActive}>الكل</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterButton}>
                <Text style={styles.filterButtonText}>قيد التنفيذ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterButton}>
                <Text style={styles.filterButtonText}>مكتمل</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterButton}>
                <Text style={styles.filterButtonText}>عاجل</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            طلباتك ({serviceRequests.length})
          </Text>
          
          {loadingRequests ? (
            <ActivityIndicator size="large" color="#2563eb" />
          ) : serviceRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔧</Text>
              <Text style={styles.emptyTitle}>لا توجد طلبات صيانة</Text>
              <Text style={styles.emptyText}>
                لم تقم بإرسال أي طلبات صيانة بعد
              </Text>
            </View>
          ) : (
            <View style={styles.requestList}>
              {serviceRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <View style={styles.requestInfo}>
                      <View style={styles.requestTitleRow}>
                        <Text style={styles.categoryIcon}>
                          {getCategoryIcon(request.category)}
                        </Text>
                        <Text style={styles.requestTitle}>{request.title}</Text>
                      </View>
                      <Text style={styles.requestDescription} numberOfLines={2}>
                        {request.description}
                      </Text>
                      <Text style={styles.requestDate}>
                        {new Date(request.created_at).toLocaleDateString('ar-EG')}
                      </Text>
                    </View>
                    
                    <View style={styles.requestStatusSection}>
                      <View 
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(request.status) }
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {getStatusText(request.status)}
                        </Text>
                      </View>
                      <View 
                        style={[
                          styles.priorityBadge,
                          { backgroundColor: getPriorityColor(request.priority) }
                        ]}
                      >
                        <Text style={styles.priorityText}>
                          {getPriorityLabel(request.priority)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  {request.estimated_cost && (
                    <View style={styles.costSection}>
                      <Text style={styles.costLabel}>التكلفة المقدرة:</Text>
                      <Text style={styles.costAmount}>{request.estimated_cost} ج.م</Text>
                    </View>
                  )}

                  {request.scheduled_date && (
                    <View style={styles.scheduleSection}>
                      <Text style={styles.scheduleLabel}>موعد الصيانة:</Text>
                      <Text style={styles.scheduleDate}>
                        {new Date(request.scheduled_date).toLocaleDateString('ar-EG')}
                      </Text>
                    </View>
                  )}

                  {request.status === 'completed' && !request.resident_rating && (
                    <TouchableOpacity 
                      style={styles.rateButton}
                      onPress={() => Alert.alert('تقييم الخدمة', 'سيتم إضافة نظام التقييم قريباً')}
                    >
                      <Text style={styles.rateButtonText}>قيّم الخدمة</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Request Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>طلب صيانة جديد</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>نوع الصيانة *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.category}
                  onValueChange={(value) => setFormData({...formData, category: value})}
                  style={styles.picker}
                >
                  <Picker.Item label="اختر نوع الصيانة" value="" />
                  {categories.map((cat) => (
                    <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>عنوان المشكلة *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({...formData, title: text})}
                placeholder="مثال: تسريب في صنبور المطبخ"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>وصف المشكلة *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
                placeholder="اشرح المشكلة بالتفصيل..."
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>مستوى الأولوية *</Text>
              <View style={styles.priorityOptions}>
                {priorities.map((priority) => (
                  <TouchableOpacity
                    key={priority.value}
                    style={[
                      styles.priorityOption,
                      formData.priority === priority.value && styles.priorityOptionSelected,
                      { borderColor: priority.color }
                    ]}
                    onPress={() => setFormData({...formData, priority: priority.value as any})}
                  >
                    <Text 
                      style={[
                        styles.priorityOptionText,
                        formData.priority === priority.value && { color: priority.color }
                      ]}
                    >
                      {priority.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleCreateRequest}
            >
              <Text style={styles.submitButtonText}>إرسال الطلب</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
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
  createButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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
  requestList: {
    gap: 12,
  },
  requestCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  requestDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  requestDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  requestStatusSection: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: 'white',
  },
  costSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
  },
  costLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  costAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  scheduleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
  },
  scheduleLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  scheduleDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  rateButton: {
    backgroundColor: '#10b981',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  rateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // Modal styles
  modal: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  picker: {
    height: 50,
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  priorityOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: 'white',
  },
  priorityOptionSelected: {
    backgroundColor: '#f9fafb',
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ServiceRequestsScreen;