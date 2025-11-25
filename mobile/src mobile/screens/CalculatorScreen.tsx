import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Modal,
  FlatList,
  Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

// Get screen dimensions for responsive design
const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CalculatorRouteProp = RouteProp<RootStackParamList, 'Calculator'>;

// Egyptian Banks and their mortgage rates
interface EgyptianBank {
  id: string;
  name: string;
  nameAr: string;
  interestRate: number;
  maxLoanAmount: number;
  maxTerm: number;
  minDownPayment: number;
  processingFee: number;
  features: string[];
}

interface MortgageCalculation {
  id: string;
  propertyPrice: number;
  downPayment: number;
  loanAmount: number;
  interestRate: number;
  termYears: number;
  monthlyPayment: number;
  totalInterest: number;
  totalAmount: number;
  bankName: string;
  calculatedAt: Date;
}

interface PaymentScheduleItem {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

const CalculatorScreen: React.FC = () => {
  const route = useRoute<CalculatorRouteProp>();
  const { initialPropertyPrice } = route.params || {};

  // Form state
  const [propertyPrice, setPropertyPrice] = useState(initialPropertyPrice ? initialPropertyPrice.toString() : '');
  const [downPaymentPercent, setDownPaymentPercent] = useState('20');
  const [termYears, setTermYears] = useState('25');
  const [selectedBank, setSelectedBank] = useState<EgyptianBank | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState('');

  // Results state
  const [calculation, setCalculation] = useState<MortgageCalculation | null>(null);
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([]);
  const [savedCalculations, setSavedCalculations] = useState<MortgageCalculation[]>([]);

  // UI state
  const [showBankSelector, setShowBankSelector] = useState(false);
  const [showPaymentSchedule, setShowPaymentSchedule] = useState(false);
  const [showSavedCalculations, setShowSavedCalculations] = useState(false);
  const [activeTab, setActiveTab] = useState<'calculator' | 'affordability'>('calculator');

  // Egyptian Banks Data
  const egyptianBanks: EgyptianBank[] = [
    {
      id: 'nbe',
      name: 'National Bank of Egypt',
      nameAr: 'البنك الأهلي المصري',
      interestRate: 18.5,
      maxLoanAmount: 15000000, // 15M EGP
      maxTerm: 30,
      minDownPayment: 20,
      processingFee: 1.5,
      features: ['أول بنك في مصر', 'شروط ميسرة', 'خدمة عملاء ممتازة']
    },
    {
      id: 'cib',
      name: 'Commercial International Bank',
      nameAr: 'البنك التجاري الدولي',
      interestRate: 17.75,
      maxLoanAmount: 20000000,
      maxTerm: 25,
      minDownPayment: 15,
      processingFee: 1.25,
      features: ['أسعار فائدة تنافسية', 'إجراءات سريعة', 'تمويل يصل إلى 85%']
    },
    {
      id: 'qnb',
      name: 'QNB Al Ahli Bank',
      nameAr: 'بنك قطر الوطني الأهلي',
      interestRate: 18.25,
      maxLoanAmount: 12000000,
      maxTerm: 30,
      minDownPayment: 20,
      processingFee: 1.0,
      features: ['رسوم إدارية منخفضة', 'مرونة في السداد', 'خدمات رقمية متطورة']
    },
    {
      id: 'aaib',
      name: 'Arab African International Bank',
      nameAr: 'البنك العربي الأفريقي',
      interestRate: 19.0,
      maxLoanAmount: 10000000,
      maxTerm: 25,
      minDownPayment: 25,
      processingFee: 1.75,
      features: ['خبرة في التمويل العقاري', 'استشارة مجانية', 'تقييم سريع للعقار']
    },
    {
      id: 'banque_misr',
      name: 'Banque Misr',
      nameAr: 'بنك مصر',
      interestRate: 18.75,
      maxLoanAmount: 8000000,
      maxTerm: 30,
      minDownPayment: 20,
      processingFee: 1.5,
      features: ['بنك حكومي موثوق', 'شروط مرنة', 'فروع في جميع المحافظات']
    }
  ];

  // Load saved calculations on mount
  useEffect(() => {
    loadSavedCalculations();
  }, []);

  // Format EGP currency
  const formatEGP = (amount: number): string => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: amount >= 1000000 ? 'compact' : 'standard',
    }).format(amount);
  };

  // Calculate mortgage
  const calculateMortgage = () => {
    if (!propertyPrice || !selectedBank || !downPaymentPercent || !termYears) {
      Alert.alert('بيانات ناقصة', 'يرجى إدخال جميع البيانات المطلوبة');
      return;
    }

    const price = parseFloat(propertyPrice);
    const downPercent = parseFloat(downPaymentPercent);
    const years = parseInt(termYears);
    const downPayment = (price * downPercent) / 100;
    const loanAmount = price - downPayment;

    // Check loan limits
    if (loanAmount > selectedBank.maxLoanAmount) {
      Alert.alert(
        'تجاوز الحد الأقصى',
        `الحد الأقصى للقرض في ${selectedBank.nameAr} هو ${formatEGP(selectedBank.maxLoanAmount)}`
      );
      return;
    }

    if (downPercent < selectedBank.minDownPayment) {
      Alert.alert(
        'مقدم أقل من المطلوب',
        `الحد الأدنى للمقدم في ${selectedBank.nameAr} هو ${selectedBank.minDownPayment}%`
      );
      return;
    }

    // Calculate monthly payment
    const monthlyRate = selectedBank.interestRate / 100 / 12;
    const numPayments = years * 12;
    const monthlyPayment = loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);

    const totalAmount = monthlyPayment * numPayments;
    const totalInterest = totalAmount - loanAmount;
    const processingFee = loanAmount * (selectedBank.processingFee / 100);

    const newCalculation: MortgageCalculation = {
      id: Date.now().toString(),
      propertyPrice: price,
      downPayment,
      loanAmount,
      interestRate: selectedBank.interestRate,
      termYears: years,
      monthlyPayment: monthlyPayment + (processingFee / numPayments),
      totalInterest,
      totalAmount: totalAmount + processingFee,
      bankName: selectedBank.nameAr,
      calculatedAt: new Date(),
    };

    setCalculation(newCalculation);
    generatePaymentSchedule(loanAmount, monthlyPayment, monthlyRate, numPayments);
  };

  // Generate payment schedule
  const generatePaymentSchedule = (
    loanAmount: number,
    monthlyPayment: number,
    monthlyRate: number,
    numPayments: number
  ) => {
    const schedule: PaymentScheduleItem[] = [];
    let balance = loanAmount;

    for (let month = 1; month <= Math.min(numPayments, 60); month++) { // Show first 5 years
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance),
      });
    }

    setPaymentSchedule(schedule);
  };

  // Calculate affordability
  const calculateAffordability = () => {
    if (!monthlyIncome) {
      Alert.alert('دخل شهري مطلوب', 'يرجى إدخال الدخل الشهري لحساب القدرة على التحمل');
      return;
    }

    const income = parseFloat(monthlyIncome);
    const maxMonthlyPayment = income * 0.33; // 33% debt-to-income ratio
    const estimatedRate = 18.5; // Average rate
    const estimatedTerm = 25; // years

    // Calculate maximum loan amount
    const monthlyRate = estimatedRate / 100 / 12;
    const numPayments = estimatedTerm * 12;
    const maxLoanAmount = maxMonthlyPayment *
      (Math.pow(1 + monthlyRate, numPayments) - 1) /
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments));

    const estimatedDownPayment = maxLoanAmount * 0.2; // 20%
    const maxPropertyPrice = maxLoanAmount + estimatedDownPayment;

    Alert.alert(
      'تقدير القدرة على التحمل',
      `بناءً على دخلك الشهري:\n\nالحد الأقصى للسعر: ${formatEGP(maxPropertyPrice)}\nالحد الأقصى للقرض: ${formatEGP(maxLoanAmount)}\nالقسط الشهري المقترح: ${formatEGP(maxMonthlyPayment)}\n\nملحوظة: هذا تقدير تقريبي`,
      [{ text: 'حسناً', style: 'default' }]
    );
  };

  // Save calculation
  const saveCalculation = async () => {
    if (!calculation) return;

    try {
      const updatedCalculations = [...savedCalculations, calculation];
      setSavedCalculations(updatedCalculations);
      await AsyncStorage.setItem('saved_calculations', JSON.stringify(updatedCalculations));
      Alert.alert('تم الحفظ', 'تم حفظ الحساب بنجاح');
    } catch (error) {
      Alert.alert('خطأ في الحفظ', 'لم يتم حفظ الحساب');
    }
  };

  // Load saved calculations
  const loadSavedCalculations = async () => {
    try {
      const saved = await AsyncStorage.getItem('saved_calculations');
      if (saved) {
        setSavedCalculations(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved calculations:', error);
    }
  };

  // Share calculation
  const shareCalculation = () => {
    if (!calculation) return;

    const shareText = `حساب التمويل العقاري 🏠

سعر العقار: ${formatEGP(calculation.propertyPrice)}
المقدم: ${formatEGP(calculation.downPayment)}
مبلغ القرض: ${formatEGP(calculation.loanAmount)}
البنك: ${calculation.bankName}
معدل الفائدة: ${calculation.interestRate}%
مدة القرض: ${calculation.termYears} سنة

القسط الشهري: ${formatEGP(calculation.monthlyPayment)}
إجمالي الفوائد: ${formatEGP(calculation.totalInterest)}
إجمالي المبلغ: ${formatEGP(calculation.totalAmount)}

تطبيق العقارات المصرية 🇪🇬`;

    Share.share({
      message: shareText,
      title: 'حساب التمويل العقاري',
    });
  };

  // Render bank selector
  const renderBankSelector = () => (
    <Modal visible={showBankSelector} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>اختر البنك</Text>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowBankSelector(false)}
          >
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={egyptianBanks}
          keyExtractor={(item) => item.id}
          renderItem={({ item: bank }) => (
            <TouchableOpacity
              style={[
                styles.bankItem,
                selectedBank?.id === bank.id && styles.bankItemSelected,
              ]}
              onPress={() => {
                setSelectedBank(bank);
                setShowBankSelector(false);
              }}
            >
              <View style={styles.bankInfo}>
                <Text style={styles.bankName}>{bank.name}</Text>
                <Text style={styles.bankNameAr}>{bank.nameAr}</Text>
                <Text style={styles.bankRate}>معدل الفائدة: {bank.interestRate}%</Text>
                <Text style={styles.bankDetails}>
                  الحد الأقصى: {formatEGP(bank.maxLoanAmount)} | مدة: {bank.maxTerm} سنة
                </Text>
              </View>
              <View style={styles.bankFeatures}>
                {bank.features.slice(0, 2).map((feature, index) => (
                  <Text key={index} style={styles.bankFeature}>• {feature}</Text>
                ))}
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );

  // Render payment schedule
  const renderPaymentSchedule = () => (
    <Modal visible={showPaymentSchedule} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>جدول السداد (أول 5 سنوات)</Text>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowPaymentSchedule(false)}
          >
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scheduleHeader}>
          <Text style={styles.scheduleHeaderText}>شهر</Text>
          <Text style={styles.scheduleHeaderText}>قسط</Text>
          <Text style={styles.scheduleHeaderText}>أصل</Text>
          <Text style={styles.scheduleHeaderText}>فوائد</Text>
          <Text style={styles.scheduleHeaderText}>رصيد</Text>
        </View>

        <FlatList
          data={paymentSchedule}
          keyExtractor={(item) => item.month.toString()}
          renderItem={({ item }) => (
            <View style={styles.scheduleRow}>
              <Text style={styles.scheduleCell}>{item.month}</Text>
              <Text style={styles.scheduleCell}>{formatEGP(item.payment)}</Text>
              <Text style={styles.scheduleCell}>{formatEGP(item.principal)}</Text>
              <Text style={styles.scheduleCell}>{formatEGP(item.interest)}</Text>
              <Text style={styles.scheduleCell}>{formatEGP(item.balance)}</Text>
            </View>
          )}
        />
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🏦 حاسبة التمويل العقاري</Text>
          <Text style={styles.headerSubtitle}>احسب قسطك الشهري مع البنوك المصرية</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'calculator' && styles.activeTab]}
            onPress={() => setActiveTab('calculator')}
          >
            <Text style={[styles.tabText, activeTab === 'calculator' && styles.activeTabText]}>
              حاسبة القرض
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'affordability' && styles.activeTab]}
            onPress={() => setActiveTab('affordability')}
          >
            <Text style={[styles.tabText, activeTab === 'affordability' && styles.activeTabText]}>
              حاسبة القدرة
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'calculator' ? (
          <>
            {/* Calculator Form */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📝 بيانات العقار والقرض</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>سعر العقار (جنيه مصري)</Text>
                <TextInput
                  style={styles.textInput}
                  value={propertyPrice}
                  onChangeText={setPropertyPrice}
                  placeholder="مثال: 2000000"
                  keyboardType="numeric"
                  textAlign="right"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>نسبة المقدم (%)</Text>
                <TextInput
                  style={styles.textInput}
                  value={downPaymentPercent}
                  onChangeText={setDownPaymentPercent}
                  placeholder="20"
                  keyboardType="numeric"
                  textAlign="right"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>مدة القرض (سنة)</Text>
                <TextInput
                  style={styles.textInput}
                  value={termYears}
                  onChangeText={setTermYears}
                  placeholder="25"
                  keyboardType="numeric"
                  textAlign="right"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>البنك</Text>
                <TouchableOpacity
                  style={styles.bankSelector}
                  onPress={() => setShowBankSelector(true)}
                >
                  <Text style={styles.bankSelectorText}>
                    {selectedBank ? selectedBank.nameAr : 'اختر البنك'}
                  </Text>
                  <Text style={styles.bankSelectorArrow}>👇</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.calculateButton} onPress={calculateMortgage}>
                <Text style={styles.calculateButtonText}>احسب القسط الشهري</Text>
              </TouchableOpacity>
            </View>

            {/* Results */}
            {calculation && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💰 نتائج الحساب</Text>
                
                <View style={styles.resultsGrid}>
                  <View style={styles.resultCard}>
                    <Text style={styles.resultValue}>{formatEGP(calculation.monthlyPayment)}</Text>
                    <Text style={styles.resultLabel}>القسط الشهري</Text>
                  </View>
                  <View style={styles.resultCard}>
                    <Text style={styles.resultValue}>{formatEGP(calculation.downPayment)}</Text>
                    <Text style={styles.resultLabel}>المقدم المطلوب</Text>
                  </View>
                  <View style={styles.resultCard}>
                    <Text style={styles.resultValue}>{formatEGP(calculation.loanAmount)}</Text>
                    <Text style={styles.resultLabel}>مبلغ القرض</Text>
                  </View>
                  <View style={styles.resultCard}>
                    <Text style={styles.resultValue}>{formatEGP(calculation.totalInterest)}</Text>
                    <Text style={styles.resultLabel}>إجمالي الفوائد</Text>
                  </View>
                </View>

                <View style={styles.resultsActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={saveCalculation}>
                    <Text style={styles.actionButtonText}>💾 حفظ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={shareCalculation}>
                    <Text style={styles.actionButtonText}>📤 مشاركة</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setShowPaymentSchedule(true)}
                  >
                    <Text style={styles.actionButtonText}>📊 جدول السداد</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        ) : (
          /* Affordability Calculator */
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 احسب قدرتك على الشراء</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>الدخل الشهري الصافي (جنيه مصري)</Text>
              <TextInput
                style={styles.textInput}
                value={monthlyIncome}
                onChangeText={setMonthlyIncome}
                placeholder="مثال: 25000"
                keyboardType="numeric"
                textAlign="right"
              />
            </View>

            <TouchableOpacity style={styles.calculateButton} onPress={calculateAffordability}>
              <Text style={styles.calculateButtonText}>احسب القدرة على الشراء</Text>
            </TouchableOpacity>

            <View style={styles.affordabilityTips}>
              <Text style={styles.tipsTitle}>💡 نصائح مهمة:</Text>
              <Text style={styles.tipItem}>• يُنصح بألا يتجاوز القسط 33% من الدخل</Text>
              <Text style={styles.tipItem}>• احتفظ بمبلغ للطوارئ (6 أشهر مصاريف)</Text>
              <Text style={styles.tipItem}>• انتبه للمصاريف الإضافية (رسوم - تأمين)</Text>
              <Text style={styles.tipItem}>• قارن عروض البنوك المختلفة</Text>
            </View>
          </View>
        )}

        {/* Saved Calculations Button */}
        {savedCalculations.length > 0 && (
          <TouchableOpacity
            style={styles.savedCalculationsButton}
            onPress={() => setShowSavedCalculations(true)}
          >
            <Text style={styles.savedCalculationsButtonText}>
              📋 الحسابات المحفوظة ({savedCalculations.length})
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modals */}
      {renderBankSelector()}
      {renderPaymentSchedule()}
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

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2563eb',
    fontWeight: '600',
  },

  // Sections
  section: {
    backgroundColor: '#ffffff',
    marginBottom: 8,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'right',
  },

  // Form Inputs
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
    textAlign: 'right',
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    textAlign: 'right',
  },
  bankSelector: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankSelectorText: {
    fontSize: 16,
    color: '#374151',
  },
  bankSelectorArrow: {
    fontSize: 16,
  },

  // Calculate Button
  calculateButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  calculateButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Results
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  resultCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
  },
  resultValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  resultLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  resultsActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },

  // Affordability Tips
  affordabilityTips: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'right',
  },
  tipItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    textAlign: 'right',
    lineHeight: 20,
  },

  // Saved Calculations
  savedCalculationsButton: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 8,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  savedCalculationsButtonText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#6b7280',
  },

  // Bank Selector
  bankItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  bankItemSelected: {
    backgroundColor: '#eff6ff',
  },
  bankInfo: {
    marginBottom: 8,
  },
  bankName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  bankNameAr: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  bankRate: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
    marginTop: 4,
  },
  bankDetails: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  bankFeatures: {
    marginTop: 8,
  },
  bankFeature: {
    fontSize: 12,
    color: '#059669',
    marginBottom: 2,
  },

  // Payment Schedule
  scheduleHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  scheduleHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
  },
  scheduleRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  scheduleCell: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },

  bottomSpacer: {
    height: 20,
  },
});

export default CalculatorScreen; 