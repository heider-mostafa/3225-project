# Phase 3 Testing Guide - OpenAI Voice Calling Integration

## 🎯 **New Features in Phase 3**

### **1. Outbound AI Calling System**
- ✅ Automatic call initiation based on scheduled times
- ✅ OpenAI Realtime API integration for voice conversations
- ✅ Lead qualification through AI voice interactions
- ✅ Real-time conversation monitoring and logging

### **2. Conversation Analysis & Intelligence**
- ✅ Automatic transcript analysis and property qualification
- ✅ Lead scoring based on conversation content
- ✅ Key information extraction (property details, motivation, timeline)
- ✅ Red flags and positive signals detection

### **3. Call Management & Logging**
- ✅ Comprehensive call logs with transcripts
- ✅ Call outcome processing and lead status updates
- ✅ Admin call management and review capabilities
- ✅ Automated follow-up message system

### **4. Batch Call Execution**
- ✅ Automatic execution of due calls
- ✅ Call scheduling with retry logic
- ✅ Batch processing for multiple leads
- ✅ Real-time monitoring and status updates

---

## 🧪 **Testing Scenarios**

### **Test 1: Single Call Initiation**

**Scenario A: Scheduled Call Execution**
```bash
# Get due calls first
curl "http://localhost:3000/api/calls/execute?preview=true"

# Execute a specific scheduled call
curl -X POST http://localhost:3000/api/calls/execute \
  -H "Content-Type: application/json" \
  -d '{
    "schedule_id": "your_schedule_id_here",
    "force_execute": false
  }'
```

**Expected Results:**
- OpenAI Realtime session created
- Call log entry created with status 'initiated'
- Lead status updated to 'called'
- WhatsApp reminder sent to lead
- Session ID and client secret returned

**Scenario B: Manual Call Initiation**
```bash
# Initiate call directly for a lead
curl -X POST http://localhost:3000/api/calls/outbound \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": "lead_1671234567890_abc123",
    "force_call": true
  }'
```

### **Test 2: Batch Call Execution**

**Scenario A: Check Due Calls**
```bash
# Preview what calls are due
curl "http://localhost:3000/api/calls/execute?preview=true"
```

**Expected Response:**
```json
{
  "due_calls": [
    {
      "id": "schedule_123",
      "lead_id": "lead_456",
      "scheduled_time": "2025-06-17T14:00:00.000Z",
      "scheduled_time_formatted": "6/17/25, 2:00:00 PM",
      "minutes_overdue": 5,
      "leads": {
        "name": "Ahmed Test",
        "whatsapp_number": "+201234567890",
        "property_type": "Apartment",
        "location": "New Cairo"
      }
    }
  ],
  "total_due": 1,
  "ready_to_execute": 1,
  "preview_mode": true
}
```

**Scenario B: Execute Batch Calls**
```bash
# Execute up to 3 due calls
curl -X POST http://localhost:3000/api/calls/execute \
  -H "Content-Type: application/json" \
  -d '{
    "batch_execute": true,
    "max_calls": 3
  }'
```

### **Test 3: Call Webhook Processing**

**Simulate conversation events:**

**Scenario A: Conversation Started**
```bash
curl -X POST http://localhost:3000/api/calls/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "call_log_id": "your_call_log_id",
    "event_type": "conversation_started",
    "session_id": "your_session_id"
  }'
```

**Scenario B: Transcript Update**
```bash
curl -X POST http://localhost:3000/api/calls/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "call_log_id": "your_call_log_id",
    "event_type": "transcript_update",
    "transcript": "Agent: Hello Mr. Ahmed, this is calling from VirtualEstate about your apartment listing. Lead: Yes, hello. I was expecting your call."
  }'
```

**Scenario C: Function Call (Lead Qualification)**
```bash
curl -X POST http://localhost:3000/api/calls/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "call_log_id": "your_call_log_id",
    "event_type": "function_called",
    "function_calls": [{
      "name": "qualify_lead",
      "arguments": {
        "property_details": {
          "exact_location": "New Cairo, 5th Settlement",
          "bedrooms": 3,
          "bathrooms": 2,
          "size_sqm": 150,
          "property_condition": "good",
          "renovations_needed": "Minor kitchen updates"
        },
        "selling_motivation": {
          "reason_for_selling": "Relocating for work",
          "urgency_level": "medium",
          "timeline_weeks": 8,
          "price_expectation": 4500000
        },
        "qualification_score": 8,
        "next_action": "qualified",
        "notes": "Very motivated seller, realistic about timeline and price"
      }
    }]
  }'
```

**Scenario D: Conversation Ended**
```bash
curl -X POST http://localhost:3000/api/calls/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "call_log_id": "your_call_log_id",
    "event_type": "conversation_ended",
    "transcript": "Full conversation transcript here...",
    "call_duration": 420,
    "conversation_ended": true
  }'
```

### **Test 4: Call Logs Management**

**Scenario A: Get Call Logs**
```bash
# Get all call logs
curl "http://localhost:3000/api/calls/logs"

# Get logs for specific lead
curl "http://localhost:3000/api/calls/logs?lead_id=lead_1671234567890_abc123"

# Get logs by status
curl "http://localhost:3000/api/calls/logs?status=completed"
```

