'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/config'
import { isCurrentUserPhotographer } from '@/lib/auth/admin-client'
import { 
  Camera, 
  Calendar, 
  MapPin, 
  Phone, 
  User, 
  Clock, 
  Upload,
  Award,
  TrendingUp,
  Navigation,
  CheckCircle,
  Star,
  Target,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
}

interface Assignment {
  id: string
  lead_id: string
  scheduled_time: string
  duration_minutes: number
  status: 'assigned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  preparation_notes: string
  lead: {
    name: string
    location: string
    property_type: string
    whatsapp_number: string
  }
}

interface PerformanceMetrics {
  shoots_completed_this_month: number
  shoots_assigned_this_month: number
  photos_uploaded_this_month: number
  average_rating: number
  properties_created: number
  current_streak: number
  shoots_today_completed: number
  shoots_today_upcoming: number
}

export default function PhotographerDashboard() {
  const [photographer, setPhotographer] = useState<PhotographerProfile | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    shoots_completed_this_month: 0,
    shoots_assigned_this_month: 0,
    photos_uploaded_this_month: 0,
    average_rating: 0,
    properties_created: 0,
    current_streak: 0,
    shoots_today_completed: 0,
    shoots_today_upcoming: 0
  })
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)
  const router = useRouter()
  // Using shared Supabase client to avoid multiple instances

  useEffect(() => {
    checkAuthentication()
  }, [])

  useEffect(() => {
    if (photographer) {
      loadDashboardData()
    }
  }, [photographer])

  const checkAuthentication = async () => {
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
      
      // Allow access if user is photographer OR admin (same logic as broker dashboard)
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
        console.log('Admin user trying to access photographer dashboard...')
        
        try {
          // First try a simple query to get all photographers
          const { data: allPhotographers, error: allPhotographersError } = await supabase
            .from('photographers')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: true })

          console.log('All photographers query result:', { allPhotographers, allPhotographersError })

          if (allPhotographersError) {
            console.error('Error querying photographers:', allPhotographersError)
            // Try using the API instead of direct Supabase query
            const response = await fetch('/api/admin/photographers')
            if (response.ok) {
              const apiData = await response.json()
              console.log('API response:', apiData)
              
              const activePhotographers = apiData.photographers?.filter((p: any) => p.is_active) || []
              if (activePhotographers.length > 0) {
                photographerData = activePhotographers[0]
                console.log('Using photographer from API:', photographerData)
              } else {
                throw new Error('No active photographers found via API')
              }
            } else {
              throw new Error('Failed to fetch photographers via API')
            }
          } else if (!allPhotographers || allPhotographers.length === 0) {
            throw new Error('No active photographers found in database')
          } else {
            photographerData = allPhotographers[0]
            console.log('Using first photographer from database:', photographerData)
          }
        } catch (error) {
          console.error('All photographer fetching methods failed:', error)
          toast({
            title: "No Photographers",
            description: "No active photographers found in the system. This might be due to database permissions.",
            variant: "destructive"
          })
          router.push('/')
          return
        }
      }

      if (!photographerData.is_active) {
        toast({
          title: "Account Inactive",
          description: "Your photographer account is currently inactive. Please contact admin.",
          variant: "destructive"
        })
        router.push('/')
        return
      }

      setPhotographer(photographerData)
    } catch (error) {
      console.error('Authentication error:', error)
      router.push('/auth')
    } finally {
      setAuthLoading(false)
    }
  }

  const loadDashboardData = async () => {
    if (!photographer) return

    try {
      setLoading(true)
      
      // Load assignments and metrics in parallel
      await Promise.all([
        loadAssignments(),
        loadMetrics()
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please refresh the page.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAssignments = async () => {
    if (!photographer) return

    try {
      const response = await fetch(`/api/photographer/assignments?photographer_id=${photographer.id}`)
      if (!response.ok) throw new Error('Failed to fetch assignments')
      
      const data = await response.json()
      setAssignments(data.assignments || [])
    } catch (error) {
      console.error('Error loading assignments:', error)
    }
  }

  const loadMetrics = async () => {
    if (!photographer) return

    try {
      const response = await fetch(`/api/photographer/dashboard?photographer_id=${photographer.id}`)
      if (!response.ok) throw new Error('Failed to fetch metrics')
      
      const data = await response.json()
      setMetrics(data.metrics || metrics)
      setAssignments(data.assignments || [])
    } catch (error) {
      console.error('Error loading metrics:', error)
    }
  }

  const updateAssignmentStatus = async (assignmentId: string, status: string) => {
    try {
      const response = await fetch('/api/photographer/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignmentId,
          status,
          photographer_id: photographer?.id
        })
      })

      if (!response.ok) throw new Error('Failed to update assignment status')

      toast({
        title: "Success",
        description: `Assignment status updated to ${status}.`
      })

      loadDashboardData()
    } catch (error) {
      console.error('Error updating assignment:', error)
      toast({
        title: "Error",
        description: "Failed to update assignment status.",
        variant: "destructive"
      })
    }
  }

  const getNextAssignment = () => {
    const upcoming = assignments
      .filter(a => a.status === 'assigned' || a.status === 'confirmed')
      .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())
    return upcoming[0] || null
  }

  const getTodaysAssignments = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return assignments.filter(a => {
      const assignmentDate = new Date(a.scheduled_time)
      return assignmentDate >= today && assignmentDate < tomorrow
    })
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const nextAssignment = getNextAssignment()
  const todaysAssignments = getTodaysAssignments()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">📸 Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {photographer?.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                <span className="text-sm font-medium">{photographer?.rating?.toFixed(1)}</span>
              </div>
              <Badge variant={photographer?.is_active ? "default" : "secondary"}>
                {photographer?.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Performance Overview - Mobile Optimized Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">This Month</p>
                  <p className="text-lg font-bold text-gray-900">
                    {metrics.shoots_completed_this_month}/{metrics.shoots_assigned_this_month}
                  </p>
                  <p className="text-xs text-gray-500">Shoots</p>
                </div>
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Photos</p>
                  <p className="text-lg font-bold text-gray-900">{metrics.photos_uploaded_this_month}</p>
                  <p className="text-xs text-gray-500">Uploaded</p>
                </div>
                <Camera className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Rating</p>
                  <p className="text-lg font-bold text-gray-900">{metrics.average_rating.toFixed(1)}/5.0</p>
                  <p className="text-xs text-gray-500">Average</p>
                </div>
                <Star className="h-6 w-6 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Streak</p>
                  <p className="text-lg font-bold text-gray-900">{metrics.current_streak}</p>
                  <p className="text-xs text-gray-500">Days</p>
                </div>
                <Zap className="h-6 w-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Today's Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{metrics.shoots_today_completed}</p>
                <p className="text-sm text-green-600">Completed</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">{metrics.shoots_today_upcoming}</p>
                <p className="text-sm text-blue-600">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - Thumb-friendly buttons */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                className="h-12 text-sm"
                onClick={() => router.push('/photographer/schedule')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Schedule
              </Button>
              <Button 
                variant="outline" 
                className="h-12 text-sm"
                onClick={() => router.push('/photographer/upload')}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Photos
              </Button>
              {nextAssignment && (
                <>
                  <Button 
                    variant="outline" 
                    className="h-12 text-sm"
                    onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(nextAssignment.lead.location)}`, '_blank')}
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Navigate
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-12 text-sm"
                    onClick={() => updateAssignmentStatus(nextAssignment.id, 'completed')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Next Assignment Card */}
        {nextAssignment && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-blue-800 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Next Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-blue-900">{nextAssignment.lead.property_type}</h3>
                  <p className="text-sm text-blue-700">
                    {new Date(nextAssignment.scheduled_time).toLocaleDateString()} at{' '}
                    {new Date(nextAssignment.scheduled_time).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-sm text-blue-600">{nextAssignment.duration_minutes} minutes</p>
                </div>
                
                <div className="bg-white p-3 rounded border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="font-medium">{nextAssignment.lead.name}</span>
                    </div>
                    <a 
                      href={`https://wa.me/${nextAssignment.lead.whatsapp_number.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline">
                        <Phone className="w-3 h-3 mr-1" />
                        Contact
                      </Button>
                    </a>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {nextAssignment.lead.location}
                  </div>
                </div>

                {nextAssignment.preparation_notes && (
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <p className="text-sm font-medium text-gray-900 mb-1">Notes:</p>
                    <p className="text-sm text-gray-700">{nextAssignment.preparation_notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={() => updateAssignmentStatus(nextAssignment.id, 'in_progress')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Start Shoot
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(nextAssignment.lead.location)}`, '_blank')}
                    className="border-blue-300 text-blue-600 hover:bg-blue-100"
                  >
                    <Navigation className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Schedule */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Today's Schedule
              </div>
              <Badge variant="secondary">{todaysAssignments.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaysAssignments.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No assignments scheduled for today</p>
                <p className="text-sm text-gray-500 mt-1">Enjoy your free day! 🌟</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysAssignments.map((assignment) => (
                  <div key={assignment.id} className="border rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{assignment.lead.name}</h4>
                        <p className="text-sm text-gray-600">{assignment.lead.property_type}</p>
                      </div>
                      <Badge 
                        variant={
                          assignment.status === 'completed' ? 'default' :
                          assignment.status === 'in_progress' ? 'secondary' :
                          'outline'
                        }
                      >
                        {assignment.status}
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Clock className="w-4 h-4 mr-2" />
                      {new Date(assignment.scheduled_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} ({assignment.duration_minutes}min)
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <MapPin className="w-4 h-4 mr-2" />
                      {assignment.lead.location}
                    </div>
                    
                    {assignment.status !== 'completed' && (
                      <div className="flex gap-2">
                        {assignment.status === 'assigned' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateAssignmentStatus(assignment.id, 'in_progress')}
                          >
                            Start
                          </Button>
                        )}
                        {assignment.status === 'in_progress' && (
                          <Button 
                            size="sm"
                            onClick={() => updateAssignmentStatus(assignment.id, 'completed')}
                          >
                            Complete
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(assignment.lead.location)}`, '_blank')}
                        >
                          Navigate
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom Navigation Placeholder */}
        <div className="h-20"></div>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-around py-2">
            <Button 
              variant="ghost" 
              className="flex-1 flex-col h-12 text-xs"
              onClick={() => router.push('/photographer')}
            >
              <TrendingUp className="w-5 h-5 mb-1" />
              Dashboard
            </Button>
            <Button 
              variant="ghost" 
              className="flex-1 flex-col h-12 text-xs"
              onClick={() => router.push('/photographer/schedule')}
            >
              <Calendar className="w-5 h-5 mb-1" />
              Schedule
            </Button>
            <Button 
              variant="ghost" 
              className="flex-1 flex-col h-12 text-xs"
              onClick={() => router.push('/photographer/upload')}
            >
              <Upload className="w-5 h-5 mb-1" />
              Upload
            </Button>
            <Button 
              variant="ghost" 
              className="flex-1 flex-col h-12 text-xs"
              onClick={() => router.push('/photographer/profile')}
            >
              <User className="w-5 h-5 mb-1" />
              Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}