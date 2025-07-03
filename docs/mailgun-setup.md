# Mailgun Setup Guide for VirtualEstate

This guide covers the complete setup of Mailgun for your real estate MVP, including configuration, environment variables, and testing.

## 📧 Mailgun Configuration

### 1. Environment Variables

Add these variables to your `.env.local` file:

```bash
# Mailgun Configuration
MAILGUN_API_KEY=your_mailgun_api_key_here
MAILGUN_DOMAIN=yourdomain.com
MAILGUN_WEBHOOK_SIGNING_KEY=your_webhook_signing_key_here

# Email Configuration
ADMIN_EMAIL=admin@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com

# Optional: Social media links for email templates
FACEBOOK_URL=https://facebook.com/yourvirtualestate
TWITTER_URL=https://twitter.com/yourvirtualestate
INSTAGRAM_URL=https://instagram.com/yourvirtualestate
LINKEDIN_URL=https://linkedin.com/company/yourvirtualestate

# Site Configuration for Email Templates
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
COMPANY_NAME=VirtualEstate
COMPANY_ADDRESS=Your Company Address, City, Country
```

### 2. Mailgun Dashboard Setup

#### Step 1: Get API Keys
1. Log in to your Mailgun dashboard
2. Go to **Settings > API Keys**
3. Copy your **Private API Key** → Use for `MAILGUN_API_KEY`
4. Copy your **HTTP webhook signing key** → Use for `MAILGUN_WEBHOOK_SIGNING_KEY`

#### Step 2: Configure Domain
1. Go to **Sending > Domains**
2. Use your verified domain → Use for `MAILGUN_DOMAIN`
3. Ensure DNS records are properly configured

#### Step 3: Set Up Webhooks
1. Go to **Settings > Webhooks**
2. Add a new webhook with URL: `https://yourdomain.com/api/webhooks/mailgun`
3. Enable these events:
   - `delivered`
   - `opened`
   - `clicked`
   - `bounced`
   - `complained`
   - `unsubscribed`
   - `failed`

## 📧 Email Trigger Points

### Automatic Email Scenarios

#### 1. **Contact Form Submissions**
- **Trigger**: User submits contact form
- **Emails Sent**:
  - Auto-reply confirmation to user
  - Notification to admin team
- **API**: `/api/contact`

#### 2. **Property Inquiries**
- **Trigger**: User inquires about property
- **Emails Sent**:
  - Inquiry confirmation to user
  - Lead notification to agent
- **API**: `/api/inquiries`

#### 3. **Viewing Bookings**
- **Trigger**: User books property viewing
- **Emails Sent**:
  - Confirmation to user with details
  - Notification to broker/agent
- **API**: `/api/properties/[id]/book-viewing`

#### 4. **User Onboarding**
- **Trigger**: New user registration
- **Emails Sent**:
  - Welcome email with platform overview
- **API**: Auth signup process

#### 5. **Password Reset**
- **Trigger**: User requests password reset
- **Emails Sent**:
  - Secure reset link with expiry
- **API**: `/api/auth/password-reset`

#### 6. **HeyGen Session Summary**
- **Trigger**: AI consultation session ends
- **Emails Sent**:
  - Session summary with insights
- **API**: HeyGen session completion

### Future Scenarios (Ready to Implement)

#### 7. **Saved Search Alerts**
- **Trigger**: New properties match user's criteria
- **Implementation**: Cron job checking new listings

#### 8. **Price Change Alerts**
- **Trigger**: Property price changes
- **Implementation**: Property update webhook

#### 9. **Newsletter/Marketing**
- **Trigger**: Scheduled campaigns
- **Implementation**: Email campaigns system

## 🛠️ Testing Your Setup

### 1. Test Email Sending

Create a simple test endpoint:

```typescript
// app/api/test-email/route.ts
import { sendCommonEmail } from '@/lib/email/mailgun';

export async function POST() {
  const result = await sendCommonEmail.welcomeEmail(
    'test@example.com',
    'Test User'
  );
  
  return Response.json(result);
}
```

### 2. Test Webhook Verification

