'use client'
import React, { useState, useEffect } from 'react'
import { 
  Calculator, 
  Building2, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Share, 
  Save, 
  ChevronDown,
  X,
  Eye,
  PiggyBank,
  CreditCard,
  BarChart3
} from 'lucide-react'

// Egyptian Banks and their mortgage rates
interface EgyptianBank {
  id: string
  name: string
  nameAr: string
  interestRate: number
  maxLoanAmount: number
  maxTerm: number
  minDownPayment: number
  processingFee: number
  features: string[]
}

interface MortgageCalculation {
  id: string
  propertyPrice: number
  downPayment: number
  loanAmount: number
  interestRate: number
  termYears: number
  monthlyPayment: number
  totalInterest: number
  totalAmount: number
  bankName: string
  calculatedAt: Date
}

interface PaymentScheduleItem {
  month: number
  payment: number
  principal: number
  interest: number
  balance: number
}

interface MortgageCalculatorProps {
  initialPropertyPrice?: number
  className?: string
}

const MortgageCalculator: React.FC<MortgageCalculatorProps> = ({ 
  initialPropertyPrice, 
  className = '' 
}) => {
  // Form state
  const [propertyPrice, setPropertyPrice] = useState(initialPropertyPrice ? initialPropertyPrice.toString() : '')
  const [downPaymentPercent, setDownPaymentPercent] = useState('20')
  const [termYears, setTermYears] = useState('25')
  const [selectedBank, setSelectedBank] = useState<EgyptianBank | null>(null)
  const [monthlyIncome, setMonthlyIncome] = useState('')

  // Results state
  const [calculation, setCalculation] = useState<MortgageCalculation | null>(null)
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([])
  const [savedCalculations, setSavedCalculations] = useState<MortgageCalculation[]>([])

  // UI state
  const [showBankSelector, setShowBankSelector] = useState(false)
  const [showPaymentSchedule, setShowPaymentSchedule] = useState(false)
  const [showSavedCalculations, setShowSavedCalculations] = useState(false)
  const [activeTab, setActiveTab] = useState<'calculator' | 'affordability'>('calculator')

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
  ]

  // Load saved calculations on mount
  useEffect(() => {
    loadSavedCalculations()
  }, [])

  // Format EGP currency
  const formatEGP = (amount: number): string => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: amount >= 1000000 ? 'compact' : 'standard',
    }).format(amount)
  }

  // Calculate mortgage
  const calculateMortgage = () => {
    if (!propertyPrice || !selectedBank || !downPaymentPercent || !termYears) {
      alert('يرجى إدخال جميع البيانات المطلوبة واختيار البنك')
      return
    }

    const price = parseFloat(propertyPrice)
    const downPercent = parseFloat(downPaymentPercent)
    const years = parseInt(termYears)
    const downPayment = (price * downPercent) / 100
    const loanAmount = price - downPayment

    // Check loan limits
    if (loanAmount > selectedBank.maxLoanAmount) {
      alert(`الحد الأقصى للقرض في ${selectedBank.nameAr} هو ${formatEGP(selectedBank.maxLoanAmount)}`)
      return
    }

    if (downPercent < selectedBank.minDownPayment) {
      alert(`الحد الأدنى للمقدم في ${selectedBank.nameAr} هو ${selectedBank.minDownPayment}%`)
      return
    }

    // Calculate monthly payment
    const monthlyRate = selectedBank.interestRate / 100 / 12
    const numPayments = years * 12
    const monthlyPayment = loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1)

    const totalAmount = monthlyPayment * numPayments
    const totalInterest = totalAmount - loanAmount
    const processingFee = loanAmount * (selectedBank.processingFee / 100)

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
    }

    setCalculation(newCalculation)
    generatePaymentSchedule(loanAmount, monthlyPayment, monthlyRate, numPayments)
  }

  // Generate payment schedule
  const generatePaymentSchedule = (
    loanAmount: number,
    monthlyPayment: number,
    monthlyRate: number,
    numPayments: number
  ) => {
    const schedule: PaymentScheduleItem[] = []
    let balance = loanAmount

    for (let month = 1; month <= Math.min(numPayments, 60); month++) { // Show first 5 years
      const interestPayment = balance * monthlyRate
      const principalPayment = monthlyPayment - interestPayment
      balance -= principalPayment

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance),
      })
    }

    setPaymentSchedule(schedule)
  }

  // Calculate affordability
  const calculateAffordability = () => {
    if (!monthlyIncome) {
      alert('يرجى إدخال الدخل الشهري لحساب القدرة على التحمل')
      return
    }

    const income = parseFloat(monthlyIncome)
    const maxMonthlyPayment = income * 0.33 // 33% debt-to-income ratio
    const estimatedRate = 18.5 // Average rate
    const estimatedTerm = 25 // years

    // Calculate maximum loan amount
    const monthlyRate = estimatedRate / 100 / 12
    const numPayments = estimatedTerm * 12
    const maxLoanAmount = maxMonthlyPayment *
      (Math.pow(1 + monthlyRate, numPayments) - 1) /
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments))

    const estimatedDownPayment = maxLoanAmount * 0.2 // 20%
    const maxPropertyPrice = maxLoanAmount + estimatedDownPayment

    alert(
      `تقدير القدرة على التحمل\n\nبناءً على دخلك الشهري:\n\nالحد الأقصى للسعر: ${formatEGP(maxPropertyPrice)}\nالحد الأقصى للقرض: ${formatEGP(maxLoanAmount)}\nالقسط الشهري المقترح: ${formatEGP(maxMonthlyPayment)}\n\nملحوظة: هذا تقدير تقريبي`
    )
  }

  // Save calculation
  const saveCalculation = () => {
    if (!calculation) return

    try {
      const updatedCalculations = [...savedCalculations, calculation]
      setSavedCalculations(updatedCalculations)
      localStorage.setItem('saved_calculations', JSON.stringify(updatedCalculations))
      alert('تم حفظ الحساب بنجاح')
    } catch (error) {
      alert('لم يتم حفظ الحساب')
    }
  }

  // Load saved calculations
  const loadSavedCalculations = () => {
    try {
      const saved = localStorage.getItem('saved_calculations')
      if (saved) {
        setSavedCalculations(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading saved calculations:', error)
    }
  }

  // Share calculation
  const shareCalculation = () => {
    if (!calculation) return

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

تطبيق العقارات المصرية 🇪🇬`

    if (navigator.share) {
      navigator.share({
        title: 'حساب التمويل العقاري',
        text: shareText,
      })
    } else {
      navigator.clipboard.writeText(shareText)
      alert('تم نسخ التفاصيل إلى الحافظة')
    }
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <Calculator className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">🏦 حاسبة التمويل العقاري</h2>
            <p className="text-blue-100">احسب قسطك الشهري مع البنوك المصرية</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
            activeTab === 'calculator'
              ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('calculator')}
        >
          <Calculator className="w-5 h-5 mx-auto mb-1" />
          حاسبة القرض
        </button>
        <button
          className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
            activeTab === 'affordability'
              ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('affordability')}
        >
          <PiggyBank className="w-5 h-5 mx-auto mb-1" />
          حاسبة القدرة
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'calculator' ? (
          <>
            {/* Calculator Form */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                📝 بيانات العقار والقرض
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    سعر العقار (جنيه مصري)
                  </label>
                  <input
                    type="number"
                    value={propertyPrice}
                    onChange={(e) => setPropertyPrice(e.target.value)}
                    placeholder="مثال: 2000000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نسبة المقدم (%)
                  </label>
                  <input
                    type="number"
                    value={downPaymentPercent}
                    onChange={(e) => setDownPaymentPercent(e.target.value)}
                    placeholder="20"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    مدة القرض (سنة)
                  </label>
                  <input
                    type="number"
                    value={termYears}
                    onChange={(e) => setTermYears(e.target.value)}
                    placeholder="25"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    البنك
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowBankSelector(!showBankSelector)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right flex items-center justify-between"
                  >
                    <span>{selectedBank ? selectedBank.nameAr : 'اختر البنك'}</span>
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Bank Selector */}
              {showBankSelector && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {egyptianBanks.map((bank) => (
                    <div
                      key={bank.id}
                      onClick={() => {
                        setSelectedBank(bank)
                        setShowBankSelector(false)
                      }}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedBank?.id === bank.id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                      }`}
                    >
                      <div className="text-right">
                        <h4 className="font-semibold text-gray-800">{bank.nameAr}</h4>
                        <p className="text-sm text-gray-600 mb-2">{bank.name}</p>
                        <div className="space-y-1">
                          <p className="text-sm">
                            <span className="font-medium">معدل الفائدة:</span> {bank.interestRate}%
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">الحد الأقصى:</span> {formatEGP(bank.maxLoanAmount)}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">أقل مقدم:</span> {bank.minDownPayment}%
                          </p>
                        </div>
                        <div className="mt-2">
                          {bank.features.map((feature, index) => (
                            <span key={index} className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full mr-1 mb-1">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={calculateMortgage}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 rtl:space-x-reverse"
              >
                <Calculator className="w-5 h-5" />
                <span>احسب القسط الشهري</span>
              </button>
            </div>

            {/* Results */}
            {calculation && (
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  💰 نتائج الحساب
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {formatEGP(calculation.monthlyPayment)}
                    </div>
                    <div className="text-sm text-gray-600">القسط الشهري</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {formatEGP(calculation.downPayment)}
                    </div>
                    <div className="text-sm text-gray-600">المقدم المطلوب</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {formatEGP(calculation.loanAmount)}
                    </div>
                    <div className="text-sm text-gray-600">مبلغ القرض</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-1">
                      {formatEGP(calculation.totalInterest)}
                    </div>
                    <div className="text-sm text-gray-600">إجمالي الفوائد</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <button
                    onClick={() => setShowPaymentSchedule(true)}
                    className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>📊 جدول السداد</span>
                  </button>
                  <button
                    onClick={shareCalculation}
                    className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Share className="w-4 h-4" />
                    <span>📤 مشاركة</span>
                  </button>
                  <button
                    onClick={saveCalculation}
                    className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>💾 حفظ</span>
                  </button>
                </div>

                {/* Bank Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">تفاصيل البنك المختار</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">البنك:</span> {calculation.bankName}
                    </div>
                    <div>
                      <span className="font-medium">معدل الفائدة:</span> {calculation.interestRate}%
                    </div>
                    <div>
                      <span className="font-medium">مدة القرض:</span> {calculation.termYears} سنة
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Affordability Calculator */
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <PiggyBank className="w-5 h-5 mr-2" />
              💡 حاسبة القدرة على التحمل
            </h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الدخل الشهري (جنيه مصري)
              </label>
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="مثال: 25000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              />
            </div>

            <button
              onClick={calculateAffordability}
              className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 rtl:space-x-reverse mb-6"
            >
              <TrendingUp className="w-5 h-5" />
              <span>احسب القدرة على التحمل</span>
            </button>

            {/* Affordability Tips */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-3">💡 نصائح لحساب القدرة على التحمل</h4>
              <div className="space-y-2 text-sm text-blue-700">
                <p>• يُنصح أن لا يتجاوز القسط الشهري 33% من الدخل الشهري</p>
                <p>• احسب جميع التزاماتك المالية الشهرية الأخرى</p>
                <p>• احتفظ بمبلغ للطوارئ لا يقل عن 6 أشهر من الراتب</p>
                <p>• ضع في الاعتبار تكاليف الصيانة والتأمين</p>
                <p>• فكر في الاستثمارات المستقبلية والادخار</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Schedule Modal */}
      {showPaymentSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">📊 جدول السداد (أول 5 سنوات)</h3>
              <button
                onClick={() => setShowPaymentSchedule(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">شهر</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">قسط</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">أصل</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">فوائد</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">رصيد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paymentSchedule.map((item) => (
                    <tr key={item.month} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.month}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatEGP(item.payment)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatEGP(item.principal)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatEGP(item.interest)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatEGP(item.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Saved Calculations Button */}
      {savedCalculations.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={() => setShowSavedCalculations(!showSavedCalculations)}
            className="w-full flex items-center justify-center space-x-2 rtl:space-x-reverse py-3 px-4 border border-gray-300 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>💾 الحسابات المحفوظة ({savedCalculations.length})</span>
          </button>
          
          {showSavedCalculations && (
            <div className="mt-4 space-y-3 max-h-60 overflow-auto">
              {savedCalculations.map((calc) => (
                <div key={calc.id} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="text-sm">
                      <div className="font-medium">{formatEGP(calc.propertyPrice)} - {calc.bankName}</div>
                      <div className="text-gray-600">
                        القسط: {formatEGP(calc.monthlyPayment)} | مدة: {calc.termYears} سنة
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {calc.calculatedAt.toLocaleDateString('ar-EG')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MortgageCalculator 