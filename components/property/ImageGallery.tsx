'use client'
import { useState, useRef } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Star, 
  Trash2,
  Edit3,
  Grid3X3,
  Eye,
  MoreVertical,
  Move,
  Check,
  AlertCircle,
  Wand2,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import VirtualStagingModal from './VirtualStagingModal'

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
  // Source tracking fields
  source?: string
  appraisal_id?: string
  original_category?: string
  document_page?: number
  extraction_metadata?: any
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

interface ImageGalleryProps {
  images: PropertyPhoto[]
  onImagesChange: (images: PropertyPhoto[]) => void
  editable?: boolean
  categories?: string[]
  className?: string
  propertyId?: string
}

export default function ImageGallery({
  images,
  onImagesChange,
  editable = false,
  categories = ['general', 'exterior', 'interior', 'amenities'],
  className = '',
  propertyId
}: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'slideshow'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null)
  const [editingImage, setEditingImage] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  
  // Virtual staging state
  const [stagingModalOpen, setStagingModalOpen] = useState(false)
  const [showOriginalToggle, setShowOriginalToggle] = useState<{[key: string]: boolean}>({})
  
  // Add image editing state
  const [editingImageId, setEditingImageId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<{
    alt_text: string
    caption: string
    category: string
  }>({
    alt_text: '',
    caption: '',
    category: 'general'
  })

  // Add lightbox staging state
  const [lightboxStagingMode, setLightboxStagingMode] = useState(false)
  const [lightboxStagingOptions, setLightboxStagingOptions] = useState({
    design: 'modern',
    roomType: 'auto-detect',
    transformationType: 'furnish',
    blockElements: false,
    highDetails: true,
    variations: 1
  })
  const [lightboxStagingProcessing, setLightboxStagingProcessing] = useState(false)

  // Add batch staging progress state
  const [batchStagingProgress, setBatchStagingProgress] = useState<{
    total: number
    completed: number
    processing: boolean
  } | null>(null)

  // Add per-image room type state
  const [imageRoomTypes, setImageRoomTypes] = useState<{[imageId: string]: string}>({})

  // Virtual staging options
  const designStyles = [
    { value: 'modern', label: 'Modern', icon: '🏢' },
    { value: 'scandinavian', label: 'Scandinavian', icon: '🌿' },
    { value: 'industrial', label: 'Industrial', icon: '🏭' },
    { value: 'minimalist', label: 'Minimalist', icon: '⚪' },
    { value: 'traditional', label: 'Traditional', icon: '🏛️' },
    { value: 'contemporary', label: 'Contemporary', icon: '🎨' },
    { value: 'rustic', label: 'Rustic', icon: '🪵' },
    { value: 'luxury', label: 'Luxury', icon: '👑' }
  ]

  const roomTypes = [
    { value: 'auto-detect', label: 'Auto-detect' },
    { value: 'living-room', label: 'Living Room' },
    { value: 'bedroom', label: 'Bedroom' },
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'dining-room', label: 'Dining Room' },
    { value: 'bathroom', label: 'Bathroom' },
    { value: 'office', label: 'Office' },
    { value: 'outdoor', label: 'Outdoor' }
  ]

  const transformationTypes = [
    { value: 'furnish', label: 'Furnish', description: 'Add furniture to empty rooms' },
    { value: 'renovate', label: 'Renovate', description: 'Update existing decor' },
    { value: 'redesign', label: 'Redesign', description: 'Complete style makeover' },
    { value: 'outdoor', label: 'Outdoor', description: 'Landscape outdoor spaces' }
  ]

  // Auto-detect room type from image category or filename
  const detectRoomType = (image: PropertyPhoto): string => {
    // Check if we already have a manually set room type
    if (imageRoomTypes[image.id]) {
      return imageRoomTypes[image.id]
    }

    // Auto-detect based on category
    const category = image.category.toLowerCase()
    if (category.includes('exterior') || category.includes('outdoor')) return 'outdoor'
    if (category.includes('kitchen')) return 'kitchen'
    if (category.includes('bedroom')) return 'bedroom'
    if (category.includes('bathroom')) return 'bathroom'
    if (category.includes('living') || category.includes('interior')) return 'living-room'
    if (category.includes('dining')) return 'dining-room'
    if (category.includes('office')) return 'office'
    
    // Auto-detect based on filename if available
    if (image.filename) {
      const filename = image.filename.toLowerCase()
      if (filename.includes('kitchen')) return 'kitchen'
      if (filename.includes('bedroom') || filename.includes('bed')) return 'bedroom'
      if (filename.includes('bathroom') || filename.includes('bath')) return 'bathroom'
      if (filename.includes('living') || filename.includes('lounge')) return 'living-room'
      if (filename.includes('dining')) return 'dining-room'
      if (filename.includes('office') || filename.includes('study')) return 'office'
      if (filename.includes('outdoor') || filename.includes('garden') || filename.includes('patio')) return 'outdoor'
    }

    // Default fallback
    return 'auto-detect'
  }

  // Update room type for specific image
  const updateImageRoomType = (imageId: string, roomType: string) => {
    setImageRoomTypes(prev => ({
      ...prev,
      [imageId]: roomType
    }))
  }

  // Get room type display for an image
  const getRoomTypeForImage = (image: PropertyPhoto): string => {
    return detectRoomType(image)
  }

  // Filter images by category
  const filteredImages = selectedCategory === 'all' 
    ? images 
    : images.filter(img => img.category === selectedCategory)

  const sortedImages = [...filteredImages].sort((a, b) => a.order_index - b.order_index)

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index)
    setLightboxOpen(true)
    setZoom(100)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    setZoom(100)
    setLightboxStagingMode(false)
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev < sortedImages.length - 1 ? prev + 1 : 0
    )
    setZoom(100)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev > 0 ? prev - 1 : sortedImages.length - 1
    )
    setZoom(100)
  }

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    )
  }

  const selectAllImages = () => {
    setSelectedImages(sortedImages.map(img => img.id))
  }

  const clearSelection = () => {
    setSelectedImages([])
  }

  const deleteSelectedImages = async () => {
    if (selectedImages.length === 0) return
    
    const confirmMessage = `Are you sure you want to delete ${selectedImages.length} image(s)?`
    if (!confirm(confirmMessage)) return

    try {
      // Separate appraisal extracted images from regular property photos
      const appraisalImageIds = selectedImages.filter(id => {
        const image = images.find(img => img.id === id)
        return image?.source === 'appraisal_extracted'
      })
      const regularImageIds = selectedImages.filter(id => {
        const image = images.find(img => img.id === id)
        return !image || image.source !== 'appraisal_extracted'
      })

      console.log('🗑️ Starting deletion process:', {
        total: selectedImages.length,
        appraisal: appraisalImageIds.length,
        regular: regularImageIds.length
      })

      let deletionSuccess = true

      // Delete regular property photos through the API
      if (regularImageIds.length > 0) {
        console.log('🔄 Deleting regular images:', regularImageIds)
        const response = await fetch('/api/upload/images', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageIds: regularImageIds
          }),
        })

        if (!response.ok) {
          deletionSuccess = false
          const errorText = await response.text()
          console.error('❌ Failed to delete regular images:', errorText)
        } else {
          console.log('✅ Successfully deleted regular images')
        }
      }

      // Delete appraisal extracted images by deleting the property_photos records AND updating form_data
      if (appraisalImageIds.length > 0 && propertyId) {
        console.log('🔄 Deleting appraisal extracted images:', appraisalImageIds)
        
        // First, delete the actual property_photos records for appraisal extracted images
        const appraisalPhotoIds = appraisalImageIds // These are already the actual database IDs
        
        if (appraisalPhotoIds.length > 0) {
          console.log('🔄 Deleting property_photos records for appraisal images:', appraisalPhotoIds)
          const deletePhotosResponse = await fetch('/api/upload/images', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageIds: appraisalPhotoIds
            }),
          })

          if (!deletePhotosResponse.ok) {
            deletionSuccess = false
            const errorText = await deletePhotosResponse.text()
            console.error('❌ Failed to delete appraisal property_photos records:', errorText)
          } else {
            console.log('✅ Successfully deleted appraisal property_photos records')
          }
        }
        
        // Also update the appraisal form_data to keep it in sync (optional, but good for consistency)
        const propertyResponse = await fetch(`/api/properties/${propertyId}`)
        if (propertyResponse.ok) {
          const propertyData = await propertyResponse.json()
          const property = propertyData.property
          
          if (property.property_appraisals && property.property_appraisals.length > 0) {
            const appraisal = property.property_appraisals[0]
            console.log('📋 Found appraisal with ID:', appraisal.id)
            
            if (appraisal.form_data?.extracted_images) {
              console.log('🖼️ Current extracted images count:', appraisal.form_data.extracted_images.length)
              
              // Get filenames of deleted images to match with form_data
              const deletedImageFilenames = images
                .filter(img => appraisalImageIds.includes(img.id))
                .map(img => img.filename)
                .filter(filename => filename) // Only include images with filenames
              
              console.log('🗑️ Deleted image filenames:', deletedImageFilenames)
              
              // Remove the selected extracted images from form_data for consistency
              const updatedExtractedImages = appraisal.form_data.extracted_images.filter(
                (img: any, index: number) => {
                  const shouldKeep = !deletedImageFilenames.includes(img.filename)
                  if (!shouldKeep) {
                    console.log(`🗑️ Removing image from form_data: ${img.filename}`)
                  }
                  return shouldKeep
                }
              )
              
              console.log('📊 Updated extracted images count:', updatedExtractedImages.length)
              
              // Update the appraisal with the new extracted_images array
              const appraisalUpdatePayload = {
                id: appraisal.id,
                form_data: {
                  ...appraisal.form_data,
                  extracted_images: updatedExtractedImages
                }
              }
              
              console.log('💾 Updating appraisal form_data for consistency')
              
              const appraisalUpdateResponse = await fetch('/api/appraisals', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(appraisalUpdatePayload),
              })

              if (!appraisalUpdateResponse.ok) {
                const errorText = await appraisalUpdateResponse.text()
                console.warn('⚠️ Failed to update appraisal form_data (non-critical):', errorText)
                // Don't set deletionSuccess to false since the main deletion (property_photos) succeeded
              } else {
                console.log('✅ Successfully updated appraisal form_data for consistency')
              }
            } else {
              console.log('⚠️ No extracted images found in appraisal form_data')
            }
          } else {
            console.log('⚠️ No appraisals found for property')
          }
        } else {
          console.warn('⚠️ Failed to fetch property data for appraisal form_data update (non-critical)')
        }
      }

      if (deletionSuccess) {
        console.log('✅ All deletions successful, updating local state')
        
        // Update the local images state
        const updatedImages = images.filter(img => !selectedImages.includes(img.id))
        onImagesChange(updatedImages)
        setSelectedImages([])
        
        // Force property detail page cache invalidation by updating property timestamp
        if (propertyId) {
          try {
            console.log('🔄 Invalidating property cache and forcing browser refresh')
            await fetch(`/api/properties/${propertyId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                updated_at: new Date().toISOString()
              }),
            })
            
            // Also force any existing property detail page tabs to refresh by setting a flag in localStorage
            // This will be picked up by the property detail page's useEffect
            const cacheKey = `property_cache_invalidated_${propertyId}`
            localStorage.setItem(cacheKey, Date.now().toString())
            
            console.log('✅ Property cache invalidated and browser refresh triggered')
          } catch (cacheError) {
            console.warn('⚠️ Could not invalidate property cache:', cacheError)
          }
        }
        
        console.log('🎉 Deletion process completed successfully')
      } else {
        console.error('❌ Some deletions failed')
        alert('Some images could not be deleted')
      }
    } catch (error) {
      console.error('💥 Delete error:', error)
      alert('Failed to delete images')
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
        const updatedImages = images.map(img => ({
          ...img,
          is_primary: img.id === imageId
        }))
        onImagesChange(updatedImages)
      } else {
        alert('Failed to set primary image')
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to set primary image')
    }
  }

  const updateImageOrder = (draggedId: string, targetId: string) => {
    const draggedImage = images.find(img => img.id === draggedId)
    const targetImage = images.find(img => img.id === targetId)
    
    if (!draggedImage || !targetImage) return

    const updatedImages = images.map(img => {
      if (img.id === draggedId) {
        return { ...img, order_index: targetImage.order_index }
      }
      if (img.id === targetId) {
        return { ...img, order_index: draggedImage.order_index }
      }
      return img
    })

    onImagesChange(updatedImages)
  }

  const handleDragStart = (e: React.DragEvent, imageId: string) => {
    setDraggedImageId(imageId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (draggedImageId && draggedImageId !== targetId) {
      updateImageOrder(draggedImageId, targetId)
    }
    setDraggedImageId(null)
  }

  const downloadImage = (imageUrl: string, filename?: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = filename || 'property-image.jpg'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Get staging status badge
  const getStagingStatusBadge = (image: PropertyPhoto) => {
    if (!image.is_virtually_staged && !image.staging_status) return null
    
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Processing' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Staged' },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Failed' }
    }
    
    const status = image.staging_status || 'completed'
    const config = statusConfig[status as keyof typeof statusConfig]
    const Icon = config.icon
    
    return (
      <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${config.color}`}>
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </div>
    )
  }

  // Handle virtual staging
  const handleVirtualStaging = async (stagingOptions: any) => {
    if (!propertyId) {
      throw new Error('Property ID is required for virtual staging')
    }

    const selectedImageObjects = images.filter(img => selectedImages.includes(img.id))
    
    // Initialize progress tracking
    setBatchStagingProgress({
      total: selectedImageObjects.length,
      completed: 0,
      processing: true
    })
    
    try {
      // Prepare per-image staging data with room types
      const imageRequests = selectedImages.map(imageId => {
        const image = images.find(img => img.id === imageId)
        return {
          imageId,
          roomType: getRoomTypeForImage(image!),
          options: {
            design: stagingOptions.design,
            transformationType: stagingOptions.transformation_type,
            blockElements: stagingOptions.block_element,
            highDetails: stagingOptions.high_details_resolution,
            variations: stagingOptions.num_images
          }
        }
      })

      const response = await fetch('/api/staging/virtual-stage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          imageRequests,
          globalOptions: {
            design: stagingOptions.design,
            transformationType: stagingOptions.transformation_type
          }
        }),
      })

      if (!response.ok) {
        setBatchStagingProgress(null)
        const error = await response.json()
        throw new Error(error.message || 'Failed to start virtual staging')
      }

      const result = await response.json()
      
      // Update images with staging status
      const updatedImages = images.map(img => 
        selectedImages.includes(img.id) 
          ? { ...img, staging_status: 'processing' as const }
          : img
      )
      
      onImagesChange(updatedImages)
      setSelectedImages([])
      
      // Simulate progress updates for demo (replace with real progress tracking)
      let completed = 0
      const progressInterval = setInterval(() => {
        completed++
        setBatchStagingProgress(prev => 
          prev ? { ...prev, completed } : null
        )
        
        if (completed >= selectedImageObjects.length) {
          clearInterval(progressInterval)
          setTimeout(() => {
            setBatchStagingProgress(null)
            alert(`Virtual staging completed for ${selectedImageObjects.length} images! New staged versions have been added to your gallery.`)
          }, 1000)
        }
      }, 3000) // Complete one every 3 seconds for demo
      
    } catch (error: any) {
      setBatchStagingProgress(null)
      console.error('Virtual staging error:', error)
      throw error
    }
  }

  // Toggle showing original vs staged image
  const toggleOriginalImage = (imageId: string) => {
    setShowOriginalToggle(prev => ({
      ...prev,
      [imageId]: !prev[imageId]
    }))
  }

  // Get the image URL to display (original or staged)
  const getDisplayImageUrl = (image: PropertyPhoto): string => {
    if (!image.is_virtually_staged || showOriginalToggle[image.id]) {
      return image.url
    }
    return image.url // In real implementation, this would be the staged image URL
  }

  // Filter images to include original images and their staged versions
  const getAllImages = () => {
    return images.filter(img => {
      // Show all non-staged images
      if (!img.is_virtually_staged) return true
      
      // For staged images, show them as separate entries
      return true
    })
  }

  // Modified selectedImages to work with image objects for staging
  const getSelectedImageObjects = (): PropertyPhoto[] => {
    return images.filter(img => selectedImages.includes(img.id))
  }

  // Can stage selected images (only original, non-staged images)
  const canStageSelectedImages = (): boolean => {
    const selectedImageObjects = getSelectedImageObjects()
    return selectedImageObjects.length > 0 && 
           selectedImageObjects.every(img => !img.is_virtually_staged) &&
           editable &&
           !!propertyId
  }

  // New function to open edit modal
  const openEditModal = (image: PropertyPhoto) => {
    setEditingImageId(image.id)
    setEditFormData({
      alt_text: image.alt_text || '',
      caption: image.caption || '',
      category: image.category
    })
  }

  // New function to save image metadata
  const saveImageMetadata = async () => {
    if (!editingImageId) return

    try {
      const response = await fetch('/api/upload/images', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates: [{
            imageId: editingImageId,
            ...editFormData
          }]
        }),
      })

      if (response.ok) {
        const updatedImages = images.map(img => 
          img.id === editingImageId 
            ? { ...img, ...editFormData }
            : img
        )
        onImagesChange(updatedImages)
        setEditingImageId(null)
        alert('Image updated successfully!')
      } else {
        alert('Failed to update image')
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update image')
    }
  }

  // Handle lightbox virtual staging
  const handleLightboxStaging = async () => {
    if (!propertyId || lightboxStagingProcessing) return

    const currentImage = sortedImages[currentImageIndex]
    if (!currentImage || currentImage.is_virtually_staged) return

    setLightboxStagingProcessing(true)

    try {
      const response = await fetch('/api/staging/virtual-stage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          imageIds: [currentImage.id],
          options: {
            design: lightboxStagingOptions.design,
            roomType: lightboxStagingOptions.roomType,
            transformationType: lightboxStagingOptions.transformationType,
            blockElements: lightboxStagingOptions.blockElements,
            highDetails: lightboxStagingOptions.highDetails,
            variations: lightboxStagingOptions.variations
          }
        }),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update the images with staging status
        const updatedImages = images.map(img => {
          if (img.id === currentImage.id) {
            return {
              ...img,
              staging_status: 'processing' as const,
              staging_request_id: result.requestId,
              staging_design: lightboxStagingOptions.design,
              staging_room_type: lightboxStagingOptions.roomType,
              staging_transformation_type: lightboxStagingOptions.transformationType,
              staging_settings: lightboxStagingOptions
            }
          }
          return img
        })

        onImagesChange(updatedImages)
        setLightboxStagingMode(false)
        alert('Virtual staging started! This will create a new staged version of your image.')

        // Mock completion after 30 seconds for demo
        setTimeout(async () => {
          try {
            // Simulate staged image creation
            const stagedImage: PropertyPhoto = {
              id: `staged_${currentImage.id}_${Date.now()}`,
              url: `${currentImage.url}?staged=true`, // Mock staged URL
              filename: `staged_${currentImage.filename}`,
              category: currentImage.category,
              is_primary: false,
              order_index: images.length + 1,
              alt_text: `${currentImage.alt_text || ''} (Virtually Staged)`,
              caption: `${currentImage.caption || ''} - ${lightboxStagingOptions.design} style`,
              is_virtually_staged: true,
              original_image_id: currentImage.id,
              staging_status: 'completed',
              staging_design: lightboxStagingOptions.design,
              staging_room_type: lightboxStagingOptions.roomType,
              staging_transformation_type: lightboxStagingOptions.transformationType,
              staging_settings: lightboxStagingOptions
            }

            const finalUpdatedImages = images.map(img => {
              if (img.id === currentImage.id) {
                return { ...img, staging_status: 'completed' as const }
              }
              return img
            })

            onImagesChange([...finalUpdatedImages, stagedImage])
          } catch (error) {
            console.error('Error completing staging:', error)
          }
        }, 30000)

      } else {
        const error = await response.text()
        alert(`Failed to start staging: ${error}`)
      }
    } catch (error) {
      console.error('Staging error:', error)
      alert('Failed to start virtual staging')
    } finally {
      setLightboxStagingProcessing(false)
    }
  }

  if (images.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
          <Grid3X3 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No images uploaded</h3>
        <p className="text-gray-500">Upload some images to see them here</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Gallery Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">Image Gallery</h3>
          
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>

          <span className="text-sm text-gray-500">
            {sortedImages.length} image{sortedImages.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Selection Controls */}
        {editable && (
          <div className="flex items-center space-x-3">
            {/* Bulk Selection Buttons */}
            {selectedImages.length === 0 ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={selectAllImages}
                  className="flex items-center space-x-2 px-3 py-1 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors text-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Select All</span>
                </button>
                <span className="text-xs text-gray-400">or click images to select</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-md">
                  <Check className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {selectedImages.length} selected
                  </span>
                </div>
                
                {/* Virtual Staging Button - More Prominent */}
                {canStageSelectedImages() && (
                  <button
                    onClick={() => setStagingModalOpen(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors shadow-sm"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>Virtual Stage ({selectedImages.length})</span>
                  </button>
                )}
                
                <button
                  onClick={deleteSelectedImages}
                  className="flex items-center space-x-2 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
                
                <button
                  onClick={clearSelection}
                  className="flex items-center space-x-2 px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
                >
                  <X className="w-4 h-4" />
                  <span>Clear</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selection Helper */}
      {editable && selectedImages.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wand2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-900">Batch Virtual Staging Available</h4>
              <p className="text-sm text-blue-700">
                Select multiple images to apply virtual staging in bulk. Perfect for staging entire properties at once!
              </p>
            </div>
            <button
              onClick={selectAllImages}
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Select All Images
            </button>
          </div>
        </div>
      )}

      {/* Batch Staging Progress */}
      {batchStagingProgress && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-purple-900">
                Processing Virtual Staging...
              </h4>
              <p className="text-sm text-purple-700">
                {batchStagingProgress.completed} of {batchStagingProgress.total} images completed
              </p>
              <div className="mt-2 w-full bg-purple-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(batchStagingProgress.completed / batchStagingProgress.total) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {sortedImages.map((image, index) => (
          <div
            key={image.id}
            className={`relative group cursor-pointer ${
              selectedImages.includes(image.id) ? 'ring-2 ring-blue-500' : ''
            }`}
            draggable={editable}
            onDragStart={(e) => handleDragStart(e, image.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, image.id)}
          >
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={getDisplayImageUrl(image)}
                alt={image.alt_text || `Property image ${index + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onClick={() => openLightbox(index)}
              />
            </div>

            {/* Enhanced Image Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg">
              
              {/* Status Badges */}
              {getStagingStatusBadge(image)}
              
              {/* Primary Badge */}
              {image.is_primary && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                  Primary
                </div>
              )}
              
              {/* Selection Checkbox - Always visible when editable */}
              {editable && (
                <div className={`absolute top-2 left-2 transition-opacity ${
                  selectedImages.includes(image.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleImageSelection(image.id)
                    }}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedImages.includes(image.id)
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110'
                        : 'bg-white border-gray-300 hover:border-blue-400'
                    }`}
                    title={selectedImages.includes(image.id) ? 'Deselect image' : 'Select image for batch operations'}
                  >
                    {selectedImages.includes(image.id) && <Check className="w-3 h-3" />}
                  </button>
                </div>
              )}

              {/* Source Badge */}
              {image.source === 'appraisal_extracted' && (
                <div className="absolute top-2 left-2">
                  <div className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full flex items-center">
                    <span>📄</span>
                    <span className="ml-1">Appraisal</span>
                    {image.document_page && (
                      <span className="ml-1 opacity-75">p.{image.document_page}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Staging Badge for Original Images */}
              {editable && !image.is_virtually_staged && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                    <Wand2 className="w-3 h-3 inline mr-1" />
                    Stageable
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openLightbox(index)
                    }}
                    className="p-1 bg-white text-gray-600 rounded hover:bg-gray-50"
                    title="View full size"
                  >
                    <Eye className="w-3 h-3" />
                  </button>

                  {/* Add Edit Button */}
                  {editable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditModal(image)
                      }}
                      className="p-1 bg-white text-blue-600 rounded hover:bg-blue-50"
                      title="Edit image details"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  )}

                  {/* Toggle Original/Staged Button */}
                  {image.is_virtually_staged && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleOriginalImage(image.id)
                      }}
                      className="p-1 bg-white text-purple-600 rounded hover:bg-purple-50"
                      title={showOriginalToggle[image.id] ? 'Show staged version' : 'Show original'}
                    >
                      <Wand2 className="w-3 h-3" />
                    </button>
                  )}

                  {editable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setPrimaryImage(image.id)
                      }}
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
                  )}
                </div>
              </div>

              {/* Center Play Button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openLightbox(index)}
                  className="p-3 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                >
                  <ZoomIn className="w-6 h-6 text-gray-700" />
                </button>
              </div>
            </div>

            {/* Image Info with Room Type */}
            <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="space-y-1">
                <div className="px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded">
                  {image.category}
                  {image.is_virtually_staged && (
                    <span className="ml-1 text-purple-300">• Staged</span>
                  )}
                </div>
                
                {/* Room Type Selector for staging */}
                {editable && !image.is_virtually_staged && (
                  <select
                    value={getRoomTypeForImage(image)}
                    onChange={(e) => {
                      e.stopPropagation()
                      updateImageRoomType(image.id, e.target.value)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="px-2 py-1 bg-purple-600 text-white text-xs rounded border-none focus:ring-2 focus:ring-purple-400"
                    title="Select room type for staging"
                  >
                    {roomTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Virtual Staging Modal */}
      {stagingModalOpen && propertyId && (
        <VirtualStagingModal
          isOpen={stagingModalOpen}
          onClose={() => setStagingModalOpen(false)}
          selectedImages={getSelectedImageObjects()}
          onStageImages={handleVirtualStaging}
          propertyId={propertyId}
        />
      )}

      {/* Image Edit Modal */}
      {editingImageId && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setEditingImageId(null)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Edit3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Edit Image Details</h3>
                    <p className="text-sm text-gray-500">Update image information and category</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingImageId(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Image Preview */}
              <div className="mb-6">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={images.find(img => img.id === editingImageId)?.url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Edit Form */}
              <div className="space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Alt Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alt Text (for SEO & accessibility)
                  </label>
                  <input
                    type="text"
                    value={editFormData.alt_text}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, alt_text: e.target.value }))}
                    placeholder="Describe what's in this image..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Caption */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Caption (optional)
                  </label>
                  <textarea
                    value={editFormData.caption}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, caption: e.target.value }))}
                    placeholder="Add a caption for this image..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex space-x-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  onClick={() => setEditingImageId(null)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveImageMetadata}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && sortedImages[currentImageIndex] && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation */}
            {sortedImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 z-10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 z-10"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Image */}
            <div className="relative max-w-full max-h-full overflow-auto">
              <img
                src={sortedImages[currentImageIndex].url}
                alt={sortedImages[currentImageIndex].alt_text || 'Property image'}
                className="max-w-full max-h-full object-contain"
                style={{ transform: `scale(${zoom / 100})` }}
              />
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black bg-opacity-50 px-4 py-2 rounded-full">
              <button
                onClick={() => setZoom(prev => Math.max(25, prev - 25))}
                disabled={zoom <= 25}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded disabled:opacity-50"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              
              <span className="text-white text-sm font-medium">
                {zoom}%
              </span>
              
              <button
                onClick={() => setZoom(prev => Math.min(400, prev + 25))}
                disabled={zoom >= 400}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded disabled:opacity-50"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <div className="w-px h-6 bg-white bg-opacity-30" />

              <button
                onClick={() => downloadImage(
                  sortedImages[currentImageIndex].url,
                  sortedImages[currentImageIndex].filename
                )}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded"
                title="Download image"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Virtual Staging Button - Only show for non-staged images */}
              {editable && propertyId && !sortedImages[currentImageIndex].is_virtually_staged && (
                <>
                  <div className="w-px h-6 bg-white bg-opacity-30" />
                  <button
                    onClick={() => setLightboxStagingMode(!lightboxStagingMode)}
                    className={`p-2 text-white rounded transition-colors ${
                      lightboxStagingMode 
                        ? 'bg-purple-600 bg-opacity-80 hover:bg-opacity-90' 
                        : 'hover:bg-white hover:bg-opacity-20'
                    }`}
                    title={lightboxStagingMode ? "Hide staging options" : "Virtual staging options"}
                  >
                    <Wand2 className="w-4 h-4" />
                  </button>
                </>
              )}

              {sortedImages.length > 1 && (
                <>
                  <div className="w-px h-6 bg-white bg-opacity-30" />
                  <span className="text-white text-sm">
                    {currentImageIndex + 1} / {sortedImages.length}
                  </span>
                </>
              )}
            </div>

            {/* Virtual Staging Panel */}
            {lightboxStagingMode && (
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Virtual Staging</h3>
                    <p className="text-sm text-gray-500">Transform this image</p>
                  </div>
                </div>

                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {/* Design Style */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Design Style
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {designStyles.map((style) => (
                        <button
                          key={style.value}
                          onClick={() => setLightboxStagingOptions(prev => ({ ...prev, design: style.value }))}
                          className={`p-2 text-center rounded-lg border transition-colors ${
                            lightboxStagingOptions.design === style.value
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <div className="text-lg mb-1">{style.icon}</div>
                          <div className="text-xs font-medium">{style.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Room Type and Transformation in a row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Room Type
                      </label>
                      <select
                        value={lightboxStagingOptions.roomType}
                        onChange={(e) => setLightboxStagingOptions(prev => ({ ...prev, roomType: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        {roomTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transformation
                      </label>
                      <select
                        value={lightboxStagingOptions.transformationType}
                        onChange={(e) => setLightboxStagingOptions(prev => ({ ...prev, transformationType: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        {transformationTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Advanced Options */}
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">High Details</span>
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={lightboxStagingOptions.highDetails}
                          onChange={(e) => setLightboxStagingOptions(prev => ({ ...prev, highDetails: e.target.checked }))}
                          className="text-purple-600 focus:ring-purple-500 rounded"
                        />
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Block Elements</span>
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={lightboxStagingOptions.blockElements}
                          onChange={(e) => setLightboxStagingOptions(prev => ({ ...prev, blockElements: e.target.checked }))}
                          className="text-purple-600 focus:ring-purple-500 rounded"
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Variations: {lightboxStagingOptions.variations}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        value={lightboxStagingOptions.variations}
                        onChange={(e) => setLightboxStagingOptions(prev => ({ ...prev, variations: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setLightboxStagingMode(false)}
                    className="flex-1 py-2 px-4 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLightboxStaging}
                    disabled={lightboxStagingProcessing}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                      lightboxStagingProcessing
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {lightboxStagingProcessing ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Save Staged Version</span>
                      </div>
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-3">
                  This will create a new staged image in your gallery
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 