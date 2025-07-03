# Voice-Enabled Chatbot Integration Guide

## Overview

Your ChatBot component has been enhanced with **OpenAI Realtime API integration** that provides voice chat capabilities with access to **ALL property listings** in your database. This creates a powerful general property search assistant that can respond to voice queries like "find me 3-bedroom apartments under $500k" and provide intelligent recommendations.

## 🎯 Key Features

### ✅ **What's New:**

1. **Voice Chat Integration**: Click the mic icon to start voice conversation
2. **All Property Access**: AI has knowledge of your entire property database
3. **Intelligent Search**: Natural language processing for property queries
4. **Real-time Responses**: Instant voice responses with property recommendations
5. **Visual Results**: Property cards displayed in chat with voice responses
6. **Multi-language Support**: English and Arabic support
7. **Function Calling**: AI can search properties based on user criteria

### 🆚 **Difference from Tour Viewer Voice Chat:**

| Feature | Tour Viewer Voice Chat | ChatBot Voice Chat |
|---------|----------------------|-------------------|
| **Scope** | Single property details | ALL property listings |
| **Purpose** | Property-specific questions | General property search & recommendations |
| **Knowledge** | One property's features, pricing, etc. | Entire database of listings |
| **Example Queries** | "How many bedrooms does this have?" | "Show me houses under $1M" |
| **Use Case** | Property tours and specific details | Property discovery and search |

## 🚀 How It Works

### 1. **Voice Activation**
- User clicks the microphone icon in the ChatBot
- System connects to OpenAI Realtime API via WebRTC
- Microphone access is requested and granted
- Voice chat becomes active (icon changes to indicate status)

### 2. **Voice Query Processing**
- User speaks a property search query
- OpenAI Whisper transcribes speech to text
- AI analyzes the query and determines if property search is needed
- If search needed, AI calls `search_properties` function

### 3. **Property Search Execution**
- Function call triggers your `/api/chat/recommendations` endpoint
- Database query executes based on parsed criteria
- Results are formatted and returned to AI
- AI provides voice response with property recommendations

### 4. **Visual Display**
- Property cards appear in chat interface
- User can see photos, prices, details, and links
- Voice response explains the findings
- User can continue conversation or click properties

## 🎤 Voice Commands & Examples

### **Budget-Based Searches**
- *"Show me properties under $500,000"*
- *"What can I get for $300k?"*
- *"Find houses under 1 million dollars"*
- *"Budget options below $250k"*

### **Specification Searches**
- *"I need a 3-bedroom apartment"*
- *"Show me 2-bathroom houses"*
- *"Find villas with 4 bedrooms"*
- *"Any studio apartments available?"*

### **Location-Based Searches**
- *"Properties in Sheikh Zayed"*
- *"Show me apartments in New Cairo"*
- *"Houses in Giza under $400k"*
- *"What's available in Maadi?"*

### **Amenity-Based Searches**
- *"Properties with swimming pools"*
- *"Houses with gardens"*
- *"Apartments with parking"*
- *"Find places with gyms"*
- *"Furnished properties only"*

### **Complex Queries**
- *"3-bedroom villa in Sheikh Zayed with pool under $600k"*
- *"Furnished 2-bedroom apartment in New Cairo with parking"*
- *"Family houses with gardens under $500k"*

## 🔧 Technical Implementation

### **Architecture Overview**

```
User Voice Input → WebRTC → OpenAI Realtime API → Function Calls → Property Database → Results → Voice Response + Visual Cards
```

### **Key Components**

1. **Voice Connection** (`connectToVoiceChat`)
   - Creates WebRTC peer connection
   - Gets ephemeral token from backend
   - Configures AI with property search capabilities

2. **Function Handler** (`handlePropertySearch`)
   - Processes AI function calls
   - Calls recommendations API
   - Returns results to AI
   - Updates chat UI

3. **Recommendations API** (`/api/chat/recommendations`)
   - Enhanced to support voice function calls
   - Merges natural language parsing with structured filters
   - Returns formatted property data

### **Session Configuration**

The AI is configured with:
- **Instructions**: Expert real estate assistant role
- **Tools**: `search_properties` function for database queries
- **Voice**: Alloy voice model
- **Audio**: PCM16 format for real-time processing
- **Turn Detection**: Server-side voice activity detection

## 🎛️ Configuration Options

### **Language Support**
```typescript
// Supports multiple languages
const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ar", label: "العربية", flag: "🇪🇬" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];
```

