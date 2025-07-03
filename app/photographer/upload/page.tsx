'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/config'
import { isCurrentUserPhotographer } from '@/lib/auth/admin-client'
import { 
  Camera, 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle,
  Plus,
  ArrowLeft,
  Send,
  FileImage,
  MapPin,
  User,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'

interface Assignment {
  id: string
  lead_id: string
  scheduled_time: string
  duration_minutes: number
  status: string
  preparation_notes: string
  lead: {
    name: string
    location: string
    property_type: string
    whatsapp_number: string
  }
}

interface PhotoUpload {
  file: File
  preview: string
  caption: string
  uploaded: boolean
  uploading: boolean
  url?: string
}

export default function PhotographerUpload() {
  const [photographer, setPhotographer] = useState<any>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [photos, setPhotos] = useState<PhotoUpload[]>([])
  const [uploading, setUploading] = useState(false)
  const [photographerNotes, setPhotographerNotes] = useState('')
  const [recommendedShots, setRecommendedShots] = useState('')
  const [propertyCondition, setPropertyCondition] = useState('')
  const [bestFeatures, setBestFeatures] = useState('')
  const [shootingChallenges, setShootingChallenges] = useState('')
  const [loading, setLoading] = useState(true)
  
  const router = useRouter()

  useEffect(() => {
    loadPhotographerData()
  }, [])

  const loadPhotographerData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth')
        return
      }

      // Check if user is a photographer or admin (admins can view photographer dashboards)
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .in('role', ['photographer', 'admin', 'super_admin'])

      const isPhotographerUser = await isCurrentUserPhotographer()
      const hasAdminAccess = userRoles && userRoles.some(role => ['admin', 'super_admin'].includes(role.role))
      
      // Allow access if user is photographer OR admin (same logic as dashboard)
      if (!isPhotographerUser && !hasAdminAccess) {
        toast({
          title: "Access Denied",
          description: "You don't have photographer or admin permissions.",
          variant: "destructive"
        })
        router.push('/')
        return
      }

      // Get photographer profile
      let photographerData = null
      
      if (isPhotographerUser) {
        // User has photographer role - get their photographer profile by email
        const { data: userPhotographerData, error } = await supabase
          .from('photographers')
          .select('*')
          .eq('email', session.user.email)
          .eq('is_active', true)
          .single()

        if (error || !userPhotographerData) {
          toast({
            title: "Access Denied",
            description: "Photographer profile not found. Please contact admin.",
            variant: "destructive"
          })
          router.push('/')
          return
        }
        photographerData = userPhotographerData
      } else if (hasAdminAccess) {
        // Admin user - try to get any active photographer for demo purposes
        try {
          const response = await fetch('/api/admin/photographers')
          if (response.ok) {
            const apiData = await response.json()
            const activePhotographers = apiData.photographers?.filter((p: any) => p.is_active) || []
            if (activePhotographers.length > 0) {
              photographerData = activePhotographers[0]
            } else {
              throw new Error('No active photographers found via API')
            }
          } else {
            throw new Error('Failed to fetch photographers via API')
          }
        } catch (error) {
          console.error('Photographer fetching failed:', error)
          toast({
            title: "No Photographers",
            description: "No active photographers found in the system.",
            variant: "destructive"
          })
          router.push('/')
          return
        }
      }

      if (!photographerData.is_active) {
        toast({
          title: "Account Inactive",
          description: "Photographer account is currently inactive. Please contact admin.",
          variant: "destructive"
        })
        router.push('/')
        return
      }

      setPhotographer(photographerData)

      // Load active assignments
      const response = await fetch(`/api/photographer/assignments?photographer_id=${photographerData.id}`)
      if (response.ok) {
        const data = await response.json()
        const activeAssignments = data.assignments.filter((a: Assignment) => 
          a.status === 'in_progress' || a.status === 'confirmed' || a.status === 'assigned'
        )
        setAssignments(activeAssignments)
      }
    } catch (error) {
      console.error('Error loading photographer data:', error)
      router.push('/auth')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const newPhoto: PhotoUpload = {
            file,
            preview: e.target?.result as string,
            caption: '',
            uploaded: false,
            uploading: false
          }
          setPhotos(prev => [...prev, newPhoto])
        }
        reader.readAsDataURL(file)
      }
    })
    
    // Clear the input
    event.target.value = ''
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const updatePhotoCaption = (index: number, caption: string) => {
    setPhotos(prev => prev.map((photo, i) => 
      i === index ? { ...photo, caption } : photo
    ))
  }

  const uploadToStorage = async (file: File): Promise<string> => {
    try {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const filePath = `photographer-uploads/${photographer.id}/${fileName}`

      console.log('Uploading file:', fileName, 'to path:', filePath)

      const { data, error } = await supabase.storage
        .from('property-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Storage upload error:', error)
        throw new Error(`Upload failed: ${error.message}`)
      }

      console.log('Upload successful:', data)

      const { data: { publicUrl } } = supabase.storage
        .from('property-photos')
        .getPublicUrl(filePath)

      console.log('Public URL generated:', publicUrl)
      return publicUrl
    } catch (error) {
      console.error('Upload to storage error:', error)
      throw error
    }
  }

  const handleUpload = async () => {
    if (!selectedAssignment || photos.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select an assignment and add at least one photo.",
        variant: "destructive"
      })
      return
    }

    setUploading(true)

    try {
      // Upload photos to storage
      const uploadedPhotos = []
      
      for (let i = 0; i < photos.length; i++) {
        setPhotos(prev => prev.map((photo, index) => 
          index === i ? { ...photo, uploading: true } : photo
        ))

        try {
          const url = await uploadToStorage(photos[i].file)
          uploadedPhotos.push({
            url,
            caption: photos[i].caption
          })

          setPhotos(prev => prev.map((photo, index) => 
            index === i ? { ...photo, uploading: false, uploaded: true, url } : photo
          ))
        } catch (error) {
          console.error(`Failed to upload photo ${i + 1}:`, error)
          setPhotos(prev => prev.map((photo, index) => 
            index === i ? { ...photo, uploading: false } : photo
          ))
          throw error
        }
      }

      // Create pending property with photos
      const response = await fetch('/api/photographer/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: selectedAssignment.id,
          photographer_id: photographer.id,
          photos: uploadedPhotos,
          photographer_notes: photographerNotes,
          recommended_shots: recommendedShots.split(',').map(s => s.trim()).filter(Boolean),
          property_condition: propertyCondition,
          best_features: bestFeatures,
          shooting_challenges: shootingChallenges
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()

      toast({
        title: "Upload Successful! 📸",
        description: `${uploadedPhotos.length} photos uploaded. Pending property created for admin review.`
      })

      // Reset form
      setPhotos([])
      setPhotographerNotes('')
      setRecommendedShots('')
      setPropertyCondition('')
      setBestFeatures('')
      setShootingChallenges('')
      setSelectedAssignment(null)

      // Redirect to dashboard
      router.push('/photographer')

    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload photos.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/photographer')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">📸 Upload Photos</h1>
              <p className="text-sm text-gray-600">Upload and create pending property</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Assignment Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Select Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <div className="text-center py-6">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No active assignments found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Complete an assignment before uploading photos
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedAssignment?.id === assignment.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedAssignment(assignment)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">{assignment.lead.name}</h3>
                          <Badge variant="secondary">{assignment.status}</Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            {assignment.lead.location}
                          </div>
                          <div className="flex items-center">
                            <Camera className="w-4 h-4 mr-2" />
                            {assignment.lead.property_type}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {new Date(assignment.scheduled_time).toLocaleDateString()} at{' '}
                            {new Date(assignment.scheduled_time).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        {assignment.preparation_notes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <strong>Notes:</strong> {assignment.preparation_notes}
                          </div>
                        )}
                      </div>
                      {selectedAssignment?.id === assignment.id && (
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedAssignment && (
          <>
            {/* Photo Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileImage className="w-5 h-5 mr-2" />
                    Photos ({photos.length})
                  </div>
                  <Badge variant="outline">
                    {photos.filter(p => p.uploaded).length}/{photos.length} uploaded
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* File Input */}
                <div className="mb-4">
                  <Label htmlFor="photo-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Tap to add photos</p>
                      <p className="text-sm text-gray-500 mt-1">JPG, PNG, HEIC supported</p>
                    </div>
                  </Label>
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Photo Grid */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={photo.preview}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Upload Status Overlay */}
                          {photo.uploading && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                              <div className="text-white text-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
                                <p className="text-sm">Uploading...</p>
                              </div>
                            </div>
                          )}

                          {photo.uploaded && (
                            <div className="absolute top-2 right-2">
                              <CheckCircle className="w-6 h-6 text-green-500 bg-white rounded-full" />
                            </div>
                          )}

                          {/* Remove Button */}
                          <button
                            onClick={() => removePhoto(index)}
                            className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            disabled={photo.uploading}
                          >
                            <X className="w-4 h-4" />
                          </button>

                          {/* Primary Badge */}
                          {index === 0 && (
                            <div className="absolute bottom-2 left-2">
                              <Badge variant="secondary" className="text-xs">Primary</Badge>
                            </div>
                          )}
                        </div>

                        {/* Caption Input */}
                        <Input
                          placeholder="Add caption (optional)"
                          value={photo.caption}
                          onChange={(e) => updatePhotoCaption(index, e.target.value)}
                          className="mt-2 text-sm"
                          disabled={photo.uploading}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Property Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
                <p className="text-sm text-gray-600">
                  Add your observations to help admin complete the property listing
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="photographer-notes">General Notes</Label>
                  <Textarea
                    id="photographer-notes"
                    placeholder="Describe the property, any special features noticed, or general observations..."
                    value={photographerNotes}
                    onChange={(e) => setPhotographerNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="property-condition">Property Condition</Label>
                  <Select value={propertyCondition} onValueChange={setPropertyCondition}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent - Move-in ready</SelectItem>
                      <SelectItem value="good">Good - Minor updates needed</SelectItem>
                      <SelectItem value="fair">Fair - Some renovation needed</SelectItem>
                      <SelectItem value="needs_work">Needs Work - Major renovation</SelectItem>
                      <SelectItem value="empty">Empty - No furniture</SelectItem>
                      <SelectItem value="furnished">Furnished</SelectItem>
                      <SelectItem value="occupied">Occupied by tenants</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="best-features">Best Features</Label>
                  <Input
                    id="best-features"
                    placeholder="e.g., Great natural light, beautiful view, spacious rooms..."
                    value={bestFeatures}
                    onChange={(e) => setBestFeatures(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="recommended-shots">Recommended Additional Shots (comma-separated)</Label>
                  <Input
                    id="recommended-shots"
                    placeholder="e.g., sunset photos, drone shots, night shots..."
                    value={recommendedShots}
                    onChange={(e) => setRecommendedShots(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="shooting-challenges">Shooting Challenges</Label>
                  <Textarea
                    id="shooting-challenges"
                    placeholder="Any issues encountered: weather, lighting, access problems, etc."
                    value={shootingChallenges}
                    onChange={(e) => setShootingChallenges(e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Upload Button */}
            <div className="sticky bottom-20 pb-4">
              <Button
                onClick={handleUpload}
                disabled={uploading || photos.length === 0 || !selectedAssignment}
                className="w-full h-12 text-lg"
                size="lg"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Uploading... ({photos.filter(p => p.uploaded).length}/{photos.length})
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Upload Photos & Create Property ({photos.length})
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Bottom Navigation Placeholder */}
        <div className="h-20"></div>
      </div>
    </div>
  )
}