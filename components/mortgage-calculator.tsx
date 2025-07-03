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
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-6">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <Calculator className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">🏦 {t('mortgageCalculator.title')}</h2>
            <p className="text-slate-100">{t('mortgageCalculator.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
            activeTab === 'calculator'
              ? 'bg-slate-50 text-slate-700 border-b-2 border-slate-600'
              : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
          }`}
          onClick={() => setActiveTab('calculator')}
        >
          <Calculator className="w-5 h-5 mx-auto mb-1" />
          {t('mortgageCalculator.loanCalculator')}
        </button>
        <button
          className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
            activeTab === 'affordability'
              ? 'bg-slate-50 text-slate-700 border-b-2 border-slate-600'
              : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
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
            {/* Calculator Form */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-slate-600" />
                📝 {t('mortgageCalculator.propertyLoanDetails')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('mortgageCalculator.propertyPrice')}
                  </label>
                  <input
                    type="number"
                    value={propertyPrice}
                    onChange={(e) => setPropertyPrice(e.target.value)}
                    placeholder={t('mortgageCalculator.propertyPricePlaceholder')}
                    className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent hover:border-slate-400 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('mortgageCalculator.downPaymentPercent')}
                  </label>
                  <input
                    type="number"
                    value={downPaymentPercent}
                    onChange={(e) => setDownPaymentPercent(e.target.value)}
                    placeholder={t('mortgageCalculator.downPaymentPlaceholder')}
                    className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent hover:border-slate-400 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('mortgageCalculator.loanTerm')}
                  </label>
                  <input
                    type="number"
                    value={termYears}
                    onChange={(e) => setTermYears(e.target.value)}
                    placeholder={t('mortgageCalculator.loanTermPlaceholder')}
                    className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent hover:border-slate-400 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('mortgageCalculator.selectBank')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowBankSelector(!showBankSelector)}
                    className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent hover:border-slate-400 transition-colors ${isRTL ? 'text-right' : 'text-left'} flex items-center justify-between`}
                  >
                    <span className="text-slate-700">{selectedBank ? selectedBank.nameAr : t('mortgageCalculator.selectBank')}</span>
                    <ChevronDown className="w-5 h-5 text-slate-500" />
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
                          ? 'border-slate-500 bg-slate-50 ring-2 ring-slate-200'
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      <div className="text-right">
                        <h4 className="font-semibold text-slate-800">{bank.nameAr}</h4>
                        <p className="text-sm text-slate-600 mb-2">{bank.name}</p>
                        <div className="space-y-1">
                          <p className="text-sm text-slate-600">
                            <span className="font-medium">{t('mortgageCalculator.interestRate')}:</span> {bank.interestRate}%
                          </p>
                          <p className="text-sm text-slate-600">
                            <span className="font-medium">{t('mortgageCalculator.maxLoanAmount')}:</span> {formatEGP(bank.maxLoanAmount)}
                          </p>
                          <p className="text-sm text-slate-600">
                            <span className="font-medium">{t('mortgageCalculator.minDownPayment')}:</span> {bank.minDownPayment}%
                          </p>
                        </div>
                        <div className="mt-2">
                          {bank.features.map((feature, index) => (
                            <span key={index} className="inline-block text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full mr-1 mb-1">
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
                className="w-full bg-slate-700 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-slate-800 transition-colors flex items-center justify-center space-x-2 rtl:space-x-reverse"
              >
                <Calculator className="w-5 h-5" />
                <span>{t('mortgageCalculator.calculatePayment')}</span>
              </button>
            </div>

            {/* Results */}
            {calculation && (
              <div className="border-t border-slate-200 pt-8">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-slate-600" />
                  💰 {t('mortgageCalculator.resultsTitle')}
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-50 p-4 rounded-lg text-center border border-slate-200">
                    <div className="text-2xl font-bold text-slate-800 mb-1">
                      {formatEGP(calculation.monthlyPayment)}
                    </div>
                    <div className="text-sm text-slate-600">{t('mortgageCalculator.monthlyPayment')}</div>
                  </div>
                  <div className="bg-slate-100 p-4 rounded-lg text-center border border-slate-300">
                    <div className="text-2xl font-bold text-slate-800 mb-1">
                      {formatEGP(calculation.downPayment)}
                    </div>
                    <div className="text-sm text-slate-600">{t('mortgageCalculator.downPaymentRequired')}</div>
                  </div>
                  <div className="bg-slate-200 p-4 rounded-lg text-center border border-slate-400">
                    <div className="text-2xl font-bold text-slate-900 mb-1">
                      {formatEGP(calculation.loanAmount)}
                    </div>
                    <div className="text-sm text-slate-600">{t('mortgageCalculator.loanAmount')}</div>
                  </div>
                  <div className="bg-slate-100 p-4 rounded-lg text-center border border-slate-300">
                    <div className="text-2xl font-bold text-slate-800 mb-1">
                      {formatEGP(calculation.totalInterest)}
                    </div>
                    <div className="text-sm text-slate-600">{t('mortgageCalculator.totalInterest')}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <button
                    onClick={() => setShowPaymentSchedule(true)}
                    className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>📊 {t('mortgageCalculator.paymentSchedule')}</span>
                  </button>
                  <button
                    onClick={shareCalculation}
                    className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200"
                  >
                    <Share className="w-4 h-4" />
                    <span>📤 {t('mortgageCalculator.shareCalculation')}</span>
                  </button>
                  <button
                    onClick={saveCalculation}
                    className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200"
                  >
                    <Save className="w-4 h-4" />
                    <span>💾 {t('mortgageCalculator.saveCalculation')}</span>
                  </button>
                </div>

                {/* Bank Details */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-2">{t('mortgageCalculator.selectedBankDetails')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">{t('mortgageCalculator.bankName')}:</span> <span className="text-slate-600">{calculation.bankName}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">{t('mortgageCalculator.interestRate')}:</span> <span className="text-slate-600">{calculation.interestRate}%</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">{t('mortgageCalculator.termYears')}:</span> <span className="text-slate-600">{calculation.termYears} {t('propertyDetails.years')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Affordability Calculator */
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <PiggyBank className="w-5 h-5 mr-2 text-slate-600" />
              💡 {t('mortgageCalculator.affordabilityTitle')}
            </h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('mortgageCalculator.monthlyIncome')}
              </label>
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder={t('mortgageCalculator.monthlyIncomePlaceholder')}
                className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent hover:border-slate-400 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
              />
            </div>

            <button
              onClick={calculateAffordability}
              className="w-full bg-slate-700 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-slate-800 transition-colors flex items-center justify-center space-x-2 rtl:space-x-reverse mb-6"
            >
              <TrendingUp className="w-5 h-5" />
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