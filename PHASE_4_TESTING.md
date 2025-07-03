# Phase 4 Testing Guide - Complete Property Management System

## 🎯 **Phase 4 Final Features**

### **1. Enhanced Admin Dashboard & Analytics**
- ✅ Real-time call monitoring and metrics
- ✅ Lead conversion funnel analytics
- ✅ OpenAI call performance metrics
- ✅ WhatsApp engagement analytics
- ✅ Photographer performance tracking
- ✅ Property approval workflow monitoring

### **2. Property Approval Workflow**
- ✅ Qualified lead review system
- ✅ Admin approval/rejection with reasons
- ✅ Automatic scoring and factors analysis
- ✅ WhatsApp notifications for decisions
- ✅ Integration with photographer scheduling

### **3. Photographer Management System**
- ✅ Complete photographer database
- ✅ Auto-assignment based on location and availability
- ✅ Assignment tracking and status management
- ✅ Client and photographer rating system
- ✅ Integration with property approval workflow

### **4. Advanced Analytics & Reporting**
- ✅ Comprehensive lead metrics and funnel
- ✅ Call analytics and qualification scoring
- ✅ Photographer performance metrics
- ✅ Multi-dimensional reporting dashboard

---

## 🧪 **Complete End-to-End Testing**

### **Test 1: Full Lead Journey - From Capture to Photo Completion**

**Step 1: Create Lead**
```bash
# Capture a new lead
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ahmed Hassan",
    "email": "ahmed@test.com",
    "whatsapp_number": "+201234567890",
    "location": "New Cairo",
    "price_range": "3M-5M EGP",
    "property_type": "Apartment",
    "timeline": "Soon (2-4 months)"
  }'
```

**Step 2: Verify WhatsApp Welcome Message**
```bash
# Check WhatsApp messages for the lead
curl "http://localhost:3000/api/admin/whatsapp/messages?lead_id=LEAD_ID_HERE"
```

**Step 3: Simulate User Response & Call Scheduling**
```bash
# Simulate user response with time preference
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "+201234567890",
            "text": {"body": "2️⃣"},
            "id": "msg_123",
            "timestamp": "'$(date +%s)'"
          }]
        }
      }]
    }]
  }'
```

**Step 4: Execute Scheduled Call**
```bash
# Check due calls
curl "http://localhost:3000/api/calls/execute?preview=true"

# Execute the call
curl -X POST http://localhost:3000/api/calls/execute \
  -H "Content-Type: application/json" \
  -d '{
    "batch_execute": true,
    "max_calls": 1
  }'
```

**Step 5: Simulate Conversation & Qualification**
```bash
# Simulate successful qualification
curl -X POST http://localhost:3000/api/calls/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "call_log_id": "CALL_LOG_ID_HERE",
    "event_type": "function_called",
    "function_calls": [{
      "name": "qualify_lead",
      "arguments": {
        "property_details": {
          "exact_location": "New Cairo, 5th Settlement",
          "bedrooms": 3,
          "bathrooms": 2,
          "size_sqm": 150,
          "property_condition": "excellent"
        },
        "selling_motivation": {
          "reason_for_selling": "Upgrading to larger home",
          "urgency_level": "high",
          "timeline_weeks": 6,
          "price_expectation": 4200000
        },
        "qualification_score": 9,
        "next_action": "qualified",
        "notes": "Highly motivated seller, property in excellent condition, realistic timeline"
      }
    }]
  }'

# End conversation
curl -X POST http://localhost:3000/api/calls/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "call_log_id": "CALL_LOG_ID_HERE",
    "event_type": "conversation_ended",
    "call_duration": 380,
    "conversation_ended": true
  }'
```

**Step 6: Admin Property Approval**
```bash
# Get qualified leads awaiting approval
curl "http://localhost:3000/api/admin/property-approval?status=pending"

# Approve the property
curl -X POST http://localhost:3000/api/admin/property-approval \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": "LEAD_ID_HERE",
    "action": "approve",
    "reason": "High-quality property with motivated seller",
    "admin_notes": "Excellent qualification score and property condition. Priority assignment."
  }'
```

