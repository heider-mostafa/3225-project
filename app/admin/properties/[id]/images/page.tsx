'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Upload, Eye, Settings, Share2 } from 'lucide-react'
import PropertyImageUploader from '@/components/property/PropertyImageUploader'
import ImageGallery from '@/components/property/ImageGallery'
import SocialMediaCampaignCreator from '@/components/social-media/SocialMediaCampaignCreator'

interface PropertyPhoto {
  id: string
  url: string
  filename?: string
  file_size?: number
  mime_type?: string
  category: string
  is_primary: boolean
  order_index: number
  alt_text?: string
  caption?: string
  // Virtual staging fields
  is_virtually_staged?: boolean
  original_image_id?: string | null
  staging_request_id?: string | null
  staging_design?: string | null
  staging_room_type?: string | null
  staging_transformation_type?: string | null
  staging_status?: 'pending' | 'processing' | 'completed' | 'failed' | null
  staging_settings?: any
}

interface Property {
  id: string
  title: string
  address: string
  property_type: string
  status: string
  price?: number
  bedrooms?: number
  bathrooms?: number
  square_feet?: number
  city?: string
  compound?: string
}

export default function PropertyImagesPage() {
  const router = useRouter()
  const params = useParams()
  const propertyId = params.id as string

  const [property, setProperty] = useState<Property | null>(null)
  const [images, setImages] = useState<PropertyPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'upload' | 'gallery' | 'social'>('upload')

  useEffect(() => {
    const fetchPropertyAndImages = async () => {
      try {
        setLoading(true)

        // Fetch property details and images in one call
        const response = await fetch(`/api/properties/${propertyId}`)
        if (response.ok) {
          const data = await response.json()
          
          // Set property data
          setProperty(data.property)
          
          // Set images data
          if (data.property?.property_photos) {
            const formattedImages = data.property.property_photos.map((photo: any) => ({
              id: photo.id,
              url: photo.url,
              filename: photo.filename,
              file_size: photo.file_size,
              mime_type: photo.mime_type,
              category: photo.category || 'general',
              is_primary: photo.is_primary,
              order_index: photo.order_index,
              alt_text: photo.alt_text,
              caption: photo.caption
            }))
            setImages(formattedImages)
          }
        }
      } catch (error) {
        console.error('Error fetching property data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (propertyId) {
      fetchPropertyAndImages()
    }
  }, [propertyId])

  const handleImagesChange = (newImages: PropertyPhoto[]) => {
    setImages(newImages)
  }

  const refreshImages = async () => {
    try {
      const response = await fetch(`/api/properties/${propertyId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.property?.property_photos) {
          const formattedImages = data.property.property_photos.map((photo: any) => ({
            id: photo.id,
            url: photo.url,
            filename: photo.filename,
            file_size: photo.file_size,
            mime_type: photo.mime_type,
            category: photo.category || 'general',
            is_primary: photo.is_primary,
            order_index: photo.order_index,
            alt_text: photo.alt_text,
            caption: photo.caption
          }))
          setImages(formattedImages)
        }
      }
    } catch (error) {
      console.error('Error refreshing images:', error)
    }
  }

  const handleCampaignCreated = (campaign: any) => {
    console.log('Campaign created:', campaign)
    // You could show a success message or refresh campaigns list here
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property images...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Property not found</h2>
          <p className="text-gray-600 mb-4">The property you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/admin/properties')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Properties
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Property Images</h1>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-gray-600">{property.title}</p>
            <span className="text-gray-400">•</span>
            <p className="text-gray-600">{property.address}</p>
            <span className="text-gray-400">•</span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              property.status === 'active' ? 'bg-green-100 text-green-800' :
              property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {property.status}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => router.push(`/admin/properties/${propertyId}`)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" />
            Property Settings
          </button>
          
          <button
            onClick={() => window.open(`/property/${propertyId}`, '_blank')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Property
          </button>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{images.length}</div>
            <div className="text-sm text-gray-500">Total Images</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {images.filter(img => img.category === 'exterior').length}
            </div>
            <div className="text-sm text-gray-500">Exterior</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {images.filter(img => img.category === 'interior').length}
            </div>
            <div className="text-sm text-gray-500">Interior</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {images.filter(img => img.category === 'amenities').length}
            </div>
            <div className="text-sm text-gray-500">Amenities</div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setView('upload')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                view === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Upload className="w-4 h-4 mr-2 inline" />
              Upload Images
            </button>
            
            <button
              onClick={() => setView('gallery')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                view === 'gallery'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Eye className="w-4 h-4 mr-2 inline" />
              Manage Gallery ({images.length})
            </button>

            <button
              onClick={() => setView('social')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                view === 'social'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Share2 className="w-4 h-4 mr-2 inline" />
              Social Media ({images.length} available)
            </button>
          </nav>
        </div>

        <div className="p-6">
          {view === 'upload' && (
            <PropertyImageUploader
              propertyId={propertyId}
              existingImages={images}
              onImagesChange={handleImagesChange}
              onUploadSuccess={refreshImages}
              maxImages={50}
              categories={['general', 'exterior', 'interior', 'amenities', 'kitchen', 'bathroom', 'bedroom', 'living_room', 'garden', 'pool']}
            />
          )}

          {view === 'gallery' && (
            <ImageGallery
              images={images}
              onImagesChange={handleImagesChange}
              editable={true}
              propertyId={propertyId}
              categories={['general', 'exterior', 'interior', 'amenities', 'kitchen', 'bathroom', 'bedroom', 'living_room', 'garden', 'pool']}
            />
          )}

          {view === 'social' && property && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                  <Share2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Social Media Campaigns
                </h3>
                <p className="text-gray-600 mb-6">
                  Create engaging social media campaigns for your property using your uploaded images. 
                  Generate optimized content for Facebook, Instagram, Twitter, and LinkedIn.
                </p>

                {images.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm">
                      You need to upload images first before creating social media campaigns.
                      Switch to the "Upload Images" tab to get started.
                    </p>
                  </div>
                ) : (
                  <SocialMediaCampaignCreator
                    property={property}
                    images={images}
                    onCampaignCreated={handleCampaignCreated}
                    className="mb-6"
                  />
                )}
              </div>

              {/* Campaign Preview Section */}
              {images.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Quick Preview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Facebook Preview */}
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                          <Share2 className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Your Real Estate Page</div>
                          <div className="text-xs text-gray-500">Facebook</div>
                        </div>
                      </div>
                      
                      {images[0] && (
                        <div className="aspect-video bg-gray-100 rounded mb-3 overflow-hidden">
                          <img 
                            src={images[0].url} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-800">
                        🏡 Discover your dream home in {property.city}! This stunning {property.bedrooms}-bedroom {property.property_type} offers modern living at its finest...
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        #RealEstate #Egypt #Properties #DreamHome
                      </div>
                    </div>

                    {/* Instagram Preview */}
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mr-3">
                          <Share2 className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">your_realestate_page</div>
                          <div className="text-xs text-gray-500">Instagram</div>
                        </div>
                      </div>
                      
                      {images[0] && (
                        <div className="aspect-square bg-gray-100 rounded mb-3 overflow-hidden">
                          <img 
                            src={images[0].url} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-800">
                        🏠 Your new home awaits! ✨
                        <br /><br />
                        📍 {property.city}
                        <br />
                        🛏️ {property.bedrooms} bedrooms
                        <br />
                        💰 {property.price ? `${(property.price / 1000000).toFixed(1)}M EGP` : 'Price on request'}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        #RealEstate #Egypt #PropertyGoals
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {images.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Primary Image</h4>
              <p className="text-sm text-blue-700 mb-3">
                The primary image is displayed as the main photo on property listings.
              </p>
              {images.find(img => img.is_primary) ? (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded overflow-hidden">
                    <img
                      src={images.find(img => img.is_primary)!.url}
                      alt="Primary"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-sm text-blue-800">Primary image set</span>
                </div>
              ) : (
                <p className="text-sm text-blue-600 font-medium">No primary image selected</p>
              )}
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Image Categories</h4>
              <p className="text-sm text-green-700 mb-3">
                Organize images by category for better browsing experience.
              </p>
              <div className="flex flex-wrap gap-1">
                {['exterior', 'interior', 'amenities', 'kitchen'].map(category => (
                  <span
                    key={category}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    {images.filter(img => img.category === category).length} {category}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Storage Usage</h4>
              <p className="text-sm text-purple-700 mb-3">
                Monitor storage space used by property images.
              </p>
              <div className="text-sm text-purple-800">
                <div>Total Size: {Math.round(images.reduce((sum, img) => sum + (img.file_size || 0), 0) / 1024 / 1024 * 100) / 100} MB</div>
                <div>Average: {images.length > 0 ? Math.round(images.reduce((sum, img) => sum + (img.file_size || 0), 0) / images.length / 1024 * 100) / 100 : 0} KB</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 