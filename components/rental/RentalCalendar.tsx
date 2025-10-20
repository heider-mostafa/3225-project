'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Clock,
  Ban,
  CheckCircle,
  Settings,
  Eye,
  Users,
  Star,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';

interface RentalBooking {
  id: string;
  check_in_date: string;
  check_out_date: string;
  guest_user_id: string;
  number_of_guests: number;
  booking_status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'completed';
  total_amount: number;
  guest_email?: string;
}

interface CalendarDay {
  date: string;
  is_available: boolean;
  nightly_rate?: number;
  minimum_stay?: number;
  special_pricing_reason?: string;
  is_special_pricing?: boolean;
  booking_id?: string;
}

interface RentalCalendarProps {
  listingId: string;
  defaultRate: number;
  minimumStay: number;
  bookings: RentalBooking[];
  calendar: CalendarDay[];
  onDateUpdate: (date: string, updates: Partial<CalendarDay>) => Promise<void>;
  onBulkUpdate: (startDate: string, endDate: string, updates: Partial<CalendarDay>) => Promise<void>;
  readOnly?: boolean;
}

type ViewMode = 'month' | 'week';
type SelectionMode = 'single' | 'range' | 'bulk';

export function RentalCalendar({
  listingId,
  defaultRate,
  minimumStay,
  bookings,
  calendar,
  onDateUpdate,
  onBulkUpdate,
  readOnly = false
}: RentalCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('single');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedRange, setSelectedRange] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });
  const [isUpdating, setIsUpdating] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);

  // Bulk update form state
  const [bulkUpdates, setBulkUpdates] = useState({
    is_available: true,
    nightly_rate: defaultRate,
    minimum_stay: minimumStay,
    special_pricing_reason: '',
    is_special_pricing: false
  });

  // Get calendar data for a specific date
  const getCalendarData = useCallback((date: string): CalendarDay => {
    const existingData = calendar.find(day => day.date === date);
    return existingData || {
      date,
      is_available: true,
      nightly_rate: defaultRate,
      minimum_stay: minimumStay
    };
  }, [calendar, defaultRate, minimumStay]);

  // Get booking for a specific date
  const getBookingForDate = useCallback((date: string): RentalBooking | undefined => {
    return bookings.find(booking => {
      const checkIn = new Date(booking.check_in_date);
      const checkOut = new Date(booking.check_out_date);
      const currentDate = new Date(date);
      return currentDate >= checkIn && currentDate < checkOut;
    });
  }, [bookings]);

  // Generate calendar days for current month
  const generateCalendarDays = useCallback(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = addDays(monthStart, -monthStart.getDay()); // Start from Sunday
    const endDate = addDays(monthEnd, 6 - monthEnd.getDay()); // End on Saturday

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // Handle date click
  const handleDateClick = (dateStr: string) => {
    if (readOnly) return;

    const date = new Date(dateStr);
    if (date < new Date()) return; // Can't select past dates

    if (selectionMode === 'single') {
      setSelectedDates([dateStr]);
    } else if (selectionMode === 'range') {
      if (!selectedRange.start || selectedRange.end) {
        // Start new range
        setSelectedRange({ start: dateStr, end: null });
      } else {
        // Complete range
        const start = new Date(selectedRange.start);
        const end = new Date(dateStr);
        if (end >= start) {
          setSelectedRange({ start: selectedRange.start, end: dateStr });
        } else {
          setSelectedRange({ start: dateStr, end: selectedRange.start });
        }
      }
    } else if (selectionMode === 'bulk') {
      setSelectedDates(prev => 
        prev.includes(dateStr) 
          ? prev.filter(d => d !== dateStr)
          : [...prev, dateStr]
      );
    }
  };

  // Quick actions
  const blockDates = async () => {
    setIsUpdating(true);
    try {
      const datesToUpdate = selectionMode === 'range' && selectedRange.start && selectedRange.end
        ? eachDayOfInterval({ 
            start: new Date(selectedRange.start), 
            end: new Date(selectedRange.end) 
          }).map(d => format(d, 'yyyy-MM-dd'))
        : selectedDates;

      for (const date of datesToUpdate) {
        await onDateUpdate(date, { is_available: false });
      }
      
      clearSelection();
    } catch (error) {
      console.error('Failed to block dates:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const unblockDates = async () => {
    setIsUpdating(true);
    try {
      const datesToUpdate = selectionMode === 'range' && selectedRange.start && selectedRange.end
        ? eachDayOfInterval({ 
            start: new Date(selectedRange.start), 
            end: new Date(selectedRange.end) 
          }).map(d => format(d, 'yyyy-MM-dd'))
        : selectedDates;

      for (const date of datesToUpdate) {
        await onDateUpdate(date, { is_available: true });
      }
      
      clearSelection();
    } catch (error) {
      console.error('Failed to unblock dates:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const clearSelection = () => {
    setSelectedDates([]);
    setSelectedRange({ start: null, end: null });
  };

  // Bulk update handler
  const handleBulkUpdate = async () => {
    if (!selectedRange.start || !selectedRange.end) return;

    setIsUpdating(true);
    try {
      await onBulkUpdate(selectedRange.start, selectedRange.end, {
        is_available: bulkUpdates.is_available,
        nightly_rate: bulkUpdates.nightly_rate,
        minimum_stay: bulkUpdates.minimum_stay,
        special_pricing_reason: bulkUpdates.special_pricing_reason || undefined,
        is_special_pricing: bulkUpdates.is_special_pricing
      });
      
      setShowBulkDialog(false);
      clearSelection();
    } catch (error) {
      console.error('Failed to bulk update:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Get date cell styling
  const getDateCellStyling = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const calendarData = getCalendarData(dateStr);
    const booking = getBookingForDate(dateStr);
    const isSelected = selectedDates.includes(dateStr);
    const isInRange = selectedRange.start && selectedRange.end && 
      date >= new Date(selectedRange.start) && date <= new Date(selectedRange.end);
    const isPast = date < new Date();
    const isCurrentMonth = isSameMonth(date, currentDate);

    let baseStyle = "relative w-10 h-10 flex items-center justify-center text-sm cursor-pointer border border-gray-200 ";

    // Past dates
    if (isPast) {
      baseStyle += "bg-gray-100 text-gray-400 cursor-not-allowed ";
    }
    // Today
    else if (isToday(date)) {
      baseStyle += "ring-2 ring-blue-500 ";
    }

    // Current month vs other months
    if (!isCurrentMonth) {
      baseStyle += "text-gray-300 ";
    }

    // Booking status
    if (booking && !isPast) {
      switch (booking.booking_status) {
        case 'confirmed':
        case 'checked_in':
          baseStyle += "bg-green-100 text-green-800 border-green-300 ";
          break;
        case 'pending':
          baseStyle += "bg-yellow-100 text-yellow-800 border-yellow-300 ";
          break;
        case 'cancelled':
          baseStyle += "bg-gray-100 text-gray-600 border-gray-300 ";
          break;
        default:
          baseStyle += "bg-blue-100 text-blue-800 border-blue-300 ";
      }
    }
    // Availability
    else if (!calendarData.is_available && !isPast) {
      baseStyle += "bg-red-100 text-red-800 border-red-300 ";
    }
    // Special pricing
    else if (calendarData.is_special_pricing && !isPast) {
      baseStyle += "bg-purple-100 text-purple-800 border-purple-300 ";
    }
    // Available
    else if (calendarData.is_available && !isPast && isCurrentMonth) {
      baseStyle += "bg-white hover:bg-gray-50 ";
    }

    // Selection states
    if (isSelected) {
      baseStyle += "ring-2 ring-blue-500 bg-blue-50 ";
    } else if (isInRange) {
      baseStyle += "bg-blue-50 ";
    }

    return baseStyle;
  };

  const days = generateCalendarDays();
  const hasSelection = selectedDates.length > 0 || (selectedRange.start && selectedRange.end);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              Rental Calendar
            </CardTitle>
            <CardDescription>
              Manage availability, pricing, and view bookings
            </CardDescription>
          </div>
          
          {!readOnly && (
            <div className="flex items-center gap-2">
              <Select value={selectionMode} onValueChange={(value) => setSelectionMode(value as SelectionMode)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="range">Range</SelectItem>
                  <SelectItem value="bulk">Multiple</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h3 className="text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Actions */}
        {!readOnly && hasSelection && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={unblockDates} disabled={isUpdating}>
              <CheckCircle className="h-3 w-3 mr-1" />
              Make Available
            </Button>
            <Button size="sm" variant="outline" onClick={blockDates} disabled={isUpdating}>
              <Ban className="h-3 w-3 mr-1" />
              Block Dates
            </Button>
            {selectedRange.start && selectedRange.end && (
              <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Settings className="h-3 w-3 mr-1" />
                    Bulk Update
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bulk Update Settings</DialogTitle>
                    <DialogDescription>
                      Update settings for selected date range: {selectedRange.start} to {selectedRange.end}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Available for booking</Label>
                      <Switch
                        checked={bulkUpdates.is_available}
                        onCheckedChange={(checked) => setBulkUpdates(prev => ({ ...prev, is_available: checked }))}
                      />
                    </div>
                    
                    <div>
                      <Label>Nightly Rate (EGP)</Label>
                      <Input
                        type="number"
                        value={bulkUpdates.nightly_rate}
                        onChange={(e) => setBulkUpdates(prev => ({ ...prev, nightly_rate: Number(e.target.value) }))}
                      />
                    </div>
                    
                    <div>
                      <Label>Minimum Stay (nights)</Label>
                      <Input
                        type="number"
                        value={bulkUpdates.minimum_stay}
                        onChange={(e) => setBulkUpdates(prev => ({ ...prev, minimum_stay: Number(e.target.value) }))}
                        min="1"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>Special Pricing</Label>
                      <Switch
                        checked={bulkUpdates.is_special_pricing}
                        onCheckedChange={(checked) => setBulkUpdates(prev => ({ ...prev, is_special_pricing: checked }))}
                      />
                    </div>
                    
                    {bulkUpdates.is_special_pricing && (
                      <div>
                        <Label>Special Pricing Reason</Label>
                        <Textarea
                          value={bulkUpdates.special_pricing_reason}
                          onChange={(e) => setBulkUpdates(prev => ({ ...prev, special_pricing_reason: e.target.value }))}
                          placeholder="Holiday, event, peak season, etc."
                        />
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleBulkUpdate} disabled={isUpdating} className="flex-1">
                        {isUpdating ? 'Updating...' : 'Apply Changes'}
                      </Button>
                      <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              Clear Selection
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Calendar Grid */}
        <div className="space-y-4">
          {/* Week Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="w-10 h-8 flex items-center justify-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const calendarData = getCalendarData(dateStr);
              const booking = getBookingForDate(dateStr);
              
              return (
                <div
                  key={index}
                  className={getDateCellStyling(date)}
                  onClick={() => handleDateClick(dateStr)}
                  title={
                    booking 
                      ? `Booked by ${booking.guest_email || 'Guest'} - ${booking.booking_status}`
                      : !calendarData.is_available 
                        ? 'Blocked' 
                        : `Available - ${calendarData.nightly_rate || defaultRate} EGP/night`
                  }
                >
                  <span className="z-10">{format(date, 'd')}</span>
                  
                  {/* Rate indicator */}
                  {calendarData.nightly_rate && calendarData.nightly_rate !== defaultRate && (
                    <div className="absolute bottom-0 left-0 right-0 text-xs bg-purple-600 text-white px-1 leading-tight">
                      {calendarData.nightly_rate}
                    </div>
                  )}
                  
                  {/* Booking indicator */}
                  {booking && (
                    <div className="absolute top-0 right-0 w-2 h-2 bg-current rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Legend</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span>Blocked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
              <span>Special Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 ring-2 ring-blue-500 rounded"></div>
              <span>Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
              <span>Past Date</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 ring-2 ring-blue-500 rounded"></div>
              <span>Selected</span>
            </div>
          </div>
        </div>

        {/* Booking Summary */}
        {bookings.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Upcoming Bookings ({bookings.filter(b => new Date(b.check_in_date) >= new Date()).length})
            </h4>
            <div className="space-y-2">
              {bookings
                .filter(booking => new Date(booking.check_in_date) >= new Date())
                .slice(0, 3)
                .map(booking => (
                  <div key={booking.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(booking.check_in_date), 'MMM dd')} - {format(new Date(booking.check_out_date), 'MMM dd')}
                      </p>
                      <p className="text-xs text-gray-600">
                        {booking.number_of_guests} guests • {booking.total_amount.toLocaleString()} EGP
                      </p>
                    </div>
                    <Badge variant={
                      booking.booking_status === 'confirmed' ? 'default' :
                      booking.booking_status === 'pending' ? 'secondary' :
                      'outline'
                    }>
                      {booking.booking_status}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}