'use client'
import { useState, useEffect } from 'react'
import { X, Wand2, Sparkles, AlertCircle, CheckCircle, Clock, Settings, Info, Home } from 'lucide-react'

interface PropertyPhoto {
  id: string
  url: string
  filename?: string
  category: string
  is_virtually_staged?: boolean
  original_image_id?: string | null
  staging_status?: 'pending' | 'processing' | 'completed' | 'failed' | null
}

interface VirtualStagingModalProps {
  isOpen: boolean
  onClose: () => void
  selectedImages: PropertyPhoto[]
  onStageImages: (stagingOptions: StagingOptions) => Promise<void>
  propertyId: string
}

interface StagingOptions {
  design: string
  room_type: string
  transformation_type: string
  block_element: string
  high_details_resolution: boolean
  num_images: number
}

const DESIGN_OPTIONS = [
  { value: 'modern', label: 'Modern', description: 'Clean lines, minimal furniture, contemporary style', icon: '🏢' },
  { value: 'scandinavian', label: 'Scandinavian', description: 'Light wood, neutral colors, cozy minimalism', icon: '🌿' },
  { value: 'industrial', label: 'Industrial', description: 'Exposed brick, metal fixtures, urban feel', icon: '🏭' },
  { value: 'bohemian', label: 'Bohemian', description: 'Eclectic patterns, warm colors, artistic flair', icon: '🎨' },
  { value: 'french', label: 'French', description: 'Elegant, classic European sophistication', icon: '🏛️' },
  { value: 'midcentury', label: 'Mid-Century', description: 'Retro 1950s-60s furniture and styling', icon: '📻' },
  { value: 'coastal', label: 'Coastal', description: 'Beach-inspired, light blues, natural textures', icon: '🌊' },
  { value: 'rustic', label: 'Rustic', description: 'Wooden furniture, natural materials, cozy cabin feel', icon: '🪵' },
  { value: 'artdeco', label: 'Art Deco', description: 'Geometric patterns, luxury materials, vintage glamour', icon: '💎' },
  { value: 'minimalist', label: 'Minimalist', description: 'Ultra-clean, few elements, maximum space', icon: '⚪' }
]

const ROOM_TYPES = [
  { value: 'living_room', label: 'Living Room' },
  { value: 'bedroom', label: 'Bedroom' },
  { value: 'dining_room', label: 'Dining Room' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'home_office', label: 'Home Office' },
  { value: 'kid_bedroom', label: 'Kid\'s Bedroom' },
  { value: 'shower', label: 'Shower' },
  { value: 'pool', label: 'Pool' },
  { value: 'terrace', label: 'Terrace' },
  { value: 'pergola', label: 'Pergola' }
]

const TRANSFORMATION_TYPES = [
  { 
    value: 'furnish', 
    label: 'Furnish', 
    description: 'Adds furniture without modifying the original picture',
    icon: <Wand2 className="w-4 h-4" />
  },
  { 
    value: 'renovate', 
    label: 'Renovate', 
    description: 'For empty rooms needing renovation with enhanced AI',
    icon: <Settings className="w-4 h-4" />
  },
  { 
    value: 'redesign', 
    label: 'Redesign', 
    description: 'For furnished rooms, retains layout while applying new design',
    icon: <Sparkles className="w-4 h-4" />
  },
  { 
    value: 'outdoor', 
    label: 'Outdoor', 
    description: 'Adds furniture to outdoor spaces like terraces and pools',
    icon: <Wand2 className="w-4 h-4" />
  }
]

// Helper function to auto-detect room type from category
const getCategoryToRoomType = (category: string): string => {
  const mapping: { [key: string]: string } = {
    'living_room': 'living_room',
    'bedroom': 'bedroom',
    'kitchen': 'kitchen',
    'bathroom': 'bathroom',
    'dining_room': 'dining_room',
    'pool': 'pool',
    'garden': 'terrace',
    'exterior': 'terrace',
    'general': 'living_room'
  }
  return mapping[category] || 'living_room'
}