**Step 7: Verify Photographer Assignment**
```bash
# Check photographer assignments
curl "http://localhost:3000/api/admin/photographer-assignments?lead_id=LEAD_ID_HERE"

# Get available photographers
curl "http://localhost:3000/api/admin/photographers?area=New Cairo&availability=true"
```

**Step 8: Complete Photo Shoot**
```bash
# Update assignment status to completed
curl -X PUT http://localhost:3000/api/admin/photographer-assignments \
  -H "Content-Type: application/json" \
  -d '{
    "assignment_id": "ASSIGNMENT_ID_HERE",
    "status": "completed",
    "completion_notes": "Successfully completed 3BR apartment shoot",
    "actual_duration_minutes": 75,
    "photos_count": 45,
    "client_rating": 5
  }'
```

**Expected Final State:**
- Lead status: `photos_completed`
- WhatsApp messages: Welcome → Call reminder → Property approved → Photographer scheduled
- Call log: Complete transcript and qualification data
- Photographer assignment: Completed with ratings
- Analytics: Full funnel tracking from capture to completion

---

### **Test 2: Property Rejection Workflow**

```bash
# Get qualified lead
curl "http://localhost:3000/api/admin/property-approval?status=pending"

# Reject the property
curl -X POST http://localhost:3000/api/admin/property-approval \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": "LEAD_ID_HERE",
    "action": "reject",
    "reason": "Property condition below standards",
    "admin_notes": "Needs significant renovations before our program"
  }'
```

**Expected Results:**
- Lead status: `rejected`
- WhatsApp rejection message sent
- No photographer assignment created
- Rejection reason stored in metadata

---

### **Test 3: Photographer Management**

**Add New Photographer:**
```bash
curl -X POST http://localhost:3000/api/admin/photographers \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newphotographer@test.com",
    "name": "Sara Photographer",
    "phone": "+201987654321",
    "preferred_areas": ["Zamalek", "Maadi"],
    "equipment": "Insta360 X5, DSLR Camera Kit",
    "skills": ["residential", "luxury", "commercial"],
    "languages": ["Arabic", "English", "French"]
  }'
```

**Manual Assignment:**
```bash
curl -X POST http://localhost:3000/api/admin/photographer-assignments \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": "LEAD_ID_HERE",
    "photographer_id": "PHOTOGRAPHER_ID_HERE",
    "scheduled_time": "2025-06-20T10:00:00.000Z",
    "duration_minutes": 90,
    "preparation_notes": "Luxury apartment - bring wide-angle lens"
  }'
```

**Auto-Assignment:**
```bash
curl -X POST http://localhost:3000/api/admin/photographer-assignments \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": "LEAD_ID_HERE",
    "scheduled_time": "2025-06-21T14:00:00.000Z",
    "auto_assign": true
  }'
```

---

### **Test 4: Advanced Analytics Dashboard**

**Get Complete Analytics:**
```bash
# 30-day analytics
curl "http://localhost:3000/api/admin/analytics?range=30d"

# 7-day analytics
curl "http://localhost:3000/api/admin/analytics?range=7d"

# 90-day analytics
curl "http://localhost:3000/api/admin/analytics?range=90d"
```

**Expected Analytics Sections:**
- **Overview**: Total counts and growth percentages
- **Lead Metrics**: Funnel analysis, conversion rates, location breakdown
- **Call Metrics**: OpenAI performance, qualification scores, success rates
- **WhatsApp Metrics**: Message volumes, response rates, engagement
- **Photographer Metrics**: Performance, ratings, assignment statistics

---

### **Test 5: Real-Time Admin Dashboard**

```bash
# Get real-time updates
curl "http://localhost:3000/api/admin/realtime"
```

**Expected Data:**
- Recent lead activities
- Due/overdue calls
- Pending approvals
- Active photographer assignments
- System health metrics

---

## 🔍 **Database Verification Queries**

