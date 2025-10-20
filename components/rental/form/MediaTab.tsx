'use client'
import { useState, useEffect } from 'react'
import { ImageIcon, Video, Upload, FileText, Camera } from 'lucide-react'
import PropertyImageUploader from '@/components/property/PropertyImageUploader'

interface MediaTabProps {
  formData: any
  updateFormData: (field: string, value: any) => void
  errors: Record<string, string>
}

interface MediaFile {
  id?: string
  url: string
  filename?: string
  type: 'photo' | 'video' | 'document'
  category?: string
  title?: string
  description?: string
}

export default function MediaTab({ formData, updateFormData, errors }: MediaTabProps) {
  const [existingPhotos, setExistingPhotos] = useState([])
  const [videos, setVideos] = useState<MediaFile[]>(formData.videos || [])
  const [documents, setDocuments] = useState<MediaFile[]>(formData.documents || [])

  // Load existing media when property is selected
  useEffect(() => {
    if (formData.property_id) {
      fetchExistingMedia()
    }
  }, [formData.property_id])

  const fetchExistingMedia = async () => {
    if (!formData.property_id) return

    try {
      const response = await fetch(`/api/properties/${formData.property_id}/media`)
      const data = await response.json()
      
      if (data.success) {
        setExistingPhotos(data.photos || [])
        setVideos(data.videos || [])
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Error fetching existing media:', error)
    }
  }

  const handlePhotosChange = (photos: any[]) => {
    // Update form data with photos
    updateFormData('photos', photos)
    
    // Sync photos with property media if property is selected
    if (formData.property_id && photos.length > 0) {
      syncMediaWithProperty({ photos })
    }
  }

  const syncMediaWithProperty = async (mediaUpdates: any) => {
    if (!formData.property_id) return

    try {
      console.log('🔄 Syncing media changes to property:', formData.property_id)
      
      const response = await fetch(`/api/properties/${formData.property_id}/media`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mediaUpdates)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Media sync successful:', result.updated_components)
      } else {
        console.warn('⚠️ Media sync failed:', await response.text())
      }
    } catch (error) {
      console.error('❌ Media sync error:', error)
      // Don't show error to user as this is background sync
    }
  }

  const handleVideoAdd = () => {
    const newVideo: MediaFile = {
      url: '',
      type: 'video',
      title: '',
      description: ''
    }
    const updatedVideos = [...videos, newVideo]
    setVideos(updatedVideos)
    updateFormData('videos', updatedVideos)
  }

  const handleVideoUpdate = (index: number, field: string, value: string) => {
    const updatedVideos = videos.map((video, i) => 
      i === index ? { ...video, [field]: value } : video
    )
    setVideos(updatedVideos)
    updateFormData('videos', updatedVideos)
    
    // Sync videos with property if URL field is updated and has value
    if (field === 'url' && value && formData.property_id) {
      syncMediaWithProperty({ videos: updatedVideos })
    }
  }

  const handleVideoRemove = (index: number) => {
    const updatedVideos = videos.filter((_, i) => i !== index)
    setVideos(updatedVideos)
    updateFormData('videos', updatedVideos)
  }

  const handleDocumentAdd = () => {
    const newDoc: MediaFile = {
      url: '',
      type: 'document',
      filename: '',
      category: 'rental_agreement'
    }
    const updatedDocs = [...documents, newDoc]
    setDocuments(updatedDocs)
    updateFormData('documents', updatedDocs)
  }

  const handleDocumentUpdate = (index: number, field: string, value: string) => {
    const updatedDocs = documents.map((doc, i) => 
      i === index ? { ...doc, [field]: value } : doc
    )
    setDocuments(updatedDocs)
    updateFormData('documents', updatedDocs)
    
    // Sync documents with property if URL field is updated and has value
    if (field === 'url' && value && formData.property_id) {
      syncMediaWithProperty({ documents: updatedDocs })
    }
  }

  const handleDocumentRemove = (index: number) => {
    const updatedDocs = documents.filter((_, i) => i !== index)
    setDocuments(updatedDocs)
    updateFormData('documents', updatedDocs)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Media & Virtual Tours</h2>
        <p className="text-gray-600">
          Add photos, videos and documents to showcase your rental property. High-quality media increases bookings by up to 60%.
        </p>
      </div>

      {/* Property Photos Section */}
      <div className="space-y-4">
        <h3 className="text-base font-medium text-gray-900 flex items-center">
          <Camera className="w-5 h-5 mr-2 text-blue-600" />
          Property Photos
        </h3>
        
        {formData.property_id ? (
          <PropertyImageUploader
            propertyId={formData.property_id}
            existingImages={existingPhotos}
            onImagesChange={handlePhotosChange}
            maxImages={30}
            categories={['general', 'exterior', 'interior', 'amenities', 'neighborhood', 'rental_specific']}
            className="bg-gray-50 rounded-lg p-4"
            onUploadSuccess={fetchExistingMedia}
          />
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              Please select a property first to manage photos.
            </p>
          </div>
        )}
      </div>

      {/* Videos Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-gray-900 flex items-center">
            <Video className="w-5 h-5 mr-2 text-blue-600" />
            Videos & Virtual Tours
          </h3>
          <button
            type="button"
            onClick={handleVideoAdd}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Video
          </button>
        </div>

        {videos.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Video className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No videos added yet</p>
            <p className="text-gray-400 text-xs">Add virtual tours, walkthrough videos, or property highlights</p>
          </div>
        ) : (
          <div className="space-y-3">
            {videos.map((video, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
                    <input
                      type="url"
                      value={video.url}
                      onChange={(e) => handleVideoUpdate(index, 'url', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={video.title}
                      onChange={(e) => handleVideoUpdate(index, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Virtual Tour, Property Walkthrough, etc."
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={video.description}
                    onChange={(e) => handleVideoUpdate(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Describe what guests will see in this video..."
                  />
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleVideoRemove(index)}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Rental Documents
          </h3>
          <button
            type="button"
            onClick={handleDocumentAdd}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Document
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No documents added yet</p>
            <p className="text-gray-400 text-xs">Add rental agreements, house rules, or property guides</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document URL</label>
                    <input
                      type="url"
                      value={doc.url}
                      onChange={(e) => handleDocumentUpdate(index, 'url', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filename</label>
                    <input
                      type="text"
                      value={doc.filename}
                      onChange={(e) => handleDocumentUpdate(index, 'filename', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="rental-agreement.pdf"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={doc.category}
                      onChange={(e) => handleDocumentUpdate(index, 'category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="rental_agreement">Rental Agreement</option>
                      <option value="house_rules">House Rules</option>
                      <option value="property_guide">Property Guide</option>
                      <option value="floor_plan">Floor Plan</option>
                      <option value="insurance">Insurance Documents</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDocumentRemove(index)}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Media Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-3 flex items-center">
          <Camera className="w-5 h-5 mr-2" />
          Media Best Practices
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p className="font-medium text-blue-800">📸 Photography Tips:</p>
            <ul className="text-blue-700 space-y-1 text-xs">
              <li>• Take 20-30 high-resolution photos</li>
              <li>• Use natural lighting during daylight</li>
              <li>• Include all rooms and key amenities</li>
              <li>• Show exterior and neighborhood</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-green-800">🎥 Video Tips:</p>
            <ul className="text-green-700 space-y-1 text-xs">
              <li>• Virtual tours increase bookings by 35%</li>
              <li>• Keep videos under 3-5 minutes</li>
              <li>• Highlight unique features and views</li>
              <li>• Use steady camera movements</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}