import crypto from 'crypto';

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
  variables?: Record<string, any>;
}

export interface EmailRecipient {
  email: string;
  name?: string;
  variables?: Record<string, any>;
}

export interface EmailOptions {
  to: EmailRecipient | EmailRecipient[];
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  variables?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    data: Buffer | string;
    contentType?: string;
  }>;
  tags?: string[];
  tracking?: boolean;
  trackingClicks?: boolean;
  trackingOpens?: boolean;
}

export class MailgunClient {
  private apiKey: string;
  private domain: string;
  private baseUrl: string;
  private webhookSigningKey: string;

  constructor() {
    this.apiKey = process.env.MAILGUN_API_KEY!;
    this.domain = process.env.MAILGUN_DOMAIN!;
    this.webhookSigningKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY!;
    this.baseUrl = 'https://api.mailgun.net/v3';

    if (!this.apiKey || !this.domain) {
      throw new Error('Mailgun configuration missing. Please set MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables.');
    }
  }

  /**
   * Send a single email
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const formData = new FormData();
      
      // Recipients
      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      recipients.forEach(recipient => {
        formData.append('to', `${recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email}`);
      });

      // From address
      formData.append('from', options.from || `VirtualEstate <noreply@${this.domain}>`);
      
      // Subject and content
      formData.append('subject', options.subject);
      if (options.html) formData.append('html', options.html);
      if (options.text) formData.append('text', options.text);
      
      // Template and variables
      if (options.template) {
        formData.append('template', options.template);
        if (options.variables) {
          formData.append('h:X-Mailgun-Variables', JSON.stringify(options.variables));
        }
      }

      // Recipient variables for batch sending
      if (Array.isArray(options.to) && options.to.some(r => r.variables)) {
        const recipientVariables: Record<string, any> = {};
        options.to.forEach(recipient => {
          if (recipient.variables) {
            recipientVariables[recipient.email] = recipient.variables;
          }
        });
        formData.append('recipient-variables', JSON.stringify(recipientVariables));
      }

      // Tracking options
      if (options.tracking !== undefined) {
        formData.append('o:tracking', options.tracking.toString());
      }
      if (options.trackingClicks !== undefined) {
        formData.append('o:tracking-clicks', options.trackingClicks ? 'yes' : 'no');
      }
      if (options.trackingOpens !== undefined) {
        formData.append('o:tracking-opens', options.trackingOpens ? 'yes' : 'no');
      }

      // Tags for categorization
      if (options.tags) {
        options.tags.forEach(tag => formData.append('o:tag', tag));
      }

      // Attachments
      if (options.attachments) {
        options.attachments.forEach((attachment, index) => {
          formData.append(`attachment[${index}]`, new Blob([attachment.data], { 
            type: attachment.contentType || 'application/octet-stream' 
          }), attachment.filename);
        });
      }

      const response = await fetch(`${this.baseUrl}/${this.domain}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${this.apiKey}`).toString('base64')}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          messageId: result.id,
        };
      } else {
        console.error('Mailgun API error:', result);
        return {
          success: false,
          error: result.message || 'Failed to send email',
        };
      }
    } catch (error) {
      console.error('Mailgun send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send bulk emails (up to 1000 recipients)
   */
  async sendBulkEmails(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    
    if (recipients.length > 1000) {
      return {
        success: false,
        error: 'Bulk email limited to 1000 recipients per batch',
      };
    }

    return this.sendEmail({
      ...options,
      to: recipients,
    });
  }

