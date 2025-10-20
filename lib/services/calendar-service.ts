// Calendar Integration Service
// Supports Google Calendar, Outlook, and Apple Calendar event creation

interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  attendees?: string[];
  organizer?: {
    name: string;
    email: string;
  };
}

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

export class CalendarService {
  private static formatDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  private static createEvent(booking: BookingDetails): CalendarEvent {
    const startDate = new Date(`${booking.preferred_date}T${booking.preferred_time || '09:00'}`);
    const endDate = new Date(startDate.getTime() + (booking.duration_hours || 2) * 60 * 60 * 1000);

    const title = `Property Appraisal - ${booking.client_name}`;
    const description = `
Property Appraisal Appointment

Client: ${booking.client_name}
Appraiser: ${booking.appraiser_name}
Booking Type: ${booking.booking_type}
Confirmation #: ${booking.confirmation_number}

${booking.property_address ? `Property Address: ${booking.property_address}` : ''}
${booking.special_requirements ? `Special Requirements: ${booking.special_requirements}` : ''}

This appointment was scheduled through the Real Estate Platform.
    `.trim();

    return {
      title,
      description,
      startDate,
      endDate,
      location: booking.property_address,
      attendees: [booking.client_email, booking.appraiser_email],
      organizer: {
        name: booking.appraiser_name,
        email: booking.appraiser_email
      }
    };
  }

  /**
   * Generate Google Calendar URL
   */
  static generateGoogleCalendarUrl(booking: BookingDetails): string {
    const event = this.createEvent(booking);
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${this.formatDate(event.startDate)}/${this.formatDate(event.endDate)}`,
      details: event.description,
      location: event.location || '',
      add: event.attendees?.join(',') || ''
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  /**
   * Generate Outlook Calendar URL
   */
  static generateOutlookCalendarUrl(booking: BookingDetails): string {
    const event = this.createEvent(booking);
    
    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: event.title,
      startdt: event.startDate.toISOString(),
      enddt: event.endDate.toISOString(),
      body: event.description,
      location: event.location || '',
      to: event.attendees?.join(';') || ''
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  }

  /**
   * Generate Apple Calendar (.ics) file content
   */
  static generateIcsContent(booking: BookingDetails): string {
    const event = this.createEvent(booking);
    const now = new Date();
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Real Estate Platform//Property Appraisal Booking//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${booking.id}@realestate-platform.com
DTSTAMP:${this.formatDate(now)}
DTSTART:${this.formatDate(event.startDate)}
DTEND:${this.formatDate(event.endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
LOCATION:${event.location || ''}
ORGANIZER;CN=${event.organizer?.name}:MAILTO:${event.organizer?.email}
${event.attendees?.map(email => `ATTENDEE;CN=${email};RSVP=TRUE:MAILTO:${email}`).join('\n') || ''}
STATUS:CONFIRMED
TRANSP:OPAQUE
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Property Appraisal Reminder
END:VALARM
END:VEVENT
END:VCALENDAR`;

    return icsContent;
  }

  /**
   * Generate download URL for .ics file
   */
  static generateIcsDownloadUrl(booking: BookingDetails): string {
    const icsContent = this.generateIcsContent(booking);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    return URL.createObjectURL(blob);
  }

  /**
   * Generate all calendar options for a booking
   */
  static generateCalendarOptions(booking: BookingDetails) {
    return {
      google: {
        url: this.generateGoogleCalendarUrl(booking),
        label: 'Add to Google Calendar'
      },
      outlook: {
        url: this.generateOutlookCalendarUrl(booking),
        label: 'Add to Outlook'
      },
      apple: {
        content: this.generateIcsContent(booking),
        downloadUrl: this.generateIcsDownloadUrl(booking),
        filename: `appraisal-appointment-${booking.confirmation_number}.ics`,
        label: 'Download for Apple Calendar'
      },
      ics: {
        content: this.generateIcsContent(booking),
        downloadUrl: this.generateIcsDownloadUrl(booking),
        filename: `appraisal-appointment-${booking.confirmation_number}.ics`,
        label: 'Download Calendar File (.ics)'
      }
    };
  }

