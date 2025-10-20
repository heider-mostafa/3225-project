# Valify Enhanced Verification Testing Guide

This guide provides comprehensive testing instructions for the complete Valify FRA (Financial Regulatory Authority) verification flow.

## 🎯 Overview

The Enhanced Verification Workflow now includes **9 steps**:
1. **Phone OTP Verification** - Egyptian mobile number verification
2. **Email OTP Verification** - Email address verification  
3. **Document Upload** - National ID/Passport OCR processing
4. **Selfie Verification** - Liveness detection and face matching
5. **CSO Validation** - Civil Society Organization ID validation
6. **NTRA Validation** - National Telecom Regulatory Authority phone validation
7. **Headshot Generation** - AI professional headshot creation
8. **Status Review** - Complete verification status review
9. **Complete** - Full FRA compliance achieved

## 🚀 Quick Testing Setup

### 1. UI Integration Status ✅
- **Main verification page updated**: `app/appraiser/verify/[id]/page.tsx` now uses `EnhancedVerificationWorkflow`
- **Verification button updated**: Components use the enhanced workflow
- **All OTP components integrated**: Phone, Email, CSO, and NTRA components are working

### 2. Database Migration ✅
- **Safe migration applied**: New columns and constraints added safely
- **All tests passed**: Database schema supports complete verification flow

## 📋 Testing Instructions

### Method 1: Browser Console Testing (Recommended)

1. **Open the verification page**:
   ```
   http://localhost:3000/appraiser/verify/[APPRAISER_ID]
   ```

2. **Open browser developer console** (F12)

3. **Load test scripts**:
   ```javascript
   // Copy and paste each test file content into console, then run:
   
   // Test Phone OTP
   runPhoneOTPTests();
   testPhoneOTPAPI();
   
   // Test Email OTP
   runEmailOTPTests();
   testEmailOTPAPI();
   
   // Test CSO and NTRA
   runValidationTests();
   testCSOAPI();
   testNTRAAPI();
   
   // Test Complete Flow
   runCompleteVerificationTest();
   ```

### Method 2: Manual UI Testing

1. **Navigate to verification page**
2. **Follow the 9-step workflow**:
   - Enter Egyptian phone number (+201234567890)
   - Enter email address
   - Upload National ID document
   - Take selfie photo
   - Confirm CSO validation
   - Confirm NTRA validation
   - Generate professional headshot
   - Review final status

### Method 3: API Testing with Postman/curl

#### Phone OTP Send
```bash
curl -X POST http://localhost:3000/api/verification/send-phone-otp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "phone_number": "+201234567890",
    "appraiser_id": "YOUR_APPRAISER_ID"
  }'
```

#### Phone OTP Verify
```bash
curl -X POST http://localhost:3000/api/verification/verify-phone-otp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "otp": "123456",
    "transaction_id": "TRANSACTION_ID_FROM_SEND",
    "appraiser_id": "YOUR_APPRAISER_ID"
  }'
```

#### Email OTP Send
```bash
curl -X POST http://localhost:3000/api/verification/send-email-otp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "test@example.com",
    "appraiser_id": "YOUR_APPRAISER_ID"
  }'
```

#### Email OTP Verify
```bash
curl -X POST http://localhost:3000/api/verification/verify-email-otp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "otp": "123456",
    "transaction_id": "TRANSACTION_ID_FROM_SEND",
    "appraiser_id": "YOUR_APPRAISER_ID"
  }'
```

#### CSO Validation
```bash
curl -X POST http://localhost:3000/api/verification/validate-cso \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "appraiser_id": "YOUR_APPRAISER_ID",
    "nid": "29001010123456",
    "full_name": "Ahmed Mohamed Ali"
  }'
```

#### NTRA Validation
```bash
curl -X POST http://localhost:3000/api/verification/validate-ntra \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "appraiser_id": "YOUR_APPRAISER_ID",
    "phone_number": "+201234567890",
    "nid": "29001010123456"
  }'
```

## 🔍 Test Cases to Verify

