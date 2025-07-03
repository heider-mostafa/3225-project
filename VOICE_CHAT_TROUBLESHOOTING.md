# OpenAI Voice Chat Troubleshooting Guide - **BROWSER LIMITATIONS DISCOVERED**

## 🚨 **ROOT CAUSE IDENTIFIED** 

After extensive research and testing, the core issue is:

**Browsers CANNOT send custom headers (like `Authorization`) with WebSocket connections.**

This is a fundamental browser security limitation, not a configuration issue.

## 🔍 **What We Discovered:**

### ❌ **What Doesn't Work in Browsers:**
```javascript
// ❌ This NEVER works in browsers:
const ws = new WebSocket('wss://api.openai.com/v1/realtime', [], {
  headers: {
    'Authorization': `Bearer ${apiKey}`,  // Browsers block this!
    'OpenAI-Beta': 'realtime=v1'
  }
})

// ❌ This also doesn't work:
const ws = new WebSocket('wss://api.openai.com/v1/realtime?authorization=Bearer+xyz')
```

### ✅ **What OpenAI Actually Recommends:**

According to [webrtcHacks.com research](https://webrtchacks.com/the-unofficial-guide-to-openai-realtime-webrtc-api/):

**Use WebRTC Data Channels, not WebSocket!**

## 🛠️ **The Correct Solutions:**

### Option 1: **WebRTC Data Channel (Recommended)**
```javascript
// Create peer connection
const pc = new RTCPeerConnection()

// Create data channel for messages
const dc = pc.createDataChannel("oai-events")

// Send offer to OpenAI API endpoint
const response = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
  method: 'POST',
  body: pc.localDescription.sdp,
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/sdp'
  }
})

// Set remote description from response
await pc.setRemoteDescription({
  type: 'answer',
  sdp: await response.text()
})

// Send messages via data channel
dc.send(JSON.stringify({
  type: 'session.update',
  session: { instructions: 'Your prompt here' }
}))
```

### Option 2: **Server-Side Proxy**
Create a server that:
1. Receives WebSocket from browser
2. Connects to OpenAI with proper auth headers
3. Proxies messages between browser and OpenAI

### Option 3: **Use Text Chat (Current Implementation)**
Use the regular Chat Completions API for text-based conversation.

## 📚 **Research Sources:**

1. **webrtcHacks Guide**: [The Unofficial Guide to OpenAI Realtime WebRTC API](https://webrtchacks.com/the-unofficial-guide-to-openai-realtime-webrtc-api/)
2. **OpenAI Community**: Multiple posts confirming WebSocket header limitations
3. **MDN Documentation**: WebSocket constructor doesn't support custom headers

## 🔧 **Implementation Status:**

- ❌ **WebSocket approach**: Fundamentally broken in browsers
- ⚠️ **WebRTC approach**: Complex but correct (not implemented yet)  
- ✅ **Text chat fallback**: Working perfectly
- ✅ **Ephemeral tokens**: Working for server-side use

## 💡 **Recommendations:**

### For Development:
1. **Use text chat** for now (it works great!)
2. **Plan WebRTC implementation** for true voice chat
3. **Don't waste time on WebSocket** - it can't work in browsers

### For Production:
1. **Implement WebRTC data channels** following the webrtcHacks guide
2. **Add server-side proxy** as fallback
3. **Keep text chat** as universal fallback

## 🎯 **Next Steps:**

If you want to implement true voice chat:

1. **Study the webrtcHacks example**: https://github.com/webrtcHacks/aiy-chatgpt-webrtc
2. **Follow their WebRTC guide**: Complete working implementation
3. **Test with your API key**: They show it working perfectly

## ✅ **Current Working Features:**

- 🟢 **API Key Configuration**: Working
- 🟢 **Ephemeral Token Generation**: Working  
- 🟢 **Text Chat**: Working perfectly
- 🟢 **Property Knowledge**: Working
- 🟢 **HeyGen Video Agents**: Working
- 🔴 **Voice Chat**: Requires WebRTC (not WebSocket)

---

**TL;DR**: Browser security prevents WebSocket custom headers. Use WebRTC data channels for voice, or stick with text chat (which works great!).

## Issues Identified and Solutions

### 1. **Missing Environment Configuration** ❌

**Problem**: No `.env.local` file with OpenAI API key configuration.

**Solution**: Create a `.env.local` file in your project root:

```bash
# OpenAI Configuration
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_API_KEY=sk-your-actual-api-key-here

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase Configuration (if needed)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**How to get your API key**:
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy it and replace `sk-your-actual-api-key-here` in the `.env.local` file

### 2. **Incorrect WebSocket Authentication** ❌

**Problem**: Browser WebSockets cannot send custom headers required for OpenAI authentication.

**What was wrong**:
```javascript
// ❌ This doesn't work in browsers
const ws = new WebSocket('wss://api.openai.com/v1/realtime?model=...')
// Browser can't send Authorization: Bearer headers
```

**Solution**: Use ephemeral token approach (now implemented):
```javascript
// ✅ Correct approach
1. Backend creates session with OpenAI
2. Returns ephemeral token (client_secret)
3. Browser uses ephemeral token for authentication
```

### 3. **OpenAI Realtime API Access** 🔑

**Problem**: The Realtime API is in **limited beta** - not everyone has access.

**How to check if you have access**:
1. Go to [OpenAI Playground](https://platform.openai.com/playground)
2. Look for "Realtime" or "Advanced Voice Mode" options
3. If not available, you need to request access

**Request access**:
- The Realtime API is gradually rolling out
- You may need to wait for broader availability
- Check OpenAI's announcements for updates

### 4. **Browser Limitations** ⚠️

**Problem**: Browser security restrictions limit WebSocket authentication methods.

**Limitations**:
- Cannot send custom headers with WebSocket connections
- Requires server-side proxy or ephemeral tokens
- Some audio processing limitations

**Solutions implemented**:
- Server-side ephemeral token generation
- Proper error handling and fallbacks
- Clear error messages explaining limitations

## Testing the Integration

### Step 1: Check Environment Setup

```bash
# 1. Ensure .env.local exists and has your API key
cat .env.local

# 2. Restart your development server
npm run dev
```

### Step 2: Test API Key Validity

```bash
# Test your API key with a simple request
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     https://api.openai.com/v1/models
```

### Step 3: Check Realtime API Access

```bash
# Try to create a Realtime session
curl -X POST https://api.openai.com/v1/realtime/sessions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -H "OpenAI-Beta: realtime=v1" \
  -d '{
    "model": "gpt-4o-realtime-preview-2024-10-01",
    "modalities": ["audio", "text"]
  }'
```

**Expected responses**:
- ✅ **200 OK**: You have access - should work
- ❌ **403 Forbidden**: No access to Realtime API beta
- ❌ **401 Unauthorized**: Invalid API key
- ❌ **404 Not Found**: Endpoint not available in your region

### Step 4: Test in Browser

1. Open browser developer tools (F12)
2. Go to Console tab
3. Try using the voice chat feature
4. Look for detailed error messages

## Common Error Messages and Solutions

### "Connection timeout - OpenAI Realtime API may not be available"
- **Cause**: No access to Realtime API or network issues
- **Solution**: Check API access, verify internet connection

### "Access forbidden - you may not have access to the Realtime API beta"
- **Cause**: Your OpenAI account doesn't have Realtime API access
- **Solution**: Wait for broader rollout or request access

### "Protocol error - invalid authentication method for browser"
- **Cause**: Trying to use direct API key authentication in browser
- **Solution**: Use ephemeral token approach (already implemented)

### "Direct connection failed - browser WebSockets cannot send auth headers"
- **Cause**: Browser WebSocket limitations
- **Solution**: Ephemeral token backend is working correctly

### "Failed to get realtime token"
- **Cause**: Backend token generation failing
- **Solution**: Check server logs, verify API key, check Realtime API access

## Debugging Steps

### 1. Check Browser Console Logs

Look for these log messages:
```
🔑 API Key available: true/false
🚀 Attempting to connect to OpenAI Realtime API...
✅ WebSocket connected, authenticating with ephemeral token...
📤 Sending auth session config...
```

### 2. Check Network Tab

In browser dev tools → Network tab:
- Look for `/api/realtime/token` request
- Check response status and body
- Verify WebSocket connection attempts

### 3. Check Server Logs

In your terminal where `npm run dev` is running:
```
✅ OpenAI session created successfully: sess_xxxxx
❌ OpenAI session creation failed: 403
```

### 4. Test with curl

```bash
# Test your token endpoint
curl -X POST http://localhost:3000/api/realtime/token \
  -H "Content-Type: application/json" \
  -d '{"propertyId": "test"}'
```

## Alternative Solutions

### 1. Use Text-Based Chat (Fallback)

If voice chat doesn't work, the existing text-based chat should still function:
- Uses `/api/chat/openai` endpoint
- Works with standard GPT-4 models
- No special API access required

### 2. Use Voice API (Alternative)

Instead of Realtime API, use:
- Speech-to-Text API for user input
- Text generation API for responses  
- Text-to-Speech API for audio output

### 3. Third-Party Solutions

Consider alternatives:
- ElevenLabs for voice synthesis
- AssemblyAI for speech recognition
- WebRTC for real-time audio

## Current Status Summary

✅ **Fixed**: WebSocket authentication approach
✅ **Fixed**: Ephemeral token generation
✅ **Fixed**: Error handling and messaging
✅ **Fixed**: Fallback mechanisms

⚠️ **Requires**: Valid OpenAI API key
⚠️ **Requires**: Access to OpenAI Realtime API beta
⚠️ **Requires**: Modern browser with WebRTC support

## Next Steps

1. **Set up environment variables** with your OpenAI API key
2. **Test API access** using the curl commands above
3. **Request Realtime API access** if needed
4. **Test the integration** in your browser
5. **Check console logs** for detailed error information

## Support Resources

- [OpenAI Realtime API Documentation](https://platform.openai.com/docs/guides/realtime)
- [OpenAI Community Forum](https://community.openai.com/c/api/7)
- [OpenAI Status Page](https://status.openai.com/)

The integration should now work correctly if you have:
1. ✅ Valid OpenAI API key
2. ✅ Access to Realtime API beta
3. ✅ Proper environment configuration 

## 🏠 Property Data Accuracy Issues

### Problem: AI gives wrong property details (bedrooms, bathrooms, etc.)

**Symptoms:**
- AI says property has different number of bedrooms/bathrooms than actual
- Incorrect square footage or price information
- Generic responses instead of property-specific data

**Root Cause:**
- AI using default/mock data instead of real property information
- Property knowledge API not being called properly
- Session not initialized with actual property context

**Solution:**
✅ **Fixed in latest version:**
1. **Session Initialization**: AI now fetches actual property data when connecting
2. **Property Context**: Session includes real bedrooms, bathrooms, square feet, price
3. **Function Calling**: AI can request detailed property knowledge when needed
4. **Data Validation**: Property highlights emphasized in AI responses

**Verification Steps:**
1. Start voice chat in any property 3D tour
2. Ask: "How many bedrooms does this property have?"
3. AI should respond with exact number from property data
4. Check browser console for: `📤 Sending session configuration with property data`

**Debugging:**
```javascript
// Check if property data is being fetched
console.log('Property data in session:', propertyInfo)

// Verify AI has correct context
// Look for: "🏠 Fetching [type] property knowledge for [propertyId]"
``` 