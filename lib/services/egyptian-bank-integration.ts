'use client';

export interface BankEligibilityRequest {
  // Property information
  property_id: string;
  property_value: number;
  property_type: 'apartment' | 'villa' | 'townhouse' | 'commercial' | 'land';
  property_age: number;
  location: string;
  district: string;
  
  // Legal status
  ownership_type: 'ibtida2i' | 'tawkeel' | 'shahr_3aqary' | 'usufruct';
  shahr_3aqary_registered: boolean;
  title_deed_available: boolean;
  bank_approved_developer: boolean;
  escrow_account_verified: boolean;
  
  // Client information
  client_monthly_income: number;
  client_age: number;
  employment_type: 'employee' | 'self_employed' | 'business_owner' | 'retired';
  employment_duration_months: number;
  existing_debts: number;
  client_nationality: 'egyptian' | 'expat';
  
  // Loan request
  requested_loan_amount: number;
  requested_duration_years: number;
  down_payment_percentage: number;
}

export interface BankEligibilityResponse {
  eligible: boolean;
  max_loan_amount: number;
  recommended_duration_years: number;
  interest_rate: number;
  monthly_installment: number;
  down_payment_required: number;
  
  // Risk assessment
  risk_score: number; // 1-10 scale
  risk_factors: string[];
  
  // Bank-specific responses
  bank_responses: BankResponse[];
  
  // Egyptian-specific requirements
  egyptian_requirements: {
    central_bank_approval_required: boolean;
    mortgage_registration_fee: number;
    insurance_required: boolean;
    appraisal_required: boolean;
  };
  
  // Compliance status
  compliance_score: number;
  compliance_issues: string[];
}

export interface BankResponse {
  bank_name: string;
  bank_code: string;
  eligible: boolean;
  max_loan_amount: number;
  interest_rate: number;
  processing_fee: number;
  conditions: string[];
  approval_timeline_days: number;
  confidence_level: number;
}

export class EgyptianBankIntegration {
  private readonly API_BASE_URL = '/api/bank-integration';
  
  // Egyptian banks configuration
  private readonly EGYPTIAN_BANKS = [
    {
      name: 'National Bank of Egypt',
      code: 'NBE',
      api_endpoint: '/nbe/mortgage-check',
      max_loan_to_value: 0.90,
      max_duration_years: 30,
      base_interest_rate: 0.13
    },
    {
      name: 'Banque Misr',
      code: 'BM',
      api_endpoint: '/bm/eligibility',
      max_loan_to_value: 0.85,
      max_duration_years: 25,
      base_interest_rate: 0.135
    },
    {
      name: 'Commercial International Bank',
      code: 'CIB',
      api_endpoint: '/cib/mortgage',
      max_loan_to_value: 0.80,
      max_duration_years: 20,
      base_interest_rate: 0.145
    },
    {
      name: 'Arab African International Bank',
      code: 'AAIB',
      api_endpoint: '/aaib/loan-check',
      max_loan_to_value: 0.85,
      max_duration_years: 25,
      base_interest_rate: 0.14
    },
    {
      name: 'Housing and Development Bank',
      code: 'HDB',
      api_endpoint: '/hdb/housing-loan',
      max_loan_to_value: 0.95,
      max_duration_years: 30,
      base_interest_rate: 0.125
    }
  ];

  async checkMortgageEligibility(request: BankEligibilityRequest): Promise<BankEligibilityResponse> {
    try {
      // Validate request
      this.validateRequest(request);
      
      // Calculate basic eligibility metrics
      const basicEligibility = this.calculateBasicEligibility(request);
      
      // Check legal compliance
      const legalCompliance = this.checkLegalCompliance(request);
      
      // Get responses from Egyptian banks
      const bankResponses = await this.getBankResponses(request);
      
      // Calculate overall eligibility
      const overallEligibility = this.calculateOverallEligibility(
        basicEligibility,
        legalCompliance,
        bankResponses
      );
      
      return overallEligibility;
      
    } catch (error) {
      console.error('Mortgage eligibility check failed:', error);
      throw new Error('Failed to check mortgage eligibility');
    }
  }