**Scenario B: Update Call Log**
```bash
curl -X POST http://localhost:3000/api/calls/logs \
  -H "Content-Type: application/json" \
  -d '{
    "call_log_id": "your_call_log_id",
    "transcript": "Complete conversation transcript",
    "conversation_summary": "Lead expressed interest in selling 3BR apartment in New Cairo within 2 months",
    "qualification_score": 8,
    "next_action": "qualified",
    "call_duration": 420,
    "call_status": "completed"
  }'
```

**Scenario C: Admin Review**
```bash
curl -X PUT http://localhost:3000/api/calls/logs \
  -H "Content-Type: application/json" \
  -d '{
    "call_log_id": "your_call_log_id",
    "admin_notes": "Reviewed call - lead seems very motivated. Approve for photographer scheduling.",
    "manual_qualification_score": 9,
    "override_next_action": "qualified"
  }'
```

---

## 🔍 **Database Verification**

### **Check Call Execution Flow**
```sql
-- View call schedules and their execution status
SELECT 
  cs.id as schedule_id,
  cs.scheduled_time,
  cs.status as schedule_status,
  l.name,
  l.whatsapp_number,
  l.status as lead_status,
  cl.call_status,
  cl.call_started_at,
  cl.call_ended_at,
  cl.qualification_score
FROM call_schedules cs
JOIN leads l ON cs.lead_id = l.lead_id
LEFT JOIN call_logs cl ON cs.id = cl.call_schedule_id
ORDER BY cs.scheduled_time DESC;
```

### **Check Conversation Analysis Results**
```sql
-- View call analysis and qualification data
SELECT 
  cl.*,
  l.name,
  l.status as current_lead_status
FROM call_logs cl
JOIN leads l ON cl.lead_id = l.lead_id
WHERE cl.call_status = 'completed'
AND cl.transcript IS NOT NULL
ORDER BY cl.call_ended_at DESC;
```

### **Check Lead Status Progression**
```sql
-- Track lead journey through call process
SELECT 
  lead_id,
  name,
  status,
  preferred_call_time,
  metadata->>'qualification_result' as qualification_data,
  created_at,
  updated_at
FROM leads 
WHERE status IN ('call_scheduled', 'called', 'qualified', 'follow_up_needed', 'callback_requested')
ORDER BY updated_at DESC;
```

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: OpenAI Session Creation Fails**
**Symptoms:** Call initiation returns OpenAI error
**Check:** 
- Verify `OPENAI_API_KEY` is set correctly
- Ensure account has Realtime API access
- Check API quota and billing

### **Issue 2: Calls Not Executing Automatically**
**Symptoms:** Due calls not being processed
**Solutions:**
- Manually trigger with `/api/calls/execute`
- Check call schedule status and timing
- Verify database call_schedules table

### **Issue 3: Conversation Analysis Fails**
**Symptoms:** Empty analysis results or errors
**Check:**
- OpenAI API connectivity
- Transcript format and content
- ConversationAnalyzer class initialization

### **Issue 4: WhatsApp Follow-up Not Sent**
**Symptoms:** No follow-up messages after calls
**Check:**
- WhatsApp API credentials
- Lead phone number format
- Message template configuration

### **Issue 5: Lead Status Not Updating**
**Symptoms:** Lead remains in 'called' status
**Check:**
- Webhook event processing
- Function call handling
- Database update permissions

---

## 🎯 **Advanced Testing Scenarios**

### **Test 5: End-to-End Voice Call Simulation**

1. **Create a test lead**
2. **Schedule a call for immediate execution**
3. **Execute the call**
4. **Simulate conversation events**
5. **Complete the conversation with qualification**
6. **Verify lead status and follow-up messages**

```bash
# Step 1: Create lead (use existing lead capture API)
# Step 2: Schedule immediate call
curl -X POST http://localhost:3000/api/calls/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": "test_lead_123",
    "specific_time": "2025-06-17T14:00:00.000Z",
    "call_type": "qualification"
  }'

# Step 3: Execute the call
curl -X POST http://localhost:3000/api/calls/execute \
  -H "Content-Type: application/json" \
  -d '{
    "schedule_id": "returned_schedule_id",
    "force_execute": true
  }'

# Steps 4-6: Use webhook simulation scripts above
```

### **Test 6: Stress Testing Batch Calls**

```bash
# Create multiple test leads with scheduled calls
# Then execute batch processing
curl -X POST http://localhost:3000/api/calls/execute \
  -H "Content-Type: application/json" \
  -d '{
    "batch_execute": true,
    "max_calls": 10
  }'
```

---

## ✅ **Phase 3 Success Criteria**

Phase 3 is complete when:
- [ ] ✅ OpenAI Realtime sessions create successfully for calls
- [ ] ✅ Scheduled calls execute automatically at due times
- [ ] ✅ Voice conversations generate accurate transcripts
- [ ] ✅ AI analysis extracts property qualification data
- [ ] ✅ Lead scores are calculated based on conversations
- [ ] ✅ Lead statuses update automatically based on call outcomes
- [ ] ✅ Follow-up WhatsApp messages are sent appropriately
- [ ] ✅ Call logs store complete conversation data
- [ ] ✅ Admin can review and override call outcomes
- [ ] ✅ Batch call execution processes multiple leads
- [ ] ✅ Error handling works for failed calls and sessions

---

## 🎯 **Ready for Phase 4**

Once Phase 3 testing passes:
1. **Enhanced Admin Dashboard** with real-time call monitoring
2. **Property Approval Workflow** for qualified leads
3. **Photographer Scheduling** integration
4. **Advanced Analytics** and reporting

---

*Test each component individually, then run full end-to-end voice calling workflows.*