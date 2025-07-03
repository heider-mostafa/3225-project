// Enhanced Social Media Content Generator for Egyptian Real Estate
// Focused on compelling hooks, emotional triggers, and strong CTAs

interface Property {
  id: string
  title: string
  address: string
  price?: number
  property_type: string
  bedrooms?: number
  bathrooms?: number
  square_feet?: number
  compound?: string
  city?: string
  description?: string
  has_pool?: boolean
  has_garden?: boolean
  has_security?: boolean
  has_gym?: boolean
  furnished?: boolean
  has_parking?: boolean
}

interface ContentTemplate {
  hook: string
  body: string
  cta: string
  hashtags: string[]
}

// Enhanced content generation with psychological triggers and Egyptian market insights
export function generateEnhancedContent(property: Property, platform: string, campaignType: string = 'property_listing'): string {
  const templates = getContentTemplates(property, platform, campaignType)
  const selectedTemplate = selectBestTemplate(templates, property, platform)
  
  return buildContent(selectedTemplate, property, platform)
}

// Egyptian Real Estate Hooks - Psychologically optimized
function getHooks(property: Property, platform: string): string[] {
  const price = property.price || 0
  const city = property.city || 'Cairo'
  const bedrooms = property.bedrooms || 2
  
  const hooks = {
    // Urgency-based hooks
    urgency: [
      `🚨 JUST LISTED: Last ${bedrooms}BR in ${property.compound || city}!`,
      `⏰ PRICE DROP: ${formatPrice(price)} EGP - Won't last!`,
      `🔥 HOT PROPERTY: 48 hours only - ${city}`,
      `💎 EXCLUSIVE: Before it hits the market officially`
    ],
    
    // Dream/Aspiration hooks
    aspiration: [
      `🏡 Your family's forever home awaits in ${city}`,
      `✨ Wake up to this view every morning`,
      `🌅 Imagine hosting Eid here with your loved ones`,
      `💭 The home your children will remember forever`
    ],
    
    // Social proof/FOMO hooks
    social: [
      `🏆 Egypt's #1 compound now available`,
      `👨‍👩‍👧‍👦 Join 500+ families who chose ${property.compound || city}`,
      `📈 Property values up 25% - secure yours now`,
      `⭐ Featured in Egypt's top real estate magazine`
    ],
    
    // Investment hooks
    investment: [
      `💰 ROI: 15%+ annual returns guaranteed`,
      `📊 Smart Egyptians are buying here - here's why`,
      `🏦 Banks approve 90% financing for this project`,
      `💎 Buy now, move in 2025, profit forever`
    ],
    
    // Platform-specific hooks
    facebook: [
      `🎯 ATTENTION ${city} FAMILIES: Your search ends here`,
      `💡 Why smart Egyptians are choosing ${property.compound || city}`,
      `🏠 From rental to ownership - your journey starts here`
    ],
    
    instagram: [
      `💫 Plot twist: You CAN afford your dream home`,
      `🔥 Main character energy: Home owner edition`,
      `✨ POV: You found THE perfect home in ${city}`
    ],
    
    linkedin: [
      `📈 Strategic real estate investment opportunity:`,
      `🎯 Professional milestone: Homeownership achieved`,
      `💼 Executive living in ${city}'s premium district`
    ]
  }
  
  // Select appropriate hook category based on property and platform
  let category = 'aspiration'
  if (price && price < 2000000) category = 'urgency'
  if (price && price > 5000000) category = 'investment'
  if (platform === 'linkedin') category = 'investment'
  if (platform === 'instagram') category = 'aspiration'
  
  const platformHooks = hooks[platform as keyof typeof hooks] || []
  const categoryHooks = hooks[category as keyof typeof hooks] || []
  
  return [...platformHooks, ...categoryHooks, ...hooks.aspiration]
}