  private validateRequest(request: BankEligibilityRequest): void {
    const requiredFields = [
      'property_id', 'property_value', 'property_type',
      'client_monthly_income', 'client_age', 'requested_loan_amount'
    ];
    
    for (const field of requiredFields) {
      if (!request[field as keyof BankEligibilityRequest]) {
        throw new Error(`Required field missing: ${field}`);
      }
    }
    
    if (request.property_value <= 0) {
      throw new Error('Property value must be greater than 0');
    }
    
    if (request.client_monthly_income <= 0) {
      throw new Error('Client monthly income must be greater than 0');
    }
    
    if (request.requested_loan_amount <= 0) {
      throw new Error('Requested loan amount must be greater than 0');
    }
  }

  private calculateBasicEligibility(request: BankEligibilityRequest) {
    // Debt-to-Income ratio (Egyptian banks prefer max 40%)
    const monthlyDebtService = request.existing_debts;
    const debtToIncomeRatio = (monthlyDebtService / request.client_monthly_income) * 100;
    
    // Loan-to-Value ratio
    const loanToValueRatio = (request.requested_loan_amount / request.property_value) * 100;
    
    // Maximum loan based on income (typically 7-8x annual income)
    const maxLoanBasedOnIncome = request.client_monthly_income * 12 * 7;
    
    // Age factor (Egyptian banks have age limits)
    const retirementAge = 60;
    const maxLoanDurationByAge = Math.max(0, retirementAge - request.client_age);
    
    return {
      debt_to_income_ratio: debtToIncomeRatio,
      loan_to_value_ratio: loanToValueRatio,
      max_loan_based_on_income: maxLoanBasedOnIncome,
      max_duration_by_age: maxLoanDurationByAge,
      basic_eligible: debtToIncomeRatio <= 40 && loanToValueRatio <= 90 && request.client_age >= 21
    };
  }

  private checkLegalCompliance(request: BankEligibilityRequest) {
    const complianceIssues: string[] = [];
    let complianceScore = 100;
    
    // Check ownership type
    if (request.ownership_type === 'tawkeel') {
      complianceIssues.push('Tawkeel ownership may require additional documentation');
      complianceScore -= 15;
    }
    
    // Check real estate registration
    if (!request.shahr_3aqary_registered) {
      complianceIssues.push('Property must be registered with Shahr 3aqary for mortgage eligibility');
      complianceScore -= 25;
    }
    
    // Check title deed
    if (!request.title_deed_available) {
      complianceIssues.push('Title deed is required for mortgage processing');
      complianceScore -= 20;
    }
    
    // Check developer approval
    if (!request.bank_approved_developer && request.property_age < 2) {
      complianceIssues.push('New properties require bank-approved developer');
      complianceScore -= 10;
    }
    
    // Check escrow account for new properties
    if (!request.escrow_account_verified && request.property_age < 1) {
      complianceIssues.push('Escrow account verification required for off-plan properties');
      complianceScore -= 15;
    }
    
    return {
      compliance_score: Math.max(0, complianceScore),
      compliance_issues: complianceIssues,
      legally_compliant: complianceScore >= 70
    };
  }

  private async getBankResponses(request: BankEligibilityRequest): Promise<BankResponse[]> {
    const responses: BankResponse[] = [];
    
    for (const bank of this.EGYPTIAN_BANKS) {
      try {
        const bankResponse = await this.checkIndividualBank(bank, request);
        responses.push(bankResponse);
      } catch (error) {
        console.error(`Failed to check ${bank.name}:`, error);
        // Add fallback response
        responses.push(this.createFallbackBankResponse(bank, request));
      }
    }
    
    return responses;
  }

