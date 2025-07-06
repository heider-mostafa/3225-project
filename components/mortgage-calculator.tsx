'use client'
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

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

  // Egyptian Banks Data with localized features
  const getBankFeatures = (bankId: string) => {
    const featureMap = {
      nbe: [t('mortgageCalculator.bankFeature1'), t('mortgageCalculator.bankFeature2'), t('mortgageCalculator.bankFeature3')],
      cib: [t('mortgageCalculator.bankFeature4'), t('mortgageCalculator.bankFeature5'), t('mortgageCalculator.bankFeature6')],
      qnb: [t('mortgageCalculator.bankFeature7'), t('mortgageCalculator.bankFeature8'), t('mortgageCalculator.bankFeature9')],
      aaib: [t('mortgageCalculator.bankFeature10'), t('mortgageCalculator.bankFeature11'), t('mortgageCalculator.bankFeature12')],
      banque_misr: [t('mortgageCalculator.bankFeature13'), t('mortgageCalculator.bankFeature2'), t('mortgageCalculator.bankFeature14')]
    }
    return featureMap[bankId as keyof typeof featureMap] || []
  }

  const egyptianBanks: EgyptianBank[] = [
    {
      id: 'nbe',
      name: 'National Bank of Egypt',
      nameAr: t('mortgageCalculator.nationalBankEgypt'),
      interestRate: 18.5,
      maxLoanAmount: 15000000, // 15M EGP
      maxTerm: 30,
      minDownPayment: 20,
      processingFee: 1.5,
      features: getBankFeatures('nbe')
    },
    {
      id: 'cib',
      name: 'Commercial International Bank',
      nameAr: t('mortgageCalculator.cib'),
      interestRate: 17.75,
      maxLoanAmount: 20000000,
      maxTerm: 25,
      minDownPayment: 15,
      processingFee: 1.25,
      features: getBankFeatures('cib')
    },
    {
      id: 'qnb',
      name: 'QNB Al Ahli Bank',
      nameAr: t('mortgageCalculator.qnbAlAhli'),
      interestRate: 18.25,
      maxLoanAmount: 12000000,
      maxTerm: 30,
      minDownPayment: 20,
      processingFee: 1.0,
      features: getBankFeatures('qnb')
    },
    {
      id: 'aaib',
      name: 'Arab African International Bank',
      nameAr: t('mortgageCalculator.aaib'),
      interestRate: 19.0,
      maxLoanAmount: 10000000,
      maxTerm: 25,
      minDownPayment: 25,
      processingFee: 1.75,
      features: getBankFeatures('aaib')
    },
    {
      id: 'banque_misr',
      name: 'Banque Misr',
      nameAr: t('mortgageCalculator.banqueMisr'),
      interestRate: 18.75,
      maxLoanAmount: 8000000,
      maxTerm: 30,
      minDownPayment: 20,
      processingFee: 1.5,
      features: getBankFeatures('banque_misr')
    }
  ]

  // Load saved calculations on mount
  useEffect(() => {
    loadSavedCalculations()
  }, [])

  // Format EGP currency
  const formatEGP = (amount: number): string => {
    const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US'
    return new Intl.NumberFormat(locale, {
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
      alert(t('mortgageCalculator.missingDataAlert'))
      return
    }

    const price = parseFloat(propertyPrice)
    const downPercent = parseFloat(downPaymentPercent)
    const years = parseInt(termYears)
    const downPayment = (price * downPercent) / 100
    const loanAmount = price - downPayment

    // Check loan limits
    if (loanAmount > selectedBank.maxLoanAmount) {
      alert(`${t('mortgageCalculator.loanLimitExceeded')} ${selectedBank.nameAr} ${t('mortgageCalculator.loanLimitExceededIs')} ${formatEGP(selectedBank.maxLoanAmount)}`)
      return
    }

    if (downPercent < selectedBank.minDownPayment) {
      alert(`${t('mortgageCalculator.downPaymentTooLow')} ${selectedBank.nameAr} ${t('mortgageCalculator.downPaymentTooLowIs')} ${selectedBank.minDownPayment}%`)
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
      alert(t('mortgageCalculator.enterMonthlyIncome'))
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
      `${t('mortgageCalculator.affordabilityResult')}\n\n${t('mortgageCalculator.affordabilityResultText')}\n\n${t('mortgageCalculator.maxPropertyPrice')}: ${formatEGP(maxPropertyPrice)}\n${t('mortgageCalculator.maxAffordableLoanAmount')}: ${formatEGP(maxLoanAmount)}\n${t('mortgageCalculator.recommendedPayment')}: ${formatEGP(maxMonthlyPayment)}\n\n${t('mortgageCalculator.estimateNote')}`
    )
  }

  // Save calculation
  const saveCalculation = () => {
    if (!calculation) return

    try {
      const updatedCalculations = [...savedCalculations, calculation]
      setSavedCalculations(updatedCalculations)
      localStorage.setItem('saved_calculations', JSON.stringify(updatedCalculations))
      alert(t('mortgageCalculator.calculationSaved'))
    } catch (error) {
      alert(t('mortgageCalculator.calculationNotSaved'))
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

    const shareText = `${t('mortgageCalculator.title')} 🏠

${t('propertyDetails.price')}: ${formatEGP(calculation.propertyPrice)}
${t('mortgageCalculator.downPaymentRequired')}: ${formatEGP(calculation.downPayment)}
${t('mortgageCalculator.loanAmount')}: ${formatEGP(calculation.loanAmount)}
${t('mortgageCalculator.bankName')}: ${calculation.bankName}
${t('mortgageCalculator.interestRate')}: ${calculation.interestRate}%
${t('mortgageCalculator.termYears')}: ${calculation.termYears} ${t('propertyDetails.years')}

${t('mortgageCalculator.monthlyPayment')}: ${formatEGP(calculation.monthlyPayment)}
${t('mortgageCalculator.totalInterest')}: ${formatEGP(calculation.totalInterest)}
${t('mortgageCalculator.totalAmount')}: ${formatEGP(calculation.totalAmount)}

${t('mortgageCalculator.appCredit')}`

    if (navigator.share) {
      navigator.share({
        title: t('mortgageCalculator.title'),
        text: shareText,
      })
    } else {
      navigator.clipboard.writeText(shareText)
      alert(t('mortgageCalculator.linkCopied'))
    }
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
      {/* Modern Clean Header */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 p-6">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 font-montserrat">{t('mortgageCalculator.title')}</h2>
            <p className="text-slate-600 font-medium">{t('mortgageCalculator.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50">
        <button
          className={`flex-1 py-4 px-6 text-center font-semibold transition-all duration-300 ${
            activeTab === 'calculator'
              ? 'bg-white text-blue-600 border-b-2 border-blue-500 shadow-sm'
              : 'text-slate-600 hover:text-blue-600 hover:bg-white hover:shadow-sm'
          }`}
          onClick={() => setActiveTab('calculator')}
        >
          <Calculator className="w-5 h-5 mx-auto mb-1" />
          {t('mortgageCalculator.loanCalculator')}
        </button>
        <button
          className={`flex-1 py-4 px-6 text-center font-semibold transition-all duration-300 ${
            activeTab === 'affordability'
              ? 'bg-white text-blue-600 border-b-2 border-blue-500 shadow-sm'
              : 'text-slate-600 hover:text-blue-600 hover:bg-white hover:shadow-sm'
          }`}
          onClick={() => setActiveTab('affordability')}
        >
          <PiggyBank className="w-5 h-5 mx-auto mb-1" />
          {t('mortgageCalculator.affordabilityCalculator')}
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'calculator' ? (
          <>
            {/* Modern Property & Loan Inputs */}
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 font-montserrat">{t('mortgageCalculator.propertyLoanDetails')}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    {t('mortgageCalculator.propertyPrice')}
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      value={propertyPrice}
                      onChange={(e) => setPropertyPrice(e.target.value)}
                      placeholder={t('mortgageCalculator.propertyPricePlaceholder')}
                      className={`w-full pl-10 pr-4 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-all duration-300 text-lg font-medium ${isRTL ? 'text-right' : 'text-left'}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    {t('mortgageCalculator.downPaymentPercent')}
                  </label>
                  <div className="relative">
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 font-medium">%</span>
                    <input
                      type="number"
                      value={downPaymentPercent}
                      onChange={(e) => setDownPaymentPercent(e.target.value)}
                      placeholder={t('mortgageCalculator.downPaymentPlaceholder')}
                      className={`w-full px-4 pr-8 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-all duration-300 text-lg font-medium ${isRTL ? 'text-right' : 'text-left'}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    {t('mortgageCalculator.loanTerm')}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      value={termYears}
                      onChange={(e) => setTermYears(e.target.value)}
                      placeholder={t('mortgageCalculator.loanTermPlaceholder')}
                      className={`w-full pl-10 pr-4 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-all duration-300 text-lg font-medium ${isRTL ? 'text-right' : 'text-left'}`}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 font-medium">years</span>
                  </div>
                </div>
              </div>

              {/* Bank Selection Grid - NO DROPDOWN */}
              <div className="mb-8">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                    <CreditCard className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 font-montserrat">{t('mortgageCalculator.selectBank')}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {egyptianBanks.map((bank) => (
                    <div
                      key={bank.id}
                      onClick={() => setSelectedBank(bank)}
                      className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg ${
                        selectedBank?.id === bank.id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 shadow-md'
                          : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                      }`}
                    >
                      {/* Selection Indicator */}
                      {selectedBank?.id === bank.id && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      )}
                      
                      <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
                        <h4 className="font-bold text-lg text-slate-800 mb-1">{isRTL ? bank.nameAr : bank.name}</h4>
                        <p className="text-sm text-slate-600 mb-4">{isRTL ? bank.name : bank.nameAr}</p>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-600">Interest Rate:</span>
                            <span className="text-lg font-bold text-blue-600">{bank.interestRate}%</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-600">Max Amount:</span>
                            <span className="text-sm font-semibold text-slate-800">{formatEGP(bank.maxLoanAmount)}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-600">Min Down:</span>
                            <span className="text-sm font-semibold text-emerald-600">{bank.minDownPayment}%</span>
                          </div>
                        </div>

                        {/* Bank Features */}
                        <div className="mt-4 flex flex-wrap gap-1">
                          {bank.features.slice(0, 2).map((feature, index) => (
                            <span key={index} className="inline-block text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={calculateMortgage}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-5 px-8 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center space-x-3 rtl:space-x-reverse shadow-lg hover:shadow-xl"
              >
                <Calculator className="w-6 h-6" />
                <span>{t('mortgageCalculator.calculatePayment')}</span>
              </button>
            </div>

            {/* Premium Results Section */}
            {calculation && (
              <div className="border-t border-slate-200 pt-8">
                <div className="flex items-center mb-8">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 font-montserrat">{t('mortgageCalculator.resultsTitle')}</h3>
                </div>
                
                {/* Main Payment Display */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-8 mb-6 text-center">
                  <p className="text-sm font-semibold text-blue-600 mb-2">{t('mortgageCalculator.monthlyPayment')}</p>
                  <div className="text-5xl font-black text-blue-700 mb-2 font-montserrat">
                    {formatEGP(calculation.monthlyPayment)}
                  </div>
                  <p className="text-sm text-blue-600 font-medium">per month for {calculation.termYears} years</p>
                </div>

                {/* Secondary Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-white border border-slate-200 rounded-xl p-6 text-center hover:shadow-md transition-shadow duration-300">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <DollarSign className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800 mb-1">
                      {formatEGP(calculation.downPayment)}
                    </div>
                    <div className="text-sm text-slate-600 font-medium">{t('mortgageCalculator.downPaymentRequired')}</div>
                  </div>
                  
                  <div className="bg-white border border-slate-200 rounded-xl p-6 text-center hover:shadow-md transition-shadow duration-300">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800 mb-1">
                      {formatEGP(calculation.loanAmount)}
                    </div>
                    <div className="text-sm text-slate-600 font-medium">{t('mortgageCalculator.loanAmount')}</div>
                  </div>
                  
                  <div className="bg-white border border-slate-200 rounded-xl p-6 text-center hover:shadow-md transition-shadow duration-300">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800 mb-1">
                      {formatEGP(calculation.totalInterest)}
                    </div>
                    <div className="text-sm text-slate-600 font-medium">{t('mortgageCalculator.totalInterest')}</div>
                  </div>
                </div>

                {/* Modern Action Buttons */}
                <div className="flex flex-wrap gap-3 mb-8">
                  <button
                    onClick={() => setShowPaymentSchedule(true)}
                    className="flex items-center space-x-2 rtl:space-x-reverse px-6 py-3 bg-white text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-300 border border-slate-200 hover:border-slate-300 hover:shadow-md"
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span className="font-medium">{t('mortgageCalculator.paymentSchedule')}</span>
                  </button>
                  <button
                    onClick={shareCalculation}
                    className="flex items-center space-x-2 rtl:space-x-reverse px-6 py-3 bg-white text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-300 border border-slate-200 hover:border-slate-300 hover:shadow-md"
                  >
                    <Share className="w-5 h-5" />
                    <span className="font-medium">{t('mortgageCalculator.shareCalculation')}</span>
                  </button>
                  <button
                    onClick={saveCalculation}
                    className="flex items-center space-x-2 rtl:space-x-reverse px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <Save className="w-5 h-5" />
                    <span className="font-medium">{t('mortgageCalculator.saveCalculation')}</span>
                  </button>
                </div>

                {/* Selected Bank Details */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <h4 className="font-bold text-slate-800 text-lg">{t('mortgageCalculator.selectedBankDetails')}</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <p className="text-sm font-medium text-slate-600 mb-1">{t('mortgageCalculator.bankName')}</p>
                      <p className="font-bold text-slate-800">{calculation.bankName}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <p className="text-sm font-medium text-slate-600 mb-1">{t('mortgageCalculator.interestRate')}</p>
                      <p className="font-bold text-blue-600 text-lg">{calculation.interestRate}%</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <p className="text-sm font-medium text-slate-600 mb-1">{t('mortgageCalculator.termYears')}</p>
                      <p className="font-bold text-slate-800">{calculation.termYears} {t('propertyDetails.years')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Modern Affordability Calculator */
          <div>
            <div className="flex items-center mb-8">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                <PiggyBank className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 font-montserrat">{t('mortgageCalculator.affordabilityTitle')}</h3>
            </div>
            
            <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                {t('mortgageCalculator.monthlyIncome')}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder={t('mortgageCalculator.monthlyIncomePlaceholder')}
                  className={`w-full pl-10 pr-4 py-5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-all duration-300 text-lg font-medium ${isRTL ? 'text-right' : 'text-left'}`}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 font-medium">EGP</span>
              </div>
            </div>

            <button
              onClick={calculateAffordability}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-5 px-8 rounded-xl font-bold text-lg hover:from-emerald-700 hover:to-emerald-800 transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center space-x-3 rtl:space-x-reverse shadow-lg hover:shadow-xl mb-8"
            >
              <TrendingUp className="w-6 h-6" />
              <span>{t('mortgageCalculator.calculateAffordability')}</span>
            </button>

            {/* Affordability Tips */}
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-3">💡 {t('mortgageCalculator.affordabilityTips')}</h4>
              <div className="space-y-2 text-sm text-slate-700">
                <p>{t('mortgageCalculator.tip1')}</p>
                <p>{t('mortgageCalculator.tip2')}</p>
                <p>{t('mortgageCalculator.tip3')}</p>
                <p>{t('mortgageCalculator.tip4')}</p>
                <p>{t('mortgageCalculator.tip5')}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Schedule Modal */}
      {showPaymentSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">📊 {t('mortgageCalculator.paymentScheduleTitle')}</h3>
              <button
                onClick={() => setShowPaymentSchedule(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} text-sm font-semibold text-slate-700`}>{t('mortgageCalculator.scheduleMonth')}</th>
                    <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} text-sm font-semibold text-slate-700`}>{t('mortgageCalculator.schedulePayment')}</th>
                    <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} text-sm font-semibold text-slate-700`}>{t('mortgageCalculator.schedulePrincipal')}</th>
                    <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} text-sm font-semibold text-slate-700`}>{t('mortgageCalculator.scheduleInterest')}</th>
                    <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} text-sm font-semibold text-slate-700`}>{t('mortgageCalculator.scheduleBalance')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paymentSchedule.map((item) => (
                    <tr key={item.month} className="hover:bg-slate-50">
                      <td className={`px-4 py-3 text-sm text-slate-900 ${isRTL ? 'text-right' : 'text-left'}`}>{item.month}</td>
                      <td className={`px-4 py-3 text-sm text-slate-900 ${isRTL ? 'text-right' : 'text-left'}`}>{formatEGP(item.payment)}</td>
                      <td className={`px-4 py-3 text-sm text-slate-900 ${isRTL ? 'text-right' : 'text-left'}`}>{formatEGP(item.principal)}</td>
                      <td className={`px-4 py-3 text-sm text-slate-900 ${isRTL ? 'text-right' : 'text-left'}`}>{formatEGP(item.interest)}</td>
                      <td className={`px-4 py-3 text-sm text-slate-900 ${isRTL ? 'text-right' : 'text-left'}`}>{formatEGP(item.balance)}</td>
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
        <div className="border-t border-slate-200 p-4">
          <button
            onClick={() => setShowSavedCalculations(!showSavedCalculations)}
            className="w-full flex items-center justify-center space-x-2 rtl:space-x-reverse py-3 px-4 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>💾 {t('mortgageCalculator.savedCalculations')} ({savedCalculations.length})</span>
          </button>
          
          {showSavedCalculations && (
            <div className="mt-4 space-y-3 max-h-60 overflow-auto">
              {savedCalculations.map((calc) => (
                <div key={calc.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-start">
                    <div className="text-sm">
                      <div className="font-medium text-slate-800">{formatEGP(calc.propertyPrice)} - {calc.bankName}</div>
                      <div className="text-slate-600">
                        {t('mortgageCalculator.monthlyPayment')}: {formatEGP(calc.monthlyPayment)} | {t('mortgageCalculator.termYears')}: {calc.termYears} {t('propertyDetails.years')}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      {calc.calculatedAt.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}
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