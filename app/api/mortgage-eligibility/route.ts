import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { egyptianBankIntegration, BankEligibilityRequest } from '@/lib/services/egyptian-bank-integration';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check user permissions
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (roleError) {
      return NextResponse.json(
        { error: 'Failed to check user permissions' },
        { status: 500 }
      );
    }

    const hasAccess = userRoles?.some(role => 
      ['appraiser', 'broker', 'admin', 'super_admin'].includes(role.role)
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied. Professional role required.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'property_id', 'property_value', 'property_type',
      'client_monthly_income', 'client_age', 'requested_loan_amount'
    ];
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Required field missing: ${field}` },
          { status: 400 }
        );
      }
    }

    // Verify property exists and get additional details
    const { data: propertyData, error: propertyError } = await supabase
      .from('properties')
      .select(`
        id,
        title,
        price,
        property_type,
        address,
        city,
        created_at,
        metadata
      `)
      .eq('id', body.property_id)
      .single();

    if (propertyError || !propertyData) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Get property age
    const propertyCreatedDate = new Date(propertyData.created_at);
    const currentDate = new Date();
    const propertyAgeYears = Math.max(0, 
      (currentDate.getTime() - propertyCreatedDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
    );

    // Build bank eligibility request
    const eligibilityRequest: BankEligibilityRequest = {
      // Property information
      property_id: body.property_id,
      property_value: body.property_value || propertyData.price,
      property_type: body.property_type || propertyData.property_type,
      property_age: body.property_age || propertyAgeYears,
      location: body.location || propertyData.address,
      district: body.district || propertyData.city,
      
      // Legal status
      ownership_type: body.ownership_type || 'shahr_3aqary',
      shahr_3aqary_registered: body.shahr_3aqary_registered || false,
      title_deed_available: body.title_deed_available || false,
      bank_approved_developer: body.bank_approved_developer || false,
      escrow_account_verified: body.escrow_account_verified || false,
      
      // Client information
      client_monthly_income: body.client_monthly_income,
      client_age: body.client_age,
      employment_type: body.employment_type || 'employee',
      employment_duration_months: body.employment_duration_months || 12,
      existing_debts: body.existing_debts || 0,
      client_nationality: body.client_nationality || 'egyptian',
      
      // Loan request
      requested_loan_amount: body.requested_loan_amount,
      requested_duration_years: body.requested_duration_years || 25,
      down_payment_percentage: body.down_payment_percentage || 20
    };

    // Check mortgage eligibility with Egyptian banks
    const eligibilityResult = await egyptianBankIntegration.checkMortgageEligibility(eligibilityRequest);

    // Log the request for analytics
    const { error: logError } = await supabase
      .from('mortgage_eligibility_requests')
      .insert({
        user_id: user.id,
        property_id: body.property_id,
        request_data: eligibilityRequest,
        response_data: eligibilityResult,
        eligible: eligibilityResult.eligible,
        max_loan_amount: eligibilityResult.max_loan_amount,
        risk_score: eligibilityResult.risk_score,
        compliance_score: eligibilityResult.compliance_score
      });

    if (logError) {
      console.error('Failed to log eligibility request:', logError);
      // Continue despite logging error
    }

    return NextResponse.json({
      success: true,
      data: eligibilityResult,
      message: 'Mortgage eligibility check completed'
    });

  } catch (error) {
    console.error('Mortgage eligibility error:', error);
    return NextResponse.json(
      { error: 'Failed to check mortgage eligibility' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Get Egyptian banks information
    if (action === 'banks') {
      const banks = egyptianBankIntegration.getEgyptianBanks();
      return NextResponse.json({
        success: true,
        data: banks
      });
    }

    // Get mortgage history for current user
    if (action === 'history') {
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const offset = (page - 1) * limit;

      const { data: requests, error } = await supabase
        .from('mortgage_eligibility_requests')
        .select(`
          *,
          properties:property_id (
            id,
            title,
            address,
            city,
            price
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch mortgage history' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: requests
      });
    }

    // Calculate mortgage payment
    if (action === 'calculate') {
      const loanAmount = parseFloat(searchParams.get('loan_amount') || '0');
      const interestRate = parseFloat(searchParams.get('interest_rate') || '0');
      const loanTermYears = parseInt(searchParams.get('loan_term_years') || '25');

      if (loanAmount <= 0 || interestRate <= 0 || loanTermYears <= 0) {
        return NextResponse.json(
          { error: 'Invalid parameters for mortgage calculation' },
          { status: 400 }
        );
      }

      const calculation = egyptianBankIntegration.calculateMortgagePayment(
        loanAmount,
        interestRate,
        loanTermYears
      );

      return NextResponse.json({
        success: true,
        data: calculation
      });
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Mortgage API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}