```bash
# Test webhook endpoint
curl -X POST https://yourdomain.com/api/webhooks/mailgun \
  -H "Content-Type: application/json" \
  -H "X-Mailgun-Signature-V2: your_signature" \
  -H "X-Mailgun-Timestamp: timestamp" \
  -d '{"event-data": {"event": "delivered"}}'
```

### 3. Check Analytics

Access your email analytics:
- Database: `email_analytics` table
- View: `email_performance_summary`
- Function: `get_user_email_stats(email, days)`

## 📊 Email Analytics & Tracking

### Available Metrics

1. **Delivery Metrics**
   - Emails sent
   - Delivery rate
   - Bounce rate

2. **Engagement Metrics**
   - Open rate
   - Click-through rate
   - Unsubscribe rate

3. **Property-Specific Metrics**
   - Email engagement per property
   - Lead quality from emails
   - Conversion tracking

### Analytics Tables

```sql
-- View email performance
SELECT * FROM email_performance_summary 
WHERE date >= CURRENT_DATE - INTERVAL '7 days';

-- Get user engagement score
SELECT * FROM get_user_email_stats('user@example.com', 30);

-- Check suppression status
SELECT is_email_suppressed('user@example.com');
```

## 🔒 Email Compliance & Best Practices

### GDPR Compliance
- ✅ Unsubscribe links in all marketing emails
- ✅ Email preference management
- ✅ Suppression list management
- ✅ Data retention policies

### CAN-SPAM Compliance
- ✅ Clear sender identification
- ✅ Truthful subject lines
- ✅ Physical address in emails
- ✅ Honor unsubscribe requests

### Best Practices
- ✅ Professional email templates
- ✅ Mobile-responsive design
- ✅ A/B testing capabilities
- ✅ Engagement tracking
- ✅ Bounce management

## 🚀 Mailgun Free Tier Limitations

### Free Plan Includes:
- **5,000 emails/month** for first 3 months
- **1 inbound route** (perfect for your needs)
- **Email validation**
- **Analytics and logs**

### Optimization Tips:
1. **Template Reuse**: Use templates to reduce development time
2. **Batch Sending**: Group similar emails together
3. **Smart Targeting**: Only send relevant emails
4. **Engagement Tracking**: Monitor and improve open rates
5. **Suppression Management**: Keep clean email lists

## 📱 Monitoring & Maintenance

### Daily Tasks
- Check bounce/complaint rates
- Monitor delivery metrics
- Review failed emails

### Weekly Tasks
- Analyze engagement trends
- Update suppression lists
- Review email templates performance

### Monthly Tasks
- Generate email performance reports
- Clean inactive email addresses
- Optimize email content based on metrics

## 🔧 Troubleshooting

### Common Issues

#### 1. Emails Not Sending
```bash
# Check Mailgun configuration
curl -s --user 'api:YOUR_API_KEY' \
    https://api.mailgun.net/v3/YOUR_DOMAIN/messages \
    -F from='test@YOUR_DOMAIN' \
    -F to='test@example.com' \
    -F subject='Test' \
    -F text='Testing'
```

#### 2. Webhooks Not Working
- Verify webhook URL is accessible
- Check signature verification
- Ensure HTTPS is configured

#### 3. High Bounce Rates
- Validate email addresses before sending
- Clean email lists regularly
- Monitor sender reputation

### Support Resources
- [Mailgun Documentation](https://documentation.mailgun.com/)
- [Email Best Practices](https://www.mailgun.com/blog/email-best-practices/)
- [Deliverability Guide](https://www.mailgun.com/resources/deliverability-guide/)

## 📋 Implementation Checklist

- [ ] Set up Mailgun account and verify domain
- [ ] Configure environment variables
- [ ] Run database migration for email analytics
- [ ] Set up webhook endpoint
- [ ] Test email sending functionality
- [ ] Implement email templates
- [ ] Configure email preferences in user settings
- [ ] Set up monitoring and analytics
- [ ] Test unsubscribe functionality
- [ ] Document email processes for team

## 🎯 Next Steps

1. **Phase 1**: Basic transactional emails (contact, inquiries, bookings)
2. **Phase 2**: User onboarding and engagement emails
3. **Phase 3**: Marketing campaigns and newsletters
4. **Phase 4**: Advanced segmentation and personalization
5. **Phase 5**: AI-powered email optimization

Your Mailgun integration is now ready for production! 🚀 