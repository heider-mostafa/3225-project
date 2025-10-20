'use client'

import React, { useState, useEffect } from 'react'
import {
  Camera,
  Calendar,
  Clock,
  MapPin,
  Star,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface Photographer {
  id: string
  email: string
  name: string
  phone: string
  preferred_areas: string[]
  equipment: string | null
  rating: number
  total_shoots: number
  is_active: boolean
  skills: string[]
  languages: string[]
}

interface AppraisedProperty {
  id: string
  title: string
  address: string
  city: string
  property_type: string
  appraisal?: {
    id: string
    client_name: string
    market_value_estimate: number
    brokers?: {
      full_name: string
      email: string
    }
  }
}

interface PhotographerSchedulingModalProps {
  isOpen: boolean
  onClose: () => void
  property: AppraisedProperty | null
  onScheduleSuccess: () => void
}

export default function PhotographerSchedulingModal({
  isOpen,
  onClose,
  property,
  onScheduleSuccess
}: PhotographerSchedulingModalProps) {
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [selectedPhotographer, setSelectedPhotographer] = useState<Photographer | null>(null)
  const [loading, setLoading] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [assignmentData, setAssignmentData] = useState({
    scheduled_time: '',
    duration_minutes: 120,
    preparation_notes: ''
  })

  useEffect(() => {
    if (isOpen) {
      loadPhotographers()
      // Set default scheduled time to tomorrow at 10 AM
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(10, 0, 0, 0)
      setAssignmentData(prev => ({
        ...prev,
        scheduled_time: tomorrow.toISOString().slice(0, 16) // Format for datetime-local input
      }))
    }
  }, [isOpen])

  useEffect(() => {
    if (property && selectedPhotographer) {
      setAssignmentData(prev => ({
        ...prev,
        preparation_notes: `Photography assignment for appraised ${property.property_type} at ${property.address}. Property appraised for ${property.appraisal?.client_name || 'client'}.`
      }))
    }
  }, [property, selectedPhotographer])

  const loadPhotographers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/photographers')
      if (!response.ok) throw new Error('Failed to fetch photographers')
      
      const data = await response.json()
      const activePhotographers = (data.photographers || []).filter((p: Photographer) => p.is_active)
      setPhotographers(activePhotographers)
    } catch (error) {
      console.error('Error loading photographers:', error)
      setPhotographers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSchedulePhotographer = async () => {
    if (!property || !selectedPhotographer || !assignmentData.scheduled_time) {
      return
    }

    try {
      setScheduling(true)
      
      // Check if this is an appraised property or regular property
      const isAppraisedProperty = property.appraisal && property.appraisal.id
      
      if (isAppraisedProperty) {
        // Use appraised properties API for appraised properties
        const response = await fetch('/api/admin/appraised-properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertyId: property.id,
            action: 'schedule_photographer',
            photographerId: selectedPhotographer.id,
            scheduledDate: new Date(assignmentData.scheduled_time).toISOString(),
            adminNotes: assignmentData.preparation_notes
          })
        })
        
        const result = await response.json()
        
        if (result.success) {
          onScheduleSuccess()
          handleClose()
        } else {
          console.error('Schedule error:', result.error)
          alert(result.error || 'Failed to schedule photographer')
        }
      } else {
        // Create a temporary lead for regular properties and use photographer assignments API
        const response = await fetch('/api/admin/photographer-assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // Create a temporary lead for this property assignment
            lead_id: null, // We'll handle this in the API
            property_id: property.id,
            photographer_id: selectedPhotographer.id,
            scheduled_time: new Date(assignmentData.scheduled_time).toISOString(),
            duration_minutes: assignmentData.duration_minutes,
            preparation_notes: assignmentData.preparation_notes || `Photography assignment for ${property.property_type}: ${property.title}`,
            property_data: {
              title: property.title,
              address: property.address,
              city: property.city,
              property_type: property.property_type
            }
          })
        })
        
        const result = await response.json()
        
        if (result.success) {
          onScheduleSuccess()
          handleClose()
        } else {
          console.error('Schedule error:', result.error)
          alert(result.error || 'Failed to schedule photographer')
        }
      }
    } catch (error) {
      console.error('Error scheduling photographer:', error)
      alert('Failed to schedule photographer')
    } finally {
      setScheduling(false)
    }
  }

  const handleClose = () => {
    setSelectedPhotographer(null)
    setAssignmentData({
      scheduled_time: '',
      duration_minutes: 120,
      preparation_notes: ''
    })
    onClose()
  }

  // Filter photographers based on property location if available
  const getRecommendedPhotographers = () => {
    if (!property) return photographers
    
    const propertyCity = property.city?.toLowerCase()
    const propertyArea = property.address?.toLowerCase()
    
    return photographers.sort((a, b) => {
      // Calculate match score based on preferred areas
      const aScore = a.preferred_areas.reduce((score, area) => {
        const areaLower = area.toLowerCase()
        if (propertyCity && areaLower.includes(propertyCity)) return score + 3
        if (propertyArea && areaLower.includes(propertyArea)) return score + 2
        return score
      }, 0)
      
      const bScore = b.preferred_areas.reduce((score, area) => {
        const areaLower = area.toLowerCase()
        if (propertyCity && areaLower.includes(propertyCity)) return score + 3
        if (propertyArea && areaLower.includes(propertyArea)) return score + 2
        return score
      }, 0)
      
      // Sort by area match first, then by rating
      if (aScore !== bScore) return bScore - aScore
      return b.rating - a.rating
    })
  }

  const recommendedPhotographers = getRecommendedPhotographers()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Schedule Photographer
          </DialogTitle>
          <DialogDescription>
            {property && (
              <>
                Schedule a photographer for the appraised property: <strong>{property.title}</strong>
                <br />
                <span className="text-sm text-gray-500">
                  {property.property_type} in {property.city} • Appraised by {property.appraisal?.brokers?.full_name || 'Appraiser'}
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Property Summary */}
          {property && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Property Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="font-medium text-blue-800">Address:</span>
                  <p className="text-blue-700">{property.address}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Type:</span>
                  <p className="text-blue-700">{property.property_type}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Value:</span>
                  <p className="text-blue-700">
                    {property.appraisal?.market_value_estimate?.toLocaleString()} EGP
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Photographer Selection */}
          <div>
            <Label className="text-base font-medium mb-3 block">Select Photographer</Label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto border rounded-lg p-2">
                {recommendedPhotographers.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <Camera className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No active photographers available</p>
                  </div>
                ) : (
                  recommendedPhotographers.map((photographer, index) => {
                    const isRecommended = index < 3 // Top 3 are recommended
                    const isSelected = selectedPhotographer?.id === photographer.id
                    
                    return (
                      <div
                        key={photographer.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedPhotographer(photographer)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-900">{photographer.name}</h4>
                              {isRecommended && (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                  Recommended
                                </Badge>
                              )}
                              <div className="flex items-center">
                                <Star className="w-3 h-3 text-yellow-500 mr-1" />
                                <span className="text-sm">{photographer.rating.toFixed(1)}</span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {photographer.preferred_areas.slice(0, 2).join(', ')}
                                {photographer.preferred_areas.length > 2 && ' +' + (photographer.preferred_areas.length - 2)}
                              </div>
                              <div className="flex items-center">
                                <Camera className="w-3 h-3 mr-1" />
                                {photographer.equipment || 'Equipment not specified'}
                              </div>
                              <div>
                                <span className="text-xs text-gray-500">Skills:</span> {photographer.skills.join(', ') || 'Not specified'}
                              </div>
                              <div>
                                <span className="text-xs text-gray-500">Total shoots:</span> {photographer.total_shoots}
                              </div>
                            </div>
                          </div>
                          
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {/* Assignment Details */}
          {selectedPhotographer && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduled_time">Scheduled Date & Time</Label>
                  <Input
                    id="scheduled_time"
                    type="datetime-local"
                    value={assignmentData.scheduled_time}
                    onChange={(e) => setAssignmentData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select
                    value={assignmentData.duration_minutes.toString()}
                    onValueChange={(value) => setAssignmentData(prev => ({ ...prev, duration_minutes: parseInt(value) }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                      <SelectItem value="120">120 minutes</SelectItem>
                      <SelectItem value="180">180 minutes</SelectItem>
                      <SelectItem value="240">240 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="preparation_notes">Assignment Notes</Label>
                <Textarea
                  id="preparation_notes"
                  rows={3}
                  value={assignmentData.preparation_notes}
                  onChange={(e) => setAssignmentData(prev => ({ ...prev, preparation_notes: e.target.value }))}
                  className="mt-1"
                  placeholder="Special instructions, access details, or preparation notes..."
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSchedulePhotographer} 
              className="flex-1"
              disabled={!selectedPhotographer || !assignmentData.scheduled_time || scheduling}
            >
              {scheduling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Photographer
                </>
              )}
            </Button>
          </div>

          {/* Selected Photographer Summary */}
          {selectedPhotographer && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">Assignment Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-green-800">Photographer:</span>
                  <p className="text-green-700 font-medium">{selectedPhotographer.name}</p>
                  <p className="text-green-600">{selectedPhotographer.email}</p>
                </div>
                <div>
                  <span className="text-green-800">Schedule:</span>
                  <p className="text-green-700">
                    {assignmentData.scheduled_time && 
                      new Date(assignmentData.scheduled_time).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    }
                  </p>
                  <p className="text-green-600">{assignmentData.duration_minutes} minutes</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}