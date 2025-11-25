import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '../config/supabase'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface Broker {
  id: string
  full_name: string
  email: string
  phone: string
  company?: string
  photo_url?: string
}

interface BrokerBookingModalProps {
  visible: boolean
  onClose: () => void
  broker: Broker | null
  propertyId: string
  propertyTitle: string
}

interface TimeSlot {
  time: string
  available: boolean
}

interface BookingForm {
  selectedDate: string
  selectedTime: string
  endTime: string
  durationMinutes: number
  viewingType: 'in_person' | 'virtual' | 'self_guided'
  partySize: number
  visitorName: string
  visitorPhone: string
  visitorEmail: string
  specialRequests: string
  preparationNotes: string
}

const BrokerBookingModal: React.FC<BrokerBookingModalProps> = ({
  visible,
  onClose,
  broker,
  propertyId,
  propertyTitle,
}) => {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  // State
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    selectedDate: '',
    selectedTime: '',
    endTime: '',
    durationMinutes: 60,
    viewingType: 'in_person',
    partySize: 1,
    visitorName: '',
    visitorPhone: '',
    visitorEmail: '',
    specialRequests: '',
    preparationNotes: '',
  })

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible && broker) {
      setBookingForm({
        selectedDate: '',
        selectedTime: '',
        endTime: '',
        durationMinutes: 60,
        viewingType: 'in_person',
        partySize: 1,
        visitorName: '',
        visitorPhone: '',
        visitorEmail: '',
        specialRequests: '',
        preparationNotes: '',
      })
      setSelectedDate('')
      setCurrentDate(new Date())
      loadAvailableSlots()
    }
  }, [visible, broker])

  // Load user profile data for form prefill
  useEffect(() => {
    if (visible) {
      loadUserProfile()
    }
  }, [visible])

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Get user profile data
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name, phone')
          .eq('user_id', user.id)
          .single()

        if (profile) {
          setBookingForm(prev => ({
            ...prev,
            visitorName: profile.full_name || '',
            visitorPhone: profile.phone || '',
            visitorEmail: user.email || '',
          }))
        } else {
          setBookingForm(prev => ({
            ...prev,
            visitorEmail: user.email || '',
          }))
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const loadAvailableSlots = async () => {
    if (!broker) return

    try {
      setLoading(true)

      // Default time slots (in real implementation, fetch from broker availability API)
      const defaultSlots: TimeSlot[] = [
        { time: '09:00', available: true },
        { time: '10:00', available: true },
        { time: '11:00', available: false },
        { time: '12:00', available: true },
        { time: '13:00', available: false },
        { time: '14:00', available: true },
        { time: '15:00', available: true },
        { time: '16:00', available: true },
        { time: '17:00', available: false },
        { time: '18:00', available: true },
      ]

      setAvailableSlots(defaultSlots)
    } catch (error) {
      console.error('Error loading available slots:', error)
      // Fallback slots
      setAvailableSlots([
        { time: '10:00', available: true },
        { time: '14:00', available: true },
        { time: '16:00', available: true },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Generate calendar dates
  const generateCalendarDates = () => {
    const dates = []
    const today = new Date()
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date)
    }
    
    return dates
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    })
  }

  const handleDateSelect = (date: Date) => {
    const dateStr = formatDate(date)
    setSelectedDate(dateStr)
    setBookingForm(prev => ({ ...prev, selectedDate: dateStr }))
  }

  const handleTimeSelect = (time: string) => {
    // Calculate end time based on duration
    const [hours, minutes] = time.split(':').map(Number)
    const startTime = new Date()
    startTime.setHours(hours, minutes, 0, 0)
    
    const endTime = new Date(startTime.getTime() + bookingForm.durationMinutes * 60000)
    const endTimeString = endTime.toTimeString().slice(0, 5)
    
    setBookingForm(prev => ({ 
      ...prev, 
      selectedTime: time,
      endTime: endTimeString
    }))
  }

  const handleSubmitBooking = async () => {
    // Validate form
    if (!bookingForm.selectedDate || !bookingForm.selectedTime) {
      Alert.alert(t('common.error'), t('booking.selectDateTime'))
      return
    }

    if (!bookingForm.visitorName || !bookingForm.visitorPhone || !bookingForm.visitorEmail) {
      Alert.alert(t('common.error'), t('booking.fillContactInfo'))
      return
    }

    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        Alert.alert(t('common.error'), t('auth.pleaseSignIn'))
        return
      }

      // Create booking record
      const { data: booking, error } = await supabase
        .from('property_viewings')
        .insert({
          property_id: propertyId,
          user_id: user.id,
          broker_id: broker?.id,
          viewing_date: bookingForm.selectedDate,
          viewing_time: bookingForm.selectedTime,
          end_time: bookingForm.endTime,
          duration_minutes: bookingForm.durationMinutes,
          viewing_type: bookingForm.viewingType,
          party_size: bookingForm.partySize,
          visitor_name: bookingForm.visitorName,
          visitor_email: bookingForm.visitorEmail,
          visitor_phone: bookingForm.visitorPhone,
          special_requests: bookingForm.specialRequests,
          preparation_notes: bookingForm.preparationNotes,
          status: 'scheduled',
          booking_source: 'mobile_app',
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Show success message
      Alert.alert(
        t('booking.success'),
        t('booking.confirmationMessage', {
          brokerName: broker?.full_name,
          date: bookingForm.selectedDate,
          time: bookingForm.selectedTime,
        }),
        [
          {
            text: t('common.ok'),
            onPress: onClose,
          },
        ]
      )
    } catch (error: any) {
      console.error('Error creating booking:', error)
      Alert.alert(t('common.error'), error.message || t('booking.failed'))
    } finally {
      setLoading(false)
    }
  }

  if (!broker) return null

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>
              {t('booking.scheduleViewing')}
            </Text>
            <Text style={[styles.propertyTitle, isRTL && styles.textRTL]}>
              {propertyTitle}
            </Text>
            <Text style={[styles.brokerName, isRTL && styles.textRTL]}>
              {t('booking.withBroker')} {broker.full_name}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Date Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
              {t('booking.selectDate')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesContainer}>
              {generateCalendarDates().map((date, index) => {
                const isSelected = selectedDate === formatDate(date)
                const isToday = formatDate(date) === formatDate(new Date())
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dateItem,
                      isSelected && styles.selectedDateItem,
                      isToday && styles.todayDateItem,
                    ]}
                    onPress={() => handleDateSelect(date)}
                  >
                    <Text style={[
                      styles.dateText,
                      isSelected && styles.selectedDateText,
                      isToday && styles.todayDateText,
                    ]}>
                      {formatDisplayDate(date)}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>

          {/* Time Selection */}
          {selectedDate && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
                {t('booking.selectTime')}
              </Text>
              <View style={styles.timeSlotsContainer}>
                {availableSlots.map((slot, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.timeSlot,
                      !slot.available && styles.unavailableTimeSlot,
                      bookingForm.selectedTime === slot.time && styles.selectedTimeSlot,
                    ]}
                    onPress={() => slot.available && handleTimeSelect(slot.time)}
                    disabled={!slot.available}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      !slot.available && styles.unavailableTimeSlotText,
                      bookingForm.selectedTime === slot.time && styles.selectedTimeSlotText,
                    ]}>
                      {slot.time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Viewing Type */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
              {t('booking.viewingType')}
            </Text>
            <View style={styles.viewingTypeContainer}>
              {[
                { key: 'in_person', label: t('booking.inPerson'), icon: '🏠' },
                { key: 'virtual', label: t('booking.virtual'), icon: '💻' },
                { key: 'self_guided', label: t('booking.selfGuided'), icon: '🗝️' },
              ].map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.viewingTypeOption,
                    bookingForm.viewingType === type.key && styles.selectedViewingType,
                  ]}
                  onPress={() => setBookingForm(prev => ({ ...prev, viewingType: type.key as any }))}
                >
                  <Text style={styles.viewingTypeIcon}>{type.icon}</Text>
                  <Text style={[
                    styles.viewingTypeText,
                    bookingForm.viewingType === type.key && styles.selectedViewingTypeText,
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Duration Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
              {t('booking.duration')}
            </Text>
            <View style={styles.durationContainer}>
              {[30, 60, 90, 120].map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.durationOption,
                    bookingForm.durationMinutes === duration && styles.selectedDuration,
                  ]}
                  onPress={() => setBookingForm(prev => ({ ...prev, durationMinutes: duration }))}
                >
                  <Text style={[
                    styles.durationText,
                    bookingForm.durationMinutes === duration && styles.selectedDurationText,
                  ]}>
                    {duration} {t('booking.minutes')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Party Size */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
              {t('booking.partySize')}
            </Text>
            <View style={styles.partySizeContainer}>
              {[1, 2, 3, 4, 5].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.partySizeOption,
                    bookingForm.partySize === size && styles.selectedPartySize,
                  ]}
                  onPress={() => setBookingForm(prev => ({ ...prev, partySize: size }))}
                >
                  <Text style={[
                    styles.partySizeText,
                    bookingForm.partySize === size && styles.selectedPartySizeText,
                  ]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
              {t('booking.contactInformation')}
            </Text>
            
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              placeholder={t('booking.fullName')}
              placeholderTextColor="#9ca3af"
              value={bookingForm.visitorName}
              onChangeText={(text) => setBookingForm(prev => ({ ...prev, visitorName: text }))}
            />
            
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              placeholder={t('booking.phoneNumber')}
              placeholderTextColor="#9ca3af"
              value={bookingForm.visitorPhone}
              onChangeText={(text) => setBookingForm(prev => ({ ...prev, visitorPhone: text }))}
              keyboardType="phone-pad"
            />
            
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              placeholder={t('booking.email')}
              placeholderTextColor="#9ca3af"
              value={bookingForm.visitorEmail}
              onChangeText={(text) => setBookingForm(prev => ({ ...prev, visitorEmail: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Special Requests */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
              {t('booking.specialRequests')}
            </Text>
            <TextInput
              style={[styles.textArea, isRTL && styles.inputRTL]}
              placeholder={t('booking.specialRequestsPlaceholder')}
              placeholderTextColor="#9ca3af"
              value={bookingForm.specialRequests}
              onChangeText={(text) => setBookingForm(prev => ({ ...prev, specialRequests: text }))}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Preparation Notes */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
              {t('booking.preparationNotes')}
            </Text>
            <TextInput
              style={[styles.textArea, isRTL && styles.inputRTL]}
              placeholder={t('booking.preparationNotesPlaceholder')}
              placeholderTextColor="#9ca3af"
              value={bookingForm.preparationNotes}
              onChangeText={(text) => setBookingForm(prev => ({ ...prev, preparationNotes: text }))}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmitBooking}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>{t('booking.confirmBooking')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  propertyTitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 2,
  },
  brokerName: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  textRTL: {
    textAlign: 'right',
  },
  
  // Date Selection
  datesContainer: {
    flexGrow: 0,
  },
  dateItem: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedDateItem: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  todayDateItem: {
    borderColor: '#f59e0b',
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  selectedDateText: {
    color: '#ffffff',
  },
  todayDateText: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  
  // Time Selection
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 70,
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  unavailableTimeSlot: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  selectedTimeSlotText: {
    color: '#ffffff',
  },
  unavailableTimeSlotText: {
    color: '#9ca3af',
  },
  
  // Viewing Type
  viewingTypeContainer: {
    gap: 8,
  },
  viewingTypeOption: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedViewingType: {
    backgroundColor: '#dbeafe',
    borderColor: '#1e40af',
  },
  viewingTypeIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  viewingTypeText: {
    fontSize: 16,
    color: '#6b7280',
  },
  selectedViewingTypeText: {
    color: '#1e40af',
    fontWeight: '600',
  },
  
  // Duration Selection
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationOption: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedDuration: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  durationText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  selectedDurationText: {
    color: '#ffffff',
  },

  // Party Size
  partySizeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  partySizeOption: {
    backgroundColor: '#ffffff',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedPartySize: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  partySizeText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  selectedPartySizeText: {
    color: '#ffffff',
  },
  
  // Form Inputs
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 12,
  },
  inputRTL: {
    textAlign: 'right',
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    height: 100,
  },
  
  // Submit Button
  submitButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 20,
  },
})

export default BrokerBookingModal