### **Search Parameters**
```typescript
// Function call parameters for property search
{
  query: string,           // User's search query
  maxPrice: number,        // Maximum price filter
  minPrice: number,        // Minimum price filter
  bedrooms: number,        // Number of bedrooms
  bathrooms: number,       // Number of bathrooms
  propertyType: string,    // apartment, villa, house, etc.
  city: string,           // City or area name
  amenities: string[],    // pool, gym, parking, garden, etc.
  maxResults: number      // Maximum results (default 3)
}
```

## 🎨 UI States & Indicators

### **Microphone Button States**
- **Gray Mic** (🎤): Voice chat inactive, click to connect
- **Loading** (⏳): Connecting to voice chat
- **Green Pulsing Mic** (🟢🎤): Listening to user
- **Blue Pulsing Speaker** (🔵🔊): AI is responding
- **Red Mic Off** (🔴🎤): Connected but not actively listening

### **Status Messages**
- *"Text & Voice Assistant"*: Default state
- *"Connecting..."*: Establishing connection
- *"Connected - ready for voice"*: Ready for voice input
- *"Listening..."*: Recording user speech
- *"AI is responding..."*: AI generating response
- *"Error: [message]"*: Connection error occurred

## 📱 Usage Integration

### **In Homepage ChatBot**
```tsx
<ChatBot 
  propertyId="general-chat" 
  agentType="general" 
/>
```

### **In Property Pages**
```tsx
<ChatBot 
  propertyId={property.id} 
  agentType="specific" 
/>
```

The `propertyId="general-chat"` triggers the general property search mode, while specific property IDs enable property-specific assistance.

## 🔍 Search Capabilities

### **Natural Language Processing**
The system parses queries for:

- **Price ranges**: "under $500k", "below 1M", "budget $300k"
- **Room counts**: "3 bedroom", "2 bathroom"
- **Property types**: "apartment", "villa", "house", "studio"
- **Locations**: "Cairo", "Sheikh Zayed", "New Cairo"
- **Amenities**: "pool", "garden", "parking", "gym", "furnished"

### **Database Filters Applied**
```sql
-- Example generated query
SELECT * FROM properties 
WHERE status = 'For Sale'
  AND bedrooms = 3
  AND price <= 500000
  AND city ILIKE '%Sheikh Zayed%'
  AND has_pool = true
ORDER BY price ASC
LIMIT 3;
```

## 🛠️ Setup & Requirements

### **Environment Variables**
```bash
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_API_KEY=sk-your-openai-api-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### **OpenAI Requirements**
- ✅ Valid OpenAI API key
- ✅ Access to Realtime API (currently in beta)
- ✅ Modern browser with WebRTC support
- ✅ Microphone permissions

### **Browser Support**
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 14+
- ✅ Edge 80+

## 🐛 Troubleshooting

### **Common Issues**

1. **"Microphone access required"**
   - Grant microphone permissions in browser
   - Check browser security settings

2. **"Failed to get realtime token"**
   - Verify OpenAI API key is set
   - Check Realtime API access (beta feature)

3. **"Connection failed"**
   - Check internet connection
   - Verify WebRTC is supported
   - Try refreshing the page

4. **No property results**
   - Check database has properties with status 'For Sale'
   - Verify search criteria aren't too restrictive
   - Try broader search terms

### **Debug Logging**
Check browser console for detailed logs:
```
🚀 Connecting to OpenAI Realtime API for property search...
🎫 Ephemeral token received for general chat
🌐 Creating WebRTC peer connection for chatbot...
🎤 Microphone access granted for chatbot
📡 Data channel created for general property chat
✅ Voice chat connected successfully for general property search!
🔍 Executing property search: {query: "3 bedroom under 500k"}
🏠 Property search results: 3 properties found
```

## 🚀 Future Enhancements

### **Planned Features**
- 📍 Location-based search with map integration
- 💬 WhatsApp sharing integration for voice results
- 📅 Voice-triggered viewing scheduling
- 🔔 Voice property alerts and notifications
- 🌍 Multi-language voice responses
- 📊 Voice-driven market analytics

### **Advanced Voice Commands**
- *"Schedule a viewing for the first property"*
- *"Send these results to my WhatsApp"*
- *"Compare these properties"*
- *"Set up alerts for similar properties"*
- *"What's the market trend for this area?"*

## 🎉 Success Metrics

Track these metrics to measure voice chat success:
- Voice session connection rate
- Query-to-result conversion rate
- Property click-through rate from voice results
- User session duration with voice enabled
- Voice query complexity and success rate

---

**Ready to experience voice-powered property search? Click the microphone icon and ask: "Show me 3-bedroom houses under $500k!"** 🎤🏠 