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
import CommunityService, { CommunityFee } from '../services/CommunityService';
import { fetchCommunityFees, updateFeePaymentStatus } from '../store/slices/communitySlice';
import { notificationService } from '../services/NotificationService';

const CommunityFeesScreen: React.FC = () => {
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [communityFees, setCommunityFees] = useState<CommunityFee[]>([]);
  const [loadingFees, setLoadingFees] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const user = AuthService.getCurrentUser();
  const { currentCompound } = useSelector((state: RootState) => state.community);

  const filterOptions = [
    { value: 'all', label: 'الكل' },
    { value: 'pending', label: 'معلق' },
    { value: 'paid', label: 'مدفوع' },
    { value: 'overdue', label: 'متأخر' },
  ];

  const feeTypes = {
    'maintenance': 'صيانة',
    'security': 'أمن',
    'utilities': 'خدمات',
    'parking': 'مواقف',
    'amenities': 'مرافق',
  };

  useEffect(() => {
    if (user?.id) {
      loadCommunityFees();
    }
  }, [user?.id, selectedFilter]);

  const loadCommunityFees = async () => {
    if (!user?.id) return;
    try {
      setLoadingFees(true);
      const filters = selectedFilter !== 'all' ? { status: selectedFilter } : undefined;
      const response = await CommunityService.getCommunityFees(user.id, filters);
      if (response.success) {
        setCommunityFees(response.data);
      } else {
        Alert.alert('خطأ', response.error || 'فشل في تحميل الرسوم');
      }
    } catch (error) {
      console.error('Error loading community fees:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل الرسوم');
    } finally {
      setLoadingFees(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCommunityFees();
    setRefreshing(false);
  };

  const handlePayFee = async (fee: CommunityFee) => {
    // Show payment method selection
    Alert.alert(
      'اختيار طريقة الدفع',
      `دفع رسوم ${feeTypes[fee.fee_type as keyof typeof feeTypes] || fee.fee_type}\nالمبلغ: ${fee.amount} ج.م`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'بطاقة ائتمان',
          onPress: () => processFeePayment(fee, 'card')
        },
        {
          text: 'تحويل بنكي',
          onPress: () => processFeePayment(fee, 'bank_transfer')
        },
        {
          text: 'محفظة إلكترونية',
          onPress: () => processFeePayment(fee, 'wallet')
        }
      ]
    );
  };

  const processFeePayment = async (fee: CommunityFee, paymentMethod: string) => {
    try {
      // Show processing dialog
      Alert.alert('معالجة الدفع', 'جاري معالجة عملية الدفع...', [], { cancelable: false });

      const response = await CommunityService.payFee(fee.id, paymentMethod);
      
      if (response.success) {
        // Send payment confirmation notification
        await notificationService.sendFeeReminderNotification({
          amount: fee.amount,
          fee_type: feeTypes[fee.fee_type as keyof typeof feeTypes] || fee.fee_type,
          due_date: 'تم الدفع',
          compound_name: currentCompound?.name || 'المجمع'
        });

        Alert.alert(
          'تم بنجاح ✅',
          `تم دفع رسوم ${feeTypes[fee.fee_type as keyof typeof feeTypes]} بمبلغ ${fee.amount} ج.م\n\nرقم المرجع: ${response.data.payment_reference}`,
          [
            {
              text: 'موافق',
              onPress: async () => {
                dispatch(updateFeePaymentStatus({
                  id: fee.id,
                  status: 'paid',
                  payment_reference: response.data.payment_reference
                }));
                await loadCommunityFees();
              }
            }
          ]
        );
      } else {
        Alert.alert('فشل الدفع', response.error || 'حدث خطأ أثناء معالجة الدفع');
      }
    } catch (error) {
      console.error('Error paying fee:', error);
      Alert.alert('خطأ في الدفع', 'حدث خطأ أثناء معالجة عملية الدفع. يرجى المحاولة مرة أخرى.');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': '#f59e0b',
      'paid': '#10b981',
      'overdue': '#ef4444',
      'partial': '#3b82f6',
      'waived': '#6b7280',
    };
    return colors[status] || '#6b7280';
  };

  const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      'pending': 'معلق',
      'paid': 'مدفوع',
      'overdue': 'متأخر',
      'partial': 'جزئي',
      'waived': 'معفى',
    };
    return texts[status] || status;
  };

  const getFeeTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'maintenance': '🔧',
      'security': '🛡️',
      'utilities': '💡',
      'parking': '🚗',
      'amenities': '🏊',
    };
    return icons[type] || '💳';
  };

  const calculateTotals = () => {
    const total = communityFees.reduce((sum, fee) => sum + fee.amount, 0);
    const paid = communityFees
      .filter(fee => fee.payment_status === 'paid')
      .reduce((sum, fee) => sum + fee.amount, 0);
    const pending = communityFees
      .filter(fee => fee.payment_status === 'pending' || fee.payment_status === 'overdue')
      .reduce((sum, fee) => sum + fee.amount, 0);
    
    return { total, paid, pending };
  };

  const { total, paid, pending } = calculateTotals();

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>الرسوم والمستحقات</Text>
          <Text style={styles.subtitle}>
            {currentCompound?.name ? `رسوم ${currentCompound.name}` : 'إدارة الرسوم والمدفوعات'}
          </Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryAmount}>{total} ج.م</Text>
            <Text style={styles.summaryLabel}>إجمالي الرسوم</Text>
          </View>
          <View style={[styles.summaryCard, styles.paidCard]}>
            <Text style={styles.summaryAmount}>{paid} ج.م</Text>
            <Text style={styles.summaryLabel}>مدفوع</Text>
          </View>
          <View style={[styles.summaryCard, styles.pendingCard]}>
            <Text style={styles.summaryAmount}>{pending} ج.م</Text>
            <Text style={styles.summaryLabel}>معلق</Text>
          </View>
        </View>

        {/* Filter Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الفلتر</Text>
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

        {/* Fees List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            الرسوم ({communityFees.length})
          </Text>
          
          {loadingFees ? (
            <ActivityIndicator size="large" color="#2563eb" />
          ) : communityFees.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyTitle}>لا توجد رسوم</Text>
              <Text style={styles.emptyText}>
                {selectedFilter === 'all' 
                  ? 'لا توجد رسوم مسجلة' 
                  : `لا توجد رسوم ${filterOptions.find(f => f.value === selectedFilter)?.label}`
                }
              </Text>
            </View>
          ) : (
            <View style={styles.feesList}>
              {communityFees.map((fee) => (
                <View key={fee.id} style={styles.feeCard}>
                  <View style={styles.feeHeader}>
                    <View style={styles.feeInfo}>
                      <View style={styles.feeTypeRow}>
                        <Text style={styles.feeTypeIcon}>
                          {getFeeTypeIcon(fee.fee_type)}
                        </Text>
                        <Text style={styles.feeTypeName}>
                          {feeTypes[fee.fee_type as keyof typeof feeTypes] || fee.fee_type}
                        </Text>
                      </View>
                      <Text style={styles.feePeriod}>
                        {new Date(fee.billing_period_start).toLocaleDateString('ar-EG')} - 
                        {new Date(fee.billing_period_end).toLocaleDateString('ar-EG')}
                      </Text>
                      <Text style={styles.feeDueDate}>
                        مستحق: {new Date(fee.due_date).toLocaleDateString('ar-EG')}
                      </Text>
                    </View>
                    
                    <View style={styles.feeAmountSection}>
                      <Text style={styles.feeAmount}>{fee.amount} ج.م</Text>
                      <View 
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(fee.payment_status) }
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {getStatusText(fee.payment_status)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {fee.late_fee && fee.late_fee > 0 && (
                    <View style={styles.lateFeeSection}>
                      <Text style={styles.lateFeeLabel}>غرامة تأخير:</Text>
                      <Text style={styles.lateFeeAmount}>+{fee.late_fee} ج.م</Text>
                    </View>
                  )}

                  {fee.discount_applied && fee.discount_applied > 0 && (
                    <View style={styles.discountSection}>
                      <Text style={styles.discountLabel}>خصم:</Text>
                      <Text style={styles.discountAmount}>-{fee.discount_applied} ج.م</Text>
                    </View>
                  )}

                  {fee.payment_date && (
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentDate}>
                        تاريخ الدفع: {new Date(fee.payment_date).toLocaleDateString('ar-EG')}
                      </Text>
                      {fee.payment_reference && (
                        <Text style={styles.paymentReference}>
                          رقم المرجع: {fee.payment_reference}
                        </Text>
                      )}
                    </View>
                  )}

                  {(fee.payment_status === 'pending' || fee.payment_status === 'overdue') && (
                    <TouchableOpacity 
                      style={[
                        styles.payButton,
                        fee.payment_status === 'overdue' && styles.payButtonUrgent
                      ]}
                      onPress={() => handlePayFee(fee)}
                    >
                      <Text style={styles.payButtonText}>
                        دفع {fee.amount + (fee.late_fee || 0)} ج.م
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Payment Methods Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>طرق الدفع المتاحة</Text>
          <View style={styles.paymentMethodsContainer}>
            <View style={styles.paymentMethod}>
              <Text style={styles.paymentMethodIcon}>💳</Text>
              <Text style={styles.paymentMethodText}>فيزا/ماستركارد</Text>
            </View>
            <View style={styles.paymentMethod}>
              <Text style={styles.paymentMethodIcon}>📱</Text>
              <Text style={styles.paymentMethodText}>فودافون كاش</Text>
            </View>
            <View style={styles.paymentMethod}>
              <Text style={styles.paymentMethodIcon}>🏦</Text>
              <Text style={styles.paymentMethodText}>حوالة بنكية</Text>
            </View>
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
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
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
  paidCard: {
    backgroundColor: '#ecfdf5',
  },
  pendingCard: {
    backgroundColor: '#fef3c7',
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
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
  feesList: {
    gap: 12,
  },
  feeCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  feeHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  feeInfo: {
    flex: 1,
  },
  feeTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  feeTypeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  feeTypeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  feePeriod: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  feeDueDate: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
  feeAmountSection: {
    alignItems: 'flex-end',
    gap: 4,
  },
  feeAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
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
  lateFeeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    marginBottom: 8,
  },
  lateFeeLabel: {
    fontSize: 14,
    color: '#ef4444',
  },
  lateFeeAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  discountSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#ecfdf5',
    borderRadius: 6,
    marginBottom: 8,
  },
  discountLabel: {
    fontSize: 14,
    color: '#10b981',
  },
  discountAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  paymentInfo: {
    padding: 8,
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
    marginBottom: 8,
  },
  paymentDate: {
    fontSize: 12,
    color: '#0369a1',
    marginBottom: 2,
  },
  paymentReference: {
    fontSize: 11,
    color: '#0369a1',
    fontFamily: 'monospace',
  },
  payButton: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonUrgent: {
    backgroundColor: '#ef4444',
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentMethodsContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentMethodIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#374151',
  },
});

export default CommunityFeesScreen;