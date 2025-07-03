'use client'
import { useState, useRef, useCallback } from 'react'
import { 
  Upload, 
  X, 
  Image, 
  Eye, 
  Star, 
  MoreVertical, 
  Trash2, 
  Edit3,
  Check,
  AlertCircle,
  Camera,
  Grid3X3
} from 'lucide-react'

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

interface PropertyImageUploaderProps {
  propertyId: string
  existingImages?: PropertyPhoto[]
  onImagesChange: (images: PropertyPhoto[]) => void
  maxImages?: number
  categories?: string[]
  className?: string
  onUploadSuccess?: () => void
}

interface UploadProgress {
  filename: string
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

export default function PropertyImageUploader({
  propertyId,
  existingImages = [],
  onImagesChange,
  maxImages = 20,
  categories = ['general', 'exterior', 'interior', 'amenities'],
  className = '',
  onUploadSuccess
}: PropertyImageUploaderProps) {
  const [images, setImages] = useState<PropertyPhoto[]>(existingImages)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('general')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateImages = useCallback((newImages: PropertyPhoto[]) => {
    setImages(newImages)
    onImagesChange(newImages)
  }, [onImagesChange])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [])

  const handleFiles = async (fileList: FileList) => {
    const files = Array.from(fileList)
    
    // Validate total images count
    if (images.length + files.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed. You can upload ${maxImages - images.length} more images.`)
      return
    }

    // Validate files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not a valid image file`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert(`${file.name} is too large. Maximum size is 10MB`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    await uploadFiles(validFiles)
  }

  const uploadFiles = async (files: File[]) => {
    setUploading(true)
    
    // Initialize progress tracking
    const progressItems: UploadProgress[] = files.map(file => ({
      filename: file.name,
      progress: 0,
      status: 'uploading'
    }))
    setUploadProgress(progressItems)

    try {
      const formData = new FormData()
      
      files.forEach(file => {
        formData.append('files', file)
      })
      
      formData.append('property_id', propertyId)
      formData.append('category', selectedCategory)
      formData.append('is_primary', images.length === 0 ? 'true' : 'false') // First image is primary

      const response = await fetch('/api/upload/images', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        // Update progress to success
        setUploadProgress(prev => prev.map(item => ({
          ...item,
          progress: 100,
          status: 'success'
        })))

        // Add uploaded images to the list
        const newImages = result.uploaded.map((upload: any, index: number) => ({
          id: upload.id,
          url: upload.url,
          filename: upload.filename,
          file_size: upload.size,
          mime_type: files[index].type,
          category: upload.category,
          is_primary: upload.is_primary,
          order_index: images.length + index + 1,
          alt_text: '',
          caption: '',
          // Virtual staging fields
          is_virtually_staged: upload.is_virtually_staged,
          original_image_id: upload.original_image_id,
          staging_request_id: upload.staging_request_id,
          staging_design: upload.staging_design,
          staging_room_type: upload.staging_room_type,
          staging_transformation_type: upload.staging_transformation_type,
          staging_status: upload.staging_status,
          staging_settings: upload.staging_settings
        }))

        updateImages([...images, ...newImages])

        // Trigger refresh callback if provided
        if (onUploadSuccess) {
          onUploadSuccess()
        }

        // Clear progress after delay
        setTimeout(() => {
          setUploadProgress([])
        }, 2000)

      } else {
        // Handle errors
        setUploadProgress(prev => prev.map(item => ({
          ...item,
          status: 'error',
          error: result.error || 'Upload failed'
        })))
      }

    } catch (error) {
      console.error('Upload error:', error)
      setUploadProgress(prev => prev.map(item => ({
        ...item,
        status: 'error',
        error: 'Network error'
      })))
    } finally {
      setUploading(false)
    }
  }

  const deleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      const response = await fetch('/api/upload/images', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageIds: [imageId]
        }),
      })

      if (response.ok) {
        updateImages(images.filter(img => img.id !== imageId))
      } else {
        alert('Failed to delete image')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete image')
    }
  }

  const setPrimaryImage = async (imageId: string) => {
    try {
      const response = await fetch('/api/upload/images', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates: [{ imageId, is_primary: true }]
        }),
      })

      if (response.ok) {
        updateImages(images.map(img => ({
          ...img,
          is_primary: img.id === imageId
        })))
      } else {
        alert('Failed to set primary image')
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to set primary image')
    }
  }

  const updateImageMetadata = async (imageId: string, updates: Partial<PropertyPhoto>) => {
    try {
      const response = await fetch('/api/upload/images', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates: [{ imageId, ...updates }]
        }),
      })

      if (response.ok) {
        updateImages(images.map(img => 
          img.id === imageId ? { ...img, ...updates } : img
        ))
      } else {
        alert('Failed to update image')
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update image')
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Area */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Property Images</h3>
          <span className="text-sm text-gray-500">
            {images.length} / {maxImages} images
          </span>
        </div>

        {/* Category Selection */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Drag & Drop Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />

          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Camera className="w-6 h-6 text-gray-600" />
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop images here or click to upload
              </p>
              <p className="text-sm text-gray-500">
                Support: JPG, PNG, WebP up to 10MB each
              </p>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || images.length >= maxImages}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Files
            </button>
          </div>
        </div>

        {/* Upload Progress */}
        {uploadProgress.length > 0 && (
          <div className="space-y-2">
            {uploadProgress.map((progress, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {progress.filename}
                  </span>
                  <div className="flex items-center space-x-2">
                    {progress.status === 'success' && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                    {progress.status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm text-gray-500">
                      {progress.progress}%
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      progress.status === 'success' ? 'bg-green-600' :
                      progress.status === 'error' ? 'bg-red-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
                
                {progress.error && (
                  <p className="text-sm text-red-600 mt-1">{progress.error}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Uploaded Images</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.alt_text || `Property image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Image Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setPrimaryImage(image.id)}
                        disabled={image.is_primary}
                        className={`p-1 rounded ${
                          image.is_primary 
                            ? 'bg-yellow-500 text-white' 
                            : 'bg-white text-gray-600 hover:bg-yellow-50'
                        }`}
                        title={image.is_primary ? 'Primary image' : 'Set as primary'}
                      >
                        <Star className="w-3 h-3" />
                      </button>
                      
                      <button
                        onClick={() => deleteImage(image.id)}
                        className="p-1 bg-white text-red-600 rounded hover:bg-red-50"
                        title="Delete image"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Primary Badge */}
                {image.is_primary && (
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Star className="w-3 h-3 mr-1" />
                      Primary
                    </span>
                  </div>
                )}

                {/* Category Badge */}
                <div className="absolute bottom-2 left-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {image.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 