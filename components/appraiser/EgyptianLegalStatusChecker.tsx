'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Building, 
  Scale,
  Banknote,
  Clock,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { egyptianBankIntegration, BankEligibilityResponse } from '@/lib/services/egyptian-bank-integration';

interface LegalStatusData {
  // Ownership structure
  ownership_type: 'ibtida2i' | 'tawkeel' | 'shahr_3aqary' | 'usufruct' | '';
  ownership_certificate_number: string;
  ownership_certificate_date: string;
  
  // Registry information
  shahr_3aqary_registered: boolean;
  shahr_3aqary_number: string;
  shahr_3aqary_date: string;
  registry_office: string;
  
  // Legal documentation
  title_deed_available: boolean;
  title_deed_number: string;
  building_permit_number: string;
  occupancy_certificate_number: string;
  
  // Compliance status
  tax_registration_current: boolean;
  utility_clearance_current: boolean;
  municipal_fees_current: boolean;
  
  // Mortgage eligibility factors
  bank_approved_developer: boolean;
  escrow_account_verified: boolean;
  construction_insurance_active: boolean;
  delivery_guarantee_available: boolean;
  
  // Risk assessment
  legal_risk_score: number;
  risk_factors: string[];
  compliance_percentage: number;
}

interface DeveloperInfo {
  developer_name: string;
  commercial_registry_number: string;
  license_status: 'active' | 'suspended' | 'revoked';
  escrow_account_verified: boolean;
  projects_completed: number;
  projects_delayed: number;
  financial_rating: string;
  risk_category: 'low' | 'medium' | 'high';
}

interface Props {
  propertyId?: string;
  propertyValue?: number;
  propertyType?: string;
  onStatusUpdate?: (status: LegalStatusData) => void;
  onMortgageEligibilityUpdate?: (eligibility: BankEligibilityResponse | null) => void;
  initialData?: Partial<LegalStatusData>;
}

