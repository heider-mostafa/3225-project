'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/config'
import { isCurrentUserPhotographer } from '@/lib/auth/admin-client'
import { 
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  Navigation,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Camera,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'

interface Assignment {
  id: string
  lead_id: string
  scheduled_time: string
  duration_minutes: number
  status: 'assigned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  preparation_notes: string
  travel_distance_km: number | null
  lead: {
    name: string
    location: string
    property_type: string
    whatsapp_number: string
  }
}

export default function PhotographerSchedule() {
  const [photographer, setPhotographer] = useState<any>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today')
  const [loading, setLoading] = useState(true)
  
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
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

      // Load assignments
      const response = await fetch(`/api/photographer/assignments?photographer_id=${photographerData.id}`)
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      router.push('/auth')
    } finally {
      setLoading(false)
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

      loadData()
    } catch (error) {
      console.error('Error updating assignment:', error)
      toast({
        title: "Error",
        description: "Failed to update assignment status.",
        variant: "destructive"
      })
    }
  }

  const getAssignmentsForDate = (date: Date) => {
    const dateStart = new Date(date)
    dateStart.setHours(0, 0, 0, 0)
    const dateEnd = new Date(date)
    dateEnd.setHours(23, 59, 59, 999)

    return assignments.filter(assignment => {
      const assignmentDate = new Date(assignment.scheduled_time)
      return assignmentDate >= dateStart && assignmentDate <= dateEnd
    }).sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())
  }

  const getWeekDates = (startDate: Date) => {
    const week = []
    const start = new Date(startDate)
    start.setDate(start.getDate() - start.getDay()) // Start from Sunday

    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      week.push(date)
    }

    return week
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    if (viewMode === 'today') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    }
    setSelectedDate(newDate)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'confirmed': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'assigned': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
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
          <p className="text-gray-600">Loading schedule...</p>
        </div>
      </div>
    )
  }

  const todaysAssignments = getAssignmentsForDate(selectedDate)
  const weekDates = getWeekDates(selectedDate)

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
              <h1 className="text-xl font-bold text-gray-900">📅 Schedule</h1>
              <p className="text-sm text-gray-600">Your photography assignments</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* View Mode Toggle */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'today' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('today')}
                >
                  Today
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                >
                  Week
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date Header */}
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {viewMode === 'today' ? formatDate(selectedDate) : `Week of ${formatDate(weekDates[0])}`}
          </h2>
          {isToday(selectedDate) && viewMode === 'today' && (
            <Badge variant="secondary" className="mt-1">Today</Badge>
          )}
        </div>

        {viewMode === 'week' ? (
          /* Week View */
          <div className="grid grid-cols-1 gap-4">
            {weekDates.map((date, index) => {
              const dayAssignments = getAssignmentsForDate(date)
              return (
                <Card key={index} className={isToday(date) ? 'border-blue-200 bg-blue-50' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </CardTitle>
                      <Badge variant="outline">{dayAssignments.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {dayAssignments.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No assignments</p>
                    ) : (
                      <div className="space-y-2">
                        {dayAssignments.map((assignment) => (
                          <div key={assignment.id} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{assignment.lead.name}</p>
                              <p className="text-xs text-gray-600">{formatTime(assignment.scheduled_time)}</p>
                            </div>
                            <Badge variant="outline" className={`text-xs ${getStatusColor(assignment.status)}`}>
                              {assignment.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          /* Today View */
          <div className="space-y-4">
            {todaysAssignments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments scheduled</h3>
                  <p className="text-gray-600">
                    {isToday(selectedDate) ? "Enjoy your free day! 🌟" : "No shoots scheduled for this day."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              todaysAssignments.map((assignment) => (
                <Card key={assignment.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        {assignment.lead.name}
                      </CardTitle>
                      <Badge className={getStatusColor(assignment.status)}>
                        {assignment.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Time and Duration */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{formatTime(assignment.scheduled_time)}</span>
                      </div>
                      <div className="text-gray-500">
                        ({assignment.duration_minutes} min)
                      </div>
                      {assignment.travel_distance_km && (
                        <div className="text-gray-500">
                          • {assignment.travel_distance_km}km away
                        </div>
                      )}
                    </div>

                    {/* Location and Property Type */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{assignment.lead.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Camera className="w-4 h-4 text-gray-500" />
                        <span>{assignment.lead.property_type}</span>
                      </div>
                    </div>

                    {/* Preparation Notes */}
                    {assignment.preparation_notes && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 mb-1">Preparation Notes:</p>
                        <p className="text-sm text-gray-700">{assignment.preparation_notes}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://wa.me/${assignment.lead.whatsapp_number.replace(/[^0-9]/g, '')}`, '_blank')}
                        className="flex-1"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Contact
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(assignment.lead.location)}`, '_blank')}
                        className="flex-1"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Navigate
                      </Button>
                    </div>

                    {/* Status Action Buttons */}
                    {assignment.status !== 'completed' && assignment.status !== 'cancelled' && (
                      <div className="flex gap-2 border-t pt-3">
                        {assignment.status === 'assigned' && (
                          <Button
                            size="sm"
                            onClick={() => updateAssignmentStatus(assignment.id, 'in_progress')}
                            className="flex-1"
                          >
                            Start Shoot
                          </Button>
                        )}
                        {assignment.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => updateAssignmentStatus(assignment.id, 'completed')}
                            className="flex-1"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Complete
                          </Button>
                        )}
                        {(assignment.status === 'assigned' || assignment.status === 'confirmed') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateAssignmentStatus(assignment.id, 'in_progress')}
                            className="flex-1"
                          >
                            Mark Started
                          </Button>
                        )}
                      </div>
                    )}

                    {assignment.status === 'completed' && (
                      <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 p-2 rounded border border-green-200">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Completed</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Summary Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {viewMode === 'today' ? 'Today\'s Summary' : 'Week Summary'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {viewMode === 'today' 
                    ? todaysAssignments.length 
                    : weekDates.reduce((sum, date) => sum + getAssignmentsForDate(date).length, 0)
                  }
                </p>
                <p className="text-sm text-gray-600">Total Assignments</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {viewMode === 'today'
                    ? todaysAssignments.filter(a => a.status === 'completed').length
                    : weekDates.reduce((sum, date) => 
                        sum + getAssignmentsForDate(date).filter(a => a.status === 'completed').length, 0
                      )
                  }
                </p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Navigation Placeholder */}
        <div className="h-20"></div>
      </div>
    </div>
  )
}