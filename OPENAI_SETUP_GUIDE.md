# OpenAI Integration Setup Guide

## Overview
The AI chatbot system now uses OpenAI's GPT-4o-mini model to provide intelligent, property-specific responses based on the comprehensive property knowledge base. The system provides contextual answers about specific properties, room details, pricing, features, and more.

## 🚀 Setup Instructions

### 1. Get Your OpenAI API Key

1. **Create an OpenAI Account:**
   - Go to [https://platform.openai.com](https://platform.openai.com)
   - Sign up or log in to your account

2. **Create an API Key:**
   - Navigate to API Keys section
   - Click "Create new secret key"
   - Give it a name like "Real Estate MVP Bot"
   - **Important:** Copy the key immediately - you won't be able to see it again!

3. **Add Credits to Your Account:**
   - Go to Settings → Billing
   - Add at least $5-10 for testing
   - The GPT-4o-mini model is very cost-effective (~$0.15/1M input tokens)

### 2. Configure Environment Variables

Update your `.env.local` file with your OpenAI API key:

```bash
# OpenAI Configuration
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Replace `your_openai_api_key_here` with your actual OpenAI API key!**

### 3. Restart Your Development Server

```bash
npm run dev
```

## 🧠 How It Works

### Property-Specific Intelligence
The AI assistant now:

1. **Loads Real Property Data:** Fetches comprehensive property information from your Supabase database
2. **Contextual Awareness:** Knows which room the user is currently viewing in the 3D tour
3. **Tour Analytics:** Uses time spent in rooms and user behavior to provide personalized insights
4. **Intelligent Responses:** Provides accurate, specific answers about:
   - Property pricing and value
   - Room features and layouts
   - Location benefits and nearby services
   - Building amenities
   - Viewing and contact information

### Usage Locations

The OpenAI-powered chat is available in:

1. **Property Detail Pages:** 
   - Click "Ask AI Assistant" button
   - Gets full property context automatically

2. **Homepage Chat:** 
   - Floating chat button (bottom right)
   - General real estate assistance

3. **3D Virtual Tours:** 
   - Context-aware based on current room
   - Time-based insights

## 📊 API Usage and Costs

### Model: GPT-4o-mini
- **Input tokens:** ~$0.15 per 1M tokens
- **Output tokens:** ~$0.60 per 1M tokens
- **Average conversation:** ~$0.001-0.005 per exchange
- **Monthly estimate for 1000 users:** ~$20-50

### Token Optimization
- Responses limited to 300 tokens (cost control)
- Property context efficiently formatted
- Smart fallback to hardcoded responses if API fails

## 🔧 Customization Options

### Modify AI Behavior

Edit `/app/api/chat/openai/route.ts` to customize:

1. **Model Selection:**
```javascript
model: "gpt-4o-mini", // Change to "gpt-4" for more advanced responses
```

2. **Response Length:**
```javascript
max_tokens: 300, // Increase for longer responses
```

3. **Creativity Level:**
```javascript
temperature: 0.7, // 0.0 = very factual, 1.0 = very creative
```

4. **System Prompt:**
   - Modify `buildSystemPrompt()` function
   - Customize personality and response style
   - Add specific real estate expertise

### Language Support

The system supports multiple languages:
- English (default)
- Arabic (العربية)
- French (Français) 
- Spanish (Español)

## 🛠️ Testing the Integration

### 1. Basic Test
1. Navigate to any property detail page
2. Click "Ask AI Assistant"
3. Ask: "What's the price of this property?"
4. Should get accurate, property-specific response

### 2. Context Test
1. Start a 3D tour
2. Navigate to kitchen
3. Ask: "Tell me about this kitchen"
4. Should acknowledge you're in the kitchen specifically

### 3. Fallback Test
1. Set invalid API key temporarily
2. Ask any question
3. Should fall back to hardcoded responses
4. Restore correct API key

## 🐛 Troubleshooting

### Common Issues

1. **"OpenAI API key not configured" Error:**
   - Verify `.env.local` has correct `NEXT_PUBLIC_OPENAI_API_KEY`
   - Restart development server
   - Check API key is valid on OpenAI platform

2. **Generic Responses:**
   - Check property data is loading correctly
   - Verify `propertyId` is passed to chat component
   - Look for console errors in browser dev tools

3. **Chat Not Loading:**
   - Check browser console for JavaScript errors
   - Verify network requests to `/api/chat/openai`
   - Check server logs for API errors

### Debug Mode

Enable detailed logging by adding to your system prompt:
```javascript
// Add this to see what data the AI receives
console.log('Property Knowledge:', propertyKnowledge);
```

## 🚀 Next Steps

### Enhanced Features to Consider

1. **Memory System:**
   - Store conversation history
   - Maintain context across property views
   - Personal preferences tracking

2. **Advanced Property Insights:**
   - Market comparisons
   - Investment analysis
   - Neighborhood trends

3. **Multilingual Responses:**
   - Dynamic language detection
   - Region-specific terminology

4. **Voice Integration:**
   - Text-to-speech for responses
   - Voice input for questions

5. **Integration with Booking:**
   - Schedule viewings through chat
   - Connect with broker availability

## 📈 Analytics and Monitoring

Track chat effectiveness:
- Response times
- User satisfaction
- Popular questions
- Conversion rates
- API usage costs

## ✅ Success Indicators

You'll know it's working when:

✅ Chat responses are property-specific and accurate  
✅ AI acknowledges current room in 3D tours  
✅ Pricing and features match property database  
✅ Response time is under 3 seconds  
✅ Fallback responses work when API is unavailable  
✅ Multiple languages work correctly  

## 💡 Pro Tips

1. **Cost Management:**
   - Monitor usage in OpenAI dashboard
   - Set up billing alerts
   - Consider caching for repeated questions

2. **User Experience:**
   - Add typing indicators
   - Show when AI is "thinking"
   - Provide suggested questions

3. **Quality Assurance:**
   - Test with real property data
   - Review AI responses regularly
   - Collect user feedback

---

**Need Help?** 
- Check OpenAI documentation: [https://platform.openai.com/docs](https://platform.openai.com/docs)
- Review implementation in `/app/api/chat/openai/route.ts`
- Test API directly: [https://platform.openai.com/playground](https://platform.openai.com/playground) 