import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import DatePicker from 'react-native-date-picker';
import { Amenity, AmenityBooking } from '../../services/CommunityService';

interface AmenityCalendarProps {
  amenity: Amenity;
  existingBookings: AmenityBooking[];
  onBookingCreate: (bookingData: {
    amenity_id: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    guest_count: number;
    booking_notes?: string;
  }) => void;
  isLoading?: boolean;
}

export const AmenityCalendar: React.FC<AmenityCalendarProps> = ({
  amenity,
  existingBookings,
  onBookingCreate,
  isLoading = false
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedStartTime, setSelectedStartTime] = useState(new Date());
  const [selectedEndTime, setSelectedEndTime] = useState(new Date());
  const [isSelectingStartTime, setIsSelectingStartTime] = useState(true);
  const [guestCount, setGuestCount] = useState(1);

  // Calculate available dates (next 30 days based on advance booking days)
  const getAvailableDates = () => {
    const today = new Date();
    const maxAdvanceDate = new Date();
    maxAdvanceDate.setDate(today.getDate() + amenity.advance_booking_days);

    const markedDates: { [key: string]: any } = {};
    
    // Mark booked dates
    existingBookings.forEach(booking => {
      if (booking.booking_status === 'confirmed') {
        const date = booking.booking_date;
        markedDates[date] = {
          disabled: true,
          disableTouchEvent: true,
          customStyles: {
            container: { backgroundColor: '#ef4444' },
            text: { color: 'white' }
          }
        };
      }
    });

    // Mark selected date
    if (selectedDate) {
      markedDates[selectedDate] = {
        selected: true,
        customStyles: {
          container: { backgroundColor: '#3b82f6' },
          text: { color: 'white' }
        }
      };
    }

    return markedDates;
  };

  // Get available time slots for selected date
  const getAvailableTimeSlots = () => {
    if (!selectedDate) return [];

    const operatingStart = amenity.operating_hours.open_time;
    const operatingEnd = amenity.operating_hours.close_time;
    
    // Parse operating hours
    const [startHour, startMinute] = operatingStart.split(':').map(Number);
    const [endHour, endMinute] = operatingEnd.split(':').map(Number);

    // Generate hourly slots
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      
      // Check if slot is available (not booked)
      const isBooked = existingBookings.some(booking => 
        booking.booking_date === selectedDate &&
        booking.booking_status === 'confirmed' &&
        booking.start_time === timeString
      );

      if (!isBooked) {
        slots.push({
          time: timeString,
          label: `${timeString} - ${(hour + 1).toString().padStart(2, '0')}:00`
        });
      }
    }

    return slots;
  };

  const handleDateSelect = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleTimeSelect = () => {
    if (!selectedDate) {
      Alert.alert('تحديد التاريخ', 'يرجى تحديد تاريخ أولاً');
      return;
    }
    setShowTimePicker(true);
  };

  const handleTimeConfirm = (date: Date) => {
    if (isSelectingStartTime) {
      setSelectedStartTime(date);
      setIsSelectingStartTime(false);
      // Keep time picker open for end time
    } else {
      setSelectedEndTime(date);
      setShowTimePicker(false);
      setIsSelectingStartTime(true);
    }
  };

  const validateBooking = () => {
    if (!selectedDate) {
      Alert.alert('خطأ', 'يرجى تحديد التاريخ');
      return false;
    }

    if (selectedStartTime >= selectedEndTime) {
      Alert.alert('خطأ', 'وقت النهاية يجب أن يكون بعد وقت البداية');
      return false;
    }

    const bookingHours = (selectedEndTime.getTime() - selectedStartTime.getTime()) / (1000 * 60 * 60);
    if (bookingHours > amenity.max_booking_hours) {
      Alert.alert('خطأ', `الحد الأقصى للحجز ${amenity.max_booking_hours} ساعات`);
      return false;
    }

    if (guestCount > amenity.capacity) {
      Alert.alert('خطأ', `السعة القصوى ${amenity.capacity} أشخاص`);
      return false;
    }

    return true;
  };

  const handleBookingSubmit = () => {
    if (!validateBooking()) return;

    const startTimeString = selectedStartTime.toTimeString().substring(0, 5);
    const endTimeString = selectedEndTime.toTimeString().substring(0, 5);

    onBookingCreate({
      amenity_id: amenity.id,
      booking_date: selectedDate,
      start_time: startTimeString,
      end_time: endTimeString,
      guest_count: guestCount,
      booking_notes: `Booking for ${amenity.name}`
    });
  };

  const formatTime = (date: Date) => {
    return date.toTimeString().substring(0, 5);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>حجز {amenity.name}</Text>
      
      <View style={styles.amenityInfo}>
        <Text style={styles.infoText}>السعة: {amenity.capacity} شخص</Text>
        <Text style={styles.infoText}>
          ساعات العمل: {amenity.operating_hours.open_time} - {amenity.operating_hours.close_time}
        </Text>
        <Text style={styles.infoText}>الحد الأقصى: {amenity.max_booking_hours} ساعات</Text>
        {amenity.price_per_hour && (
          <Text style={styles.priceText}>
            السعر: {amenity.price_per_hour} جنيه/ساعة
          </Text>
        )}
      </View>

      <Calendar
        style={styles.calendar}
        theme={{
          selectedDayBackgroundColor: '#3b82f6',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#3b82f6',
          dayTextColor: '#2d3748',
          textDisabledColor: '#cbd5e0',
          monthTextColor: '#2d3748',
          arrowColor: '#3b82f6',
        }}
        minDate={new Date().toISOString().split('T')[0]}
        maxDate={new Date(Date.now() + amenity.advance_booking_days * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0]}
        onDayPress={handleDateSelect}
        markedDates={getAvailableDates()}
        markingType="custom"
        hideExtraDays={true}
      />

      {selectedDate && (
        <View style={styles.timeSelection}>
          <Text style={styles.sectionTitle}>تحديد الوقت</Text>
          
          <TouchableOpacity
            style={styles.timeButton}
            onPress={handleTimeSelect}
          >
            <Text style={styles.timeButtonText}>
              {isSelectingStartTime ? 'اختيار وقت البداية' : 'اختيار وقت النهاية'}
            </Text>
          </TouchableOpacity>

          <View style={styles.timeDisplay}>
            <Text style={styles.timeText}>
              من: {formatTime(selectedStartTime)}
            </Text>
            <Text style={styles.timeText}>
              إلى: {formatTime(selectedEndTime)}
            </Text>
          </View>

          <View style={styles.guestSection}>
            <Text style={styles.sectionTitle}>عدد الضيوف</Text>
            <View style={styles.guestControls}>
              <TouchableOpacity
                style={styles.guestButton}
                onPress={() => setGuestCount(Math.max(1, guestCount - 1))}
              >
                <Text style={styles.guestButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.guestCount}>{guestCount}</Text>
              <TouchableOpacity
                style={styles.guestButton}
                onPress={() => setGuestCount(Math.min(amenity.capacity, guestCount + 1))}
              >
                <Text style={styles.guestButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.bookButton, isLoading && styles.bookButtonDisabled]}
            onPress={handleBookingSubmit}
            disabled={isLoading}
          >
            <Text style={styles.bookButtonText}>
              {isLoading ? 'جاري الحجز...' : 'تأكيد الحجز'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <DatePicker
        modal
        open={showTimePicker}
        date={isSelectingStartTime ? selectedStartTime : selectedEndTime}
        mode="time"
        onConfirm={handleTimeConfirm}
        onCancel={() => {
          setShowTimePicker(false);
          setIsSelectingStartTime(true);
        }}
        title={isSelectingStartTime ? 'اختيار وقت البداية' : 'اختيار وقت النهاية'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 16,
  },
  amenityInfo: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#38a169',
    marginTop: 8,
  },
  calendar: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeSelection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 12,
  },
  timeButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  timeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  timeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f7fafc',
    borderRadius: 8,
  },
  timeText: {
    fontSize: 16,
    color: '#4a5568',
    fontWeight: '500',
  },
  guestSection: {
    marginBottom: 20,
  },
  guestControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestButton: {
    backgroundColor: '#e2e8f0',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a5568',
  },
  guestCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginHorizontal: 20,
  },
  bookButton: {
    backgroundColor: '#38a169',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#cbd5e0',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AmenityCalendar;