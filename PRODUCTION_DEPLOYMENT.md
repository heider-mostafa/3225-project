# Production Deployment Guide - Real Estate CRM System

## 🚀 **Pre-Deployment Checklist**

### **1. Environment Setup**
- [ ] Production Supabase project created
- [ ] Production domain configured
- [ ] SSL certificates installed
- [ ] Environment variables configured
- [ ] API keys and secrets secured

### **2. Database Setup**
- [ ] Production database created
- [ ] All migrations applied
- [ ] Row Level Security (RLS) policies enabled
- [ ] Database backups configured
- [ ] Connection pooling configured

### **3. Third-Party Services**
- [ ] OpenAI API production keys
- [ ] WhatsApp Business API production setup
- [ ] Email service (if used) configured
- [ ] Analytics/monitoring services setup

---

## 🔧 **Environment Variables**

### **Required Environment Variables**

Create a `.env.production` file with:

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI API
OPENAI_API_KEY=sk-your_production_openai_key
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-10-01

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_production_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_secure_webhook_token

# Admin Configuration
ADMIN_EMAIL=admin@yourdomain.com
SUPER_ADMIN_EMAIL=superadmin@yourdomain.com

# Security
NEXTAUTH_SECRET=your_secure_nextauth_secret_32_chars_min
NEXTAUTH_URL=https://yourdomain.com

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn_if_using
VERCEL_ENV=production
```

### **Environment Variable Security**
- Use environment variable management (Vercel, Railway, etc.)
- Never commit `.env` files to version control
- Rotate secrets regularly
- Use least-privilege access for API keys

---

## 📊 **Database Migration & Setup**

### **1. Apply Database Migrations**

**Connect to Production Database:**
```bash
# Using Supabase CLI
supabase link --project-ref YOUR_PROJECT_REF
supabase db push

# Or manually apply each migration
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" -f supabase/migrations/20241226_leads_automation_system.sql
```

**Apply all migration files in order:**
1. `20241226_leads_automation_system.sql` - Core system tables
2. `20250617_create_whatsapp_messages.sql` - WhatsApp integration
3. `20250617_create_call_schedules.sql` - Call scheduling system
4. `20250617_create_call_logs.sql` - Call logging and analysis

### **2. Verify Database Setup**

```sql
-- Verify all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'leads', 
  'whatsapp_messages', 
  'call_schedules', 
  'call_logs', 
  'photographers', 
  'photographer_assignments'
);

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Verify sample data exists
SELECT COUNT(*) FROM photographers;
SELECT COUNT(*) FROM brokers;
```

### **3. Production Data Setup**

**Insert Real Photographers:**
```sql
-- Replace sample data with real photographers
DELETE FROM photographers WHERE email LIKE '%@gmail.com';

INSERT INTO photographers (email, name, phone, preferred_areas, equipment, rating, skills) VALUES
('realphoto1@yourcompany.com', 'Ahmed Professional', '+201234567890', '{"New Cairo", "Fifth Settlement"}', 'Insta360 X5, Professional DSLR Kit', 4.8, '{"residential", "luxury"}'),
('realphoto2@yourcompany.com', 'Sara Expert', '+201987654321', '{"Zamalek", "Maadi", "Heliopolis"}', 'Insta360 X5, Drone Equipment', 4.9, '{"luxury", "commercial"}'),
('realphoto3@yourcompany.com', 'Omar Specialist', '+201555666777', '{"6th October", "Sheikh Zayed"}', 'Insta360 X5, Wide-angle Lenses', 4.7, '{"residential", "commercial"});

-- Update broker information with real data
UPDATE brokers SET 
  preferred_areas = ARRAY['Areas you serve'],
  whatsapp_number = 'Real WhatsApp numbers',
  is_active = true
WHERE email = 'your-real-broker@email.com';
```

---

## 🔐 **Security Configuration**

### **1. Supabase Security**

**Row Level Security (RLS) Policies:**
```sql
-- Verify admin-only access to sensitive tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('leads', 'call_logs', 'photographer_assignments');
```

**API Key Security:**
- Use anon key for client-side operations only
- Service role key only for server-side operations
- Configure API key restrictions in Supabase dashboard
- Enable database SSL enforcement

### **2. API Security**

**Rate Limiting (if using Vercel):**
```javascript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  return NextResponse.next();
}
```

### **3. CORS Configuration**

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "https://yourdomain.com" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
};
```

---

## 📱 **WhatsApp Business API Production Setup**

### **1. WhatsApp Business Account Verification**

1. **Business Verification:**
   - Complete Facebook Business verification
   - Verify your business phone number
   - Submit required documentation

2. **Production Access:**
   - Request production access from Meta
   - Complete security assessment if required
   - Configure webhook URL: `https://yourdomain.com/api/whatsapp/webhook`

### **2. Webhook Configuration**

```bash
# Configure webhook in Meta Business Dashboard
Webhook URL: https://yourdomain.com/api/whatsapp/webhook
Verify Token: your_secure_webhook_token
```

**Test Webhook:**
```bash
curl -X POST "https://graph.facebook.com/v19.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "YOUR_TEST_NUMBER",
    "type": "text",
    "text": {"body": "Production test message"}
  }'
```

---

## 🔧 **OpenAI API Production Configuration**

