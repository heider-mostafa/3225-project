import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
} from 'react-native'
import { useTranslation } from 'react-i18next'

interface Broker {
  id: string
  full_name: string
  email: string
  phone: string
  company?: string
  photo_url?: string
  specialties?: string[]
  languages?: string[]
  rating?: number
  total_reviews?: number
  years_experience?: number
  is_primary?: boolean
}

interface BrokerCardProps {
  broker: Broker
  onScheduleShowing: (brokerId: string) => void
  propertyId: string
}

const BrokerCard: React.FC<BrokerCardProps> = ({ broker, onScheduleShowing, propertyId }) => {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  // Handle contact options
  const handleContactBroker = () => {
    Alert.alert(
      `${t('brokers.contactBroker')} ${broker.full_name}`,
      `${broker.company ? broker.company + '\n' : ''}${t('brokers.chooseContactMethod')}:`,
      [
        {
          text: `📞 ${t('brokers.call')}`,
          onPress: () => Linking.openURL(`tel:${broker.phone}`),
        },
        {
          text: `✉️ ${t('brokers.email')}`,
          onPress: () => Linking.openURL(`mailto:${broker.email}`),
        },
        {
          text: `📅 ${t('brokers.scheduleShowing')}`,
          onPress: () => onScheduleShowing(broker.id),
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ]
    )
  }

  // Generate star rating
  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push('⭐')
    }
    if (hasHalfStar) {
      stars.push('⭐')
    }
    while (stars.length < 5) {
      stars.push('☆')
    }

    return stars.join('')
  }

  return (
    <TouchableOpacity
      style={[styles.brokerCard, isRTL && styles.brokerCardRTL]}
      onPress={handleContactBroker}
      activeOpacity={0.7}
    >
      {/* Primary Broker Badge */}
      {broker.is_primary && (
        <View style={styles.primaryBadge}>
          <Text style={styles.primaryBadgeText}>{t('brokers.primaryBroker')}</Text>
        </View>
      )}

      <View style={[styles.brokerContent, isRTL && styles.brokerContentRTL]}>
        {/* Broker Photo */}
        <View style={styles.brokerPhotoContainer}>
          {broker.photo_url ? (
            <Image
              source={{ uri: broker.photo_url }}
              style={styles.brokerPhoto}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.brokerPhotoPlaceholder}>
              <Text style={styles.brokerPhotoPlaceholderText}>👤</Text>
            </View>
          )}
        </View>

        {/* Broker Information */}
        <View style={[styles.brokerInfo, isRTL && styles.brokerInfoRTL]}>
          <Text style={[styles.brokerName, isRTL && styles.textRTL]}>
            {broker.full_name}
          </Text>

          {broker.company && (
            <Text style={[styles.brokerCompany, isRTL && styles.textRTL]}>
              {broker.company}
            </Text>
          )}

          {/* Rating */}
          {broker.rating && (
            <View style={[styles.ratingContainer, isRTL && styles.ratingContainerRTL]}>
              <Text style={styles.starsText}>{renderStars(broker.rating)}</Text>
              <Text style={styles.ratingText}>
                {broker.rating.toFixed(1)} ({broker.total_reviews || 0} {t('brokers.reviews')})
              </Text>
            </View>
          )}

          {/* Experience */}
          {broker.years_experience && (
            <Text style={[styles.experienceText, isRTL && styles.textRTL]}>
              💼 {broker.years_experience} {t('brokers.yearsExperience')}
            </Text>
          )}

          {/* Specialties */}
          {broker.specialties && broker.specialties.length > 0 && (
            <View style={[styles.specialtiesContainer, isRTL && styles.specialtiesContainerRTL]}>
              {broker.specialties.slice(0, 2).map((specialty, index) => (
                <View key={index} style={styles.specialtyChip}>
                  <Text style={styles.specialtyText}>{specialty}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Languages */}
          {broker.languages && broker.languages.length > 0 && (
            <Text style={[styles.languagesText, isRTL && styles.textRTL]}>
              🌐 {broker.languages.join(', ')}
            </Text>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.scheduleButton}
          onPress={() => onScheduleShowing(broker.id)}
        >
          <Text style={styles.scheduleButtonText}>📅 {t('brokers.scheduleShowing')}</Text>
        </TouchableOpacity>

        <View style={styles.contactButtonsRow}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => Linking.openURL(`tel:${broker.phone}`)}
          >
            <Text style={styles.contactButtonText}>📞</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => Linking.openURL(`mailto:${broker.email}`)}
          >
            <Text style={styles.contactButtonText}>✉️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  brokerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  brokerCardRTL: {
    // RTL specific styles if needed
  },
  primaryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#1e40af',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  primaryBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  brokerContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  brokerContentRTL: {
    flexDirection: 'row-reverse',
  },
  brokerPhotoContainer: {
    marginRight: 12,
  },
  brokerPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  brokerPhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brokerPhotoPlaceholderText: {
    fontSize: 24,
    color: '#9ca3af',
  },
  brokerInfo: {
    flex: 1,
  },
  brokerInfoRTL: {
    alignItems: 'flex-end',
  },
  brokerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  brokerCompany: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingContainerRTL: {
    flexDirection: 'row-reverse',
  },
  starsText: {
    fontSize: 14,
    marginRight: 6,
  },
  ratingText: {
    fontSize: 12,
    color: '#6b7280',
  },
  experienceText: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 6,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  specialtiesContainerRTL: {
    flexDirection: 'row-reverse',
  },
  specialtyChip: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  specialtyText: {
    fontSize: 10,
    color: '#1e40af',
    fontWeight: '500',
  },
  languagesText: {
    fontSize: 12,
    color: '#4b5563',
  },
  textRTL: {
    textAlign: 'right',
  },
  actionButtons: {
    gap: 8,
  },
  scheduleButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  scheduleButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  contactButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  contactButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  contactButtonText: {
    fontSize: 18,
  },
})

export default BrokerCard