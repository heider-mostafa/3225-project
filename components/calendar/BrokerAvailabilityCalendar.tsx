'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, User, Star, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { 
  Broker, 
  BrokerAvailabilityCalendarProps, 
  CalendarDay, 
  TimeSlot,
  PropertyBrokersResponse,
  AvailableSlotsResponse
} from '@/types/broker';

export default function BrokerAvailabilityCalendar({
  propertyId,
  selectedBrokerId,
  onTimeSelected,
  onBrokerChange,
  minDate,
  maxDate,
  className
}: BrokerAvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [activeBroker, setActiveBroker] = useState<Broker | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlotsResponse['slots']>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate calendar days for current month
  const getCalendarDays = useCallback((): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Add previous month's trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(firstDayOfMonth);
      date.setDate(date.getDate() - (i + 1));
      days.push({
        date: date.toISOString().split('T')[0],
        dayOfMonth: date.getDate(),
        isToday: false,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isPast: date < today,
        hasAvailability: false,
        timeSlots: []
      });
    }
    
    // Add current month's days
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      
      // Check if date is within allowed range
      const isInRange = (!minDate || dateString >= minDate) && 
                       (!maxDate || dateString <= maxDate);
      
      days.push({
        date: dateString,
        dayOfMonth: day,
        isToday: date.getTime() === today.getTime(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isPast: date < today || !isInRange,
        hasAvailability: false, // Will be updated when slots are loaded
        timeSlots: []
      });
    }
    
    // Add next month's leading days to complete the grid
    const totalCells = 42; // 6 weeks × 7 days
    const remainingCells = totalCells - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date: date.toISOString().split('T')[0],
        dayOfMonth: day,
        isToday: false,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isPast: true,
        hasAvailability: false,
        timeSlots: []
      });
    }
    
    return days;
  }, [currentDate, minDate, maxDate]);

  // Load brokers for the property
  const loadBrokers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/properties/${propertyId}/brokers`);
      const data: PropertyBrokersResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load brokers');
      }
      
      setBrokers(data.brokers as any);
      
      // Set active broker
      if (selectedBrokerId) {
        const selectedBroker = data.brokers.find(b => b.id === selectedBrokerId);
        if (selectedBroker) {
          setActiveBroker(selectedBroker as any);
        }
      } else if (data.brokers.length > 0) {
        // Default to primary broker or first available
        const primaryBroker = data.brokers.find(b => (b as any).is_primary);
        setActiveBroker((primaryBroker || data.brokers[0]) as any);
      }
      
    } catch (err) {
      console.error('Error loading brokers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load brokers');
    } finally {
      setLoading(false);
    }
  }, [propertyId, selectedBrokerId]);

  // Load available time slots for a date
  const loadAvailableSlots = useCallback(async (date: string) => {
    if (!date) return;
    
    try {
      setSlotsLoading(true);
      
      const url = new URL(`/api/properties/${propertyId}/available-slots`, window.location.origin);
      url.searchParams.set('date', date);
      if (activeBroker) {
        url.searchParams.set('broker_id', activeBroker.id);
      }
      
      const response = await fetch(url.toString());
      const data: AvailableSlotsResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load available slots');
      }
      
      // If no slots returned but we have brokers, provide fallback slots
      if (data.slots.length === 0 && brokers.length > 0) {
        console.warn('No availability data found, providing fallback slots');
        const fallbackSlots = brokers.map(broker => ({
          broker_id: broker.id,
          broker: broker,
          is_primary: (broker as any).is_primary || false,
          timeSlots: [
            { time: '09:00', available: true, maxBookings: 1, currentBookings: 0, broker_id: broker.id, availability_id: 'fallback-1', duration_minutes: 60, booking_type: 'property_viewing', notes: '' },
            { time: '11:00', available: true, maxBookings: 1, currentBookings: 0, broker_id: broker.id, availability_id: 'fallback-2', duration_minutes: 60, booking_type: 'property_viewing', notes: '' },
            { time: '14:00', available: true, maxBookings: 1, currentBookings: 0, broker_id: broker.id, availability_id: 'fallback-3', duration_minutes: 60, booking_type: 'property_viewing', notes: '' },
            { time: '16:00', available: true, maxBookings: 1, currentBookings: 0, broker_id: broker.id, availability_id: 'fallback-4', duration_minutes: 60, booking_type: 'property_viewing', notes: '' }
          ]
        }));
        setAvailableSlots(fallbackSlots);
      } else {
      setAvailableSlots(data.slots);
      }
      
    } catch (err) {
      console.error('Error loading slots:', err);
      
      // Provide fallback slots if we have brokers
      if (brokers.length > 0) {
        console.warn('API failed, providing fallback slots for date:', date);
        const fallbackSlots = brokers.map(broker => ({
          broker_id: broker.id,
          broker: broker,
          is_primary: (broker as any).is_primary || false,
          timeSlots: [
            { time: '09:00', available: true, maxBookings: 1, currentBookings: 0, broker_id: broker.id, availability_id: 'fallback-1', duration_minutes: 60, booking_type: 'property_viewing', notes: '' },
            { time: '11:00', available: true, maxBookings: 1, currentBookings: 0, broker_id: broker.id, availability_id: 'fallback-2', duration_minutes: 60, booking_type: 'property_viewing', notes: '' },
            { time: '14:00', available: true, maxBookings: 1, currentBookings: 0, broker_id: broker.id, availability_id: 'fallback-3', duration_minutes: 60, booking_type: 'property_viewing', notes: '' },
            { time: '16:00', available: true, maxBookings: 1, currentBookings: 0, broker_id: broker.id, availability_id: 'fallback-4', duration_minutes: 60, booking_type: 'property_viewing', notes: '' }
          ]
        }));
        setAvailableSlots(fallbackSlots);
      } else {
      setAvailableSlots([]);
      }
    } finally {
      setSlotsLoading(false);
    }
  }, [propertyId, activeBroker, brokers]);

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
    setSelectedDate(null); // Clear selection when changing months
  };

  // Handle date selection
  const handleDateSelect = (day: CalendarDay) => {
    if (day.isPast) return;
    
    setSelectedDate(day.date);
    loadAvailableSlots(day.date);
  };

  // Handle broker change
  const handleBrokerChange = (broker: Broker) => {
    setActiveBroker(broker);
    onBrokerChange?.(broker);
    
    // Reload slots if a date is selected
    if (selectedDate) {
      loadAvailableSlots(selectedDate);
    }
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (!activeBroker || !selectedDate) return;
    onTimeSelected(activeBroker, selectedDate, slot.time);
  };

  // Load brokers on mount
  useEffect(() => {
    loadBrokers();
  }, [loadBrokers]);

  // Format month/year display
  const monthYearDisplay = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  const calendarDays = getCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedule a Viewing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedule a Viewing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadBrokers} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (brokers.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedule a Viewing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-600">No brokers available for this property.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Schedule a Viewing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Broker Selection */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Choose Your Broker</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {brokers.map((broker: any) => (
              <div
                key={broker.id}
                onClick={() => handleBrokerChange(broker)}
                className={cn(
                  "p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md",
                  activeBroker?.id === broker.id 
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200" 
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    {broker.photo_url ? (
                      <img 
                        src={broker.photo_url} 
                        alt={broker.full_name || 'Broker'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {broker.full_name || 'Unknown Broker'}
                      </h4>
                      {broker.is_primary && (
                        <Badge variant="secondary" className="text-xs">
                          Primary
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600">
                        {broker.rating ? broker.rating.toFixed(1) : '0.0'} ({broker.total_reviews || 0} reviews)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{broker.years_experience || 0}+ years</span>
                      <span>•</span>
                      <span>{broker.specialties ? broker.specialties.join(', ') : 'General'}</span>
                    </div>
                    {broker.has_availability && (
                      <div className="flex items-center gap-1 mt-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">
                          {broker.next_available_slots || 0} slots available
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Select Date</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-medium text-gray-900 min-w-[140px] text-center">
                {monthYearDisplay}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const isCurrentMonth = day.dayOfMonth <= 31 && 
                  index >= new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() &&
                  index < new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() + 
                         new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                
                return (
                  <button
                    key={day.date}
                    onClick={() => handleDateSelect(day)}
                    disabled={day.isPast || !isCurrentMonth}
                    className={cn(
                      "p-2 text-sm rounded-md transition-colors relative",
                      {
                        // Current month days
                        "hover:bg-gray-100": isCurrentMonth && !day.isPast && selectedDate !== day.date,
                        "bg-blue-600 text-white": selectedDate === day.date,
                        "bg-blue-50 text-blue-600": day.isToday && selectedDate !== day.date,
                        "text-gray-900": isCurrentMonth && !day.isPast && !day.isToday,
                        
                        // Disabled states
                        "text-gray-300 cursor-not-allowed": day.isPast || !isCurrentMonth,
                        
                        // Weekend styling
                        "text-red-600": day.isWeekend && isCurrentMonth && !day.isPast && selectedDate !== day.date && !day.isToday,
                      }
                    )}
                  >
                    {day.dayOfMonth}
                    {day.hasAvailability && isCurrentMonth && !day.isPast && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                        <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Time Slots */}
        {selectedDate && activeBroker && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <h3 className="font-medium text-gray-900">
                Available Times - {new Date(selectedDate).toLocaleDateString()}
              </h3>
            </div>
            
            {slotsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No available time slots for this date.</p>
                <p className="text-sm text-gray-500 mt-1">
                  Try selecting a different date or broker.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableSlots.map((brokerSlots) => (
                  <div key={brokerSlots.broker_id}>
                    {brokerSlots.timeSlots.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {brokerSlots.timeSlots.map((slot) => (
                          <Button
                            key={`${slot.broker_id}-${slot.time}`}
                            variant={slot.available ? "outline" : "ghost"}
                            size="sm"
                            onClick={() => handleTimeSlotSelect(slot)}
                            disabled={!slot.available}
                            className={cn(
                              "text-sm",
                              slot.available 
                                ? "hover:bg-blue-50 hover:border-blue-300" 
                                : "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {slot.time}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 