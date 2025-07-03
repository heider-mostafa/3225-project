# Phase 2 Testing Guide - Enhanced Time Scheduling & WhatsApp

## 🎯 **New Features in Phase 2**

### **1. Enhanced Time Parsing**
- ✅ Standard time slots (1️⃣, 2️⃣, 3️⃣)
- ✅ Specific times (2pm, 3:30pm, 14:00)
- ✅ Natural language (tomorrow 3pm, morning, afternoon)
- ✅ Time clarification requests for unclear inputs

### **2. Automated Call Scheduling**
- ✅ Automatic scheduling in `call_schedules` table
- ✅ Egypt timezone handling
- ✅ Conflict detection and resolution
- ✅ Admin manual scheduling capability

### **3. Real-time Admin Updates**
- ✅ Live status monitoring for admins
- ✅ Due calls tracking
- ✅ Recent activity summaries

### **4. Enhanced Message Templates**
- ✅ Call reminders
- ✅ Missed call follow-ups
- ✅ Clarification requests
- ✅ Follow-up messages

---

## 🧪 **Testing Scenarios**

### **Test 1: Enhanced Time Slot Selection**

**Scenario A: Standard Time Slots**
```bash
# Simulate WhatsApp response with "1"
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "field": "messages",
        "value": {
          "messages": [{
            "from": "201234567890",
            "id": "wamid.test123",
            "timestamp": "1671234567",
            "text": { "body": "1" }
          }]
        }
      }]
    }]
  }'
```

**Expected Results:**
- Lead status updated to `time_selected`
- Entry created in `call_schedules` table
- Confirmation WhatsApp message sent with specific time
- Scheduled time calculated for next available morning slot

**Scenario B: Specific Time**
```bash
# Simulate WhatsApp response with "2pm"
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "field": "messages",
        "value": {
          "messages": [{
            "from": "201234567890",
            "id": "wamid.test124",
            "timestamp": "1671234567",
            "text": { "body": "2pm" }
          }]
        }
      }]
    }]
  }'
```

**Expected Results:**
- Time parsed to 2:00 PM today (or tomorrow if passed)
- Call scheduled for exact time
- Egypt timezone correctly applied

**Scenario C: Unclear Time**
```bash
# Simulate WhatsApp response with unclear time
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "field": "messages",
        "value": {
          "messages": [{
            "from": "201234567890",
            "id": "wamid.test125",
            "timestamp": "1671234567",
            "text": { "body": "sometime later" }
          }]
        }
      }]
    }]
  }'
```

**Expected Results:**
- Status updated to `time_clarification_needed`
- Clarification message sent asking for specific time
- No call scheduled yet

### **Test 2: Call Scheduling API**

**Test A: Automatic Scheduling**
```bash
curl -X POST http://localhost:3000/api/calls/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": "lead_1671234567890_abc123",
    "preferred_time_slot": "Afternoon (12-5 PM)",
    "call_type": "qualification"
  }'
```

**Test B: Admin Manual Scheduling**
```bash
curl -X POST http://localhost:3000/api/calls/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": "lead_1671234567890_abc123",
    "specific_time": "2025-06-18T15:30:00.000Z",
    "call_type": "qualification",
    "admin_scheduled": true
  }'
```

**Test C: Get Scheduled Calls**
```bash
# Get all scheduled calls
curl "http://localhost:3000/api/calls/schedule"

# Get calls for specific lead
curl "http://localhost:3000/api/calls/schedule?lead_id=lead_1671234567890_abc123"

# Get due calls
curl "http://localhost:3000/api/calls/schedule?status=scheduled"
```

### **Test 3: Real-time Admin Updates**

```bash
# Get recent updates
curl "http://localhost:3000/api/admin/realtime"

# Get updates since specific time
curl "http://localhost:3000/api/admin/realtime?since=2025-06-17T10:00:00.000Z"

# Get specific update types
curl "http://localhost:3000/api/admin/realtime?types=leads,calls"
```