export default function VirtualStagingModal({
  isOpen,
  onClose,
  selectedImages,
  onStageImages,
  propertyId
}: VirtualStagingModalProps) {
  const [stagingOptions, setStagingOptions] = useState<StagingOptions>({
    design: 'modern',
    room_type: 'living_room',
    transformation_type: 'furnish',
    block_element: 'wall,floor,ceiling,windowpane,door',
    high_details_resolution: true,
    num_images: 2
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'configure' | 'preview' | 'processing'>('configure')

  // Auto-detect room type from selected images
  useEffect(() => {
    if (selectedImages.length > 0) {
      const firstImageCategory = selectedImages[0].category
      const detectedRoomType = getCategoryToRoomType(firstImageCategory)
      setStagingOptions(prev => ({
        ...prev,
        room_type: detectedRoomType
      }))
    }
  }, [selectedImages])

  const handleSubmit = async () => {
    if (selectedImages.length === 0) {
      setError('Please select at least one image to stage')
      return
    }

    setLoading(true)
    setError(null)
    setStep('processing')

    try {
      await onStageImages(stagingOptions)
      // Success - parent component handles the result
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to start virtual staging')
      setStep('configure')
    } finally {
      setLoading(false)
    }
  }

  const updateStagingOption = <K extends keyof StagingOptions>(
    key: K, 
    value: StagingOptions[K]
  ) => {
    setStagingOptions(prev => ({ ...prev, [key]: value }))
  }

  const canUseBlockElements = ['furnish', 'redesign', 'outdoor'].includes(stagingOptions.transformation_type)
  const canUseHighDetails = ['furnish', 'renovate', 'redesign'].includes(stagingOptions.transformation_type)
  const canUseMultipleImages = ['furnish', 'renovate', 'redesign', 'outdoor'].includes(stagingOptions.transformation_type)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Virtual Staging</h3>
                <p className="text-sm text-gray-500">
                  Transform {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} with AI-powered furniture and design
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {step === 'configure' && (
            <div className="space-y-6">
              {/* Selected Images Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Selected Images ({selectedImages.length})
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {selectedImages.slice(0, 8).map((image, index) => (
                    <div key={image.id} className="relative">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={image.url}
                          alt={image.filename || `Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute top-2 right-2 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded">
                        {image.category}
                      </div>
                    </div>
                  ))}
                  {selectedImages.length > 8 && (
                    <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500 text-sm">+{selectedImages.length - 8} more</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Design Style Grid */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Design Style
                  <span className="text-gray-500 text-xs ml-2">(applies to all selected images)</span>
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {DESIGN_OPTIONS.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => updateStagingOption('design', style.value)}
                      className={`p-3 text-center rounded-lg border transition-colors ${
                        stagingOptions.design === style.value
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="text-2xl mb-2">{style.icon}</div>
                      <div className="text-sm font-medium">{style.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Transformation Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Transformation Type
                  <span className="text-gray-500 text-xs ml-2">(applies to all selected images)</span>
                </label>
                <div className="space-y-2">
                  {TRANSFORMATION_TYPES.map((type) => (
                    <label key={type.value} className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                      <input
                        type="radio"
                        name="transformation_type"
                        value={type.value}
                        checked={stagingOptions.transformation_type === type.value}
                        onChange={(e) => updateStagingOption('transformation_type', e.target.value)}
                        className="mt-1 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Room Type Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Home className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Room Type Detection</h4>
                    <p className="text-sm text-blue-700">
                      Room types are automatically detected and can be adjusted per image in the gallery. 
                      Each room will be transformed according to its specific type.
                    </p>
                  </div>
                </div>
              </div>

              {/* Advanced Options */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Advanced Options</h4>
                
                {canUseHighDetails && (
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={stagingOptions.high_details_resolution}
                      onChange={(e) => updateStagingOption('high_details_resolution', e.target.checked)}
                      className="text-purple-600"
                    />
                    <span className="text-sm text-gray-700">High Details Resolution</span>
                  </label>
                )}

                {canUseMultipleImages && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Variations (1-4)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="4"
                      value={stagingOptions.num_images}
                      onChange={(e) => updateStagingOption('num_images', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                )}

                {canUseBlockElements && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preserve Elements
                    </label>
                    <input
                      type="text"
                      value={stagingOptions.block_element}
                      onChange={(e) => updateStagingOption('block_element', e.target.value)}
                      placeholder="wall,floor,ceiling,windowpane,door"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Comma-separated list of elements to keep unchanged
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Clock className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Your Images</h3>
              <p className="text-gray-600 mb-4">
                Our AI is working on staging your {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''}. 
                This typically takes 2-5 minutes.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center space-x-2 text-blue-800 text-sm">
                  <Info className="w-4 h-4" />
                  <span>You'll receive a notification when the staging is complete</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          {step === 'configure' && (
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Estimated cost: ${(selectedImages.length * stagingOptions.num_images * 0.50).toFixed(2)}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || selectedImages.length === 0}
                  className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Starting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Start Virtual Staging</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 