export function EgyptianLegalStatusChecker({ 
  propertyId, 
  propertyValue, 
  propertyType, 
  onStatusUpdate, 
  onMortgageEligibilityUpdate, 
  initialData 
}: Props) {
  const [legalData, setLegalData] = useState<LegalStatusData>({
    ownership_type: '',
    ownership_certificate_number: '',
    ownership_certificate_date: '',
    shahr_3aqary_registered: false,
    shahr_3aqary_number: '',
    shahr_3aqary_date: '',
    registry_office: '',
    title_deed_available: false,
    title_deed_number: '',
    building_permit_number: '',
    occupancy_certificate_number: '',
    tax_registration_current: false,
    utility_clearance_current: false,
    municipal_fees_current: false,
    bank_approved_developer: false,
    escrow_account_verified: false,
    construction_insurance_active: false,
    delivery_guarantee_available: false,
    legal_risk_score: 5,
    risk_factors: [],
    compliance_percentage: 0,
    ...initialData
  });

  const [developerInfo, setDeveloperInfo] = useState<DeveloperInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [mortgageEligibility, setMortgageEligibility] = useState<BankEligibilityResponse | null>(null);
  const [isCheckingMortgage, setIsCheckingMortgage] = useState(false);

  useEffect(() => {
    calculateComplianceScore();
  }, [legalData]);

  useEffect(() => {
    if (onStatusUpdate) {
      onStatusUpdate(legalData);
    }
  }, [legalData, onStatusUpdate]);

  useEffect(() => {
    if (onMortgageEligibilityUpdate) {
      onMortgageEligibilityUpdate(mortgageEligibility);
    }
  }, [mortgageEligibility, onMortgageEligibilityUpdate]);

  const calculateComplianceScore = () => {
    const checklistItems = [
      legalData.ownership_type !== '',
      legalData.ownership_certificate_number !== '',
      legalData.shahr_3aqary_registered,
      legalData.title_deed_available,
      legalData.building_permit_number !== '',
      legalData.occupancy_certificate_number !== '',
      legalData.tax_registration_current,
      legalData.utility_clearance_current,
      legalData.municipal_fees_current,
      legalData.bank_approved_developer,
      legalData.escrow_account_verified,
      legalData.construction_insurance_active,
      legalData.delivery_guarantee_available
    ];

    const completedItems = checklistItems.filter(Boolean).length;
    const compliancePercentage = (completedItems / checklistItems.length) * 100;
    
    // Calculate risk score (1-10, lower is better)
    let riskScore = 10;
    const riskFactors: string[] = [];

    if (legalData.ownership_type === '') {
      riskFactors.push('Ownership type not specified');
      riskScore += 1;
    }
    
    if (!legalData.shahr_3aqary_registered) {
      riskFactors.push('Not registered with Shahr 3aqary');
      riskScore += 2;
    }
    
    if (!legalData.title_deed_available) {
      riskFactors.push('Title deed not available');
      riskScore += 2;
    }
    
    if (!legalData.tax_registration_current) {
      riskFactors.push('Tax registration not current');
      riskScore += 1;
    }
    
    if (!legalData.bank_approved_developer) {
      riskFactors.push('Developer not bank-approved');
      riskScore += 1;
    }
    
    if (!legalData.escrow_account_verified) {
      riskFactors.push('Escrow account not verified');
      riskScore += 1;
    }

    // Cap the risk score at 10
    riskScore = Math.min(riskScore, 10);

    setLegalData(prev => ({
      ...prev,
      compliance_percentage: Math.round(compliancePercentage),
      legal_risk_score: riskScore,
      risk_factors: riskFactors
    }));
  };

  const checkDeveloperCredentials = async (developerName: string) => {
    if (!developerName.trim()) return;
    
    setIsChecking(true);
    try {
      // Simulate API call to check developer credentials
      // In real implementation, this would call Egyptian developer registry API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock developer data
      const mockDeveloperInfo: DeveloperInfo = {
        developer_name: developerName,
        commercial_registry_number: `CR-${Math.floor(Math.random() * 1000000)}`,
        license_status: 'active',
        escrow_account_verified: Math.random() > 0.5,
        projects_completed: Math.floor(Math.random() * 50) + 5,
        projects_delayed: Math.floor(Math.random() * 5),
        financial_rating: ['A+', 'A', 'B+', 'B', 'C'][Math.floor(Math.random() * 5)],
        risk_category: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high'
      };
      
      setDeveloperInfo(mockDeveloperInfo);
      toast.success('Developer credentials verified');
    } catch (error) {
      toast.error('Failed to verify developer credentials');
    } finally {
      setIsChecking(false);
    }
  };

  const checkMortgageEligibility = async () => {
    if (!propertyId || !propertyValue) {
      toast.error('Property information required for mortgage eligibility check');
      return;
    }

    setIsCheckingMortgage(true);
    try {
      const response = await fetch('/api/mortgage-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Property information
          property_id: propertyId,
          property_value: propertyValue,
          property_type: propertyType || 'apartment',
          property_age: 5, // Default value, should be passed from parent
          location: 'Cairo', // Default, should be from property data
          district: 'New Cairo', // Default, should be from property data
          
          // Legal status from current form
          ownership_type: legalData.ownership_type || 'shahr_3aqary',
          shahr_3aqary_registered: legalData.shahr_3aqary_registered,
          title_deed_available: legalData.title_deed_available,
          bank_approved_developer: legalData.bank_approved_developer,
          escrow_account_verified: legalData.escrow_account_verified,
          
          // Default client information (these would normally come from a separate form)
          client_monthly_income: 25000, // Default example
          client_age: 35, // Default example
          employment_type: 'employee',
          employment_duration_months: 36,
          existing_debts: 0,
          client_nationality: 'egyptian',
          
          // Default loan request
          requested_loan_amount: propertyValue * 0.8, // 80% of property value
          requested_duration_years: 25,
          down_payment_percentage: 20
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setMortgageEligibility(result.data);
        toast.success('Mortgage eligibility check completed');
      } else {
        toast.error('Failed to check mortgage eligibility: ' + result.error);
      }
    } catch (error) {
      console.error('Mortgage eligibility check error:', error);
      toast.error('Failed to check mortgage eligibility');
    } finally {
      setIsCheckingMortgage(false);
    }
  };

  const getComplianceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskColor = (score: number) => {
    if (score <= 3) return 'text-green-600';
    if (score <= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMortgageEligibilityStatus = () => {
    const requiredItems = [
      legalData.shahr_3aqary_registered,
      legalData.title_deed_available,
      legalData.bank_approved_developer,
      legalData.tax_registration_current
    ];
    
    const metRequirements = requiredItems.filter(Boolean).length;
    const eligibilityPercentage = (metRequirements / requiredItems.length) * 100;
    
    if (eligibilityPercentage >= 100) return { status: 'eligible', color: 'text-green-600', icon: CheckCircle };
    if (eligibilityPercentage >= 75) return { status: 'likely eligible', color: 'text-yellow-600', icon: Clock };
    return { status: 'not eligible', color: 'text-red-600', icon: XCircle };
  };

  const eligibilityStatus = getMortgageEligibilityStatus();
  const EligibilityIcon = eligibilityStatus.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Egyptian Legal Status Verification
          </CardTitle>
          <CardDescription>
            Comprehensive legal compliance check based on Egyptian real estate law
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className={`text-2xl font-bold ${getComplianceColor(legalData.compliance_percentage)}`}>
                {legalData.compliance_percentage}%
              </div>
              <Shield className={`h-6 w-6 ${getComplianceColor(legalData.compliance_percentage)}`} />
            </div>
            <Progress value={legalData.compliance_percentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Legal Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className={`text-2xl font-bold ${getRiskColor(legalData.legal_risk_score)}`}>
                {legalData.legal_risk_score}/10
              </div>
              <AlertTriangle className={`h-6 w-6 ${getRiskColor(legalData.legal_risk_score)}`} />
            </div>
            <div className="text-xs text-gray-500 mt-1">Lower is better</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Mortgage Eligibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className={`text-sm font-medium ${eligibilityStatus.color}`}>
                {eligibilityStatus.status.toUpperCase()}
              </div>
              <EligibilityIcon className={`h-6 w-6 ${eligibilityStatus.color}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ownership Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Ownership Structure
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ownership_type">Ownership Type *</Label>
              <Select 
                value={legalData.ownership_type} 
                onValueChange={(value) => setLegalData(prev => ({ ...prev, ownership_type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ownership type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ibtida2i">إبتدائي (Ibtida2i)</SelectItem>
                  <SelectItem value="tawkeel">توكيل (Tawkeel)</SelectItem>
                  <SelectItem value="shahr_3aqary">شهر عقاري (Shahr 3aqary)</SelectItem>
                  <SelectItem value="usufruct">حق انتفاع (Usufruct)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownership_certificate_number">Certificate Number</Label>
              <Input
                id="ownership_certificate_number"
                value={legalData.ownership_certificate_number}
                onChange={(e) => setLegalData(prev => ({ ...prev, ownership_certificate_number: e.target.value }))}
                placeholder="Enter certificate number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownership_certificate_date">Certificate Date</Label>
              <Input
                id="ownership_certificate_date"
                type="date"
                value={legalData.ownership_certificate_date}
                onChange={(e) => setLegalData(prev => ({ ...prev, ownership_certificate_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registry_office">Registry Office</Label>
              <Input
                id="registry_office"
                value={legalData.registry_office}
                onChange={(e) => setLegalData(prev => ({ ...prev, registry_office: e.target.value }))}
                placeholder="Registry office name"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Registration & Documentation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="shahr_3aqary_registered"
                  checked={legalData.shahr_3aqary_registered}
                  onCheckedChange={(checked) => setLegalData(prev => ({ ...prev, shahr_3aqary_registered: !!checked }))}
                />
                <Label htmlFor="shahr_3aqary_registered" className="font-medium">
                  Registered with Shahr 3aqary
                </Label>
              </div>

              {legalData.shahr_3aqary_registered && (
                <div className="ml-6 space-y-2">
                  <div>
                    <Label htmlFor="shahr_3aqary_number">Registration Number</Label>
                    <Input
                      id="shahr_3aqary_number"
                      value={legalData.shahr_3aqary_number}
                      onChange={(e) => setLegalData(prev => ({ ...prev, shahr_3aqary_number: e.target.value }))}
                      placeholder="Shahr 3aqary number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shahr_3aqary_date">Registration Date</Label>
                    <Input
                      id="shahr_3aqary_date"
                      type="date"
                      value={legalData.shahr_3aqary_date}
                      onChange={(e) => setLegalData(prev => ({ ...prev, shahr_3aqary_date: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="title_deed_available"
                  checked={legalData.title_deed_available}
                  onCheckedChange={(checked) => setLegalData(prev => ({ ...prev, title_deed_available: !!checked }))}
                />
                <Label htmlFor="title_deed_available" className="font-medium">
                  Title Deed Available
                </Label>
              </div>

              {legalData.title_deed_available && (
                <div className="ml-6">
                  <Label htmlFor="title_deed_number">Title Deed Number</Label>
                  <Input
                    id="title_deed_number"
                    value={legalData.title_deed_number}
                    onChange={(e) => setLegalData(prev => ({ ...prev, title_deed_number: e.target.value }))}
                    placeholder="Title deed number"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="building_permit_number">Building Permit Number</Label>
                <Input
                  id="building_permit_number"
                  value={legalData.building_permit_number}
                  onChange={(e) => setLegalData(prev => ({ ...prev, building_permit_number: e.target.value }))}
                  placeholder="Building permit number"
                />
              </div>

              <div>
                <Label htmlFor="occupancy_certificate_number">Occupancy Certificate Number</Label>
                <Input
                  id="occupancy_certificate_number"
                  value={legalData.occupancy_certificate_number}
                  onChange={(e) => setLegalData(prev => ({ ...prev, occupancy_certificate_number: e.target.value }))}
                  placeholder="Occupancy certificate number"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Compliance Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Financial Compliance</h4>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tax_registration_current"
                  checked={legalData.tax_registration_current}
                  onCheckedChange={(checked) => setLegalData(prev => ({ ...prev, tax_registration_current: !!checked }))}
                />
                <Label htmlFor="tax_registration_current">Real estate tax paid</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="utility_clearance_current"
                  checked={legalData.utility_clearance_current}
                  onCheckedChange={(checked) => setLegalData(prev => ({ ...prev, utility_clearance_current: !!checked }))}
                />
                <Label htmlFor="utility_clearance_current">Utility clearance current</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="municipal_fees_current"
                  checked={legalData.municipal_fees_current}
                  onCheckedChange={(checked) => setLegalData(prev => ({ ...prev, municipal_fees_current: !!checked }))}
                />
                <Label htmlFor="municipal_fees_current">Municipal fees current</Label>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Developer Verification</h4>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bank_approved_developer"
                  checked={legalData.bank_approved_developer}
                  onCheckedChange={(checked) => setLegalData(prev => ({ ...prev, bank_approved_developer: !!checked }))}
                />
                <Label htmlFor="bank_approved_developer">Bank-approved developer</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="escrow_account_verified"
                  checked={legalData.escrow_account_verified}
                  onCheckedChange={(checked) => setLegalData(prev => ({ ...prev, escrow_account_verified: !!checked }))}
                />
                <Label htmlFor="escrow_account_verified">Escrow account verified</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="construction_insurance_active"
                  checked={legalData.construction_insurance_active}
                  onCheckedChange={(checked) => setLegalData(prev => ({ ...prev, construction_insurance_active: !!checked }))}
                />
                <Label htmlFor="construction_insurance_active">Construction insurance active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="delivery_guarantee_available"
                  checked={legalData.delivery_guarantee_available}
                  onCheckedChange={(checked) => setLegalData(prev => ({ ...prev, delivery_guarantee_available: !!checked }))}
                />
                <Label htmlFor="delivery_guarantee_available">Delivery guarantee available</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Factors */}
      {legalData.risk_factors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Identified Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {legalData.risk_factors.map((factor, index) => (
                <div key={index} className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">{factor}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mortgage Eligibility Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Mortgage Eligibility Assessment
          </CardTitle>
          <CardDescription>
            Check mortgage eligibility with Egyptian banks based on legal status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={checkMortgageEligibility}
              disabled={isCheckingMortgage || !propertyId || !propertyValue}
              className="flex items-center gap-2"
            >
              {isCheckingMortgage ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Checking Eligibility...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Check Mortgage Eligibility
                </>
              )}
            </Button>
            {(!propertyId || !propertyValue) && (
              <div className="text-sm text-amber-600 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Property information required
              </div>
            )}
          </div>

          {mortgageEligibility && (
            <div className="space-y-4">
              {/* Overall Eligibility Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg border-2 ${
                  mortgageEligibility.eligible 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {mortgageEligibility.eligible ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {mortgageEligibility.eligible ? 'Eligible' : 'Not Eligible'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Based on {mortgageEligibility.bank_responses.filter(b => b.eligible).length} of {mortgageEligibility.bank_responses.length} banks
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-gray-50">
                  <div className="font-medium text-green-600 text-lg">
                    {mortgageEligibility.max_loan_amount.toLocaleString()} EGP
                  </div>
                  <div className="text-sm text-gray-600">Max Loan Amount</div>
                </div>

                <div className="p-4 rounded-lg border bg-gray-50">
                  <div className="font-medium text-blue-600 text-lg">
                    {(mortgageEligibility.interest_rate * 100).toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-600">Best Interest Rate</div>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Risk Assessment
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Risk Score:</span>
                      <span className={`text-sm font-medium ${getRiskColor(mortgageEligibility.risk_score)}`}>
                        {mortgageEligibility.risk_score}/10
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Compliance Score:</span>
                      <span className={`text-sm font-medium ${getComplianceColor(mortgageEligibility.compliance_score)}`}>
                        {mortgageEligibility.compliance_score}%
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Payment Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Monthly Payment:</span>
                      <span className="font-medium">{mortgageEligibility.monthly_installment.toLocaleString()} EGP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Down Payment:</span>
                      <span className="font-medium">{mortgageEligibility.down_payment_required.toLocaleString()} EGP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Loan Duration:</span>
                      <span className="font-medium">{mortgageEligibility.recommended_duration_years} years</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Responses */}
              <div>
                <h4 className="font-medium mb-3">Bank Responses</h4>
                <div className="grid gap-3">
                  {mortgageEligibility.bank_responses.map((bank, index) => (
                    <div key={index} className={`p-3 border rounded-lg ${
                      bank.eligible ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{bank.bank_name}</span>
                          <Badge variant={bank.eligible ? 'default' : 'secondary'}>
                            {bank.eligible ? 'Approved' : 'Declined'}
                          </Badge>
                        </div>
                        {bank.eligible && (
                          <div className="text-sm font-medium text-green-600">
                            {(bank.interest_rate * 100).toFixed(2)}%
                          </div>
                        )}
                      </div>
                      {bank.eligible && (
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div>Max Loan: {bank.max_loan_amount.toLocaleString()} EGP</div>
                          <div>Timeline: {bank.approval_timeline_days} days</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Issues */}
              {mortgageEligibility.compliance_issues.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-amber-600 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Issues to Address
                  </h4>
                  <div className="space-y-1">
                    {mortgageEligibility.compliance_issues.map((issue, index) => (
                      <div key={index} className="text-sm text-amber-600 flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3" />
                        {issue}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Developer Information */}
      {developerInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Developer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Commercial Registry</Label>
                <div className="font-medium">{developerInfo.commercial_registry_number}</div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">License Status</Label>
                <Badge variant={developerInfo.license_status === 'active' ? 'default' : 'destructive'}>
                  {developerInfo.license_status}
                </Badge>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Financial Rating</Label>
                <div className="font-medium">{developerInfo.financial_rating}</div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Risk Category</Label>
                <Badge variant={
                  developerInfo.risk_category === 'low' ? 'default' : 
                  developerInfo.risk_category === 'medium' ? 'secondary' : 'destructive'
                }>
                  {developerInfo.risk_category}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}