'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { 
  Clock, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Coffee,
  MessageSquare,
  Phone,
  Globe,
  Timer,
  MapPin,
  AlertCircle,
  CalendarCheck,
  Settings,
  Edit,
  Save,
  X,
  Plus
} from 'lucide-react';

interface AvailabilitySlot {
  id: string;
  appraiser_id: string;
  day_of_week: number; // 0=Sunday, 1=Monday, etc.
  start_time: string;
  end_time: string;
  is_available: boolean;
  timezone: string;
  break_start_time?: string;
  break_end_time?: string;
  notes?: string;
}

interface ProfileAvailabilityTabProps {
  appraiser_id: string;
  availability_schedule: AvailabilitySlot[];
  response_time_hours: number;
  timezone: string;
  emergency_available: boolean;
  booking_advance_days: number;
  service_areas: string[];
  contact_preferences: {
    phone: boolean;
    email: boolean;
    whatsapp: boolean;
  };
  isManagementMode?: boolean; // Added for dashboard vs public profile
  onBookAppraisal?: () => void; // Callback for booking button
  onQuickMessage?: () => void; // Callback for message button
  appraiserName?: string; // For messaging context
}

export function ProfileAvailabilityTab({ 
  appraiser_id, 
  availability_schedule,
  response_time_hours,
  timezone,
  emergency_available,
  booking_advance_days,
  service_areas,
  contact_preferences,
  isManagementMode = false,
  onBookAppraisal,
  onQuickMessage,
  appraiserName = 'Appraiser'
}: ProfileAvailabilityTabProps) {
  const { t } = useTranslation();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  // Management mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<AvailabilitySlot[]>(availability_schedule);
  const [editingSettings, setEditingSettings] = useState({
    response_time_hours,
    emergency_available,
    booking_advance_days,
    contact_preferences
  });
  const [saving, setSaving] = useState(false);

  const dayNames = [
    t('appraiserDashboard.sunday'), t('appraiserDashboard.monday'), t('appraiserDashboard.tuesday'), t('appraiserDashboard.wednesday'), 
    t('appraiserDashboard.thursday'), t('appraiserDashboard.friday'), t('appraiserDashboard.saturday')
  ];

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const hour24 = parseInt(hours);
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      const hour12 = hour24 % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  const getCurrentDayStatus = () => {
    const today = new Date().getDay();
    const todaySchedule = availability_schedule.find(slot => slot.day_of_week === today);
    
    if (!todaySchedule || !todaySchedule.is_available) {
      return { status: 'closed', message: t('appraiserDashboard.closedToday') };
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (currentTime >= todaySchedule.start_time && currentTime <= todaySchedule.end_time) {
      // Check if it's during break time
      if (todaySchedule.break_start_time && todaySchedule.break_end_time &&
          currentTime >= todaySchedule.break_start_time && currentTime <= todaySchedule.break_end_time) {
        return { status: 'break', message: 'On break - Back at ' + formatTime(todaySchedule.break_end_time) };
      }
      return { status: 'open', message: t('appraiserDashboard.availableNow') };
    } else if (currentTime < todaySchedule.start_time) {
      return { status: 'opening', message: t('appraiserDashboard.opensAt', { time: formatTime(todaySchedule.start_time) }) };
    } else {
      return { status: 'closed', message: t('appraiserDashboard.closedForToday') };
    }
  };

  const getNextAvailableDay = () => {
    const today = new Date().getDay();
    for (let i = 1; i <= 7; i++) {
      const dayIndex = (today + i) % 7;
      const daySchedule = availability_schedule.find(slot => slot.day_of_week === dayIndex && slot.is_available);
      if (daySchedule) {
        return {
          day: dayNames[dayIndex],
          time: formatTime(daySchedule.start_time)
        };
      }
    }
    return null;
  };

  const currentStatus = getCurrentDayStatus();
  const nextAvailable = getNextAvailableDay();

  // Management functions
  const handleSaveAvailability = async () => {
    setSaving(true);
    
    try {
      // Save availability schedule
      const response = await fetch(`/api/appraisers/${appraiser_id}/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          availability_schedule: editingSchedule,
          settings: editingSettings
        }),
      });

      if (response.ok) {
        toast.success('Availability updated successfully!');
        setIsEditing(false);
        
        // Update the displayed data to match what we just saved
        // This ensures the dashboard shows the updated availability immediately
        console.log('✅ Availability saved, updating display with:', editingSchedule);
        
        // Force a re-render by updating the component's data
        window.location.reload(); // Simple solution - refresh the page
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update availability');
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Failed to update availability. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingSchedule(availability_schedule);
    setEditingSettings({
      response_time_hours,
      emergency_available,
      booking_advance_days,
      contact_preferences
    });
    setIsEditing(false);
  };

  const updateDaySchedule = (dayIndex: number, updates: Partial<AvailabilitySlot>) => {
    setEditingSchedule(prev => {
      const existing = prev.find(slot => slot.day_of_week === dayIndex);
      if (existing) {
        return prev.map(slot => 
          slot.day_of_week === dayIndex 
            ? { ...slot, ...updates }
            : slot
        );
      } else {
        // Create new slot for this day
        const newSlot: AvailabilitySlot = {
          id: `new-${dayIndex}`,
          appraiser_id,
          day_of_week: dayIndex,
          start_time: '09:00',
          end_time: '17:00',
          is_available: true,
          timezone,
          ...updates
        };
        return [...prev, newSlot];
      }
    });
  };

  const renderCurrentStatus = () => (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              currentStatus.status === 'open' ? 'bg-green-100' :
              currentStatus.status === 'break' ? 'bg-yellow-100' :
              currentStatus.status === 'opening' ? 'bg-blue-100' :
              'bg-gray-100'
            }`}>
              {currentStatus.status === 'open' ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : currentStatus.status === 'break' ? (
                <Coffee className="h-6 w-6 text-yellow-600" />
              ) : currentStatus.status === 'opening' ? (
                <Clock className="h-6 w-6 text-blue-600" />
              ) : (
                <XCircle className="h-6 w-6 text-gray-600" />
              )}
            </div>
            
            <div>
              <h3 className={`text-lg font-semibold ${
                currentStatus.status === 'open' ? 'text-green-600' :
                currentStatus.status === 'break' ? 'text-yellow-600' :
                currentStatus.status === 'opening' ? 'text-blue-600' :
                'text-gray-600'
              }`}>
                {currentStatus.message}
              </h3>
              <p className="text-gray-600 text-sm">
                {currentStatus.status === 'open' 
                  ? `Typically responds within ${response_time_hours} hours`
                  : nextAvailable 
                    ? t('appraiserDashboard.nextAvailable', { day: nextAvailable.day, time: nextAvailable.time })
                    : 'Contact for availability'
                }
              </p>
            </div>
          </div>
          
          {!isManagementMode && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="flex items-center gap-2"
                onClick={onBookAppraisal || (() => toast.info(t('appraiserDashboard.bookingSystemWillOpen')))}
              >
                <CalendarCheck className="h-4 w-4" />
                {t('appraiserDashboard.bookAppraisal')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={onQuickMessage || (() => toast.info(t('appraiserDashboard.messagingSystemWillOpen')))}
              >
                <MessageSquare className="h-4 w-4" />
                {t('appraiserDashboard.quickMessage')}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderWeeklySchedule = () => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('appraiserDashboard.weeklySchedule')}
            </CardTitle>
            <CardDescription>
              {t('appraiserDashboard.allTimesShownIn', { timezone })}
            </CardDescription>
          </div>
          {isManagementMode && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveAvailability} disabled={saving}>
                    {saving ? (
                      <Settings className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit Schedule
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dayNames.map((day, index) => {
            const daySchedule = (isEditing ? editingSchedule : availability_schedule).find(slot => slot.day_of_week === index);
            const isToday = new Date().getDay() === index;
            
            return (
              <div 
                key={day}
                className={`p-3 rounded-lg border transition-colors ${
                  isToday ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                } ${selectedDay === index ? 'ring-2 ring-blue-500' : ''} ${
                  isEditing ? 'border-dashed' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-16 text-sm font-medium">
                      {day}
                      {isToday && <Badge variant="secondary" className="ml-2 text-xs">Today</Badge>}
                    </div>
                    
                    {isEditing ? (
                      // Edit mode controls
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={daySchedule?.is_available || false}
                            onCheckedChange={(checked) => 
                              updateDaySchedule(index, { is_available: checked })
                            }
                          />
                          <Label className="text-sm">{t('appraiserDashboard.available')}</Label>
                        </div>
                        
                        {daySchedule?.is_available && (
                          <>
                            <div className="flex items-center gap-2">
                              <Input
                                type="time"
                                value={daySchedule.start_time}
                                onChange={(e) => 
                                  updateDaySchedule(index, { start_time: e.target.value })
                                }
                                className="w-24 h-8"
                              />
                              <span className="text-xs text-gray-500">to</span>
                              <Input
                                type="time"
                                value={daySchedule.end_time}
                                onChange={(e) => 
                                  updateDaySchedule(index, { end_time: e.target.value })
                                }
                                className="w-24 h-8"
                              />
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedDay(selectedDay === index ? null : index)}
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    ) : (
                      // Display mode
                      daySchedule && daySchedule.is_available ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">
                            {formatTime(daySchedule.start_time)} - {formatTime(daySchedule.end_time)}
                          </span>
                          {daySchedule.break_start_time && (
                            <span className="text-xs text-gray-500">
                              ({t('appraiserDashboard.breakTime', { start: formatTime(daySchedule.break_start_time), end: formatTime(daySchedule.break_end_time!) })})
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">{t('appraiserDashboard.closed')}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
                
                {/* Extended controls when day is selected in edit mode */}
                {isEditing && selectedDay === index && daySchedule?.is_available && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">{t('appraiserDashboard.breakStart')}</Label>
                        <Input
                          type="time"
                          value={daySchedule.break_start_time || ''}
                          onChange={(e) => 
                            updateDaySchedule(index, { break_start_time: e.target.value || undefined })
                          }
                          className="h-8"
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">{t('appraiserDashboard.breakEnd')}</Label>
                        <Input
                          type="time"
                          value={daySchedule.break_end_time || ''}
                          onChange={(e) => 
                            updateDaySchedule(index, { break_end_time: e.target.value || undefined })
                          }
                          className="h-8"
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Notes</Label>
                      <Textarea
                        value={daySchedule.notes || ''}
                        onChange={(e) => 
                          updateDaySchedule(index, { notes: e.target.value || undefined })
                        }
                        className="h-16 text-xs"
                        placeholder="Special instructions for this day..."
                      />
                    </div>
                  </div>
                )}
                
                {!isEditing && daySchedule?.notes && (
                  <div className="text-xs text-gray-500 max-w-xs truncate mt-2">
                    {daySchedule.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {selectedDay !== null && availability_schedule.find(slot => slot.day_of_week === selectedDay)?.notes && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{dayNames[selectedDay]} Notes:</strong>{' '}
              {availability_schedule.find(slot => slot.day_of_week === selectedDay)?.notes}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderBookingInfo = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Response Time & Booking Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            {t('appraiserDashboard.responseAndBooking')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{t('appraiserDashboard.averageResponseTime')}</span>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="font-medium">{response_time_hours} hours</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{t('appraiserDashboard.bookingAdvanceNotice')}</span>
            <span className="font-medium">{booking_advance_days} days</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Emergency Services</span>
            <div className="flex items-center gap-1">
              {emergency_available ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-green-600">{t('appraiserDashboard.available')}</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-500">{t('appraiserDashboard.notAvailable')}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{t('appraiserDashboard.timezoneLabel')}</span>
            <div className="flex items-center gap-1">
              <Globe className="h-4 w-4 text-blue-500" />
              <span className="font-medium">{timezone}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            {t('appraiserDashboard.contactPreferences')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('appraiserDashboard.phoneCallsLabel')}</span>
              {contact_preferences.phone ? (
                <Badge className="bg-green-100 text-green-800">{t('appraiserDashboard.preferred')}</Badge>
              ) : (
                <Badge variant="outline">{t('appraiserDashboard.notPreferred')}</Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('appraiserDashboard.emailLabel')}</span>
              {contact_preferences.email ? (
                <Badge className="bg-blue-100 text-blue-800">{t('appraiserDashboard.available')}</Badge>
              ) : (
                <Badge variant="outline">{t('appraiserDashboard.notAvailable')}</Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('appraiserDashboard.whatsappLabel')}</span>
              {contact_preferences.whatsapp ? (
                <Badge className="bg-green-100 text-green-800">{t('appraiserDashboard.available')}</Badge>
              ) : (
                <Badge variant="outline">{t('appraiserDashboard.notAvailable')}</Badge>
              )}
            </div>
          </div>

          {service_areas && service_areas.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{t('appraiserDashboard.serviceAreas')}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {service_areas.slice(0, 3).map((area, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {area}
                  </Badge>
                ))}
                {service_areas.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{service_areas.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Current Status */}
      {renderCurrentStatus()}

      {/* Booking Information */}
      {renderBookingInfo()}

      {/* Weekly Schedule */}
      {renderWeeklySchedule()}

      {/* Important Notes */}
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <strong>{t('appraiserDashboard.bookingGuidelines', { days: booking_advance_days })}</strong> 
          {emergency_available 
            ? ' Emergency services are available with additional fees.' 
            : ' Emergency services are not currently offered.'
          } Contact directly for urgent requests or questions about availability.
        </AlertDescription>
      </Alert>
    </div>
  );
}