  /**
   * Verify webhook signature for security
   */
  verifyWebhookSignature(body: string, signature: string, timestamp: string): boolean {
    if (!this.webhookSigningKey) {
      console.warn('Webhook signing key not configured');
      return false;
    }

    try {
      const hmac = crypto.createHmac('sha256', this.webhookSigningKey);
      hmac.update(timestamp + body);
      const computedSignature = hmac.digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(computedSignature, 'hex')
      );
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Get email analytics for a specific period
   */
  async getEmailStats(period: 'day' | 'week' | 'month' = 'week'): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.domain}/stats/total?event=*&duration=${period}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${this.apiKey}`).toString('base64')}`,
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching email stats:', error);
      return null;
    }
  }

  /**
   * Validate email address
   */
  async validateEmail(email: string): Promise<{ valid: boolean; reason?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/address/validate?address=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${this.apiKey}`).toString('base64')}`,
        },
      });

      const result = await response.json();
      
      return {
        valid: result.is_valid,
        reason: result.reason,
      };
    } catch (error) {
      console.error('Email validation error:', error);
      return { valid: false, reason: 'Validation service error' };
    }
  }

  /**
   * Create or update email template
   */
  async createTemplate(name: string, template: EmailTemplate): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', `Template for ${name}`);
      formData.append('template', template.html);
      if (template.text) formData.append('text', template.text);

      const response = await fetch(`${this.baseUrl}/${this.domain}/templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${this.apiKey}`).toString('base64')}`,
        },
        body: formData,
      });

      return response.ok;
    } catch (error) {
      console.error('Template creation error:', error);
      return false;
    }
  }

  /**
   * Add email to suppression list (unsubscribe)
   */
  async suppressEmail(email: string, reason: 'bounce' | 'unsubscribe' | 'complaint' = 'unsubscribe'): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('address', email);
      formData.append('reason', reason);

      const response = await fetch(`${this.baseUrl}/${this.domain}/unsubscribes`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${this.apiKey}`).toString('base64')}`,
        },
        body: formData,
      });

      return response.ok;
    } catch (error) {
      console.error('Email suppression error:', error);
      return false;
    }
  }

  /**
   * Check if email is suppressed
   */
  async isEmailSuppressed(email: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.domain}/unsubscribes/${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${this.apiKey}`).toString('base64')}`,
        },
      });

      return response.status === 200;
    } catch (error) {
      console.error('Suppression check error:', error);
      return false;
    }
  }
}

// Singleton instance
export const mailgun = new MailgunClient();

// Email templates for real estate scenarios
export const EmailTemplates = {
  // User onboarding
  WELCOME: 'welcome-email',
  EMAIL_VERIFICATION: 'email-verification',
  PASSWORD_RESET: 'password-reset',
  
  // Property inquiries
  INQUIRY_CONFIRMATION: 'inquiry-confirmation',
  INQUIRY_AGENT_NOTIFICATION: 'inquiry-agent-notification',
  
  // Viewing bookings
  VIEWING_CONFIRMATION: 'viewing-confirmation',
  VIEWING_REMINDER: 'viewing-reminder',
  VIEWING_AGENT_NOTIFICATION: 'viewing-agent-notification',
  
  // AI interactions
  HEYGEN_SESSION_SUMMARY: 'heygen-session-summary',
  VOICE_CHAT_TRANSCRIPT: 'voice-chat-transcript',
  
  // Property alerts
  SAVED_SEARCH_ALERT: 'saved-search-alert',
  PRICE_CHANGE_ALERT: 'price-change-alert',
  NEW_PROPERTY_ALERT: 'new-property-alert',
  
  // Admin notifications
  DAILY_REPORT: 'daily-report',
  NEW_USER_NOTIFICATION: 'new-user-notification',
  SYSTEM_ALERT: 'system-alert',
};

// Helper function for common email scenarios
export const sendCommonEmail = {
  async welcomeEmail(userEmail: string, userName: string) {
    return mailgun.sendEmail({
      to: { email: userEmail, name: userName },
      subject: 'Welcome to VirtualEstate! 🏠',
      template: EmailTemplates.WELCOME,
      variables: { user_name: userName },
      tags: ['onboarding', 'welcome'],
      trackingOpens: true,
    });
  },

  async inquiryConfirmation(userEmail: string, userName: string, propertyTitle: string, inquiryId: string) {
    return mailgun.sendEmail({
      to: { email: userEmail, name: userName },
      subject: `Inquiry Received - ${propertyTitle}`,
      template: EmailTemplates.INQUIRY_CONFIRMATION,
      variables: { 
        user_name: userName, 
        property_title: propertyTitle,
        inquiry_id: inquiryId,
        support_email: `support@${process.env.MAILGUN_DOMAIN}`,
      },
      tags: ['inquiry', 'confirmation'],
      trackingOpens: true,
    });
  },

  async viewingConfirmation(
    userEmail: string, 
    userName: string, 
    propertyTitle: string, 
    viewingDate: string, 
    viewingTime: string,
    confirmationCode: string,
    brokerName: string,
    brokerPhone: string
  ) {
    return mailgun.sendEmail({
      to: { email: userEmail, name: userName },
      subject: `Viewing Confirmed - ${propertyTitle}`,
      template: EmailTemplates.VIEWING_CONFIRMATION,
      variables: { 
        user_name: userName,
        property_title: propertyTitle,
        viewing_date: viewingDate,
        viewing_time: viewingTime,
        confirmation_code: confirmationCode,
        broker_name: brokerName,
        broker_phone: brokerPhone,
      },
      tags: ['viewing', 'confirmation'],
      trackingOpens: true,
    });
  },

  async agentInquiryNotification(
    agentEmail: string, 
    agentName: string, 
    propertyTitle: string, 
    clientName: string,
    clientEmail: string,
    clientPhone: string,
    message: string
  ) {
    return mailgun.sendEmail({
      to: { email: agentEmail, name: agentName },
      subject: `New Inquiry - ${propertyTitle}`,
      template: EmailTemplates.INQUIRY_AGENT_NOTIFICATION,
      variables: { 
        agent_name: agentName,
        property_title: propertyTitle,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        inquiry_message: message,
      },
      tags: ['agent', 'inquiry', 'notification'],
      trackingOpens: true,
    });
  },

  async autoReply(userEmail: string, userName: string, subject: string, inquiryId: string, contactType: string) {
    return mailgun.sendEmail({
      to: { email: userEmail, name: userName },
      subject: `Thank you for contacting VirtualEstate - ${subject}`,
      template: EmailTemplates.INQUIRY_CONFIRMATION,
      variables: { 
        user_name: userName,
        inquiry_subject: subject,
        inquiry_id: inquiryId,
        contact_type: contactType,
        support_email: `support@${process.env.MAILGUN_DOMAIN}`,
        expected_response_time: '24 hours',
      },
      tags: ['auto-reply', 'confirmation', contactType],
      trackingOpens: true,
    });
  },

  async contactFormNotification(
    adminEmail: string,
    adminName: string,
    clientName: string,
    clientEmail: string,
    clientPhone: string,
    message: string,
    subject: string,
    contactType: string,
    inquiryId: string
  ) {
    return mailgun.sendEmail({
      to: { email: adminEmail, name: adminName },
      subject: `New Contact Form Submission - ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">New Contact Form Submission</h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Contact Details:</h3>
            <p><strong>Name:</strong> ${clientName}</p>
            <p><strong>Email:</strong> <a href="mailto:${clientEmail}">${clientEmail}</a></p>
            <p><strong>Phone:</strong> ${clientPhone}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Contact Type:</strong> ${contactType}</p>
            <p><strong>Inquiry ID:</strong> #${inquiryId}</p>
          </div>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Message:</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <a href="mailto:${clientEmail}?subject=Re: ${subject}" style="background-color: #3b82f6; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reply to Client</a>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">
            This notification was sent from the VirtualEstate contact form.
          </p>
        </div>
      `,
      text: `