**Expected Response:**
```json
{
  "timestamp": "2025-06-17T12:30:00.000Z",
  "updates": {
    "leads": {
      "count": 5,
      "recent": [...],
      "status_summary": {
        "total_24h": 12,
        "by_status": {
          "new_lead": 3,
          "whatsapp_sent": 4,
          "time_selected": 2,
          "call_scheduled": 3
        },
        "active_leads": 9
      }
    },
    "calls": {
      "recent_count": 2,
      "recent": [...],
      "due_now": [...],
      "due_count": 1
    },
    "messages": {
      "count": 8,
      "recent": [...],
      "incoming_count": 4
    }
  }
}
```

### **Test 4: Enhanced Message Templates**

**Test A: Call Reminder**
```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+201234567890",
    "message_type": "call_reminder",
    "variables": {
      "name": "Ahmed",
      "call_time": "Today at 2:00 PM",
      "phone_number": "+201234567890",
      "property_type": "Apartment",
      "location": "New Cairo"
    }
  }'
```

**Test B: Follow-up Message**
```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+201234567890",
    "message_type": "follow_up",
    "variables": {
      "name": "Ahmed",
      "property_type": "Apartment",
      "location": "New Cairo"
    }
  }'
```

---

## 🔍 **Database Verification**

### **Check Call Schedules**
```sql
-- View all scheduled calls with lead information
SELECT 
  cs.*,
  l.name,
  l.whatsapp_number,
  l.property_type,
  l.location,
  l.status as lead_status
FROM call_schedules cs
JOIN leads l ON cs.lead_id = l.lead_id
ORDER BY cs.scheduled_time;

-- Check due calls
SELECT * FROM call_schedules 
WHERE status = 'scheduled' 
AND scheduled_time <= NOW()
ORDER BY scheduled_time;
```

### **Check Lead Status Flow**
```sql
-- View leads and their progression
SELECT 
  lead_id,
  name,
  status,
  preferred_call_time,
  created_at,
  updated_at,
  metadata->>'time_selection' as time_selection_data
FROM leads 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC;
```

### **Check WhatsApp Message History**
```sql
-- View conversation flow for a lead
SELECT 
  wm.*,
  l.name,
  l.status
FROM whatsapp_messages wm
JOIN leads l ON wm.lead_id = l.lead_id
WHERE l.lead_id = 'your_lead_id'
ORDER BY wm.timestamp;
```

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: Time Zone Problems**
**Symptoms:** Scheduled times appear incorrect
**Check:** 
```javascript
// Verify Egypt time calculation
console.log(new Date().toLocaleString("en-US", {timeZone: "Africa/Cairo"}))
```

### **Issue 2: Duplicate Call Schedules**
**Symptoms:** Multiple scheduled calls for same lead
**Solution:** Check cancellation logic in scheduling API

### **Issue 3: WhatsApp Webhook Not Processing**
**Symptoms:** Messages received but not processed
**Check:** 
- Webhook verification token
- Phone number format (+20 prefix)
- Lead exists in database

### **Issue 4: Real-time Updates Not Working**
**Symptoms:** Admin dashboard not showing updates
**Check:** 
- Admin authentication
- Database permissions
- Recent activity timestamps

---

## ✅ **Phase 2 Success Criteria**

Phase 2 is complete when:
- [ ] ✅ Enhanced time parsing works for all formats
- [ ] ✅ Automatic call scheduling creates entries in database
- [ ] ✅ Egypt timezone handling is accurate
- [ ] ✅ Admin can schedule calls manually
- [ ] ✅ Real-time updates provide current status
- [ ] ✅ Message templates cover all scenarios
- [ ] ✅ Clarification requests handle unclear inputs
- [ ] ✅ Call conflicts are detected and resolved
- [ ] ✅ Status transitions work correctly

---

## 🎯 **Ready for Phase 3**

Once Phase 2 testing passes:
1. **OpenAI Voice Calling** - Implement actual outbound calls
2. **Call Execution** - Connect scheduled calls to OpenAI agents
3. **Conversation Processing** - Extract qualification data
4. **Call Outcomes** - Update lead status based on results

---

*Test each component individually, then run full end-to-end scenarios.*