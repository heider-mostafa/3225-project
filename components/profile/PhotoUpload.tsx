'use client'
import { useState, useRef } from 'react'
import { Camera, Upload, X, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase/config'
import { useAuth } from '@/components/providers'

interface PhotoUploadProps {
  currentPhotoUrl?: string | null
  onPhotoUpdate: (photoUrl: string | null) => void
  className?: string
}

export default function PhotoUpload({ currentPhotoUrl, onPhotoUpdate, className = '' }: PhotoUploadProps) {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, or WebP)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    await uploadPhoto(file)
  }

  const uploadPhoto = async (file: File) => {
    if (!user) return

    try {
      setUploading(true)
      setUploadProgress(0)

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      // Delete existing photo if it exists
      if (currentPhotoUrl) {
        const oldPath = currentPhotoUrl.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('profile-photos')
            .remove([`${user.id}/${oldPath}`])
        }
      }

      // Upload new photo
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName)

      // Update profile with new photo URL
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile_photo_url: publicUrl
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      onPhotoUpdate(publicUrl)
      setUploadProgress(100)

      // Log activity
      await supabase
        .from('user_activity_log')
        .insert({
          user_id: user.id,
          activity_type: 'profile_photo_update',
          entity_type: 'profile',
          entity_id: user.id,
          activity_data: { action: 'uploaded_photo' }
        })

    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Failed to upload photo. Please try again.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const removePhoto = async () => {
    if (!user || !currentPhotoUrl) return

    try {
      setUploading(true)

      // Remove from storage
      const fileName = currentPhotoUrl.split('/').pop()
      if (fileName) {
        await supabase.storage
          .from('profile-photos')
          .remove([`${user.id}/${fileName}`])
      }

      // Update profile
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile_photo_url: null
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      onPhotoUpdate(null)

      // Log activity
      await supabase
        .from('user_activity_log')
        .insert({
          user_id: user.id,
          activity_type: 'profile_photo_update',
          entity_type: 'profile',
          entity_id: user.id,
          activity_data: { action: 'removed_photo' }
        })

    } catch (error) {
      console.error('Error removing photo:', error)
      alert('Failed to remove photo. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className="relative group">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
          {currentPhotoUrl ? (
            <img
              src={currentPhotoUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white font-medium text-2xl">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        
        {/* Upload/Remove Buttons */}
        <div className="absolute bottom-0 right-0 flex space-x-1">
          <button
            onClick={handleFileSelect}
            disabled={uploading}
            className="w-6 h-6 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Upload photo"
          >
            {uploading ? (
              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-3 h-3 text-gray-600" />
            )}
          </button>
          
          {currentPhotoUrl && !uploading && (
            <button
              onClick={removePhoto}
              className="w-6 h-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center hover:bg-red-600 transition-colors"
              title="Remove photo"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          )}
        </div>
        
        {/* Upload Progress */}
        {uploading && uploadProgress > 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="text-white text-xs font-medium">
              {uploadProgress === 100 ? (
                <Check className="w-4 h-4" />
              ) : (
                `${uploadProgress}%`
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Upload Instructions */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        <p>Click camera to upload</p>
        <p>Max 5MB • JPG, PNG, WebP</p>
      </div>
    </div>
  )
} 