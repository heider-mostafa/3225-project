'use client'
import { useState, useEffect } from 'react'
import { 
  Share2, 
  Calendar, 
  Target, 
  Wand2, 
  Eye, 
  Check, 
  Clock,
  TrendingUp,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Loader2,
  X,
  Plus,
  Settings,
  BarChart3,
  Send
} from 'lucide-react'
import { generateEnhancedContent } from './enhanced-content-generator'

interface PropertyPhoto {
  id: string
  url: string
  category: string
  is_primary: boolean
  order_index: number
  alt_text?: string
  caption?: string
}

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

interface SocialMediaCampaignCreatorProps {
  property: Property
  images: PropertyPhoto[]
  onCampaignCreated?: (campaign: any) => void
  className?: string
}

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600', description: 'Reach Egyptian families and investors' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-600 to-pink-600', description: 'Visual storytelling for properties' },
  { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'bg-sky-500', description: 'Quick updates and market news' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700', description: 'Professional network and investors' },
]

const CAMPAIGN_TYPES = [
  { id: 'property_listing', name: 'Property Listing', description: 'Showcase a new property' },
  { id: 'property_update', name: 'Property Update', description: 'Updates to existing property' },
  { id: 'price_drop', name: 'Price Drop', description: 'Announce price reduction' },
  { id: 'open_house', name: 'Open House', description: 'Promote viewing events' },
  { id: 'custom', name: 'Custom Campaign', description: 'Custom marketing message' },
]