### **1. API Key Setup**
- Use production API keys (separate from development)
- Configure usage limits and monitoring
- Set up billing alerts

### **2. Rate Limiting & Error Handling**
```javascript
// lib/openai/client.ts
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 60000, // 60 seconds
});

// Implement exponential backoff
async function callOpenAIWithRetry(fn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

---

## 🚀 **Deployment Platforms**

### **Option 1: Vercel Deployment**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... add all environment variables
```

**vercel.json configuration:**
```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  },
  "rewrites": [
    {
      "source": "/api/whatsapp/webhook",
      "destination": "/api/whatsapp/webhook"
    }
  ]
}
```

### **Option 2: Railway Deployment**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up

# Configure environment variables
railway variables set NEXT_PUBLIC_SUPABASE_URL=your_value
# ... set all environment variables
```

### **Option 3: Docker Deployment**

```dockerfile
# Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and deploy
docker build -t real-estate-crm .
docker run -p 3000:3000 --env-file .env.production real-estate-crm
```

---

## 📊 **Monitoring & Analytics**

### **1. Application Monitoring**

**Sentry Setup (Error Tracking):**
```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

### **2. Database Monitoring**

**Supabase Dashboard:**
- Monitor database performance
- Set up usage alerts
- Configure backup schedules
- Monitor API usage

### **3. Custom Monitoring**

```javascript
// lib/monitoring.ts
export async function logSystemHealth() {
  const metrics = {
    activeLeads: await supabase.from('leads').select('id', { count: 'exact', head: true }),
    todaysCalls: await supabase.from('call_logs').select('id', { count: 'exact', head: true }).gte('call_started_at', new Date().toISOString().split('T')[0]),
    pendingAssignments: await supabase.from('photographer_assignments').select('id', { count: 'exact', head: true }).eq('status', 'assigned')
  };
  
  console.log('System Health:', metrics);
  return metrics;
}
```

---

## 🔄 **Backup & Recovery**

### **1. Database Backups**

**Automated Backups (Supabase):**
- Configure daily automated backups
- Set retention period (30 days recommended)
- Test backup restoration monthly

**Manual Backup:**
```bash
# Create backup
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" > backup_$(date +%Y%m%d).sql

# Restore backup
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" < backup_20250617.sql
```

### **2. Application Backups**

```bash
# Code repository backup
git clone --mirror https://github.com/yourusername/real-estate-mvp.git backup-repo

# Environment variables backup (encrypted)
gpg --cipher-algo AES256 --compress-algo 1 --s2k-mode 3 --s2k-digest-algo SHA512 --s2k-count 65536 --symmetric --output env-backup.gpg .env.production
```

---

## 🔄 **Deployment Process**

### **1. Pre-Deployment Testing**

```bash
# Run full test suite
npm run test

# Build verification
npm run build

# Database migration dry run
supabase db diff --use-migra

# Integration tests
npm run test:integration
```

### **2. Deployment Steps**

```bash
# 1. Backup current production
pg_dump "production_db_url" > pre_deploy_backup.sql

# 2. Deploy application
vercel --prod  # or your deployment platform

# 3. Apply database migrations
supabase db push

# 4. Verify deployment
curl https://yourdomain.com/api/health

# 5. Test critical paths
curl -X POST https://yourdomain.com/api/leads -d '{"test": "data"}'
```

### **3. Post-Deployment Verification**

```bash
# Test all API endpoints
./scripts/test-production-endpoints.sh

# Verify database connections
./scripts/verify-db-health.sh

# Monitor logs for errors
vercel logs --since 1h
```

---

## 🚨 **Troubleshooting Guide**

### **Common Issues & Solutions**

**1. Database Connection Issues:**
```bash
# Check Supabase status
curl https://status.supabase.com/api/v2/status.json

# Verify connection string
psql "your_supabase_connection_string" -c "SELECT 1;"
```

**2. OpenAI API Failures:**
```bash
# Check API status
curl https://status.openai.com/api/v2/status.json

# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**3. WhatsApp Webhook Issues:**
```bash
# Verify webhook endpoint
curl -X GET "https://yourdomain.com/api/whatsapp/webhook?hub.verify_token=your_token&hub.challenge=test123&hub.mode=subscribe"

# Check webhook logs
vercel logs --filter "whatsapp/webhook"
```

### **Performance Optimization**

```javascript
// Enable database connection pooling
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      pool: {
        max: 20,
        min: 5,
        idleTimeoutMillis: 30000,
      }
    }
  }
);
```

---

## ✅ **Production Checklist**

### **Go-Live Checklist**
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies enabled and tested
- [ ] WhatsApp webhook configured and verified
- [ ] OpenAI API tested and rate limits configured
- [ ] Monitoring and alerting set up
- [ ] Backup procedures tested
- [ ] SSL certificates installed and verified
- [ ] DNS configured correctly
- [ ] Load testing completed
- [ ] Security scan passed
- [ ] Documentation updated
- [ ] Team trained on production procedures
- [ ] Rollback plan prepared

### **Post-Launch Monitoring**
- [ ] Monitor error rates first 24 hours
- [ ] Verify all integrations working
- [ ] Check database performance
- [ ] Monitor API usage and costs
- [ ] Validate backup procedures
- [ ] Review security logs
- [ ] Performance metrics baseline established

---

*Follow this guide step-by-step for a successful production deployment. Always test in a staging environment first.*