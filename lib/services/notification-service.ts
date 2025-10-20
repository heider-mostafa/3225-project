// Email and SMS Notification Service
// This service provides a unified interface for sending notifications
// Implements Mailgun for email and Twilio for SMS

export interface EmailTemplate {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, any>;
}

export interface SMSTemplate {
  to: string;
  message: string;
  template: string;
  variables: Record<string, any>;
}

export interface NotificationConfig {
  email?: {
    provider: 'mailgun' | 'console';
    apiKey?: string;
    domain?: string;
    fromEmail?: string;
    fromName?: string;
  };
  sms?: {
    provider: 'twilio' | 'console';
    accountSid?: string;
    authToken?: string;
    fromNumber?: string;
  };
}

class NotificationService {
  private config: NotificationConfig;

  constructor(config: NotificationConfig = {}) {
    this.config = {
      email: {
        provider: (process.env.EMAIL_PROVIDER as any) || 'mailgun',
        apiKey: process.env.MAILGUN_API_KEY,
        domain: process.env.MAILGUN_DOMAIN,
        fromEmail: process.env.NOTIFICATION_FROM_EMAIL || 'noreply@yourdomain.com',
        fromName: process.env.NOTIFICATION_FROM_NAME || 'Real Estate Platform',
        ...config.email
      },
      sms: {
        provider: (process.env.SMS_PROVIDER as any) || 'twilio',
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        fromNumber: process.env.TWILIO_FROM_NUMBER,
        ...config.sms
      }
    };
  }

