import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { UserRole } from '@/lib/supabase/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const feeId = params.id;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      payment_amount,
      payment_method,
      payment_reference,
      paymob_transaction_id,
      notes
    } = body;

    // Validate required fields
    if (!payment_amount || !payment_method) {
      return NextResponse.json({ 
        error: 'payment_amount and payment_method are required' 
      }, { status: 400 });
    }

    // Get fee details
    const { data: fee, error: fetchError } = await supabase
      .from('community_fees')
      .select(`
        id,
        unit_id,
        fee_type,
        description,
        amount,
        currency,
        due_date,
        status,
        paid_amount,
        late_fee_amount,
        discount_amount,
        community_units (
          id,
          unit_number,
          building_name,
          compound_id,
          compounds (
            id,
            name
          ),
          compound_residents!inner (
            id,
            user_id,
            resident_type,
            user_profiles (
              full_name,
              email,
              phone
            )
          )
        )
      `)
      .eq('id', feeId)
      .single();

    if (fetchError || !fee) {
      return NextResponse.json({ error: 'Fee not found' }, { status: 404 });
    }

    // Check if user has permission to pay this fee
    const isResident = fee.community_units?.compound_residents?.some(
      (resident: any) => resident.user_id === user.id
    );

    // Check if user is compound manager or admin
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, compound_id, developer_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const hasAdminAccess = userRoles?.some((role: UserRole) => 
      ['admin', 'super_admin'].includes(role.role)
    );

    const isCompoundManager = userRoles?.some((role: UserRole) => 
      role.role === 'compound_manager' && role.compound_id === fee.community_units?.compound_id
    );

    if (!isResident && !hasAdminAccess && !isCompoundManager) {
      return NextResponse.json({ 
        error: 'You can only pay fees for your own unit' 
      }, { status: 403 });
    }

    // Validate payment amount
    const paymentAmount = parseFloat(payment_amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json({ 
        error: 'Payment amount must be a positive number' 
      }, { status: 400 });
    }

    const outstandingAmount = fee.amount - fee.paid_amount + fee.late_fee_amount - fee.discount_amount;

    if (paymentAmount > outstandingAmount) {
      return NextResponse.json({ 
        error: `Payment amount cannot exceed outstanding amount of ${outstandingAmount} ${fee.currency}` 
      }, { status: 400 });
    }

    if (fee.status === 'paid') {
      return NextResponse.json({ 
        error: 'This fee has already been paid in full' 
      }, { status: 400 });
    }

    // Calculate new paid amount and status
    const newPaidAmount = fee.paid_amount + paymentAmount;
    const totalAmount = fee.amount + fee.late_fee_amount - fee.discount_amount;
    const newStatus = newPaidAmount >= totalAmount ? 'paid' : 'partial';

    // Update fee with payment information
    const { data: updatedFee, error: updateError } = await supabase
      .from('community_fees')
      .update({
        paid_amount: newPaidAmount,
        status: newStatus,
        paid_at: newStatus === 'paid' ? new Date().toISOString() : fee.paid_at,
        payment_method,
        payment_reference,
        notes: notes ? `${fee.notes || ''}\nPayment: ${notes}`.trim() : fee.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', feeId)
      .select(`
        id,
        unit_id,
        fee_type,
        description,
        amount,
        currency,
        due_date,
        status,
        paid_amount,
        paid_at,
        payment_method,
        payment_reference,
        late_fee_amount,
        discount_amount,
        created_at,
        updated_at,
        community_units (
          id,
          unit_number,
          building_name,
          compounds (
            id,
            name
          )
        )
      `)
      .single();

    if (updateError) {
      console.error('Payment update error:', updateError);
      return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
    }

    // Create payment record for tracking
    const { error: paymentRecordError } = await supabase
      .from('community_fee_payments')
      .insert({
        fee_id: feeId,
        amount: paymentAmount,
        currency: fee.currency,
        payment_method,
        payment_reference,
        paymob_transaction_id,
        paid_by_user_id: user.id,
        status: 'completed',
        notes
      });

    if (paymentRecordError) {
      console.error('Payment record creation error:', paymentRecordError);
      // Don't fail the main transaction for this
    }

    // TODO: Send payment confirmation notification to resident
    // TODO: Send notification to compound manager
    // TODO: Generate receipt
    // TODO: Integrate with Paymob webhook for payment verification

    const remainingAmount = totalAmount - newPaidAmount;

    return NextResponse.json({
      success: true,
      fee: updatedFee,
      payment: {
        amount: paymentAmount,
        currency: fee.currency,
        method: payment_method,
        reference: payment_reference,
        remaining_amount: remainingAmount,
        fully_paid: newStatus === 'paid'
      },
      message: newStatus === 'paid' 
        ? 'Fee paid in full successfully' 
        : `Partial payment of ${paymentAmount} ${fee.currency} processed. Remaining: ${remainingAmount} ${fee.currency}`
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}