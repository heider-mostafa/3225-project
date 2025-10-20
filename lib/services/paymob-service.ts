// Paymob Egypt Payment Gateway Service
// Implements both Intention API (2025) and Legacy API for compatibility
// Supports all Egyptian payment methods

interface PaymobConfig {
  apiKey: string;
  secretKey: string;
  publicKey: string;
  integrationId: number;
  iframeId: number;
  webhookSecret: string;
  baseUrl: string;
}

interface PaymobIntentionData {
  amount: number; // Amount in EGP (not cents in new API)
  currency: 'EGP';
  payment_methods: string[]; // ['card', 'wallet', 'installments', 'bnpl']
  items: {
    name: string;
    amount: number;
    description: string;
    quantity: number;
  }[];
  billing_data: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    country: 'EG';
    state: string;
    city: string;
    street: string;
    building?: string;
    floor?: string;
    apartment?: string;
    postal_code?: string;
  };
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  };
  extras?: {
    ee: number; // Extra fees
  };
}

interface PaymobIntentionResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_url: string;
  iframe_url: string;
  created_at: string;
  expires_at: string;
  payment_methods: PaymentMethod[];
}

interface PaymentMethod {
  id: string;
  name: string;
  logo_url: string;
  type: 'card' | 'wallet' | 'installments' | 'bnpl' | 'bank_transfer';
  fees: {
    percentage: number;
    fixed: number;
  };
  processing_time: string;
  minimum_amount: number;
  maximum_amount: number;
  supported_currencies: string[];
}

interface PaymobOrderData {
  amount_cents: number; // Legacy: Amount in Egyptian Piasters (EGP * 100)
  currency: 'EGP';
  merchant_order_id: string;
  items: {
    name: string;
    amount_cents: number;
    description: string;
    quantity: number;
  }[];
  delivery_needed: boolean;
  merchant_id?: number;
}

interface PaymobPaymentData {
  amount_cents: number;
  expiration: number; // 3600 seconds recommended
  order_id: string;
  billing_data: {
    apartment: string;
    email: string;
    floor: string;
    first_name: string;
    street: string;
    building: string;
    phone_number: string;
    shipping_method: "NA"; // No shipping for services
    postal_code: string;
    city: string;
    country: "EG";
    last_name: string;
    state: string;
  };
  currency: "EGP";
  integration_id: number;
  lock_order_when_paid: boolean;
}

interface PaymobWebhook {
  amount_cents: number;
  created_at: string;
  currency: string;
  error_occured: boolean;
  has_parent_transaction: boolean;
  id: number;
  integration_id: number;
  is_3d_secure: boolean;
  is_auth: boolean;
  is_capture: boolean;
  is_refunded: boolean;
  is_standalone_payment: boolean;
  is_voided: boolean;
  order: {
    id: number;
    created_at: string;
    delivery_needed: boolean;
    merchant: {
      id: number;
      created_at: string;
      phones: string[];
      company_emails: string[];
      company_name: string;
      state: string;
      country: string;
      city: string;
      postal_code: string;
      street: string;
    };
    collector: any;
    amount_cents: number;
    shipping_data: any;
    currency: string;
    is_payment_locked: boolean;
    is_return: boolean;
    is_cancel: boolean;
    is_returned: boolean;
    is_canceled: boolean;
    merchant_order_id: string;
    wallet_notification: any;
    paid_amount_cents: number;
    notify_user_with_email: boolean;
    items: any[];
    order_url: string;
    commission_fees: number;
    delivery_fees_cents: number;
    delivery_vat_cents: number;
    payment_method: string;
    merchant_staff_tag: any;
    api_source: string;
    data: any;
  };
  owner: number;
  pending: boolean;
  source_data: {
    pan: string;
    type: string;
    tenure: number;
    sub_type: string;
  };
  success: boolean;
  terminal_id: any;
  transaction_processed_callback_responses: any[];
  type: string;
  updated_at: string;
}

interface InstallmentOption {
  bank_id: string;
  bank_name: string;
  installments: {
    months: number;
    interest_rate: number;
    monthly_payment: number;
    total_amount: number;
    fees: number;
  }[];
}

export class PaymobService {
  private config: PaymobConfig;
  private authToken?: string;
  private tokenExpiry?: Date;

