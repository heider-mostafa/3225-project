'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Upload, 
  ImageIcon, 
  Star, 
  Trash2, 
  Eye, 
  Edit,
  Move,
  Grid,
  List,
  Filter,
  Plus,
  Download,
  Share2,
  Camera,
  AlertCircle
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface RentalImage {
  id: string
  rental_listing_id: string
  url: string
  category: string
  is_primary: boolean
  caption?: string
  order_index: number
  created_at: string
}

interface RentalListing {
  id: string
  property_id: string
  properties: {
    title: string
    city: string
  }
}

const IMAGE_CATEGORIES = [
  { value: 'exterior', label: 'Exterior', icon: '🏢', description: 'Building facade, entrance, surroundings' },
  { value: 'living_room', label: 'Living Room', icon: '🛋️', description: 'Main living area, seating' },
  { value: 'bedroom', label: 'Bedrooms', icon: '🛏️', description: 'All bedrooms, master suite' },
  { value: 'kitchen', label: 'Kitchen', icon: '🍳', description: 'Kitchen, dining area' },
  { value: 'bathroom', label: 'Bathrooms', icon: '🛁', description: 'All bathrooms, amenities' },
  { value: 'balcony', label: 'Balcony/Terrace', icon: '🌅', description: 'Outdoor spaces, views' },
  { value: 'amenities', label: 'Amenities', icon: '🏊', description: 'Pool, gym, shared facilities' },
  { value: 'view', label: 'Views', icon: '🌊', description: 'Sea view, Nile view, city view' },
  { value: 'neighborhood', label: 'Neighborhood', icon: '🏘️', description: 'Area, nearby attractions' },
  { value: 'other', label: 'Other', icon: '📸', description: 'Additional photos' }
]