New Contact Form Submission

Contact Details:
Name: ${clientName}
Email: ${clientEmail}
Phone: ${clientPhone}
Subject: ${subject}
Contact Type: ${contactType}
Inquiry ID: #${inquiryId}

Message:
${message}

Reply to: ${clientEmail}
      `,
      tags: ['admin', 'notification', 'contact-form', contactType],
      trackingOpens: true,
    });
  },

  async passwordReset(userEmail: string, resetUrl: string, expiryHours: number = 2) {
    return mailgun.sendEmail({
      to: { email: userEmail },
      subject: 'Reset Your VirtualEstate Password',
      template: EmailTemplates.PASSWORD_RESET,
      variables: { 
        reset_url: resetUrl,
        expiry_hours: expiryHours,
        support_email: `support@${process.env.MAILGUN_DOMAIN}`,
      },
      tags: ['password-reset', 'security'],
      trackingOpens: true,
    });
  },

  async heygenSessionSummary(
    userEmail: string,
    userName: string,
    propertyTitle: string,
    sessionData: {
      sessionDate: string;
      sessionDuration: string;
      agentName: string;
      topicsDiscussed: string[];
      aiInsights: string;
      nextSteps: string[];
    }
  ) {
    return mailgun.sendEmail({
      to: { email: userEmail, name: userName },
      subject: `AI Property Consultation Summary - ${propertyTitle}`,
      template: EmailTemplates.HEYGEN_SESSION_SUMMARY,
      variables: { 
        user_name: userName,
        property_title: propertyTitle,
        ...sessionData,
      },
      tags: ['heygen', 'ai-consultation', 'summary'],
      trackingOpens: true,
    });
  },
}; 