export default function SocialMediaCampaignCreator({
  property,
  images,
  onCampaignCreated,
  className = ''
}: SocialMediaCampaignCreatorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Campaign data
  const [campaignName, setCampaignName] = useState('')
  const [campaignType, setCampaignType] = useState('property_listing')
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [primaryImageId, setPrimaryImageId] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook', 'instagram'])
  const [scheduledTimes, setScheduledTimes] = useState<Record<string, string[]>>({})
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({})
  const [customCaptions, setCustomCaptions] = useState<Record<string, string>>({})
  const [autoGenerate, setAutoGenerate] = useState(true)
  const [useAIOptimization, setUseAIOptimization] = useState(true)

  useEffect(() => {
    if (!campaignName && property.title) {
      setCampaignName(`${property.title} - Social Campaign`)
    }
  }, [property.title, campaignName])

  useEffect(() => {
    if (selectedImages.length > 0 && !primaryImageId) {
      setPrimaryImageId(selectedImages[0])
    }
  }, [selectedImages, primaryImageId])

  const handleImageToggle = (imageId: string) => {
    setSelectedImages(prev => {
      if (prev.includes(imageId)) {
        const newSelection = prev.filter(id => id !== imageId)
        if (primaryImageId === imageId && newSelection.length > 0) {
          setPrimaryImageId(newSelection[0])
        }
        return newSelection
      } else {
        return [...prev, imageId]
      }
    })
  }

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        return prev.filter(id => id !== platformId)
      } else {
        return [...prev, platformId]
      }
    })
  }

  const generateContent = async () => {
    if (!autoGenerate) return
    
    setLoading(true)
    try {
      // This would call your AI content generation API
      // For now, we'll use a simple template-based approach
      const content: Record<string, string> = {}
      
      for (const platform of selectedPlatforms) {
        content[platform] = generatePlatformContent(platform)
      }
      
      setGeneratedContent(content)
    } catch (error) {
      console.error('Error generating content:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePlatformContent = (platform: string): string => {
    // Use our comprehensive enhanced content generator
    return generateEnhancedContent(property, platform, campaignType)
  }

  const addScheduledTime = (platform: string) => {
    const currentTimes = scheduledTimes[platform] || []
    const newTime = new Date()
    newTime.setHours(newTime.getHours() + 1) // Default to 1 hour from now
    
    setScheduledTimes(prev => ({
      ...prev,
      [platform]: [...currentTimes, newTime.toISOString().slice(0, 16)]
    }))
  }

  const removeScheduledTime = (platform: string, index: number) => {
    setScheduledTimes(prev => ({
      ...prev,
      [platform]: prev[platform]?.filter((_, i) => i !== index) || []
    }))
  }

  const updateScheduledTime = (platform: string, index: number, newTime: string) => {
    setScheduledTimes(prev => ({
      ...prev,
      [platform]: prev[platform]?.map((time, i) => i === index ? newTime : time) || []
    }))
  }

  const createCampaign = async () => {
    setLoading(true)
    try {
      const campaignData = {
        property_id: property.id,
        name: campaignName,
        campaign_type: campaignType,
        selected_image_ids: selectedImages,
        primary_image_id: primaryImageId,
        platforms: selectedPlatforms,
        scheduled_times: scheduledTimes,
        auto_generate_content: autoGenerate,
        use_ai_optimization: useAIOptimization,
        custom_captions: customCaptions
      }

      const response = await fetch('/api/social-media/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      })

      const result = await response.json()

      if (response.ok) {
        onCampaignCreated?.(result.campaign)
        setIsOpen(false)
        resetForm()
      } else {
        throw new Error(result.error || 'Failed to create campaign')
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
      alert('Failed to create campaign. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setCurrentStep(1)
    setCampaignName('')
    setSelectedImages([])
    setPrimaryImageId('')
    setScheduledTimes({})
    setGeneratedContent({})
    setCustomCaptions({})
  }

  const formatPrice = (price: number): string => {
    if (!price) return 'Price on request'
    
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K`
    }
    return price.toLocaleString()
  }

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1: return campaignName.trim() && campaignType
      case 2: return selectedImages.length > 0
      case 3: return selectedPlatforms.length > 0
      case 4: return Object.values(scheduledTimes).some(times => times.length > 0)
      default: return true
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all ${className}`}
      >
        <Share2 className="w-4 h-4 mr-2" />
        Create Social Campaign
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create Social Media Campaign</h2>
              <p className="text-gray-600 mt-1">{property.title}</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center mt-6 space-x-4">
            {[
              { step: 1, title: 'Campaign Details' },
              { step: 2, title: 'Select Images' },
              { step: 3, title: 'Choose Platforms' },
              { step: 4, title: 'Schedule Posts' },
              { step: 5, title: 'Review & Launch' }
            ].map(({ step, title }) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step ? <Check className="w-4 h-4" /> : step}
                </div>
                <span className={`ml-2 text-sm ${
                  currentStep >= step ? 'text-purple-600 font-medium' : 'text-gray-500'
                }`}>
                  {title}
                </span>
                {step < 5 && <div className="w-8 h-px bg-gray-300 ml-4" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {/* Step 1: Campaign Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter campaign name..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CAMPAIGN_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setCampaignType(type.id)}
                      className={`p-3 border rounded-lg text-left transition-all ${
                        campaignType === type.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{type.name}</div>
                      <div className="text-sm text-gray-600">{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={autoGenerate}
                    onChange={(e) => setAutoGenerate(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Auto-generate content</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={useAIOptimization}
                    onChange={(e) => setUseAIOptimization(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">AI optimization</span>
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Select Images */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Select Images for Your Campaign
                </h3>
                <p className="text-gray-600 mb-4">
                  Choose the best images to showcase your property. Selected images will be used across all platforms.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImages.includes(image.id)
                        ? 'border-purple-500 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleImageToggle(image.id)}
                  >
                    <div className="aspect-square">
                      <img
                        src={image.url}
                        alt={image.alt_text || 'Property image'}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Selection overlay */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-all ${
                      selectedImages.includes(image.id) 
                        ? 'bg-purple-600 bg-opacity-30'
                        : 'bg-black bg-opacity-0 hover:bg-opacity-20'
                    }`}>
                      {selectedImages.includes(image.id) && (
                        <div className="bg-purple-600 text-white rounded-full p-1">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Primary image indicator */}
                    {primaryImageId === image.id && (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                        Primary
                      </div>
                    )}

                    {/* Category badge */}
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                      {image.category}
                    </div>
                  </div>
                ))}
              </div>

              {selectedImages.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Primary Image</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Select which image should be the main image for your campaign:
                  </p>
                  <div className="flex space-x-2">
                    {selectedImages.map((imageId) => {
                      const image = images.find(img => img.id === imageId)
                      if (!image) return null
                      
                      return (
                        <button
                          key={imageId}
                          onClick={() => setPrimaryImageId(imageId)}
                          className={`relative w-16 h-16 rounded border-2 overflow-hidden ${
                            primaryImageId === imageId 
                              ? 'border-yellow-500' 
                              : 'border-gray-300'
                          }`}
                        >
                          <img
                            src={image.url}
                            alt="Primary option"
                            className="w-full h-full object-cover"
                          />
                          {primaryImageId === imageId && (
                            <div className="absolute inset-0 bg-yellow-500 bg-opacity-30 flex items-center justify-center">
                              <Check className="w-3 h-3 text-yellow-700" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Continue with other steps... */}
          {/* This is getting quite long, so I'll continue with the remaining steps in the next part */}

          {/* Step 3: Choose Platforms */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Choose Social Media Platforms
                </h3>
                <p className="text-gray-600 mb-4">
                  Select the platforms where you want to publish your property campaign. Each platform will have optimized content.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PLATFORMS.map((platform) => {
                  const Icon = platform.icon
                  const isSelected = selectedPlatforms.includes(platform.id)
                  
                  return (
                    <button
                      key={platform.id}
                      onClick={() => handlePlatformToggle(platform.id)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center mb-3">
                        <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center mr-3`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{platform.name}</div>
                          {isSelected && (
                            <div className="text-sm text-purple-600">✓ Selected</div>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">{platform.description}</div>
                    </button>
                  )
                })}
              </div>

              {selectedPlatforms.length > 0 && autoGenerate && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Content Preview</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Click "Generate Content" to see how your posts will look on each platform:
                  </p>
                  <button
                    onClick={generateContent}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Content
                      </>
                    )}
                  </button>
                </div>
              )}

              {Object.keys(generatedContent).length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Generated Content Preview</h4>
                  {selectedPlatforms.map((platformId) => {
                    const platform = PLATFORMS.find(p => p.id === platformId)
                    const content = generatedContent[platformId]
                    if (!platform || !content) return null

                    const Icon = platform.icon
                    
                    return (
                      <div key={platformId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <div className={`w-8 h-8 rounded-lg ${platform.color} flex items-center justify-center mr-3`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="font-medium text-gray-900">{platform.name}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded text-sm text-gray-800 whitespace-pre-wrap">
                          {content}
                        </div>
                        <div className="mt-2">
                          <button
                            onClick={() => setCustomCaptions(prev => ({ ...prev, [platformId]: content }))}
                            className="text-sm text-purple-600 hover:text-purple-700"
                          >
                            Edit Content
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Schedule Posts */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Schedule Your Posts
                </h3>
                <p className="text-gray-600 mb-4">
                  Set when you want your posts to go live on each platform. You can schedule multiple posts for different times.
                </p>
              </div>

              <div className="space-y-6">
                {selectedPlatforms.map((platformId) => {
                  const platform = PLATFORMS.find(p => p.id === platformId)
                  if (!platform) return null

                  const Icon = platform.icon
                  const platformTimes = scheduledTimes[platformId] || []
                  
                  return (
                    <div key={platformId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-lg ${platform.color} flex items-center justify-center mr-3`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="font-medium text-gray-900">{platform.name}</div>
                        </div>
                        <button
                          onClick={() => addScheduledTime(platformId)}
                          className="inline-flex items-center px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Time
                        </button>
                      </div>

                      {platformTimes.length === 0 ? (
                        <div className="text-sm text-gray-500 text-center py-4">
                          No posts scheduled. Click "Add Time" to schedule your first post.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {platformTimes.map((time, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <input
                                type="datetime-local"
                                value={time}
                                onChange={(e) => updateScheduledTime(platformId, index, e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                min={new Date().toISOString().slice(0, 16)}
                              />
                              <button
                                onClick={() => removeScheduledTime(platformId, index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {Object.values(scheduledTimes).some(times => times.length > 0) && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Scheduling Summary</h4>
                  <div className="text-sm text-green-700">
                    Total posts scheduled: {Object.values(scheduledTimes).reduce((sum, times) => sum + times.length, 0)}
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    Your posts will be automatically published at the scheduled times.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Review & Launch */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Review & Launch Campaign
                </h3>
                <p className="text-gray-600 mb-4">
                  Review all your campaign details before launching. You can always edit campaigns after creation.
                </p>
              </div>

              {/* Campaign Summary */}
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Campaign Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span> <span className="font-medium">{campaignName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Type:</span> <span className="font-medium">{CAMPAIGN_TYPES.find(t => t.id === campaignType)?.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Images:</span> <span className="font-medium">{selectedImages.length} selected</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Platforms:</span> <span className="font-medium">{selectedPlatforms.length} platforms</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Selected Platforms</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlatforms.map((platformId) => {
                      const platform = PLATFORMS.find(p => p.id === platformId)
                      if (!platform) return null
                      const Icon = platform.icon
                      const postCount = scheduledTimes[platformId]?.length || 0
                      
                      return (
                        <div key={platformId} className="flex items-center space-x-2 bg-white px-3 py-2 rounded border">
                          <div className={`w-6 h-6 rounded ${platform.color} flex items-center justify-center`}>
                            <Icon className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm font-medium">{platform.name}</span>
                          <span className="text-xs text-gray-500">({postCount} posts)</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Schedule Summary</h4>
                  <div className="text-sm text-gray-600">
                    Total posts: <span className="font-medium">{Object.values(scheduledTimes).reduce((sum, times) => sum + times.length, 0)}</span>
                  </div>
                  {Object.values(scheduledTimes).some(times => times.length > 0) && (
                    <div className="text-sm text-gray-600">
                      Next post: <span className="font-medium">{
                        new Date(Math.min(...Object.values(scheduledTimes).flat().map(time => new Date(time).getTime()))).toLocaleString()
                      }</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Images Preview */}
              {selectedImages.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Selected Images</h4>
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {selectedImages.map((imageId) => {
                      const image = images.find(img => img.id === imageId)
                      if (!image) return null
                      
                      return (
                        <div key={imageId} className="relative flex-shrink-0">
                          <div className="w-20 h-20 rounded border-2 border-gray-300 overflow-hidden">
                            <img
                              src={image.url}
                              alt="Selected"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {primaryImageId === imageId && (
                            <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-1 rounded-full">
                              ★
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Final checklist */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Ready to Launch?</h4>
                <div className="space-y-1 text-sm text-blue-700">
                  <div className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-blue-600" />
                    Campaign details configured
                  </div>
                  <div className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-blue-600" />
                    {selectedImages.length} images selected
                  </div>
                  <div className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-blue-600" />
                    {selectedPlatforms.length} platforms chosen
                  </div>
                  <div className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-blue-600" />
                    {Object.values(scheduledTimes).reduce((sum, times) => sum + times.length, 0)} posts scheduled
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Previous
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {currentStep < 5 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceedToNextStep()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={createCampaign}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Launch Campaign
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 