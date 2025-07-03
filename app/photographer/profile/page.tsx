'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/config'
import { isCurrentUserPhotographer } from '@/lib/auth/admin-client'
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Star,
  Award,
  Calendar,
  Settings,
  LogOut,
  ArrowLeft,
  Edit,
  Save,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'

interface PhotographerProfile {
  id: string
  name: string
  email: string
  phone: string
  rating: number
  total_shoots: number
  is_active: boolean
  preferred_areas: string[]
  equipment: string
  skills: string[]
  languages: string[]
  created_at: string
}

export default function PhotographerProfile() {
  const [photographer, setPhotographer] = useState<PhotographerProfile | null>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    preferred_areas: '',
    equipment: '',
    skills: '',
    languages: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    loadPhotographerProfile()
  }, [])

  const loadPhotographerProfile = async () => {
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
      setEditForm({
        name: photographerData.name,
        phone: photographerData.phone,
        preferred_areas: photographerData.preferred_areas.join(', '),
        equipment: photographerData.equipment || '',
        skills: photographerData.skills.join(', '),
        languages: photographerData.languages.join(', ')
      })
    } catch (error) {
      console.error('Error loading photographer profile:', error)
      router.push('/auth')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!photographer) return

    setSaving(true)
    try {
      const updateData = {
        name: editForm.name,
        phone: editForm.phone,
        preferred_areas: editForm.preferred_areas.split(',').map(s => s.trim()).filter(Boolean),
        equipment: editForm.equipment,
        skills: editForm.skills.split(',').map(s => s.trim()).filter(Boolean),
        languages: editForm.languages.split(',').map(s => s.trim()).filter(Boolean)
      }

      const { error } = await supabase
        .from('photographers')
        .update(updateData)
        .eq('id', photographer.id)

      if (error) {
        throw new Error(error.message)
      }

      // Update local state
      setPhotographer({
        ...photographer,
        ...updateData
      })

      setEditing(false)
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully."
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth')
    } catch (error) {
      console.error('Error signing out:', error)
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!photographer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Profile not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
                <h1 className="text-xl font-bold text-gray-900">👤 Profile</h1>
                <p className="text-sm text-gray-600">Manage your photographer profile</p>
              </div>
            </div>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(false)}
                    disabled={saving}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Camera className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{photographer.name}</h2>
                <p className="text-gray-600">{photographer.email}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">{photographer.rating.toFixed(1)}</span>
                  </div>
                  <Badge variant={photographer.is_active ? "default" : "secondary"}>
                    {photographer.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Camera className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{photographer.total_shoots}</p>
              <p className="text-sm text-gray-600">Total Shoots</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{photographer.rating.toFixed(1)}</p>
              <p className="text-sm text-gray-600">Average Rating</p>
            </CardContent>
          </Card>
        </div>

        {/* Profile Details */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="preferred-areas">Preferred Areas (comma-separated)</Label>
                  <Input
                    id="preferred-areas"
                    placeholder="New Cairo, Zamalek, Maadi"
                    value={editForm.preferred_areas}
                    onChange={(e) => setEditForm(prev => ({ ...prev, preferred_areas: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="equipment">Equipment</Label>
                  <Input
                    id="equipment"
                    placeholder="Insta360 X5, DSLR Camera Kit"
                    value={editForm.equipment}
                    onChange={(e) => setEditForm(prev => ({ ...prev, equipment: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <Input
                    id="skills"
                    placeholder="residential, luxury, commercial, drone"
                    value={editForm.skills}
                    onChange={(e) => setEditForm(prev => ({ ...prev, skills: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="languages">Languages (comma-separated)</Label>
                  <Input
                    id="languages"
                    placeholder="Arabic, English, French"
                    value={editForm.languages}
                    onChange={(e) => setEditForm(prev => ({ ...prev, languages: e.target.value }))}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">Full Name</p>
                      <p className="text-gray-600">{photographer.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-gray-600">{photographer.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">Phone</p>
                      <p className="text-gray-600">{photographer.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Preferred Areas</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {photographer.preferred_areas.map((area, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Camera className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">Equipment</p>
                      <p className="text-gray-600">{photographer.equipment || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-gray-500 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Skills</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {photographer.skills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Settings className="w-5 h-5 text-gray-500 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Languages</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {photographer.languages.map((language, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {language}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">Member Since</p>
                      <p className="text-gray-600">{formatDate(photographer.created_at)}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Bottom Navigation Placeholder */}
        <div className="h-20"></div>
      </div>
    </div>
  )
}