export default function RentalImagesPage() {
  const params = useParams()
  const router = useRouter()
  const [rental, setRental] = useState<RentalListing | null>(null)
  const [images, setImages] = useState<RentalImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rentalId = params.id as string

  useEffect(() => {
    if (rentalId) {
      fetchRentalData()
      fetchImages()
    }
  }, [rentalId])

  const fetchRentalData = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('rental_listings')
        .select(`
          id,
          property_id,
          properties (
            title,
            city
          )
        `)
        .eq('id', rentalId)
        .single()

      if (error) throw error
      setRental(data)
    } catch (err) {
      console.error('Error fetching rental data:', err)
      setError('Failed to load rental information')
    }
  }

  const fetchImages = async () => {
    try {
      const supabase = createClient()
      
      // For now, we'll simulate image data since the table doesn't exist yet
      // In a real implementation, you'd fetch from rental_images table
      setImages([])
      
    } catch (err) {
      console.error('Error fetching images:', err)
    } finally {
      setLoading(false)
    }
  }

  const getImagesByCategory = () => {
    if (selectedCategory === 'all') return images
    return images.filter(img => img.category === selectedCategory)
  }

  const getCategoryStats = () => {
    const stats: Record<string, number> = {}
    IMAGE_CATEGORIES.forEach(cat => {
      stats[cat.value] = images.filter(img => img.category === cat.value).length
    })
    stats.all = images.length
    return stats
  }

  const handleImageSelect = (imageId: string) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    )
  }

  const handleBulkDelete = async () => {
    if (selectedImages.length === 0) return
    
    try {
      // Implement bulk delete logic here
      console.log('Deleting images:', selectedImages)
      setSelectedImages([])
      // Refresh images
      fetchImages()
    } catch (err) {
      console.error('Error deleting images:', err)
    }
  }

  const handleSetPrimary = async (imageId: string) => {
    try {
      // Implement set primary logic here
      console.log('Setting primary image:', imageId)
      // Refresh images
      fetchImages()
    } catch (err) {
      console.error('Error setting primary image:', err)
    }
  }

  const stats = getCategoryStats()
  const filteredImages = getImagesByCategory()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading images...</p>
        </div>
      </div>
    )
  }

  if (error || !rental) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Images</h2>
          <p className="text-gray-600 mb-4">{error || 'Could not load rental information'}</p>
          <Link href={`/admin/rentals/${rentalId}`} className="text-blue-600 hover:text-blue-800">
            ← Back to Rental Details
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href={`/admin/rentals/${rentalId}`}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Rental Images
                </h1>
                <p className="text-sm text-gray-500">
                  {rental.properties?.title} • {rental.properties?.city}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {selectedImages.length > 0 && (
                <div className="flex items-center space-x-2 mr-4">
                  <span className="text-sm text-gray-600">
                    {selectedImages.length} selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete Selected
                  </button>
                </div>
              )}

              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Images
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Categories */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
              
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>All Images</span>
                    <span className="text-sm text-gray-500">{stats.all}</span>
                  </div>
                </button>

                {IMAGE_CATEGORIES.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      selectedCategory === category.value
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span>{category.icon}</span>
                        <span className="text-sm">{category.label}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {stats[category.value] || 0}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <h3 className="font-medium text-blue-900 mb-2">📸 Photo Guidelines</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• Upload 20-30 high-quality photos</p>
                <p>• Use natural lighting when possible</p>
                <p>• Include all rooms and amenities</p>
                <p>• Show exterior and neighborhood</p>
                <p>• Highlight unique features and views</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Stats Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{stats.all}</div>
                    <div className="text-sm text-gray-500">Total Images</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {images.filter(img => img.is_primary).length}
                    </div>
                    <div className="text-sm text-gray-500">Primary</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Object.keys(stats).filter(key => key !== 'all' && stats[key] > 0).length}
                    </div>
                    <div className="text-sm text-gray-500">Categories</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-600 hover:text-gray-800 rounded-md hover:bg-gray-100">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-gray-800 rounded-md hover:bg-gray-100">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Images Grid/List */}
            {filteredImages.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedCategory === 'all' ? 'No Images Uploaded' : `No ${selectedCategory.replace('_', ' ')} Images`}
                </h3>
                <p className="text-gray-600 mb-6">
                  {selectedCategory === 'all' 
                    ? 'Start by uploading some beautiful photos of your rental property'
                    : `Upload images for the ${selectedCategory.replace('_', ' ')} category`
                  }
                </p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload First Images
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">
                    {selectedCategory === 'all' 
                      ? `All Images (${filteredImages.length})`
                      : `${selectedCategory.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} (${filteredImages.length})`
                    }
                  </h3>
                  
                  <div className="flex items-center space-x-2">
                    <button className="text-sm text-gray-600 hover:text-gray-800">
                      Reorder
                    </button>
                  </div>
                </div>

                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredImages.map((image) => (
                      <div
                        key={image.id}
                        className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden"
                      >
                        <img
                          src={image.url}
                          alt={image.caption || 'Rental image'}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                            <button
                              onClick={() => handleImageSelect(image.id)}
                              className="p-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100"
                            >
                              {selectedImages.includes(image.id) ? <Eye className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleSetPrimary(image.id)}
                              className="p-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                            <button className="p-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Primary Badge */}
                        {image.is_primary && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded-md">
                            Primary
                          </div>
                        )}

                        {/* Selection Checkbox */}
                        <div className="absolute top-2 right-2">
                          <input
                            type="checkbox"
                            checked={selectedImages.includes(image.id)}
                            onChange={() => handleImageSelect(image.id)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredImages.map((image) => (
                      <div key={image.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={image.url}
                            alt={image.caption || 'Rental image'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">
                              {image.caption || `${image.category.replace('_', ' ')} image`}
                            </h4>
                            {image.is_primary && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-md">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {image.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} • 
                            Uploaded {new Date(image.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleSetPrimary(image.id)}
                            className="p-2 text-gray-600 hover:text-yellow-600 rounded-md hover:bg-gray-100"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:text-gray-800 rounded-md hover:bg-gray-100">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:text-red-600 rounded-md hover:bg-gray-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowUploadModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900">Upload Rental Images</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Upload high-quality photos to showcase your rental property
                </p>
              </div>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Image Upload Coming Soon</h4>
                <p className="text-gray-600 mb-4">
                  Professional image upload and management system will be available in the next update.
                </p>
                <p className="text-sm text-gray-500">
                  For now, images can be uploaded via the property management system.
                </p>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}