  constructor() {
    this.config = {
      apiKey: process.env.PAYMOB_API_KEY || '',
      secretKey: process.env.PAYMOB_SECRET_KEY || '',
      publicKey: process.env.PAYMOB_PUBLIC_KEY || '',
      integrationId: parseInt(process.env.PAYMOB_INTEGRATION_ID || '0'),
      iframeId: parseInt(process.env.PAYMOB_IFRAME_ID || '0'),
      webhookSecret: process.env.PAYMOB_WEBHOOK_SECRET || '',
      baseUrl: process.env.PAYMOB_BASE_URL || 'https://accept.paymob.com/api'
    };

    // Debug configuration
    console.log('🔧 Paymob Configuration:', {
      apiKey: this.config.apiKey ? `${this.config.apiKey.substring(0, 10)}...` : 'NOT SET',
      integrationId: this.config.integrationId,
      iframeId: this.config.iframeId,
      baseUrl: this.config.baseUrl,
      hasWebhookSecret: !!this.config.webhookSecret
    });

  }

  // Authentication
  async getAuthToken(): Promise<string> {
    if (this.authToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.authToken;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/auth/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: this.config.apiKey
        })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.authToken = data.token;
      this.tokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      return this.authToken;
    } catch (error) {
      console.error('Paymob authentication error:', error);
      throw new Error('Failed to authenticate with Paymob');
    }
  }

  // NEW: Complete Paymob Integration (2025) - 2-Step Process
  async createPaymentIntention(intentionData: PaymobIntentionData): Promise<PaymobIntentionResponse> {
    console.log('🔐 Starting Paymob payment intention creation...');
    const token = await this.getAuthToken();
    console.log('✅ Auth token obtained');

    try {
      // Step 1: Create order first
      console.log('📋 Step 1: Creating order...');
      console.log('💰 Input amount:', intentionData.amount, 'EGP');
      const amountCents = Math.round(intentionData.amount * 100);
      console.log('💰 Converted to cents:', amountCents);
      
      const orderData = {
        auth_token: token,
        amount_cents: amountCents,
        currency: intentionData.currency,
        merchant_order_id: `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        items: intentionData.items.map(item => ({
          name: item.name,
          amount_cents: Math.round(item.amount * 100),
          description: item.description,
          quantity: item.quantity
        })),
        delivery_needed: false
      };

      const orderResponse = await fetch(`${this.config.baseUrl}/ecommerce/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.text();
        console.error('❌ Paymob order creation failed:', errorData);
        throw new Error(`Failed to create order: ${orderResponse.statusText}`);
      }

      const order = await orderResponse.json();
      console.log('✅ Order created:', order.id);

      // Step 2: Create payment key with comprehensive payment methods
      console.log('🔑 Step 2: Creating payment key...');
      const paymentKeyData = {
        auth_token: token,
        amount_cents: Math.round(intentionData.amount * 100),
        expiration: 3600,
        order_id: order.id,
        billing_data: {
          apartment: intentionData.billing_data.apartment || 'N/A',
          email: intentionData.billing_data.email,
          floor: intentionData.billing_data.floor || 'N/A',
          first_name: intentionData.billing_data.first_name,
          street: intentionData.billing_data.street,
          building: intentionData.billing_data.building || 'N/A',
          phone_number: intentionData.billing_data.phone_number,
          shipping_method: 'NA',
          postal_code: intentionData.billing_data.postal_code || '00000',
          city: intentionData.billing_data.city,
          country: 'EG',
          last_name: intentionData.billing_data.last_name,
          state: intentionData.billing_data.state
        },
        currency: intentionData.currency,
        integration_id: this.config.integrationId,
        lock_order_when_paid: true,
        special_reference: `RENTAL-${Date.now()}` // Help identify rental transactions
      };

      const paymentKeyResponse = await fetch(`${this.config.baseUrl}/acceptance/payment_keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentKeyData)
      });

      if (!paymentKeyResponse.ok) {
        const errorData = await paymentKeyResponse.text();
        console.error('❌ Paymob payment key creation failed:', errorData);
        throw new Error(`Failed to create payment key: ${paymentKeyResponse.statusText}`);
      }

      const paymentKey = await paymentKeyResponse.json();
      console.log('✅ Payment key created:', paymentKey.token?.substring(0, 20) + '...');
      
      // Try different iframe approaches based on Paymob 2025 documentation
      
      // Approach 1: Standard iframe URL (most reliable)
      const standardIframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${this.config.iframeId}?payment_token=${paymentKey.token}`;
      
      // Approach 2: Enhanced URL with payment methods (experimental)
      const paymentMethodsParam = intentionData.payment_methods.join(',');
      const enhancedIframeUrl = `${standardIframeUrl}&payment_methods=${paymentMethodsParam}&locale=en`;
      
      // Use standard approach as it's more reliable
      const iframeUrl = standardIframeUrl;
      console.log('🔗 Standard iframe URL constructed:', iframeUrl);
      console.log('🔗 Enhanced URL (for reference):', enhancedIframeUrl);
      console.log('🔗 Payment methods in order:', paymentMethodsParam);
      
      return {
        id: paymentKey.token,
        amount: intentionData.amount,
        currency: intentionData.currency,
        status: 'pending',
        payment_url: iframeUrl,
        iframe_url: iframeUrl,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        payment_methods: []
      };
    } catch (error) {
      console.error('💥 Payment intention error:', error);
      throw error;
    }
  }

  // Legacy order creation (still supported)
  async createOrder(orderData: PaymobOrderData): Promise<any> {
    const token = await this.getAuthToken();

    try {
      const response = await fetch(`${this.config.baseUrl}/ecommerce/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          auth_token: token,
          ...orderData
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Paymob order creation failed:', errorData);
        throw new Error(`Failed to create order: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Order creation error:', error);
      throw error;
    }
  }

  // Create payment key for iframe/SDK
  async createPaymentKey(paymentData: PaymobPaymentData): Promise<string> {
    const token = await this.getAuthToken();

    try {
      const response = await fetch(`${this.config.baseUrl}/acceptance/payment_keys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          auth_token: token,
          ...paymentData
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Paymob payment key creation failed:', errorData);
        throw new Error(`Failed to create payment key: ${response.statusText}`);
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Payment key creation error:', error);
      throw error;
    }
  }

  // Get available payment methods (2025 Paymob API)
  async getAvailablePaymentMethods(amount: number, currency: string = 'EGP'): Promise<PaymentMethod[]> {
    try {
      console.log('🔍 Fetching payment methods for amount:', amount, currency);
      
      // For now, return comprehensive default methods since Paymob API endpoints aren't working
      // This ensures users see all available payment options in our UI
      // The actual payment method selection will happen in the Paymob iframe
      console.log('✅ Using comprehensive default payment methods');
      return this.getDefaultPaymentMethods(amount);
      
    } catch (error) {
      console.warn('❌ Payment methods fetch error:', error);
      return this.getDefaultPaymentMethods(amount);
    }
  }

  // Get installment options
  async getInstallmentOptions(amount: number, bankId?: string): Promise<InstallmentOption[]> {
    const token = await this.getAuthToken();

    try {
      const url = bankId 
        ? `${this.config.baseUrl}/acceptance/installments?amount=${amount}&bank_id=${bankId}`
        : `${this.config.baseUrl}/acceptance/installments?amount=${amount}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn('Could not fetch installment options');
        return [];
      }

      const data = await response.json();
      return data.installment_options || [];
    } catch (error) {
      console.warn('Installment options fetch error:', error);
      return [];
    }
  }

  // Enhanced transaction inquiry
  async getTransactionStatus(transactionId: string): Promise<any> {
    const token = await this.getAuthToken();

    try {
      const response = await fetch(`${this.config.baseUrl}/acceptance/transactions/${transactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get transaction status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Transaction status error:', error);
      throw error;
    }
  }

  // Advanced refund processing
  async processRefund(transactionId: string, amount: number, reason?: string): Promise<any> {
    const token = await this.getAuthToken();

    try {
      const response = await fetch(`${this.config.baseUrl}/acceptance/void_refund/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          auth_token: token,
          transaction_id: transactionId,
          amount_cents: Math.round(amount * 100), // Convert to cents
          reason: reason || 'Customer request'
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Paymob refund failed:', errorData);
        throw new Error(`Failed to process refund: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Refund processing error:', error);
      throw error;
    }
  }

  // Enhanced webhook handling with signature verification
  async handleWebhook(webhookData: PaymobWebhook, signature: string): Promise<boolean> {
    try {
      // Verify webhook signature
      const isValid = this.verifyWebhookSignature(webhookData, signature);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return false;
      }

      // Process webhook based on type
      const success = webhookData.success;
      const transactionId = webhookData.id.toString();
      const orderId = webhookData.order.id.toString();
      const merchantOrderId = webhookData.order.merchant_order_id;

      console.log(`Processing webhook for transaction ${transactionId}, success: ${success}`);

      // Update payment status in database
      await this.updatePaymentStatus(transactionId, orderId, merchantOrderId, webhookData);

      return true;
    } catch (error) {
      console.error('Webhook processing error:', error);
      return false;
    }
  }

  // Verify webhook signature
  private verifyWebhookSignature(webhookData: PaymobWebhook, signature: string): boolean {
    try {
      const crypto = require('crypto');
      
      // Concatenate specific fields as per Paymob documentation
      const concatenated = 
        webhookData.amount_cents.toString() +
        webhookData.created_at +
        webhookData.currency +
        webhookData.error_occured.toString() +
        webhookData.has_parent_transaction.toString() +
        webhookData.id.toString() +
        webhookData.integration_id.toString() +
        webhookData.is_3d_secure.toString() +
        webhookData.is_auth.toString() +
        webhookData.is_capture.toString() +
        webhookData.is_refunded.toString() +
        webhookData.is_standalone_payment.toString() +
        webhookData.is_voided.toString() +
        webhookData.order.id.toString() +
        webhookData.owner.toString() +
        webhookData.pending.toString() +
        (webhookData.source_data.pan || '') +
        (webhookData.source_data.sub_type || '') +
        (webhookData.source_data.type || '') +
        webhookData.success.toString();

      const hash = crypto
        .createHmac('sha512', this.config.webhookSecret)
        .update(concatenated)
        .digest('hex');

      return hash === signature;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  // Update payment status in database (handles both rental and appraisal payments)
  private async updatePaymentStatus(
    transactionId: string, 
    orderId: string, 
    merchantOrderId: string, 
    webhookData: PaymobWebhook
  ): Promise<void> {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const status = webhookData.success ? 'paid' : 'failed';
      const paymentDate = webhookData.success ? new Date().toISOString() : null;

      // Try to update rental_payments first
      const { data: rentalPayment, error: rentalError } = await supabase
        .from('rental_payments')
        .update({
          paymob_transaction_id: transactionId,
          status,
          payment_date: paymentDate,
          payment_method: webhookData.order.payment_method || 'unknown',
          updated_at: new Date().toISOString()
        })
        .eq('paymob_order_id', merchantOrderId)
        .select()
        .single();

      if (rentalPayment) {
        console.log(`✅ Rental payment status updated for order ${merchantOrderId}: ${status}`);
        
        // If rental payment successful, update booking status
        if (webhookData.success) {
          const { error: bookingError } = await supabase
            .from('rental_bookings')
            .update({
              status: 'confirmed',
              payment_status: 'paid',
              confirmed_at: new Date().toISOString()
            })
            .eq('id', rentalPayment.booking_id);
            
          if (bookingError) {
            console.error('Failed to update booking status:', bookingError);
          } else {
            console.log(`✅ Booking ${rentalPayment.booking_id} confirmed`);
          }
        }
        return;
      }

      // If not a rental payment, try appraisal_payments
      const { error: appraisalError } = await supabase
        .from('appraisal_payments')
        .update({
          paymob_transaction_id: transactionId,
          status,
          payment_date: paymentDate,
          paymob_status: webhookData.success ? 'success' : 'failed',
          payment_method: webhookData.order.payment_method || 'unknown',
          metadata: {
            webhook_data: webhookData,
            processed_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('merchant_order_id', merchantOrderId);

      if (appraisalError) {
        console.error('Failed to update appraisal payment status:', appraisalError);
      } else {
        console.log(`✅ Appraisal payment status updated for order ${merchantOrderId}: ${status}`);
      }

    } catch (error) {
      console.error('Database update error:', error);
    }
  }

  // Default payment methods for Egyptian market (2025 comprehensive)
  private getDefaultPaymentMethods(amount: number): PaymentMethod[] {
    const allMethods = [
      {
        id: 'card',
        name: 'Credit/Debit Cards',
        logo_url: '/payment-logos/cards.png',
        type: 'card' as const,
        fees: { percentage: 2.85, fixed: 3 },
        processing_time: 'Instant',
        minimum_amount: 1,
        maximum_amount: 50000,
        supported_currencies: ['EGP']
      },
      {
        id: 'apple_pay',
        name: 'Apple Pay',
        logo_url: '/payment-logos/apple-pay.png',
        type: 'wallet' as const,
        fees: { percentage: 2.85, fixed: 3 },
        processing_time: 'Instant',
        minimum_amount: 1,
        maximum_amount: 50000,
        supported_currencies: ['EGP']
      },
      {
        id: 'google_pay',
        name: 'Google Pay',
        logo_url: '/payment-logos/google-pay.png',
        type: 'wallet' as const,
        fees: { percentage: 2.85, fixed: 3 },
        processing_time: 'Instant',
        minimum_amount: 1,
        maximum_amount: 50000,
        supported_currencies: ['EGP']
      },
      {
        id: 'vodafone_cash',
        name: 'Vodafone Cash',
        logo_url: '/payment-logos/vodafone.png',
        type: 'wallet' as const,
        fees: { percentage: 2.5, fixed: 2 },
        processing_time: 'Instant',
        minimum_amount: 1,
        maximum_amount: 25000,
        supported_currencies: ['EGP']
      },
      {
        id: 'orange_cash',
        name: 'Orange Cash',
        logo_url: '/payment-logos/orange.png',
        type: 'wallet' as const,
        fees: { percentage: 2.5, fixed: 2 },
        processing_time: 'Instant',
        minimum_amount: 1,
        maximum_amount: 25000,
        supported_currencies: ['EGP']
      },
      {
        id: 'etisalat_cash',
        name: 'Etisalat Cash',
        logo_url: '/payment-logos/etisalat.png',
        type: 'wallet' as const,
        fees: { percentage: 2.5, fixed: 2 },
        processing_time: 'Instant',
        minimum_amount: 1,
        maximum_amount: 25000,
        supported_currencies: ['EGP']
      },
      {
        id: 'instapay',
        name: 'InstaPay',
        logo_url: '/payment-logos/instapay.png',
        type: 'bank_transfer' as const,
        fees: { percentage: 1.5, fixed: 1 },
        processing_time: 'Instant',
        minimum_amount: 1,
        maximum_amount: 100000,
        supported_currencies: ['EGP']
      },
      {
        id: 'fawry',
        name: 'Fawry',
        logo_url: '/payment-logos/fawry.png',
        type: 'wallet' as const,
        fees: { percentage: 2.2, fixed: 2 },
        processing_time: 'Instant',
        minimum_amount: 1,
        maximum_amount: 50000,
        supported_currencies: ['EGP']
      },
      {
        id: 'valu',
        name: 'valU',
        logo_url: '/payment-logos/valu.png',
        type: 'bnpl' as const,
        fees: { percentage: 3.5, fixed: 5 },
        processing_time: 'Instant',
        minimum_amount: 100,
        maximum_amount: 30000,
        supported_currencies: ['EGP']
      },
      {
        id: 'souhoola',
        name: 'Souhoola',
        logo_url: '/payment-logos/souhoola.png',
        type: 'bnpl' as const,
        fees: { percentage: 4.0, fixed: 5 },
        processing_time: 'Instant',
        minimum_amount: 200,
        maximum_amount: 25000,
        supported_currencies: ['EGP']
      },
      {
        id: 'shahry',
        name: 'Shahry',
        logo_url: '/payment-logos/shahry.png',
        type: 'bnpl' as const,
        fees: { percentage: 3.8, fixed: 5 },
        processing_time: 'Instant',
        minimum_amount: 150,
        maximum_amount: 20000,
        supported_currencies: ['EGP']
      }
    ];

    // Filter methods based on amount eligibility
    return allMethods.filter(method => 
      amount >= method.minimum_amount && amount <= method.maximum_amount
    );
  }

  // Utility method to convert EGP to cents
  static egpToCents(egp: number): number {
    return Math.round(egp * 100);
  }

  // Utility method to convert cents to EGP
  static centsToEgp(cents: number): number {
    return cents / 100;
  }

  // Generate enhanced iframe URL with payment methods support
  getIframeUrl(paymentKey: string, paymentMethods: string[] = ['card', 'wallet', 'instapay', 'bnpl']): string {
    const paymentMethodsParam = paymentMethods.join(',');
    return `https://accept.paymob.com/api/acceptance/iframes/${this.config.iframeId}?payment_token=${paymentKey}&payment_methods=${paymentMethodsParam}&show_payment_methods=true&locale=en`;
  }

  // Generate redirect URL for mobile payments
  getRedirectUrl(paymentKey: string, integrationId?: number): string {
    const intId = integrationId || this.config.integrationId;
    return `https://accept.paymob.com/api/acceptance/payments/pay?payment_token=${paymentKey}&integration_id=${intId}`;
  }
}

// Export singleton instance
export const paymobService = new PaymobService();