// ================================================================
// BROKER CALENDAR SYSTEM - TypeScript Types
// ================================================================

export interface Broker {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  license_number?: string;
  photo_url?: string;
  bio?: string;
  specialties: string[];
  languages: string[];
  rating: number;
  total_reviews: number;
  years_experience: number;
  commission_rate: number;
  is_active: boolean;
  timezone: string;
  working_hours: WorkingHours;
  created_at: string;
  updated_at: string;
}

export interface WorkingHours {
  monday?: DaySchedule | { closed: boolean };
  tuesday?: DaySchedule | { closed: boolean };
  wednesday?: DaySchedule | { closed: boolean };
  thursday?: DaySchedule | { closed: boolean };
  friday?: DaySchedule | { closed: boolean };
  saturday?: DaySchedule | { closed: boolean };
  sunday?: DaySchedule | { closed: boolean };
}

export interface DaySchedule {
  start: string; // HH:MM format
  end: string;   // HH:MM format
}

export interface BrokerAvailability {
  id: string;
  broker_id: string;
  date: string; // YYYY-MM-DD format
  start_time: string; // HH:MM format
  end_time: string;   // HH:MM format
  is_available: boolean;
  max_bookings: number;
  current_bookings: number;
  slot_duration_minutes: number;
  break_between_slots: number;
  booking_type: 'property_viewing' | 'consultation' | 'tour';
  notes?: string;
  recurring_pattern?: 'none' | 'weekly' | 'daily';
  recurring_until?: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyBroker {
  id: string;
  property_id: string;
  broker_id: string;
  is_primary: boolean;
  assignment_type: 'listing' | 'selling' | 'showing';
  commission_split: number;
  assigned_at: string;
  assigned_by?: string;
  is_active: boolean;
  created_at: string;
  broker?: Broker; // When populated via join
}

export interface PropertyViewing {
  id: string;
  property_id: string;
  broker_id: string;
  user_id?: string;
  viewing_date: string; // YYYY-MM-DD format
  viewing_time: string; // HH:MM format
  end_time: string;     // HH:MM format
  duration_minutes: number;
  visitor_name: string;
  visitor_email: string;
  visitor_phone?: string;
  party_size: number;
  viewing_type: 'in_person' | 'virtual' | 'self_guided';
  special_requests?: string;
  preparation_notes?: string;
  status: ViewingStatus;
  confirmation_code: string;
  booking_source: 'website' | 'phone' | 'email' | 'walk_in';
  reminded_at?: string;
  reminder_count: number;
  checked_in_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  follow_up_required: boolean;
  follow_up_completed: boolean;
  rating?: number;
  feedback?: string;
  lead_quality_score?: number;
  notes?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  // When populated via joins
  broker?: Broker;
  property?: {
    id: string;
    title: string;
    address: string;
    city: string;
    price: number;
  };
}

export type ViewingStatus = 
  | 'scheduled' 
  | 'confirmed' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show' 
  | 'rescheduled';

export interface BrokerSchedule {
  id: string;
  broker_id: string;
  day_of_week: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time: string;  // HH:MM format
  end_time: string;    // HH:MM format
  is_active: boolean;
  max_daily_bookings: number;
  lunch_break_start?: string;
  lunch_break_end?: string;
  slot_duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface BrokerBlockedTime {
  id: string;
  broker_id: string;
  start_datetime: string; // ISO format
  end_datetime: string;   // ISO format
  reason?: string;
  block_type: 'vacation' | 'meeting' | 'personal' | 'training';
  is_recurring: boolean;
  recurring_pattern?: 'weekly' | 'monthly';
  recurring_until?: string;
  created_by?: string;
  created_at: string;
}

// ================================================================
// UI COMPONENT TYPES
// ================================================================

export interface TimeSlot {
  time: string; // HH:MM format
  available: boolean;
  maxBookings: number;
  currentBookings: number;
  broker_id: string;
  availability_id: string;
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD format
  dayOfMonth: number;
  isToday: boolean;
  isWeekend: boolean;
  isPast: boolean;
  hasAvailability: boolean;
  timeSlots: TimeSlot[];
}

export interface CalendarMonth {
  year: number;
  month: number; // 0-11
  days: CalendarDay[];
  brokers: Broker[];
}

export interface BookingFormData {
  visitor_name: string;
  visitor_email: string;
  visitor_phone?: string;
  party_size: number;
  viewing_type: 'in_person' | 'virtual' | 'self_guided';
  special_requests?: string;
}

export interface ViewingBookingRequest {
  property_id: string;
  broker_id: string;
  viewing_date: string;
  viewing_time: string;
  duration_minutes?: number;
  visitor_name: string;
  visitor_email: string;
  visitor_phone?: string;
  party_size?: number;
  viewing_type?: 'in_person' | 'virtual' | 'self_guided';
  special_requests?: string;
  booking_source?: string;
  metadata?: Record<string, any>;
}

export interface ViewingBookingResponse {
  success: boolean;
  viewing?: PropertyViewing;
  error?: string;
  confirmation_code?: string;
}

// ================================================================
// API RESPONSE TYPES
// ================================================================

export interface PropertyBrokersResponse {
  success: boolean;
  brokers: (Broker & { is_primary: boolean })[];
  error?: string;
}

export interface BrokerAvailabilityResponse {
  success: boolean;
  availability: BrokerAvailability[];
  calendar: CalendarMonth;
  error?: string;
}

export interface AvailableSlotsResponse {
  success: boolean;
  slots: {
    broker_id: string;
    broker: Broker;
    timeSlots: TimeSlot[];
  }[];
  error?: string;
}

export interface ViewingStatusUpdateRequest {
  status: ViewingStatus;
  notes?: string;
  cancellation_reason?: string;
  rating?: number;
  feedback?: string;
}

// ================================================================
// CALENDAR COMPONENT PROPS
// ================================================================

export interface BrokerAvailabilityCalendarProps {
  propertyId: string;
  selectedBrokerId?: string;
  onTimeSelected: (broker: Broker, date: string, time: string) => void;
  onBrokerChange?: (broker: Broker) => void;
  minDate?: string;
  maxDate?: string;
  className?: string;
}

export interface TimeSlotPickerProps {
  date: string;
  brokers: Broker[];
  availableSlots: {
    broker_id: string;
    broker: Broker;
    timeSlots: TimeSlot[];
  }[];
  selectedBrokerId?: string;
  onSlotSelected: (broker: Broker, slot: TimeSlot) => void;
  onBrokerChange?: (broker: Broker) => void;
  className?: string;
}

export interface ViewingBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: {
    id: string;
    title: string;
    address: string;
    price: number;
    property_photos?: Array<{ url: string; is_primary: boolean }>;
  };
  broker: Broker;
  selectedDate: string;
  selectedTime: string;
  onConfirm: (bookingData: BookingFormData) => Promise<void>;
  isLoading?: boolean;
}

export interface BrokerProfileCardProps {
  broker: Broker;
  showAvailability?: boolean;
  compact?: boolean;
  onSelect?: (broker: Broker) => void;
  isSelected?: boolean;
  className?: string;
}

// ================================================================
// UTILITY TYPES
// ================================================================

export interface BrokerStats {
  total_viewings: number;
  completed_viewings: number;
  pending_viewings: number;
  conversion_rate: number;
  average_rating: number;
  this_month_bookings: number;
}

export interface CalendarFilters {
  brokerId?: string;
  viewingType?: 'in_person' | 'virtual' | 'self_guided';
  minDuration?: number;
  maxDuration?: number;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
}

export interface BrokerSearchFilters {
  specialties?: string[];
  languages?: string[];
  minRating?: number;
  minExperience?: number;
  availability_date?: string;
  location?: string;
}

// ================================================================
// ADMIN TYPES
// ================================================================

export interface BrokerManagementData {
  broker: Broker;
  stats: BrokerStats;
  recent_viewings: PropertyViewing[];
  upcoming_viewings: PropertyViewing[];
  blocked_times: BrokerBlockedTime[];
  weekly_schedule: BrokerSchedule[];
}

export interface ViewingAnalytics {
  total_viewings: number;
  bookings_by_day: { date: string; count: number }[];
  bookings_by_broker: { broker_id: string; broker_name: string; count: number }[];
  conversion_rates: { broker_id: string; rate: number }[];
  popular_time_slots: { time: string; count: number }[];
  cancellation_rate: number;
  no_show_rate: number;
  average_lead_quality: number;
} 