### **Complete Lead Journey Tracking**
```sql
-- Full lead journey with all related data
SELECT 
  l.lead_id,
  l.name,
  l.status,
  l.initial_score,
  l.created_at,
  
  -- WhatsApp interaction
  wm.message_count,
  wm.last_message_at,
  
  -- Call data
  cl.call_status,
  cl.call_duration,
  cl.lead_qualification_score,
  cl.conversation_summary,
  
  -- Photographer assignment
  pa.photographer_name,
  pa.assignment_status,
  pa.scheduled_time as photo_scheduled,
  pa.completion_notes,
  pa.photos_count

FROM leads l

LEFT JOIN (
  SELECT 
    lead_id,
    COUNT(*) as message_count,
    MAX(timestamp) as last_message_at
  FROM whatsapp_messages 
  GROUP BY lead_id
) wm ON l.lead_id = wm.lead_id

LEFT JOIN (
  SELECT DISTINCT ON (lead_id)
    lead_id,
    call_status,
    call_duration,
    lead_qualification_score,
    conversation_summary
  FROM call_logs 
  ORDER BY lead_id, call_started_at DESC
) cl ON l.lead_id = cl.lead_id

LEFT JOIN (
  SELECT 
    pa.lead_id,
    p.name as photographer_name,
    pa.status as assignment_status,
    pa.scheduled_time,
    pa.completion_notes,
    pa.photos_count
  FROM photographer_assignments pa
  JOIN photographers p ON pa.photographer_id = p.id
) pa ON l.id = pa.lead_id

ORDER BY l.created_at DESC;
```

### **Conversion Funnel Analysis**
```sql
-- Lead conversion funnel
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM leads 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'new_lead' THEN 1
    WHEN 'whatsapp_sent' THEN 2
    WHEN 'responded' THEN 3
    WHEN 'call_scheduled' THEN 4
    WHEN 'called' THEN 5
    WHEN 'qualified' THEN 6
    WHEN 'property_approved' THEN 7
    WHEN 'photographer_assigned' THEN 8
    WHEN 'photos_completed' THEN 9
    WHEN 'completed' THEN 10
    ELSE 99
  END;
```

### **Photographer Performance**
```sql
-- Photographer performance metrics
SELECT 
  p.name,
  p.rating,
  COUNT(pa.id) as total_assignments,
  COUNT(CASE WHEN pa.status = 'completed' THEN 1 END) as completed,
  AVG(pa.actual_duration_minutes) as avg_duration,
  AVG(pa.photos_count) as avg_photos,
  AVG(pa.client_rating) as avg_client_rating
FROM photographers p
LEFT JOIN photographer_assignments pa ON p.id = pa.photographer_id
WHERE p.is_active = true
GROUP BY p.id, p.name, p.rating
ORDER BY completed DESC, p.rating DESC;
```

---

## 🚨 **Integration Testing Scenarios**

### **Scenario 1: High Volume Load Test**
- Create 10 leads simultaneously
- Schedule calls for all leads
- Execute batch calls
- Process all through approval workflow
- Assign photographers to approved properties
- Verify all data integrity

### **Scenario 2: Error Recovery Testing**
- Test with invalid phone numbers
- Test with OpenAI API failures
- Test with WhatsApp API failures
- Test photographer availability conflicts
- Verify graceful error handling

### **Scenario 3: Concurrent Operations**
- Multiple admin users approving properties
- Simultaneous photographer assignments
- Concurrent call executions
- Real-time analytics updates
- Verify no data corruption

---

## ✅ **Phase 4 Success Criteria**

Phase 4 is complete when:
- [ ] ✅ Complete lead-to-completion journey works end-to-end
- [ ] ✅ Property approval workflow processes qualified leads
- [ ] ✅ Photographer auto-assignment works for approved properties
- [ ] ✅ WhatsApp notifications sent at all workflow stages
- [ ] ✅ Analytics dashboard shows comprehensive metrics
- [ ] ✅ Real-time admin dashboard updates correctly
- [ ] ✅ All database relationships and constraints work
- [ ] ✅ Error handling covers all failure scenarios
- [ ] ✅ Performance acceptable under load testing
- [ ] ✅ Data integrity maintained across all operations

---

## 🎯 **Production Readiness**

Once Phase 4 testing passes:
1. **Environment Configuration** - Production API keys and settings
2. **Database Migration** - Apply all schema changes to production
3. **Monitoring Setup** - Error tracking and performance monitoring
4. **Backup Strategy** - Database and file backup procedures
5. **Deployment Pipeline** - CI/CD configuration
6. **Documentation** - User guides and API documentation

---

*Test systematically through each scenario. Verify data integrity after each step. Monitor logs for any errors or performance issues.*