# VirtualEstate N8N Automation - Environment Variables Setup

## Required Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# N8N Configuration
NEXT_PUBLIC_N8N_URL=https://your-n8n-instance.com
N8N_API_KEY=your_n8n_api_key

# WhatsApp Business API
WHATSAPP_API_KEY=your_whatsapp_business_api_key
WHATSAPP_PHONE_ID=your_whatsapp_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id

# OpenAI Configuration (for AI voice calls)
OPENAI_API_KEY=your_openai_api_key
OPENAI_REALTIME_API_KEY=your_openai_realtime_api_key

# Google Calendar API (for photographer scheduling)
GOOGLE_CALENDAR_CLIENT_ID=your_google_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALENDAR_REFRESH_TOKEN=your_refresh_token

# Realsee API (for 3D tour processing)
REALSEE_API_KEY=your_realsee_api_key
REALSEE_API_SECRET=your_realsee_api_secret

# Mailgun (for email notifications)
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Security
JWT_SECRET=your_jwt_secret_for_webhook_verification
WEBHOOK_SECRET=your_webhook_verification_secret
```

## Setup Instructions

### 1. N8N Configuration

1. **Set up N8N Cloud account** or self-host N8N
2. **Get API credentials** from your N8N instance
3. **Configure webhook URLs** in N8N workflows

### 2. WhatsApp Business API Setup

1. **Create Facebook Developer Account**
2. **Set up WhatsApp Business API**
3. **Get Phone Number ID and Business Account ID**
4. **Configure webhook for message delivery status**

### 3. OpenAI Realtime API

1. **Sign up for OpenAI API access**
2. **Request access to Realtime API** (currently in beta)
3. **Generate API keys** with appropriate permissions

### 4. Google Calendar API

1. **Create Google Cloud Project**
2. **Enable Calendar API**
3. **Create OAuth 2.0 credentials**
4. **Generate refresh token** for server-to-server access

### 5. Realsee API

1. **Contact Realsee** for API access
2. **Get API credentials** for 3D tour processing
3. **Configure webhook endpoints** for processing status

### 6. Mailgun Setup

1. **Create Mailgun account**
2. **Verify your domain**
3. **Get API key and domain configuration**

## Webhook URLs Configuration

Configure these webhook URLs in your respective services:

```bash
# N8N Workflow Webhooks
https://your-domain.com/api/webhooks/n8n/lead-capture
https://your-domain.com/api/webhooks/n8n/ai-qualification
https://your-domain.com/api/webhooks/n8n/booking-confirmation
https://your-domain.com/api/webhooks/n8n/post-shoot
https://your-domain.com/api/webhooks/n8n/followup

# WhatsApp Webhooks
https://your-domain.com/api/webhooks/whatsapp/delivery-status
https://your-domain.com/api/webhooks/whatsapp/messages

# Realsee Webhooks
https://your-domain.com/api/webhooks/realsee/processing-status

# Google Calendar Webhooks
https://your-domain.com/api/webhooks/calendar/events
```

## Security Considerations

1. **Use HTTPS** for all webhook endpoints
2. **Implement webhook signature verification**
3. **Rate limiting** on API endpoints
4. **Environment-specific configurations**

## Testing Configuration

For development/testing, you can use these test values:

```bash
# Test N8N (use ngrok for local testing)
NEXT_PUBLIC_N8N_URL=https://your-ngrok-url.ngrok.io
N8N_API_KEY=test_api_key

# Test WhatsApp (use WhatsApp Test Numbers)
WHATSAPP_API_KEY=test_key
WHATSAPP_PHONE_ID=test_phone_id

# Test OpenAI (use playground credits)
OPENAI_API_KEY=sk-test-your-test-key

# Test mode flags
NODE_ENV=development
ENABLE_TEST_MODE=true
SKIP_REAL_CALLS=true
```

## Deployment Checklist

- [ ] All environment variables configured
- [ ] Webhook URLs updated with production domain
- [ ] SSL certificates configured
- [ ] Rate limiting implemented
- [ ] Error monitoring set up
- [ ] Database migrations run
- [ ] N8N workflows imported and activated
- [ ] Test lead submission end-to-end
- [ ] Monitor logs for any configuration issues

## Troubleshooting

### Common Issues

1. **N8N webhook not triggering**
   - Check webhook URL configuration
   - Verify API key permissions
   - Check N8N workflow activation status

2. **WhatsApp messages not sending**
   - Verify phone number verification
   - Check message template approval
   - Verify webhook configuration

3. **OpenAI calls failing**
   - Check API key permissions
   - Verify Realtime API access
   - Monitor usage quotas

4. **Database connection issues**
   - Verify Supabase credentials
   - Check RLS policies
   - Verify table permissions

### Debug Mode

Enable debug logging by adding:

```bash
DEBUG=true
LOG_LEVEL=debug
ENABLE_WEBHOOK_LOGGING=true
``` 