  private async checkIndividualBank(bank: any, request: BankEligibilityRequest): Promise<BankResponse> {
    // Simulate bank API call (in production, this would be actual API calls)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    const loanToValue = request.requested_loan_amount / request.property_value;
    const debtToIncome = request.existing_debts / request.client_monthly_income;
    
    // Calculate bank-specific eligibility
    const eligible = this.calculateBankEligibility(bank, request, loanToValue, debtToIncome);
    
    const maxLoanAmount = Math.min(
      request.property_value * bank.max_loan_to_value,
      request.client_monthly_income * 12 * 7
    );
    
    const interestRate = this.calculateInterestRate(bank, request, eligible);
    const monthlyInstallment = this.calculateMonthlyInstallment(
      maxLoanAmount,
      interestRate,
      Math.min(request.requested_duration_years, bank.max_duration_years)
    );
    
    return {
      bank_name: bank.name,
      bank_code: bank.code,
      eligible,
      max_loan_amount: eligible ? maxLoanAmount : 0,
      interest_rate: interestRate,
      processing_fee: request.property_value * 0.005, // 0.5% processing fee
      conditions: this.getBankConditions(bank, request, eligible),
      approval_timeline_days: this.getApprovalTimeline(bank, eligible),
      confidence_level: eligible ? Math.random() * 20 + 80 : Math.random() * 30 + 10
    };
  }

  private calculateBankEligibility(
    bank: any,
    request: BankEligibilityRequest,
    loanToValue: number,
    debtToIncome: number
  ): boolean {
    // Basic eligibility criteria
    if (loanToValue > bank.max_loan_to_value) return false;
    if (debtToIncome > 0.4) return false;
    if (request.client_age < 21 || request.client_age > 60) return false;
    
    // Legal requirements
    if (!request.shahr_3aqary_registered) return false;
    if (!request.title_deed_available) return false;
    
    // Employment requirements
    if (request.employment_duration_months < 12) return false;
    
    // Special conditions per bank
    switch (bank.code) {
      case 'HDB':
        // Housing and Development Bank is more flexible for residential properties
        return request.property_type === 'apartment' || request.property_type === 'villa';
      
      case 'CIB':
        // CIB has stricter requirements but better rates
        return request.client_monthly_income >= 10000 && request.employment_type !== 'self_employed';
      
      default:
        return true;
    }
  }

  private calculateInterestRate(bank: any, request: BankEligibilityRequest, eligible: boolean): number {
    if (!eligible) return 0;
    
    let rate = bank.base_interest_rate;
    
    // Adjust based on risk factors
    if (request.client_nationality === 'expat') rate += 0.01;
    if (request.employment_type === 'self_employed') rate += 0.015;
    if (request.property_age > 10) rate += 0.005;
    if (request.down_payment_percentage < 20) rate += 0.005;
    
    // Better rates for low-risk clients
    if (request.client_monthly_income > 20000) rate -= 0.005;
    if (request.down_payment_percentage >= 30) rate -= 0.005;
    if (request.employment_type === 'employee' && request.employment_duration_months > 60) rate -= 0.01;
    
    return Math.max(0.10, Math.min(0.20, rate));
  }

  private calculateMonthlyInstallment(loanAmount: number, annualRate: number, years: number): number {
    const monthlyRate = annualRate / 12;
    const numPayments = years * 12;
    
    if (monthlyRate === 0) return loanAmount / numPayments;
    
    return loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
           (Math.pow(1 + monthlyRate, numPayments) - 1);
  }

  private getBankConditions(bank: any, request: BankEligibilityRequest, eligible: boolean): string[] {
    if (!eligible) return ['Application not eligible based on current criteria'];
    
    const conditions: string[] = [
      'Valid ID and employment documentation required',
      'Property valuation by bank-approved appraiser',
      'Life insurance covering loan amount',
      'Property insurance required'
    ];
    
    if (request.property_age > 15) {
      conditions.push('Building structural report required');
    }
    
    if (request.client_nationality === 'expat') {
      conditions.push('Work permit and residence visa required');
      conditions.push('Egyptian guarantor may be required');
    }
    
    if (bank.code === 'CIB') {
      conditions.push('Minimum 6-month salary transfer to CIB account');
    }
    
    if (bank.code === 'HDB') {
      conditions.push('Property must be residential use only');
    }
    
    return conditions;
  }

