# Social Media Integration Environment Setup

This document explains all the environment variables needed to set up the social media campaign publishing system for your Egyptian real estate MVP.

## Required Environment Variables

Add these variables to your `.env.local` file:

### Facebook/Meta Integration

```bash
# Facebook Page Access Token (required for posting)
FACEBOOK_ACCESS_TOKEN=your_facebook_page_access_token_here

# Facebook Page ID (the page where posts will be published)
FACEBOOK_PAGE_ID=your_facebook_page_id_here
```

**How to get Facebook credentials:**
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use existing app
3. Add "Pages" permissions to your app
4. Generate a Page Access Token for your business page
5. Get your Page ID from your Facebook page settings

### Instagram Integration

```bash
# Instagram Business Access Token (linked to Facebook Page)
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token_here

# Instagram Business User ID
INSTAGRAM_USER_ID=your_instagram_business_user_id_here
```

**Requirements:**
- Instagram Business Account (not personal)
- Connected to a Facebook Page
- Uses Facebook Graph API

### Twitter/X Integration

```bash
# Twitter Bearer Token for API v2
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here

# Twitter API v1.1 credentials (for posting)
TWITTER_API_KEY=your_twitter_api_key_here
TWITTER_API_SECRET=your_twitter_api_secret_here
TWITTER_ACCESS_TOKEN=your_twitter_access_token_here
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret_here
```

**How to get Twitter credentials:**
1. Apply for Twitter Developer Account at [developer.twitter.com](https://developer.twitter.com/)
2. Create a new app in Twitter Developer Portal
3. Generate API keys and access tokens
4. Enable OAuth 1.0a for posting capabilities

### LinkedIn Integration

```bash
# LinkedIn Access Token with posting permissions
LINKEDIN_ACCESS_TOKEN=your_linkedin_access_token_here

# LinkedIn Person ID (for personal posts) or Organization ID (for company posts)
LINKEDIN_PERSON_ID=your_linkedin_person_or_page_id_here
```

**How to get LinkedIn credentials:**
1. Create app at [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Request permissions for "w_member_social" (posting to personal profiles)
3. For company pages, request "w_organization_social"
4. Generate access token through OAuth flow

### TikTok Integration (Optional)

```bash
# TikTok Business API Access Token
TIKTOK_ACCESS_TOKEN=your_tiktok_access_token_here

# TikTok User ID for business account
TIKTOK_USER_ID=your_tiktok_user_id_here
```

**Note:** TikTok requires video content and has strict API approval process.

## Getting Started

### 1. Start with Test Mode

The system defaults to test mode (`test_mode: false` in the API) which simulates posting without actually publishing to social media platforms. This is perfect for development and testing.

### 2. Set Up Facebook First

Facebook is the easiest to set up and has the most comprehensive API:

1. Create a Facebook Developer account
2. Create a new app
3. Add your business Facebook page
4. Generate page access token
5. Add the credentials to your `.env.local`

### 3. Test the Integration

```bash
# Test API call to publish a post
curl -X POST http://localhost:3000/api/social-media/publish \
  -H "Content-Type: application/json" \
  -d '{
    "post_id": "your-post-id",
    "platform": "facebook",
    "test_mode": true
  }'
```

### 4. Enable Real Posting

Once you've added the credentials and tested in test mode:

1. Set `test_mode: false` in your API calls
2. Verify all credentials are working
3. Start with a single platform (Facebook recommended)
4. Gradually enable other platforms

## Platform-Specific Notes

### Facebook
- Supports text, single images, and photo albums
- Best for detailed property descriptions
- Good engagement for Egyptian real estate market

### Instagram
- Requires at least one image
- Limited to single images initially (carousel support coming)
- Great for visual property showcasing
- Popular with younger Egyptian buyers

### Twitter/X
- 280 character limit (captions are automatically truncated)
- Text-only initially (image support requires additional implementation)
- Good for quick updates and market news

### LinkedIn
- Text-only initially (image support requires complex upload flow)
- Best for professional networking and investor outreach
- Good for luxury properties and commercial real estate

### TikTok
- Video content only
- Requires TikTok Business API approval
- Best for property tours and virtual walkthroughs

## Security Best Practices

1. **Never commit API keys to version control**
2. **Use environment variables only**
3. **Rotate tokens regularly**
4. **Monitor API usage and costs**
5. **Set up proper error handling and logging**

## Troubleshooting

### Common Issues

1. **"Credentials not configured" error**
   - Check that environment variables are set correctly
   - Verify variable names match exactly
   - Restart your development server after adding new variables

2. **"Authentication failed" error**
   - Verify API tokens are still valid
   - Check token permissions/scopes
   - Some tokens expire and need renewal

3. **"Rate limit exceeded" error**
   - Social media platforms have posting limits
   - Implement proper scheduling delays
   - Consider upgrading to business API plans

### Testing Commands

```bash
# Test campaign creation
npm run dev
# Navigate to admin panel -> Properties -> Images -> Social Campaign

# Test direct API posting
curl -X POST http://localhost:3000/api/social-media/publish \
  -H "Content-Type: application/json" \
  -d '{
    "post_id": "test-post-id",
    "platform": "facebook",
    "test_mode": true,
    "immediate_publish": true
  }'
```

## Next Steps

1. Set up Facebook credentials first
2. Test the complete campaign flow in test mode
3. Create your first real estate campaign
4. Monitor analytics and engagement
5. Gradually add other platforms
6. Optimize content based on performance data

For support, check the logs in your application and refer to each platform's developer documentation for the most up-to-date API requirements. 