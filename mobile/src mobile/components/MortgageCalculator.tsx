import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  Share,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Egyptian Banks and their mortgage rates (matching web version)
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

interface MortgageCalculatorProps {
  initialPropertyPrice?: number;
  visible: boolean;
  onClose: () => void;
}

const MortgageCalculator: React.FC<MortgageCalculatorProps> = ({
  initialPropertyPrice,
  visible,
  onClose,
}) => {
  // Form state
  const [propertyPrice, setPropertyPrice] = useState(
    initialPropertyPrice ? initialPropertyPrice.toString() : ''
  );
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
  const [calculating, setCalculating] = useState(false);

  // Egyptian Banks Data (matching web version)
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
      features: ['فوائد تنافسية', 'سداد مبكر', 'خدمة عملاء 24/7'],
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
      features: ['أقل دفعة أولى', 'معالجة سريعة', 'استشارة مجانية'],
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
      features: ['رسوم أقل', 'مرونة في السداد', 'عروض خاصة'],
    },
    {
      id: 'aaib',
      name: 'Arab African International Bank',
      nameAr: 'البنك العربي الأفريقي الدولي',
      interestRate: 19.0,
      maxLoanAmount: 10000000,
      maxTerm: 25,
      minDownPayment: 25,
      processingFee: 1.75,
      features: ['خدمة شخصية', 'تمويل سريع', 'مساعدة قانونية'],
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
      features: ['فوائد تنافسية', 'سداد مبكر', 'تغطية شاملة'],
    },
  ];

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
  const calculateMortgage = async () => {
    if (!propertyPrice || !selectedBank || !downPaymentPercent || !termYears) {
      Alert.alert('بيانات ناقصة', 'يرجى إدخال جميع البيانات المطلوبة');
      return;
    }

    setCalculating(true);

    try {
      const price = parseFloat(propertyPrice);
      const downPercent = parseFloat(downPaymentPercent);
      const years = parseInt(termYears);
      const downPayment = (price * downPercent) / 100;
      const loanAmount = price - downPayment;

      // Check loan limits
      if (loanAmount > selectedBank.maxLoanAmount) {
        Alert.alert(
          'تجاوز حد القرض',
          `الحد الأقصى للقرض في ${selectedBank.nameAr} هو ${formatEGP(selectedBank.maxLoanAmount)}`
        );
        setCalculating(false);
        return;
      }

      if (downPercent < selectedBank.minDownPayment) {
        Alert.alert(
          'الدفعة الأولى قليلة',
          `الحد الأدنى للدفعة الأولى في ${selectedBank.nameAr} هو ${selectedBank.minDownPayment}%`
        );
        setCalculating(false);
        return;
      }

      // Calculate monthly payment
      const monthlyRate = selectedBank.interestRate / 100 / 12;
      const numPayments = years * 12;
      const monthlyPayment =
        (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
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
        monthlyPayment: monthlyPayment + processingFee / numPayments,
        totalInterest,
        totalAmount: totalAmount + processingFee,
        bankName: selectedBank.nameAr,
        calculatedAt: new Date(),
      };

      setCalculation(newCalculation);
      generatePaymentSchedule(loanAmount, monthlyPayment, monthlyRate, numPayments);
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء الحساب');
    } finally {
      setCalculating(false);
    }
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

    for (let month = 1; month <= Math.min(numPayments, 60); month++) {
      // Show first 5 years
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
      Alert.alert('بيانات ناقصة', 'يرجى إدخال الدخل الشهري');
      return;
    }

    const income = parseFloat(monthlyIncome);
    const maxMonthlyPayment = income * 0.33; // 33% debt-to-income ratio
    const estimatedRate = 18.5; // Average rate
    const estimatedTerm = 25; // years

    // Calculate maximum loan amount
    const monthlyRate = estimatedRate / 100 / 12;
    const numPayments = estimatedTerm * 12;
    const maxLoanAmount =
      (maxMonthlyPayment * (Math.pow(1 + monthlyRate, numPayments) - 1)) /
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments));

    const estimatedDownPayment = maxLoanAmount * 0.2; // 20%
    const maxPropertyPrice = maxLoanAmount + estimatedDownPayment;

    Alert.alert(
      'نتيجة حساب القدرة على التحمل',
      `بناءً على دخلك الشهري:\n\nأقصى سعر عقار: ${formatEGP(maxPropertyPrice)}\nأقصى مبلغ قرض: ${formatEGP(maxLoanAmount)}\nالقسط الموصى به: ${formatEGP(maxMonthlyPayment)}\n\nهذه تقديرات تقريبية`
    );
  };

  // Save calculation
  const saveCalculation = async () => {
    if (!calculation) return;

    try {
      const updatedCalculations = [...savedCalculations, calculation];
      setSavedCalculations(updatedCalculations);
      await AsyncStorage.setItem('saved_calculations', JSON.stringify(updatedCalculations));
      Alert.alert('تم', 'تم حفظ الحساب بنجاح');
    } catch (error) {
      Alert.alert('خطأ', 'فشل في حفظ الحساب');
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
  const shareCalculation = async () => {
    if (!calculation) return;

    const shareText = `حاسبة التمويل العقاري 🏠

سعر العقار: ${formatEGP(calculation.propertyPrice)}
الدفعة الأولى: ${formatEGP(calculation.downPayment)}
مبلغ القرض: ${formatEGP(calculation.loanAmount)}
البنك: ${calculation.bankName}
سعر الفائدة: ${calculation.interestRate}%
مدة القرض: ${calculation.termYears} سنة

القسط الشهري: ${formatEGP(calculation.monthlyPayment)}
إجمالي الفوائد: ${formatEGP(calculation.totalInterest)}
إجمالي المبلغ: ${formatEGP(calculation.totalAmount)}

تطبيق العقارات المصرية`;

    try {
      await Share.share({
        message: shareText,
        title: 'حاسبة التمويل العقاري',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // Bank Selection Component
  const BankSelector = () => (
    <Modal visible={showBankSelector} animationType="slide" onRequestClose={() => setShowBankSelector(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>اختر البنك</Text>
          <TouchableOpacity onPress={() => setShowBankSelector(false)} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={egyptianBanks}
          keyExtractor={(item) => item.id}
          style={styles.bankList}
          renderItem={({ item: bank }) => (
            <TouchableOpacity
              style={[
                styles.bankCard,
                selectedBank?.id === bank.id && styles.selectedBankCard,
              ]}
              onPress={() => {
                setSelectedBank(bank);
                setShowBankSelector(false);
              }}
            >
              <View style={styles.bankCardHeader}>
                <Text style={styles.bankName}>{bank.nameAr}</Text>
                <Text style={styles.bankNameEn}>{bank.name}</Text>
              </View>

              <View style={styles.bankDetails}>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>سعر الفائدة:</Text>
                  <Text style={styles.bankDetailValue}>{bank.interestRate}%</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>أقصى مبلغ:</Text>
                  <Text style={styles.bankDetailValue}>{formatEGP(bank.maxLoanAmount)}</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>أقل دفعة أولى:</Text>
                  <Text style={styles.bankDetailValue}>{bank.minDownPayment}%</Text>
                </View>
              </View>

              <View style={styles.bankFeatures}>
                {bank.features.slice(0, 2).map((feature, index) => (
                  <Text key={index} style={styles.bankFeature}>
                    ✅ {feature}
                  </Text>
                ))}
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );

  // Payment Schedule Component
  const PaymentScheduleModal = () => (
    <Modal visible={showPaymentSchedule} animationType="slide" onRequestClose={() => setShowPaymentSchedule(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>📊 جدولة السداد</Text>
          <TouchableOpacity onPress={() => setShowPaymentSchedule(false)} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scheduleHeader}>
          <Text style={styles.scheduleHeaderText}>الشهر</Text>
          <Text style={styles.scheduleHeaderText}>القسط</Text>
          <Text style={styles.scheduleHeaderText}>أصل المبلغ</Text>
          <Text style={styles.scheduleHeaderText}>الفوائد</Text>
          <Text style={styles.scheduleHeaderText}>الرصيد</Text>
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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🏦 حاسبة التمويل العقاري</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'calculator' && styles.activeTab]}
            onPress={() => setActiveTab('calculator')}
          >
            <Text style={[styles.tabText, activeTab === 'calculator' && styles.activeTabText]}>
              💰 حاسبة القرض
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'affordability' && styles.activeTab]}
            onPress={() => setActiveTab('affordability')}
          >
            <Text style={[styles.tabText, activeTab === 'affordability' && styles.activeTabText]}>
              📊 القدرة على التحمل
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'calculator' ? (
            <>
              {/* Property & Loan Inputs */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🏠 تفاصيل العقار والقرض</Text>

                <View style={styles.inputContainer}>
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

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>نسبة الدفعة الأولى (%)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={downPaymentPercent}
                    onChangeText={setDownPaymentPercent}
                    placeholder="مثال: 20"
                    keyboardType="numeric"
                    textAlign="right"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>مدة القرض (سنة)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={termYears}
                    onChangeText={setTermYears}
                    placeholder="مثال: 25"
                    keyboardType="numeric"
                    textAlign="right"
                  />
                </View>

                {/* Bank Selection */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>البنك المختار</Text>
                  <TouchableOpacity style={styles.bankSelector} onPress={() => setShowBankSelector(true)}>
                    <Text style={styles.bankSelectorText}>
                      {selectedBank ? selectedBank.nameAr : 'اختر البنك'}
                    </Text>
                    <Text style={styles.bankSelectorArrow}>⌄</Text>
                  </TouchableOpacity>
                  {selectedBank && (
                    <View style={styles.selectedBankInfo}>
                      <Text style={styles.selectedBankDetail}>
                        سعر الفائدة: {selectedBank.interestRate}%
                      </Text>
                      <Text style={styles.selectedBankDetail}>
                        أقصى مبلغ: {formatEGP(selectedBank.maxLoanAmount)}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.calculateButton}
                  onPress={calculateMortgage}
                  disabled={calculating}
                >
                  {calculating ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.calculateButtonText}>💰 احسب القسط الشهري</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Results */}
              {calculation && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>📊 نتائج الحساب</Text>

                  {/* Main Payment Display */}
                  <View style={styles.mainResult}>
                    <Text style={styles.mainResultLabel}>القسط الشهري</Text>
                    <Text style={styles.mainResultValue}>{formatEGP(calculation.monthlyPayment)}</Text>
                    <Text style={styles.mainResultSubtitle}>
                      لمدة {calculation.termYears} سنة
                    </Text>
                  </View>

                  {/* Secondary Details */}
                  <View style={styles.resultsGrid}>
                    <View style={styles.resultCard}>
                      <Text style={styles.resultCardLabel}>الدفعة الأولى</Text>
                      <Text style={styles.resultCardValue}>{formatEGP(calculation.downPayment)}</Text>
                    </View>
                    <View style={styles.resultCard}>
                      <Text style={styles.resultCardLabel}>مبلغ القرض</Text>
                      <Text style={styles.resultCardValue}>{formatEGP(calculation.loanAmount)}</Text>
                    </View>
                    <View style={styles.resultCard}>
                      <Text style={styles.resultCardLabel}>إجمالي الفوائد</Text>
                      <Text style={styles.resultCardValue}>{formatEGP(calculation.totalInterest)}</Text>
                    </View>
                    <View style={styles.resultCard}>
                      <Text style={styles.resultCardLabel}>إجمالي المبلغ</Text>
                      <Text style={styles.resultCardValue}>{formatEGP(calculation.totalAmount)}</Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => setShowPaymentSchedule(true)}
                    >
                      <Text style={styles.actionButtonText}>📊 جدولة السداد</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={shareCalculation}>
                      <Text style={styles.actionButtonText}>📤 مشاركة</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveButton} onPress={saveCalculation}>
                      <Text style={styles.saveButtonText}>💾 حفظ</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Bank Details */}
                  <View style={styles.bankDetailsCard}>
                    <Text style={styles.bankDetailsTitle}>تفاصيل البنك المختار</Text>
                    <Text style={styles.bankDetailsText}>البنك: {calculation.bankName}</Text>
                    <Text style={styles.bankDetailsText}>سعر الفائدة: {calculation.interestRate}%</Text>
                    <Text style={styles.bankDetailsText}>مدة القرض: {calculation.termYears} سنة</Text>
                  </View>
                </View>
              )}
            </>
          ) : (
            /* Affordability Calculator */
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 حاسبة القدرة على التحمل</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>الدخل الشهري (جنيه مصري)</Text>
                <TextInput
                  style={styles.textInput}
                  value={monthlyIncome}
                  onChangeText={setMonthlyIncome}
                  placeholder="مثال: 15000"
                  keyboardType="numeric"
                  textAlign="right"
                />
              </View>

              <TouchableOpacity style={styles.calculateButton} onPress={calculateAffordability}>
                <Text style={styles.calculateButtonText}>📊 احسب القدرة على التحمل</Text>
              </TouchableOpacity>

              {/* Affordability Tips */}
              <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>💡 نصائح مهمة</Text>
                <Text style={styles.tipText}>• يُنصح ألا يتجاوز القسط 33% من الدخل الشهري</Text>
                <Text style={styles.tipText}>• احتفظ بمدخرات للطوارئ لمدة 6 أشهر</Text>
                <Text style={styles.tipText}>• احسب جميع التكاليف الإضافية</Text>
                <Text style={styles.tipText}>• قارن بين عروض البنوك المختلفة</Text>
                <Text style={styles.tipText}>• تأكد من استقرار الدخل قبل الالتزام</Text>
              </View>
            </View>
          )}

          {/* Saved Calculations */}
          {savedCalculations.length > 0 && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.savedCalculationsToggle}
                onPress={() => setShowSavedCalculations(!showSavedCalculations)}
              >
                <Text style={styles.savedCalculationsToggleText}>
                  💾 الحسابات المحفوظة ({savedCalculations.length})
                </Text>
              </TouchableOpacity>

              {showSavedCalculations && (
                <View style={styles.savedCalculationsList}>
                  {savedCalculations.map((calc) => (
                    <View key={calc.id} style={styles.savedCalculationCard}>
                      <Text style={styles.savedCalculationTitle}>
                        {formatEGP(calc.propertyPrice)} - {calc.bankName}
                      </Text>
                      <Text style={styles.savedCalculationDetails}>
                        القسط الشهري: {formatEGP(calc.monthlyPayment)} | المدة: {calc.termYears} سنة
                      </Text>
                      <Text style={styles.savedCalculationDate}>
                        {new Date(calc.calculatedAt).toLocaleDateString('ar-EG')}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <BankSelector />
        <PaymentScheduleModal />
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
  },
  title: {
    fontSize: 20,
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
    fontSize: 18,
    color: '#64748b',
    fontWeight: 'bold',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  activeTab: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#2563eb',
  },

  // Content
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'right',
  },

  // Inputs
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'right',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },

  // Bank Selector
  bankSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  bankSelectorText: {
    fontSize: 16,
    color: '#374151',
  },
  bankSelectorArrow: {
    fontSize: 16,
    color: '#6b7280',
  },
  selectedBankInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
  },
  selectedBankDetail: {
    fontSize: 12,
    color: '#0369a1',
    textAlign: 'right',
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
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Results
  mainResult: {
    backgroundColor: '#f0f9ff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  mainResultLabel: {
    fontSize: 14,
    color: '#0369a1',
    marginBottom: 4,
  },
  mainResultValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1d4ed8',
    marginBottom: 4,
  },
  mainResultSubtitle: {
    fontSize: 12,
    color: '#0369a1',
  },

  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  resultCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resultCardLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    textAlign: 'center',
  },
  resultCardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  saveButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },

  // Bank Details Card
  bankDetailsCard: {
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bankDetailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'right',
  },
  bankDetailsText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    textAlign: 'right',
  },

  // Tips
  tipsContainer: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 12,
    textAlign: 'right',
  },
  tipText: {
    fontSize: 14,
    color: '#166534',
    marginBottom: 6,
    textAlign: 'right',
  },

  // Saved Calculations
  savedCalculationsToggle: {
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  savedCalculationsToggleText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  savedCalculationsList: {
    marginTop: 12,
  },
  savedCalculationCard: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  savedCalculationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'right',
  },
  savedCalculationDetails: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    textAlign: 'right',
  },
  savedCalculationDate: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'right',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },

  // Bank List
  bankList: {
    flex: 1,
    padding: 16,
  },
  bankCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  selectedBankCard: {
    borderColor: '#2563eb',
    backgroundColor: '#f0f9ff',
  },
  bankCardHeader: {
    marginBottom: 12,
  },
  bankName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'right',
  },
  bankNameEn: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
  },
  bankDetails: {
    marginBottom: 12,
  },
  bankDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bankDetailLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  bankDetailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  bankFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  bankFeature: {
    fontSize: 10,
    color: '#059669',
    marginRight: 8,
    marginBottom: 4,
  },

  // Payment Schedule
  scheduleHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  scheduleHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
  },
  scheduleRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  scheduleCell: {
    flex: 1,
    fontSize: 10,
    color: '#374151',
    textAlign: 'center',
  },
});

export default MortgageCalculator;