// Egyptian-focused CTAs with urgency and cultural relevance
function getCTAs(property: Property, platform: string): string[] {
  const ctas = {
    facebook: [
      `📱 WhatsApp us now: Don't let someone else get YOUR home!`,
      `🏃‍♂️ Schedule viewing TODAY - serious buyers only`,
      `💬 Comment "INTERESTED" - we'll send full details privately`,
      `🔥 First 10 viewers get special Egypt Cup discount!`,
      `📞 Call now - evening viewings available for working families`
    ],
    
    instagram: [
      `📩 DM "DETAILS" for floor plans & payment options`,
      `💌 Save this post + DM us = Skip the waiting list`,
      `🏃‍♀️ Story reaction = Instant callback within 1 hour`,
      `✨ Tag your future roommate/spouse in comments`,
      `📱 Link in bio for virtual tour (available 24/7)`
    ],
    
    twitter: [
      `🧵 Reply for thread with full details`,
      `📱 DM for immediate response`,
      `🔄 RT if you know someone looking in ${property.city}`,
      `💬 Quote tweet with "INTERESTED" for priority viewing`
    ],
    
    linkedin: [
      `📊 Connect for detailed investment analysis`,
      `💼 Message me for exclusive professional pricing`,
      `📈 Comment "ANALYSIS" for ROI projections`,
      `🤝 Let's discuss over coffee - serious investors only`
    ]
  }
  
  return ctas[platform as keyof typeof ctas] || ctas.facebook
}

// Build emotional, compelling captions
function buildCaptions(property: Property, platform: string): string {
  const city = property.city || 'Cairo'
  const bedrooms = property.bedrooms || 2
  const price = formatPrice(property.price || 0)
  
  // Generate property URL (adjust domain as needed)
  const propertyUrl = `https://yourdomain.com/properties/${property.id}`
  
  // Platform-specific 3D tour and AI agent messaging
  const get3DTourMessage = (platform: string): string => {
    const messages = {
      facebook: `🌐 Take a 3D virtual tour and chat with our AI agent: ${propertyUrl}
🤖 Ask anything about the property, neighborhood, financing - get instant answers!`,
      
      instagram: `🏠 3D Virtual Tour + AI Assistant ⬇️
${propertyUrl}
Ask our AI: "What's nearby?" "Payment options?" "Best time to visit?"`,
      
      twitter: `🌐 3D Tour + AI Chat: ${propertyUrl}
Ask our AI agent any questions instantly!`,
      
      linkedin: `🔗 Detailed property analysis with 3D virtual tour: ${propertyUrl}
💬 Our AI investment advisor can answer questions about ROI, market trends, and financing options.`
    }
    return messages[platform as keyof typeof messages] || messages.facebook
  }

  const captions = {
    facebook: `Every morning, imagine waking up in your own home in ${city}. No more rent receipts, no more "temporary" living.

This ${bedrooms}-bedroom sanctuary isn't just a property - it's where your children will learn to walk, where family gatherings will create lifelong memories, where YOU become the homeowner you've always dreamed of being.

🏡 Your Details:
• ${bedrooms} spacious bedrooms for growing families
• ${property.bathrooms || 2} modern bathrooms
• ${property.square_feet ? `${property.square_feet} sqft` : 'Perfectly sized'} for comfort
• ${property.compound || 'Prime location'} - surrounded by everything you need
• ${price} EGP - payment plans available

✨ Special Features:
${getEmoFeatures(property)}

This isn't just real estate - it's your family's future. Your legacy starts here.

${get3DTourMessage('facebook')}`,

    instagram: `🏠 Your forever home era starts now ✨

📍 ${city} | ${bedrooms}BR paradise
💰 ${price} EGP | Payment plans available
${property.compound ? `🏢 ${property.compound}` : '📍 Prime location'}

Swipe to see your future: 
✨ Where morning coffee tastes better
🌅 Where every sunset belongs to YOU
👨‍👩‍👧‍👦 Where family memories are made
💎 Where neighbors become lifelong friends

No more landlord calls. No more "one more year of rent."
Just pure ownership bliss. 

${getEmoFeatures(property)}

This isn't just real estate - it's your family's future. Your legacy starts here.

${get3DTourMessage('instagram')}`,

    linkedin: `Strategic Real Estate Investment | ${city}

Market Analysis: ${property.compound || city} has shown consistent 15-20% annual appreciation, making this ${bedrooms}-bedroom property an excellent investment opportunity.

Property Highlights:
• ${bedrooms} bedrooms, ${property.bathrooms || 2} bathrooms
• ${property.square_feet ? `${property.square_feet} sqft` : 'Optimal space utilization'}
• ${property.compound || 'Strategic location'} with infrastructure development planned
• Current valuation: ${price} EGP
• Projected 5-year ROI: 75-85%

Investment Advantages:
${getInvestmentFeatures(property)}

Perfect for:
✓ First-time homeowners seeking stability
✓ Investors targeting Egyptian real estate growth
✓ Professionals requiring premium location access

This isn't just real estate - it's your family's future. Your legacy starts here.

${get3DTourMessage('linkedin')}`,

    twitter: `🏡 BREAKING: Perfect ${bedrooms}BR home in ${city}

✅ ${price} EGP
✅ ${property.compound || 'Prime location'}
✅ Ready to move
✅ Payment plans available

Why this matters:
• Egyptian real estate up 20% YoY
• Rent prices rising faster than ever
• Ownership = stability for your family

Your house key is waiting. 🗝️

This isn't just real estate - it's your family's future. Your legacy starts here.

${get3DTourMessage('twitter')}`
  }
  
  return captions[platform as keyof typeof captions] || captions.facebook
}

