# 📱 Push Notifications Implementation Plan
## Supabase + Expo Push Notifications Strategy

### **🌟 Why Supabase Instead of Firebase?**

✅ **Already Integrated**: Supabase is your main backend
✅ **Simpler Setup**: No additional Firebase project needed
✅ **Real-time Ready**: Built-in real-time subscriptions
✅ **Edge Functions**: Server-side notification logic
✅ **Database Integration**: Notification history and preferences already exist

---

## **📚 Architecture Overview**

### **Components We'll Use:**
1. **Expo Push Notifications** - Cross-platform push delivery
2. **Supabase Edge Functions** - Trigger notifications server-side
3. **Supabase Real-time** - Listen for notification triggers
4. **React Native Notifications** - Handle foreground/background notifications

### **Data Flow:**
```
Event (new property, price change) 
  ↓
Supabase Database Trigger
  ↓  
Edge Function (determines who to notify)
  ↓
Expo Push API (sends notification)
  ↓
Mobile App (receives notification)
```

---

## **🚀 Phase 13A: Dependencies & Setup**

### **Mobile Dependencies:**
```bash
# Core notification handling
npm install expo-notifications expo-device expo-constants

# Token management (already have AsyncStorage)
# Real-time subscriptions
npm install @supabase/supabase-js

# Optional: Notification sounds/haptics
npm install expo-haptics expo-av
```

### **Backend Dependencies (Supabase Edge Functions):**
```typescript
// edge-functions/send-push-notification/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// We'll use Expo's push notification service
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
```

---

## **💾 Database Schema (Already Mostly Ready!)**

### **✅ Existing Tables We'll Use:**
- `user_profiles.push_notifications` - Preferences ✅
- `properties` - Property data for notifications ✅
- `inquiries` - Inquiry notifications ✅

### **🆕 New Tables We Need:**
```sql
-- Push notification tokens
CREATE TABLE push_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  device_id TEXT,
  platform TEXT CHECK (platform IN ('ios', 'android')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, expo_push_token)
);

-- Notification history
CREATE TABLE notification_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipient_user_id UUID REFERENCES auth.users(id),
  expo_ticket_id TEXT, -- Expo's receipt ID
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB, -- Custom payload
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Notification queue (for batching/scheduling)
CREATE TABLE notification_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## **📱 Phase 13B: Mobile Implementation**

### **1. Notification Service Setup**
```typescript
// mobile/src/services/NotificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '../config/supabase';

export class NotificationService {
  static async initialize() {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    
    // Get push token
    const token = await this.getExpoPushToken();
    
    // Register token with Supabase
    await this.registerToken(token);
    
    // Setup notification handlers
    this.setupNotificationHandlers();
  }
}
```

### **2. Real-time Subscriptions**
```typescript
// mobile/src/services/RealtimeService.ts
import { supabase } from '../config/supabase';

export class RealtimeService {
  static subscribeToNotifications(userId: string) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_queue',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          // Trigger local notification
          this.handleRealtimeNotification(payload.new);
        }
      )
      .subscribe();
  }
}
```

### **3. Integration with Existing Screens**
```typescript
// Update existing screens to trigger notifications
// PropertyDetailsScreen.tsx - Notify about price changes
// InquiriesScreen.tsx - Notify about inquiry responses
// AIAssistantScreen.tsx - Notify about property recommendations
```

---

## **🔧 Phase 13C: Supabase Edge Functions**

### **1. Send Push Notification Function**
```typescript
// supabase/functions/send-push-notification/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { userIds, title, body, data } = await req.json()
  
  // Get user push tokens
  const supabase = createClient(...)
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('expo_push_token')
    .in('user_id', userIds)
    .eq('is_active', true)
  
  // Send to Expo Push API
  const messages = tokens.map(token => ({
    to: token.expo_push_token,
    title,
    body,
    data
  }))
  
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages)
  })
  
  return new Response(JSON.stringify({ success: true }))
})
```

### **2. Property Notification Triggers**
```sql
-- Database trigger for new properties
CREATE OR REPLACE FUNCTION notify_new_property()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue notifications for users interested in this area/type
  INSERT INTO notification_queue (user_id, title, body, data)
  SELECT 
    up.user_id,
    'New Property Available! 🏠',
    'A new ' || NEW.property_type || ' in ' || NEW.city || ' matches your preferences',
    jsonb_build_object('property_id', NEW.id, 'type', 'new_property')
  FROM user_profiles up
  WHERE up.preferred_cities ? NEW.city
    AND up.push_notifications->>'new_properties' = 'true';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER property_notification_trigger
  AFTER INSERT ON properties
  FOR EACH ROW EXECUTE FUNCTION notify_new_property();
```

---

## **🎯 Phase 13D: Notification Types**

### **Egyptian Real Estate Specific Notifications:**

1. **🏠 New Property Alerts**
   - New properties in preferred areas (New Cairo, Sheikh Zayed, etc.)
   - Properties matching budget/type preferences
   
2. **💰 Price Change Notifications**
   - Price drops on saved properties
   - Price increases (for sellers)
   
3. **📅 Virtual Tour Reminders**
   - Scheduled tour starting soon
   - New virtual tours available
   
4. **💬 Inquiry Updates**
   - Broker responded to inquiry
   - Property viewing scheduled
   
5. **🤖 AI Assistant Notifications**
   - New property recommendations
   - Market insights for preferred areas
   
6. **📊 Market Updates**
   - New properties in favorite areas
   - Market reports for Egyptian real estate

---

## **⚡ Implementation Timeline**

### **Week 1: Setup & Dependencies**
- [ ] Install Expo notification packages
- [ ] Create database tables
- [ ] Setup basic notification service
- [ ] Test permission requests

### **Week 2: Core Functionality**
- [ ] Token registration system
- [ ] Basic push notification sending
- [ ] Foreground/background handlers
- [ ] Integration with existing screens

### **Week 3: Advanced Features**
- [ ] Real-time subscriptions
- [ ] Notification preferences UI
- [ ] Database triggers
- [ ] Edge functions deployment

### **Week 4: Testing & Polish**
- [ ] End-to-end testing
- [ ] Notification analytics
- [ ] Performance optimization
- [ ] Egyptian market specific notifications

---

## **🔒 Security & Privacy**

### **User Control:**
- ✅ Granular notification preferences (already in database)
- ✅ Easy opt-out mechanisms
- ✅ Notification history and transparency

### **Data Protection:**
- ✅ Tokens stored securely in Supabase
- ✅ RLS policies for notification data
- ✅ No sensitive data in notification payload

---

## **📊 Success Metrics**

1. **Engagement**: Notification open rates
2. **Retention**: Users who keep notifications enabled
3. **Conversions**: Property inquiries from notifications
4. **Performance**: Delivery success rate

---

## **🎉 Benefits Over Firebase**

✅ **Unified Backend**: Everything in Supabase
✅ **Real-time Integration**: Built-in real-time subscriptions
✅ **Simpler Setup**: No Firebase project needed
✅ **Better Analytics**: Integrated with existing user analytics
✅ **Expo Simplicity**: Cross-platform without platform-specific code

---

**Ready to start implementation?** 🚀 