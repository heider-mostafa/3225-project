'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar,
  Download,
  ExternalLink,
  Clock,
  MapPin,
  User
} from 'lucide-react';
import { CalendarService } from '@/lib/services/calendar-service';

interface BookingDetails {
  id: string;
  appraiser_name: string;
  appraiser_email: string;
  client_name: string;
  client_email: string;
  property_address?: string;
  booking_type: string;
  preferred_date: string;
  preferred_time: string;
  duration_hours?: number;
  special_requirements?: string;
  confirmation_number: string;
}

interface CalendarIntegrationProps {
  booking: BookingDetails;
  showTitle?: boolean;
  compact?: boolean;
}

export function CalendarIntegration({ 
  booking, 
  showTitle = true, 
  compact = false 
}: CalendarIntegrationProps) {
  const calendarOptions = CalendarService.generateCalendarOptions(booking);
  
  const handleDownloadIcs = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const icsContent = calendarOptions.ics.content;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = calendarOptions.ics.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  };

  const appointmentDate = new Date(`${booking.preferred_date}T${booking.preferred_time}`);
  
  if (compact) {
    return (
      <div className="space-y-3">
        {showTitle && (
          <h4 className="font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Add to Calendar
          </h4>
        )}
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(calendarOptions.google.url, '_blank')}
          >
            📅 Google
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(calendarOptions.outlook.url, '_blank')}
          >
            📅 Outlook
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadIcs}
          >
            <Download className="h-3 w-3 mr-1" />
            .ics
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Add to Your Calendar
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent className="space-y-4">
        {/* Appointment Summary */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="font-medium">
              {appointmentDate.toLocaleDateString('en-EG', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
            <span className="text-gray-600">
              at {appointmentDate.toLocaleTimeString('en-EG', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>with {booking.appraiser_name}</span>
          </div>
          
          {booking.property_address && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{booking.property_address}</span>
            </div>
          )}
        </div>

        {/* Calendar Options */}
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Choose your preferred calendar app to add this appointment:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => window.open(calendarOptions.google.url, '_blank')}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">📅</div>
                <div className="text-left">
                  <div className="font-medium">Google Calendar</div>
                  <div className="text-xs text-gray-500">Opens in new tab</div>
                </div>
                <ExternalLink className="h-4 w-4 ml-auto" />
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => window.open(calendarOptions.outlook.url, '_blank')}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">📅</div>
                <div className="text-left">
                  <div className="font-medium">Outlook</div>
                  <div className="text-xs text-gray-500">Opens in new tab</div>
                </div>
                <ExternalLink className="h-4 w-4 ml-auto" />
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={handleDownloadIcs}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🍎</div>
                <div className="text-left">
                  <div className="font-medium">Apple Calendar</div>
                  <div className="text-xs text-gray-500">Download .ics file</div>
                </div>
                <Download className="h-4 w-4 ml-auto" />
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={handleDownloadIcs}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">📄</div>
                <div className="text-left">
                  <div className="font-medium">Other Calendar</div>
                  <div className="text-xs text-gray-500">Download .ics file</div>
                </div>
                <Download className="h-4 w-4 ml-auto" />
              </div>
            </Button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
          <p className="flex items-start gap-2">
            <span>ℹ️</span>
            <span>
              A calendar invitation with appointment details has been sent to your email. 
              You can also use the options above to manually add this appointment to your calendar.
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}