  private getApprovalTimeline(bank: any, eligible: boolean): number {
    if (!eligible) return 0;
    
    const baseDays = {
      'NBE': 14,
      'BM': 16,
      'CIB': 12,
      'AAIB': 15,
      'HDB': 18
    };
    
    return baseDays[bank.code as keyof typeof baseDays] || 15;
  }

  private createFallbackBankResponse(bank: any, request: BankEligibilityRequest): BankResponse {
    return {
      bank_name: bank.name,
      bank_code: bank.code,
      eligible: false,
      max_loan_amount: 0,
      interest_rate: 0,
      processing_fee: 0,
      conditions: ['Bank service temporarily unavailable'],
      approval_timeline_days: 0,
      confidence_level: 0
    };
  }

  private calculateOverallEligibility(
    basicEligibility: any,
    legalCompliance: any,
    bankResponses: BankResponse[]
  ): BankEligibilityResponse {
    const eligibleBanks = bankResponses.filter(bank => bank.eligible);
    const overallEligible = eligibleBanks.length > 0 && legalCompliance.legally_compliant;
    
    const bestOffer = eligibleBanks.length > 0 
      ? eligibleBanks.reduce((best, current) => 
          current.interest_rate < best.interest_rate ? current : best
        )
      : null;
    
    // Risk factors
    const riskFactors: string[] = [];
    if (basicEligibility.debt_to_income_ratio > 35) {
      riskFactors.push('High debt-to-income ratio');
    }
    if (basicEligibility.loan_to_value_ratio > 80) {
      riskFactors.push('High loan-to-value ratio');
    }
    
    // Calculate overall risk score (1-10, lower is better)
    let riskScore = 5;
    if (basicEligibility.debt_to_income_ratio > 30) riskScore += 1;
    if (basicEligibility.loan_to_value_ratio > 80) riskScore += 1;
    if (!legalCompliance.legally_compliant) riskScore += 2;
    if (eligibleBanks.length === 0) riskScore += 2;
    
    riskScore = Math.min(10, Math.max(1, riskScore));
    
    return {
      eligible: overallEligible,
      max_loan_amount: bestOffer?.max_loan_amount || 0,
      recommended_duration_years: 25,
      interest_rate: bestOffer?.interest_rate || 0,
      monthly_installment: bestOffer ? this.calculateMonthlyInstallment(
        bestOffer.max_loan_amount,
        bestOffer.interest_rate,
        25
      ) : 0,
      down_payment_required: bestOffer ? 
        (bestOffer.max_loan_amount * 0.2) : 0, // 20% minimum down payment
      
      risk_score: riskScore,
      risk_factors: [...riskFactors, ...legalCompliance.compliance_issues],
      
      bank_responses: bankResponses,
      
      egyptian_requirements: {
        central_bank_approval_required: overallEligible && bestOffer ? bestOffer.max_loan_amount > 3000000 : false,
        mortgage_registration_fee: overallEligible ? (bestOffer?.max_loan_amount || 0) * 0.001 : 0,
        insurance_required: overallEligible,
        appraisal_required: overallEligible
      },
      
      compliance_score: legalCompliance.compliance_score,
      compliance_issues: legalCompliance.compliance_issues
    };
  }

  // Utility method to get mortgage calculator
  calculateMortgagePayment(
    loanAmount: number,
    annualInterestRate: number,
    loanTermYears: number
  ): {
    monthly_payment: number;
    total_payment: number;
    total_interest: number;
  } {
    const monthlyPayment = this.calculateMonthlyInstallment(loanAmount, annualInterestRate, loanTermYears);
    const totalPayment = monthlyPayment * loanTermYears * 12;
    const totalInterest = totalPayment - loanAmount;
    
    return {
      monthly_payment: monthlyPayment,
      total_payment: totalPayment,
      total_interest: totalInterest
    };
  }

  // Method to get all Egyptian banks info
  getEgyptianBanks() {
    return this.EGYPTIAN_BANKS.map(bank => ({
      name: bank.name,
      code: bank.code,
      max_loan_to_value: bank.max_loan_to_value,
      max_duration_years: bank.max_duration_years,
      base_interest_rate: bank.base_interest_rate
    }));
  }
}

export const egyptianBankIntegration = new EgyptianBankIntegration();