  // Email Templates
  private getEmailTemplate(template: string, variables: Record<string, any>): string {
    const templates: Record<string, string> = {
      'appraiser_notification': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Contact Request</h2>
          <p>Hello <strong>${variables.appraiser_name}</strong>,</p>
          <p>You have received a new ${variables.contact_type === 'appraisal_request' ? 'appraisal request' : 'contact message'} from <strong>${variables.client_name}</strong>.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Contact Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 5px 0;"><strong>Name:</strong> ${variables.client_name}</li>
              <li style="padding: 5px 0;"><strong>Email:</strong> ${variables.client_email}</li>
              <li style="padding: 5px 0;"><strong>Phone:</strong> ${variables.client_phone || 'Not provided'}</li>
              <li style="padding: 5px 0;"><strong>Preferred Contact:</strong> ${variables.contact_preference}</li>
            </ul>
          </div>

          ${variables.contact_type === 'appraisal_request' ? `
          <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #065f46;">Property Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 5px 0;"><strong>Type:</strong> ${variables.property_type}</li>
              <li style="padding: 5px 0;"><strong>Address:</strong> ${variables.property_address}</li>
              <li style="padding: 5px 0;"><strong>Appraisal Type:</strong> ${variables.appraisal_type}</li>
              <li style="padding: 5px 0;"><strong>Urgency:</strong> ${variables.urgency}</li>
            </ul>
          </div>
          ` : ''}

          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #92400e;">Message:</h3>
            <p style="margin-bottom: 0;">${variables.message}</p>
          </div>

          <p><strong>Request ID:</strong> ${variables.request_id}</p>
          
          <p>Please respond to this request within your standard response time.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin-bottom: 0;">Best regards,<br><strong>Real Estate Platform Team</strong></p>
          </div>
        </div>
      `,

      'client_confirmation': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Contact Request Confirmation</h2>
          <p>Hello <strong>${variables.client_name}</strong>,</p>
          <p>Thank you for contacting <strong>${variables.appraiser_name}</strong>. Your ${variables.contact_type === 'appraisal_request' ? 'appraisal request' : 'message'} has been successfully sent.</p>
          
          <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #065f46;">Request Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 5px 0;"><strong>Confirmation ID:</strong> ${variables.request_id}</li>
              <li style="padding: 5px 0;"><strong>Appraiser:</strong> ${variables.appraiser_name}</li>
              <li style="padding: 5px 0;"><strong>Expected Response:</strong> ${variables.estimated_response_time}</li>
              ${variables.property_address !== 'N/A' ? `<li style="padding: 5px 0;"><strong>Property:</strong> ${variables.property_address}</li>` : ''}
            </ul>
          </div>

          <p>The appraiser will contact you directly using your preferred contact method. If you don't hear back within the expected timeframe, please don't hesitate to reach out to us.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin-bottom: 0;">Best regards,<br><strong>OpenBeit Team</strong></p>
          </div>
        </div>
      `,

      'booking_confirmation_appraiser': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Booking Request</h2>
          <p>Hello <strong>${variables.appraiser_name}</strong>,</p>
          <p>You have received a new booking request for a <strong>${variables.booking_type}</strong>.</p>
          
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">Booking Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 5px 0;"><strong>Confirmation Number:</strong> ${variables.confirmation_number}</li>
              <li style="padding: 5px 0;"><strong>Client:</strong> ${variables.client_name}</li>
              <li style="padding: 5px 0;"><strong>Email:</strong> ${variables.client_email}</li>
              <li style="padding: 5px 0;"><strong>Phone:</strong> ${variables.client_phone || 'Not provided'}</li>
              <li style="padding: 5px 0;"><strong>Date & Time:</strong> ${variables.scheduled_datetime}</li>
              <li style="padding: 5px 0;"><strong>Duration:</strong> ${variables.estimated_duration_hours} hours</li>
              <li style="padding: 5px 0;"><strong>Property:</strong> ${variables.property_address}</li>
              <li style="padding: 5px 0;"><strong>Estimated Cost:</strong> ${variables.estimated_cost} EGP</li>
            </ul>
          </div>

          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #92400e;">Special Instructions:</h3>
            <p style="margin-bottom: 0;">${variables.special_instructions || 'None provided'}</p>
          </div>

          <p>Please confirm or reschedule this booking through your dashboard.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin-bottom: 0;">Best regards,<br><strong>Real Estate Platform Team</strong></p>
          </div>
        </div>
      `,

      'booking_confirmation_client': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Booking Confirmation</h2>
          <p>Hello <strong>${variables.client_name}</strong>,</p>
          <p>Your ${variables.booking_type} booking has been successfully created!</p>
          
          <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #065f46;">Booking Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 5px 0;"><strong>Confirmation Number:</strong> ${variables.confirmation_number}</li>
              <li style="padding: 5px 0;"><strong>Appraiser:</strong> ${variables.appraiser_name}</li>
              <li style="padding: 5px 0;"><strong>Date & Time:</strong> ${variables.scheduled_datetime}</li>
              <li style="padding: 5px 0;"><strong>Property:</strong> ${variables.property_address}</li>
              <li style="padding: 5px 0;"><strong>Total Cost:</strong> ${variables.estimated_cost} EGP</li>
              <li style="padding: 5px 0;"><strong>Deposit Due:</strong> ${variables.payment_due} EGP</li>
            </ul>
          </div>

          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">Next Steps:</h3>
            <ol style="padding-left: 20px;">
              ${variables.next_steps?.map((step: string) => `<li style="padding: 3px 0;">${step}</li>`).join('') || ''}
            </ol>
          </div>

          <p>The appraiser will contact you 24 hours before your scheduled appointment to confirm details and provide any additional instructions.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin-bottom: 0;">Best regards,<br><strong>Real Estate Platform Team</strong></p>
          </div>
        </div>
      `,

      'booking_update': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Booking Update</h2>
          <p>Hello <strong>${variables.client_name}</strong>,</p>
          <p>${variables.message}</p>
          
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">Booking Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 5px 0;"><strong>Confirmation Number:</strong> ${variables.confirmation_number}</li>
              <li style="padding: 5px 0;"><strong>Service:</strong> ${variables.booking_type}</li>
              <li style="padding: 5px 0;"><strong>Appraiser:</strong> ${variables.appraiser_name}</li>
              ${variables.new_datetime ? `<li style="padding: 5px 0;"><strong>New Date & Time:</strong> ${variables.new_datetime}</li>` : `<li style="padding: 5px 0;"><strong>Date & Time:</strong> ${variables.scheduled_datetime}</li>`}
            </ul>
          </div>

          ${variables.notes ? `
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #92400e;">Additional Notes:</h3>
            <p style="margin-bottom: 0;">${variables.notes}</p>
          </div>
          ` : ''}

          <p>If you have any questions or concerns, please don't hesitate to contact us.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin-bottom: 0;">Best regards,<br><strong>Real Estate Platform Team</strong></p>
          </div>
        </div>
      `,

      'rental_booking_confirmed': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">🎉 Rental Booking Confirmed!</h2>
          <p>Hello <strong>${variables.guest_name}</strong>,</p>
          <p>Great news! Your rental booking has been <strong>confirmed and paid</strong>. Get ready for your stay!</p>
          
          <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #065f46;">📍 Property Details</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 8px 0;"><strong>Property:</strong> ${variables.property_title}</li>
              <li style="padding: 8px 0;"><strong>Address:</strong> ${variables.property_address}</li>
              <li style="padding: 8px 0;"><strong>Booking ID:</strong> ${variables.booking_id}</li>
            </ul>
          </div>

          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">📅 Stay Details</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 8px 0;"><strong>Check-in:</strong> ${variables.check_in_date}</li>
              <li style="padding: 8px 0;"><strong>Check-out:</strong> ${variables.check_out_date}</li>
              <li style="padding: 8px 0;"><strong>Guests:</strong> ${variables.number_of_guests}</li>
              <li style="padding: 8px 0;"><strong>Total Paid:</strong> ${variables.total_amount} EGP</li>
            </ul>
          </div>

          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #92400e;">📋 Next Steps</h3>
            <ul style="padding-left: 20px;">
              <li style="padding: 3px 0;">You'll receive check-in details 24 hours before arrival</li>
              <li style="padding: 3px 0;">Keep this confirmation email for your records</li>
              <li style="padding: 3px 0;">The property management team will contact you before check-in</li>
              <li style="padding: 3px 0;">Check-in time: After ${variables.check_in_time || '15:00'}</li>
              <li style="padding: 3px 0;">Check-out time: Before ${variables.check_out_time || '11:00'}</li>
            </ul>
          </div>

          <p>We hope you have a wonderful stay! If you have any questions, don't hesitate to contact us.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin-bottom: 0;">Best regards,<br><strong>OpenBeit Rental Team</strong></p>
          </div>
        </div>
      `,

      'rental_payment_failed': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">❌ Payment Failed</h2>
          <p>Hello <strong>${variables.guest_name}</strong>,</p>
          <p>Unfortunately, we couldn't process your payment for the rental booking. Your reservation is currently on hold.</p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #991b1b;">Booking Details</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 5px 0;"><strong>Property:</strong> ${variables.property_title}</li>
              <li style="padding: 5px 0;"><strong>Dates:</strong> ${variables.check_in_date} to ${variables.check_out_date}</li>
              <li style="padding: 5px 0;"><strong>Amount:</strong> ${variables.total_amount} EGP</li>
              <li style="padding: 5px 0;"><strong>Booking ID:</strong> ${variables.booking_id}</li>
            </ul>
          </div>

          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">What to do next?</h3>
            <p>Please try to complete your payment again. Your booking will be held for 24 hours.</p>
            <p><strong>Note:</strong> If payment isn't completed within 24 hours, your booking may be cancelled and dates released to other guests.</p>
          </div>

          <p>If you continue to experience payment issues, please contact our support team.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin-bottom: 0;">Best regards,<br><strong>OpenBeit Rental Team</strong></p>
          </div>
        </div>
      `,

      'booking_payment_confirmed': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">🎉 Payment Confirmed!</h2>
          <p>Hello <strong>${variables.client_name}</strong>,</p>
          <p>Great news! Your payment has been successfully processed and your appraisal booking is now confirmed.</p>
          
          <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #065f46;">📋 Booking Details</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 8px 0;"><strong>Confirmation Number:</strong> ${variables.confirmation_number}</li>
              <li style="padding: 8px 0;"><strong>Service:</strong> ${variables.booking_type}</li>
              <li style="padding: 8px 0;"><strong>Appraiser:</strong> ${variables.appraiser_name}</li>
              <li style="padding: 8px 0;"><strong>Date & Time:</strong> ${variables.scheduled_datetime}</li>
              <li style="padding: 8px 0;"><strong>Property:</strong> ${variables.property_address}</li>
              <li style="padding: 8px 0;"><strong>Total Paid:</strong> ${variables.total_amount} EGP</li>
            </ul>
          </div>

          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">📋 Next Steps</h3>
            <ul style="padding-left: 20px;">
              <li style="padding: 3px 0;">Your appraiser will contact you 24-48 hours before the appointment</li>
              <li style="padding: 3px 0;">Please ensure property access is available at the scheduled time</li>
              <li style="padding: 3px 0;">Keep this confirmation email for your records</li>
              <li style="padding: 3px 0;">Any changes to the schedule should be communicated in advance</li>
            </ul>
          </div>

          <p>Thank you for choosing our appraisal services! We look forward to providing you with a comprehensive property evaluation.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin-bottom: 0;">Best regards,<br><strong>OpenBeit Appraisal Team</strong></p>
          </div>
        </div>
      `,

      'booking_payment_failed': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">❌ Payment Failed</h2>
          <p>Hello <strong>${variables.client_name}</strong>,</p>
          <p>Unfortunately, we couldn't process your payment for the appraisal booking. Your appointment is currently on hold.</p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #991b1b;">Booking Details</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 5px 0;"><strong>Confirmation Number:</strong> ${variables.confirmation_number}</li>
              <li style="padding: 5px 0;"><strong>Service:</strong> ${variables.booking_type}</li>
              <li style="padding: 5px 0;"><strong>Appraiser:</strong> ${variables.appraiser_name}</li>
              <li style="padding: 5px 0;"><strong>Scheduled:</strong> ${variables.scheduled_datetime}</li>
              <li style="padding: 5px 0;"><strong>Property:</strong> ${variables.property_address}</li>
              <li style="padding: 5px 0;"><strong>Amount:</strong> ${variables.total_amount} EGP</li>
            </ul>
          </div>

          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">What to do next?</h3>
            <p>Please try to complete your payment again to confirm your booking. Your appointment slot will be held for 24 hours.</p>
            <p><strong>Note:</strong> If payment isn't completed within 24 hours, your appointment may be cancelled and the time slot released to other clients.</p>
          </div>

          <p>If you continue to experience payment issues, please contact our support team for assistance.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin-bottom: 0;">Best regards,<br><strong>OpenBeit Appraisal Team</strong></p>
          </div>
        </div>
      `
    };

    return templates[template] || 'Template not found';
  }

  // SMS Templates
  private getSMSTemplate(template: string, variables: Record<string, any>): string {
    const templates: Record<string, string> = {
      'appraiser_notification': `New ${variables.contact_type === 'appraisal_request' ? 'appraisal request' : 'contact'} from ${variables.client_name}. Check your email for details. Request ID: ${variables.request_id}`,
      
      'client_confirmation': `Thank you! Your message to ${variables.appraiser_name} has been sent. Confirmation: ${variables.request_id}. Expected response: ${variables.estimated_response_time}`,
      
      'booking_confirmation_appraiser': `New booking: ${variables.booking_type} on ${variables.scheduled_datetime} with ${variables.client_name}. Confirmation: ${variables.confirmation_number}`,
      
      'booking_confirmation_client': `Booking confirmed! ${variables.booking_type} with ${variables.appraiser_name} on ${variables.scheduled_datetime}. Confirmation: ${variables.confirmation_number}`,
      
      'booking_update': `Booking ${variables.action}: ${variables.booking_type} - ${variables.confirmation_number}. Check your email for details.`,
      
      'rental_booking_confirmed': `🎉 Rental confirmed! Check-in: ${variables.check_in_date} at ${variables.property_title}. Booking ID: ${variables.booking_id}. Check email for details.`,
      
      'rental_payment_failed': `❌ Payment failed for rental booking ${variables.booking_id}. Please retry payment within 24 hours or your booking may be cancelled.`,
      
      'booking_payment_confirmed': `🎉 Payment confirmed! Your appraisal booking ${variables.confirmation_number} is confirmed for ${variables.scheduled_datetime}. Check email for details.`,
      
      'booking_payment_failed': `❌ Payment failed for appraisal booking ${variables.confirmation_number}. Please retry payment within 24 hours or your appointment may be cancelled.`
    };

    return templates[template] || 'Template not found';
  }

  // Email sending methods
  async sendEmail(emailData: EmailTemplate): Promise<boolean> {
    try {
      const htmlContent = this.getEmailTemplate(emailData.template, emailData.variables);
      
      switch (this.config.email?.provider) {
        case 'mailgun':
          return await this.sendEmailWithMailgun(emailData, htmlContent);
        default:
          // Console fallback for development
          console.log('📧 EMAIL NOTIFICATION:', {
            to: emailData.to,
            subject: emailData.subject,
            template: emailData.template,
            variables: emailData.variables
          });
          return true;
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  async sendSMS(smsData: SMSTemplate): Promise<boolean> {
    try {
      const message = this.getSMSTemplate(smsData.template, smsData.variables);
      
      switch (this.config.sms?.provider) {
        case 'twilio':
          return await this.sendSMSWithTwilio(smsData, message);
        default:
          // Console fallback for development
          console.log('📱 SMS NOTIFICATION:', {
            to: smsData.to,
            template: smsData.template,
            message
          });
          return true;
      }
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }

  // Mailgun implementation
  private async sendEmailWithMailgun(emailData: EmailTemplate, htmlContent: string): Promise<boolean> {
    try {
      const { apiKey, domain, fromEmail, fromName } = this.config.email!;
      
      if (!apiKey || !domain) {
        console.error('Mailgun API key or domain not configured');
        return false;
      }

      const formData = new FormData();
      formData.append('from', `${fromName} <${fromEmail}>`);
      formData.append('to', emailData.to);
      formData.append('subject', emailData.subject);
      formData.append('html', htmlContent);

      const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Email sent via Mailgun:', result.id);
        return true;
      } else {
        const error = await response.text();
        console.error('❌ Mailgun error:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ Mailgun sending failed:', error);
      return false;
    }
  }

  // Twilio implementation
  private async sendSMSWithTwilio(smsData: SMSTemplate, message: string): Promise<boolean> {
    try {
      const { accountSid, authToken, fromNumber } = this.config.sms!;
      
      if (!accountSid || !authToken || !fromNumber) {
        console.error('Twilio credentials not configured');
        return false;
      }

      const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      
      const body = new URLSearchParams();
      body.append('From', fromNumber);
      body.append('To', smsData.to);
      body.append('Body', message);

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ SMS sent via Twilio:', result.sid);
        return true;
      } else {
        const error = await response.text();
        console.error('❌ Twilio error:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ Twilio sending failed:', error);
      return false;
    }
  }

  // Convenience methods for common notification scenarios
  async notifyAppraiserNewContact(data: {
    appraiser_name: string;
    appraiser_email: string;
    appraiser_phone?: string;
    client_name: string;
    client_email: string;
    client_phone?: string;
    contact_type: string;
    contact_preference: string;
    property_address?: string;
    property_type?: string;
    appraisal_type?: string;
    urgency?: string;
    message: string;
    request_id: string;
  }): Promise<void> {
    // Send email notification
    await this.sendEmail({
      to: data.appraiser_email,
      subject: data.contact_type === 'appraisal_request' 
        ? `New Appraisal Request from ${data.client_name}`
        : `New Contact Message from ${data.client_name}`,
      template: 'appraiser_notification',
      variables: data
    });

    // Send SMS if phone number is available and client prefers phone/SMS
    if (data.appraiser_phone && (data.contact_preference === 'phone' || data.contact_preference === 'whatsapp')) {
      await this.sendSMS({
        to: data.appraiser_phone,
        template: 'appraiser_notification',
        message: '',
        variables: data
      });
    }
  }

  async notifyClientContactConfirmation(data: {
    client_name: string;
    client_email: string;
    client_phone?: string;
    appraiser_name: string;
    contact_type: string;
    property_address?: string;
    estimated_response_time: string;
    request_id: string;
  }): Promise<void> {
    // Send email confirmation
    await this.sendEmail({
      to: data.client_email,
      subject: data.contact_type === 'appraisal_request'
        ? `Appraisal Request Confirmation - ${data.request_id}`
        : `Contact Message Confirmation - ${data.request_id}`,
      template: 'client_confirmation',
      variables: data
    });

    // Send SMS confirmation if phone is available
    if (data.client_phone) {
      await this.sendSMS({
        to: data.client_phone,
        template: 'client_confirmation',
        message: '',
        variables: data
      });
    }
  }

  async notifyBookingConfirmation(data: {
    appraiser_name: string;
    appraiser_email: string;
    appraiser_phone?: string;
    client_name: string;
    client_email: string;
    client_phone?: string;
    booking_type: string;
    confirmation_number: string;
    scheduled_datetime: string;
    estimated_duration_hours: number;
    property_address: string;
    estimated_cost: number;
    payment_due: number;
    special_instructions?: string;
    next_steps: string[];
  }): Promise<void> {
    // Notify appraiser
    await this.sendEmail({
      to: data.appraiser_email,
      subject: `New Booking: ${data.booking_type} - ${data.confirmation_number}`,
      template: 'booking_confirmation_appraiser',
      variables: data
    });

    // Notify client
    await this.sendEmail({
      to: data.client_email,
      subject: `Booking Confirmed: ${data.booking_type} - ${data.confirmation_number}`,
      template: 'booking_confirmation_client',
      variables: data
    });

    // Send SMS notifications if phone numbers are available
    if (data.appraiser_phone) {
      await this.sendSMS({
        to: data.appraiser_phone,
        template: 'booking_confirmation_appraiser',
        message: '',
        variables: data
      });
    }

    if (data.client_phone) {
      await this.sendSMS({
        to: data.client_phone,
        template: 'booking_confirmation_client',
        message: '',
        variables: data
      });
    }
  }

  // Rental booking notification methods
  async notifyRentalBookingConfirmed(data: {
    guest_name: string;
    guest_email: string;
    guest_phone?: string;
    property_title: string;
    property_address: string;
    check_in_date: string;
    check_out_date: string;
    check_in_time?: string;
    check_out_time?: string;
    number_of_guests: number;
    total_amount: number;
    booking_id: string;
  }): Promise<void> {
    // Send email confirmation
    await this.sendEmail({
      to: data.guest_email,
      subject: `🎉 Rental Booking Confirmed - ${data.property_title}`,
      template: 'rental_booking_confirmed',
      variables: data
    });

    // Send SMS confirmation if phone is available
    if (data.guest_phone) {
      await this.sendSMS({
        to: data.guest_phone,
        template: 'rental_booking_confirmed',
        message: '',
        variables: data
      });
    }
  }

  async notifyRentalPaymentFailed(data: {
    guest_name: string;
    guest_email: string;
    guest_phone?: string;
    property_title: string;
    check_in_date: string;
    check_out_date: string;
    total_amount: number;
    booking_id: string;
  }): Promise<void> {
    // Send email notification
    await this.sendEmail({
      to: data.guest_email,
      subject: `❌ Payment Failed - Action Required for ${data.property_title}`,
      template: 'rental_payment_failed',
      variables: data
    });

    // Send SMS notification if phone is available
    if (data.guest_phone) {
      await this.sendSMS({
        to: data.guest_phone,
        template: 'rental_payment_failed',
        message: '',
        variables: data
      });
    }
  }

  // Appraiser booking payment notification methods
  async notifyBookingPaymentConfirmation(payment: any): Promise<void> {
    try {
      const booking = payment.appraiser_bookings;
      if (!booking) {
        console.warn('No booking data found for payment confirmation notification');
        return;
      }

      // Send notification to client
      await this.sendEmail({
        to: booking.client_email,
        subject: `🎉 Payment Confirmed - Appraisal Booking ${booking.confirmation_number}`,
        template: 'booking_payment_confirmed',
        variables: {
          client_name: booking.client_name,
          confirmation_number: booking.confirmation_number,
          scheduled_datetime: booking.scheduled_datetime,
          property_address: booking.property_address,
          total_amount: payment.amount_egp,
          booking_type: booking.booking_type,
          appraiser_name: booking.appraiser_name
        }
      });

      console.log(`✅ Booking payment confirmation sent to ${booking.client_email}`);
    } catch (error) {
      console.error('Failed to send booking payment confirmation:', error);
    }
  }

  async notifyPaymentFailure(payment: any): Promise<void> {
    try {
      const booking = payment.appraiser_bookings;
      if (!booking) {
        console.warn('No booking data found for payment failure notification');
        return;
      }

      // Send notification to client
      await this.sendEmail({
        to: booking.client_email,
        subject: `❌ Payment Failed - Action Required for Booking ${booking.confirmation_number}`,
        template: 'booking_payment_failed',
        variables: {
          client_name: booking.client_name,
          confirmation_number: booking.confirmation_number,
          scheduled_datetime: booking.scheduled_datetime,
          property_address: booking.property_address,
          total_amount: payment.amount_egp,
          booking_type: booking.booking_type,
          appraiser_name: booking.appraiser_name
        }
      });

      console.log(`❌ Payment failure notification sent to ${booking.client_email}`);
    } catch (error) {
      console.error('Failed to send payment failure notification:', error);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();