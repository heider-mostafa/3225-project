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
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import AuthService from '../services/AuthService';
import CommunityService, { VisitorPass } from '../services/CommunityService';
import { QRGenerator } from '../components/qr/QRGenerator';
import { fetchVisitorPasses } from '../store/slices/communitySlice';

const VisitorManagementScreen: React.FC = () => {
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [visitorPasses, setVisitorPasses] = useState<VisitorPass[]>([]);
  const [loadingPasses, setLoadingPasses] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    visitor_name: '',
    visitor_phone: '',
    visitor_id_number: '',
    visit_purpose: '',
    expected_arrival: '',
    expected_departure: '',
  });

  const user = AuthService.getCurrentUser();
  const { currentCompound } = useSelector((state: RootState) => state.community);

  useEffect(() => {
    if (user?.id) {
      loadVisitorPasses();
    }
  }, [user?.id]);

  const loadVisitorPasses = async () => {
    if (!user?.id) return;
    try {
      setLoadingPasses(true);
      const response = await CommunityService.getVisitorPasses(user.id);
      if (response.success) {
        setVisitorPasses(response.data);
      } else {
        Alert.alert('خطأ', response.error || 'فشل في تحميل تصاريح الزوار');
      }
    } catch (error) {
      console.error('Error loading visitor passes:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل تصاريح الزوار');
    } finally {
      setLoadingPasses(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVisitorPasses();
    setRefreshing(false);
  };

  const handleCreatePass = async () => {
    if (!formData.visitor_name || !formData.visitor_phone || !formData.visit_purpose || !formData.expected_arrival) {
      Alert.alert('بيانات ناقصة', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const response = await CommunityService.createVisitorPass(formData);
      if (response.success) {
        Alert.alert('تم بنجاح', 'تم إنشاء تصريح الزيارة بنجاح');
        setShowCreateModal(false);
        setFormData({
          visitor_name: '',
          visitor_phone: '',
          visitor_id_number: '',
          visit_purpose: '',
          expected_arrival: '',
          expected_departure: '',
        });
        await loadVisitorPasses();
      } else {
        Alert.alert('فشل', response.error || 'فشل في إنشاء تصريح الزيارة');
      }
    } catch (error) {
      console.error('Error creating visitor pass:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إنشاء تصريح الزيارة');
    }
  };

  const handleCancelPass = async (passId: string) => {
    Alert.alert(
      'إلغاء التصريح',
      'هل أنت متأكد من إلغاء هذا التصريح؟',
      [
        { text: 'لا', style: 'cancel' },
        { 
          text: 'نعم', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await CommunityService.cancelVisitorPass(passId);
              if (response.success) {
                Alert.alert('تم', 'تم إلغاء التصريح بنجاح');
                await loadVisitorPasses();
              } else {
                Alert.alert('فشل', response.error || 'فشل في إلغاء التصريح');
              }
            } catch (error) {
              console.error('Error cancelling pass:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء إلغاء التصريح');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': '#f59e0b',
      'active': '#10b981',
      'used': '#6b7280',
      'expired': '#ef4444',
      'cancelled': '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      'pending': 'معلق',
      'active': 'نشط',
      'used': 'مستخدم',
      'expired': 'منتهي الصلاحية',
      'cancelled': 'ملغي',
    };
    return texts[status] || status;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>إدارة الزوار</Text>
          <Text style={styles.subtitle}>
            {currentCompound?.name ? `تصاريح دخول ${currentCompound.name}` : 'إنشاء تصاريح دخول للزوار'}
          </Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.createButtonText}>إنشاء تصريح جديد</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            تصاريحك ({visitorPasses.length})
          </Text>
          
          {loadingPasses ? (
            <ActivityIndicator size="large" color="#2563eb" />
          ) : visitorPasses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>لا توجد تصاريح</Text>
              <Text style={styles.emptyText}>
                لم تقم بإنشاء أي تصاريح زوار بعد
              </Text>
            </View>
          ) : (
            <View style={styles.passList}>
              {visitorPasses.map((pass) => (
                <View key={pass.id} style={styles.passCard}>
                  <View style={styles.passHeader}>
                    <View style={styles.passInfo}>
                      <Text style={styles.visitorName}>{pass.visitor_name}</Text>
                      <Text style={styles.visitPurpose}>{pass.visit_purpose}</Text>
                      <Text style={styles.visitDate}>
                        الوصول: {new Date(pass.expected_arrival).toLocaleString('ar-EG')}
                      </Text>
                      {pass.expected_departure && (
                        <Text style={styles.visitDate}>
                          المغادرة: {new Date(pass.expected_departure).toLocaleString('ar-EG')}
                        </Text>
                      )}
                    </View>
                    
                    <View style={styles.qrSection}>
                      {(pass.access_status === 'pending' || pass.access_status === 'active') ? (
                        <QRGenerator
                          value={CommunityService.generateVisitorQRCode(pass)}
                          size={80}
                          backgroundColor="#FFFFFF"
                          color="#000000"
                        />
                      ) : (
                        <View style={styles.qrPlaceholder}>
                          <Text style={styles.qrText}>QR</Text>
                        </View>
                      )}
                      <View 
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(pass.access_status) }
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {getStatusText(pass.access_status)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.passActions}>
                    <Text style={styles.passPhone}>📱 {pass.visitor_phone}</Text>
                    
                    {(pass.access_status === 'pending' || pass.access_status === 'active') && (
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancelPass(pass.id)}
                      >
                        <Text style={styles.cancelButtonText}>إلغاء</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات مهمة</Text>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>• التصريح صالح لمدة 24 ساعة من وقت الإنشاء</Text>
            <Text style={styles.infoText}>• يجب على الزائر إحضار هوية شخصية صالحة</Text>
            <Text style={styles.infoText}>• رمز QR مطلوب للدخول من البوابة الرئيسية</Text>
            <Text style={styles.infoText}>• يمكن إلغاء التصريح قبل استخدامه</Text>
          </View>
        </View>
      </ScrollView>

      {/* Create Pass Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>إنشاء تصريح زيارة</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>اسم الزائر *</Text>
              <TextInput
                style={styles.input}
                value={formData.visitor_name}
                onChangeText={(text) => setFormData({...formData, visitor_name: text})}
                placeholder="أدخل اسم الزائر"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>رقم الهاتف *</Text>
              <TextInput
                style={styles.input}
                value={formData.visitor_phone}
                onChangeText={(text) => setFormData({...formData, visitor_phone: text})}
                placeholder="أدخل رقم الهاتف"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>رقم الهوية</Text>
              <TextInput
                style={styles.input}
                value={formData.visitor_id_number}
                onChangeText={(text) => setFormData({...formData, visitor_id_number: text})}
                placeholder="رقم البطاقة الشخصية (اختياري)"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>غرض الزيارة *</Text>
              <TextInput
                style={styles.input}
                value={formData.visit_purpose}
                onChangeText={(text) => setFormData({...formData, visit_purpose: text})}
                placeholder="مثال: زيارة عائلية، عمل، توصيل طلب"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>وقت الوصول المتوقع *</Text>
              <TextInput
                style={styles.input}
                value={formData.expected_arrival}
                onChangeText={(text) => setFormData({...formData, expected_arrival: text})}
                placeholder="مثال: 2024-01-15 14:30"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>وقت المغادرة المتوقع</Text>
              <TextInput
                style={styles.input}
                value={formData.expected_departure}
                onChangeText={(text) => setFormData({...formData, expected_departure: text})}
                placeholder="مثال: 2024-01-15 18:00 (اختياري)"
              />
            </View>

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleCreatePass}
            >
              <Text style={styles.submitButtonText}>إنشاء التصريح</Text>
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
  passList: {
    gap: 12,
  },
  passCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  passHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  passInfo: {
    flex: 1,
  },
  visitorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  visitPurpose: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  visitDate: {
    fontSize: 12,
    color: '#2563eb',
    marginBottom: 2,
  },
  qrSection: {
    alignItems: 'center',
    gap: 8,
  },
  qrPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  passActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passPhone: {
    fontSize: 14,
    color: '#374151',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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

export default VisitorManagementScreen;