// Helper functions
function getEmoFeatures(property: Property): string {
  const features = []
  
  if (property.has_pool) features.push('🏊‍♂️ Private pool for weekend family fun')
  if (property.has_garden) features.push('🌿 Garden where kids can play safely')
  if (property.has_security) features.push('🛡️ 24/7 security for peace of mind')
  if (property.has_gym) features.push('💪 Gym to stay healthy for your family')
  if (property.furnished) features.push('🛋️ Move in tomorrow - fully furnished')
  if (property.has_parking) features.push('🚗 Covered parking - Cairo sun protection')
  
  return features.length > 0 ? features.join('\n• ') : '• Modern amenities designed for Egyptian families\n• Quality construction built to last generations'
}

function getInvestmentFeatures(property: Property): string {
  const features = []
  
  if (property.has_security) features.push('• 24/7 security increases property value')
  if (property.has_gym) features.push('• Fitness facilities - high tenant demand')
  if (property.compound) features.push('• Gated community - premium market segment')
  if (property.has_parking) features.push('• Parking spaces - essential Cairo amenity')
  
  return features.length > 0 ? features.join('\n') : '• Prime location with infrastructure development\n• High-quality construction ensures long-term value'
}

function formatPrice(price: number): string {
  if (!price) return 'Price on request'
  
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}M`
  } else if (price >= 1000) {
    return `${(price / 1000).toFixed(0)}K`
  }
  return price.toLocaleString()
}

function getContentTemplates(property: Property, platform: string, campaignType: string): ContentTemplate[] {
  const hooks = getHooks(property, platform)
  const ctas = getCTAs(property, platform)
  const caption = buildCaptions(property, platform)
  
  return [{
    hook: hooks[Math.floor(Math.random() * Math.min(3, hooks.length))],
    body: caption,
    cta: ctas[Math.floor(Math.random() * Math.min(2, ctas.length))],
    hashtags: getHashtags(property, platform)
  }]
}

function selectBestTemplate(templates: ContentTemplate[], property: Property, platform: string): ContentTemplate {
  return templates[0] // For now, return first template. In production, use A/B testing data
}

function buildContent(template: ContentTemplate, property: Property, platform: string): string {
  const content = `${template.hook}

${template.body}

${template.cta}

${template.hashtags.map(tag => `#${tag}`).join(' ')}`
  
  // Platform-specific length optimization
  if (platform === 'twitter' && content.length > 280) {
    // Truncate for Twitter
    const shortContent = `${template.hook}

${template.body.substring(0, 150)}...

${template.cta}

${template.hashtags.slice(0, 3).map(tag => `#${tag}`).join(' ')}`
    return shortContent
  }
  
  return content
}

function getHashtags(property: Property, platform: string): string[] {
  const baseHashtags = ['RealEstate', 'Egypt', 'Property', 'DreamHome']
  const cityTag = property.city?.replace(/\s+/g, '') || 'Cairo'
  const typeTag = property.property_type?.replace(/\s+/g, '') || 'Apartment'
  
  const platformTags = {
    facebook: [...baseHashtags, cityTag, typeTag, 'Investment', 'NewHome'],
    instagram: [...baseHashtags, cityTag, typeTag, 'PropertyGoals', 'NewHome', 'Lifestyle', 'HomeDesign'],
    twitter: [...baseHashtags, cityTag, typeTag, 'Investment'],
    linkedin: [...baseHashtags, cityTag, 'Investment', 'PropertyInvestment', 'RealEstateInvestment']
  }
  
  return platformTags[platform as keyof typeof platformTags] || baseHashtags
} 