  /**
   * Send calendar invitation via email (using notification service)
   */
  static async sendCalendarInvitation(
    booking: BookingDetails,
    notificationService: any
  ): Promise<boolean> {
    try {
      const icsContent = this.generateIcsContent(booking);
      const event = this.createEvent(booking);

      // Send to client
      await notificationService.sendEmail({
        to: booking.client_email,
        subject: `Calendar Invitation: Property Appraisal - ${event.startDate.toLocaleDateString()}`,
        html: `
          <h2>Property Appraisal Appointment Scheduled</h2>
          <p>Dear ${booking.client_name},</p>
          
          <p>Your property appraisal appointment has been confirmed:</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Appointment Details:</strong><br>
            📅 Date: ${event.startDate.toLocaleDateString()}<br>
            🕐 Time: ${event.startDate.toLocaleTimeString()}<br>
            👨‍💼 Appraiser: ${booking.appraiser_name}<br>
            🏠 Location: ${booking.property_address || 'TBA'}<br>
            🔢 Confirmation #: ${booking.confirmation_number}
          </div>
          
          <p>Please find the calendar invitation attached. You can also add this appointment to your calendar:</p>
          
          <div style="margin: 20px 0;">
            <a href="${this.generateGoogleCalendarUrl(booking)}" 
               style="background: #4285f4; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; margin-right: 10px;">
              📅 Add to Google Calendar
            </a>
            <a href="${this.generateOutlookCalendarUrl(booking)}" 
               style="background: #0078d4; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">
              📅 Add to Outlook
            </a>
          </div>
          
          <p>If you need to reschedule or have any questions, please contact your appraiser directly.</p>
          
          <p>Best regards,<br>Real Estate Platform Team</p>
        `,
        attachments: [{
          filename: `appointment-${booking.confirmation_number}.ics`,
          content: icsContent,
          contentType: 'text/calendar'
        }]
      });

      // Send to appraiser
      await notificationService.sendEmail({
        to: booking.appraiser_email,
        subject: `New Appointment Scheduled: ${booking.client_name} - ${event.startDate.toLocaleDateString()}`,
        html: `
          <h2>New Property Appraisal Appointment</h2>
          <p>Dear ${booking.appraiser_name},</p>
          
          <p>A new property appraisal appointment has been scheduled:</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Appointment Details:</strong><br>
            📅 Date: ${event.startDate.toLocaleDateString()}<br>
            🕐 Time: ${event.startDate.toLocaleTimeString()}<br>
            👤 Client: ${booking.client_name}<br>
            📧 Client Email: ${booking.client_email}<br>
            🏠 Location: ${booking.property_address || 'TBA'}<br>
            📋 Type: ${booking.booking_type}<br>
            🔢 Confirmation #: ${booking.confirmation_number}
          </div>
          
          ${booking.special_requirements ? `
          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Special Requirements:</strong><br>
            ${booking.special_requirements}
          </div>
          ` : ''}
          
          <p>Calendar invitation is attached. Add to your calendar:</p>
          
          <div style="margin: 20px 0;">
            <a href="${this.generateGoogleCalendarUrl(booking)}" 
               style="background: #4285f4; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; margin-right: 10px;">
              📅 Add to Google Calendar
            </a>
            <a href="${this.generateOutlookCalendarUrl(booking)}" 
               style="background: #0078d4; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">
              📅 Add to Outlook
            </a>
          </div>
          
          <p>You can manage this appointment from your dashboard.</p>
          
          <p>Best regards,<br>Real Estate Platform Team</p>
        `,
        attachments: [{
          filename: `appointment-${booking.confirmation_number}.ics`,
          content: icsContent,
          contentType: 'text/calendar'
        }]
      });

      return true;
    } catch (error) {
      console.error('Failed to send calendar invitation:', error);
      return false;
    }
  }

  /**
   * Generate calendar reminder for upcoming appointments
   */
  static generateReminderContent(booking: BookingDetails, reminderType: 'day_before' | 'hour_before'): string {
    const event = this.createEvent(booking);
    const timeUntil = reminderType === 'day_before' ? '24 hours' : '1 hour';
    
    return `
      <h2>🔔 Appointment Reminder</h2>
      <p>This is a reminder that your property appraisal appointment is in ${timeUntil}:</p>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <strong>Appointment Details:</strong><br>
        📅 Date: ${event.startDate.toLocaleDateString()}<br>
        🕐 Time: ${event.startDate.toLocaleTimeString()}<br>
        👨‍💼 Appraiser: ${booking.appraiser_name}<br>
        🏠 Location: ${booking.property_address || 'TBA'}<br>
        🔢 Confirmation #: ${booking.confirmation_number}
      </div>
      
      <p>Please ensure you're available at the scheduled time. If you need to reschedule, please contact your appraiser as soon as possible.</p>
      
      <p>Best regards,<br>Real Estate Platform Team</p>
    `;
  }
}