### Phone OTP Testing
- ✅ Egyptian phone number validation (+20 format)
- ✅ OTP code format validation (6 digits)
- ✅ Countdown timer functionality
- ✅ Resend OTP capability
- ✅ Trial limit tracking
- ✅ Database session storage

### Email OTP Testing
- ✅ Email format validation
- ✅ OTP code format validation (6 digits)
- ✅ Countdown timer functionality
- ✅ Resend OTP capability
- ✅ Trial limit tracking
- ✅ Database session storage

### CSO Validation Testing
- ✅ National ID format validation (14 digits)
- ✅ Personal data validation
- ✅ CSO API response handling
- ✅ Error code interpretation
- ✅ Database validation storage

### NTRA Validation Testing
- ✅ Phone number-National ID matching
- ✅ NTRA API response handling
- ✅ Match result validation
- ✅ Database validation storage

### Complete Flow Testing
- ✅ Step-by-step progression
- ✅ Data persistence between steps
- ✅ Error handling and recovery
- ✅ Final status compilation
- ✅ Database trigger functionality

## 🧪 Test Files Provided

1. **`test_phone_otp_flow.js`** - Phone OTP verification tests
2. **`test_email_otp_flow.js`** - Email OTP verification tests  
3. **`test_cso_ntra_flow.js`** - CSO and NTRA validation tests
4. **`test_complete_verification_flow.js`** - End-to-end flow tests

## 📊 Expected Results

### Development Mode (Mock APIs)
All tests should **PASS** with mock responses:
- Phone OTP: Returns mock success responses
- Email OTP: Returns mock success responses
- CSO Validation: Returns `isValid: true`
- NTRA Validation: Returns `isMatched: true`

### Production Mode (Real Valify APIs)
Results depend on actual Valify service responses:
- Phone OTP: Requires real Egyptian phone numbers
- Email OTP: Requires accessible email addresses
- CSO/NTRA: Requires valid Egyptian National IDs and registered phone numbers

## 🔧 Environment Variables Required

```env
# Valify API Configuration
VALIFY_API_BASE_URL=https://valifystage.com
VALIFY_USERNAME=your_username
VALIFY_PASSWORD=your_password
VALIFY_CLIENT_ID=your_client_id
VALIFY_CLIENT_SECRET=your_client_secret
VALIFY_BUNDLE_KEY=a3e473fc80ce4670a2279bdc48e28af1
VALIFY_WEBHOOK_SECRET=your_webhook_secret
```

## 🚨 Troubleshooting

### Common Issues:

1. **"Unauthorized" errors**
   - Check Supabase authentication
   - Verify JWT token in localStorage
   - Ensure user owns the appraiser record

2. **"Appraiser not found"**
   - Use valid appraiser ID from database
   - Check foreign key relationships

3. **"Failed to send OTP"**
   - Verify Valify credentials in environment variables
   - Check network connectivity
   - Review API endpoint URLs

4. **Database constraint violations**
   - Run the safe migration script
   - Check database schema matches expected structure

5. **UI components not displaying**
   - Verify import paths are correct
   - Check for TypeScript compilation errors
   - Ensure all dependencies are installed

### Debug Mode:
Add this to your browser console for detailed logging:
```javascript
localStorage.setItem('debug', 'valify:*');
```

## ✅ Success Criteria

A successful test run should show:

1. **All API endpoints respond correctly** (200 status codes)
2. **Database sessions created and updated** properly
3. **UI components render and function** correctly
4. **Step progression works** smoothly
5. **Final verification status** shows `verified: true`
6. **All broker verification fields** set to `true`

## 📝 Reporting Issues

When reporting issues, please include:

1. **Test method used** (Browser Console/Manual/API)
2. **Specific step that failed**
3. **Error messages** from console/network tab
4. **Browser and version**
5. **Database migration status**
6. **Environment variables status** (without sensitive values)

## 🎉 Next Steps After Testing

Once all tests pass:

1. **Deploy to staging environment**
2. **Test with real Valify API credentials**
3. **Perform user acceptance testing**
4. **Monitor verification success rates**
5. **Set up error monitoring and alerting**

---

**🚀 Happy Testing!** The Enhanced Verification Workflow is now ready for comprehensive testing with full FRA compliance support.