import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  Alert, 
  ActivityIndicator,
  SafeAreaView,
  StatusBar 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { QRScanner } from '../../components/qr/QRScanner';
import CommunityService from '../../services/CommunityService';
import { notificationService } from '../../services/NotificationService';

interface VisitorPassData {
  id: string;
  visitor_name: string;
  visitor_phone: string;
  unit_number: string;
  compound_name: string;
  visit_date: string;
  visit_time: string;
  created_by: string;
  status: 'pending' | 'checked_in' | 'expired' | 'cancelled';
}

export const VisitorQRScanScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const handleQRScanSuccess = async (qrData: string) => {
    try {
      setIsLoading(true);
      
      // Parse QR code data
      let visitorPassData: VisitorPassData;
      try {
        visitorPassData = JSON.parse(qrData);
      } catch (parseError) {
        Alert.alert('Invalid QR Code', 'This QR code does not contain valid visitor pass data');
        return;
      }

      // Validate QR code structure
      if (!visitorPassData.id || !visitorPassData.visitor_name) {
        Alert.alert('Invalid QR Code', 'This QR code is not a valid visitor pass');
        return;
      }

      // Check in visitor
      const checkInResult = await CommunityService.checkInVisitor(visitorPassData.id);
      
      if (checkInResult.success) {
        // Send visitor check-in notification
        await notificationService.sendVisitorCheckInNotification({
          name: visitorPassData.visitor_name,
          unit_number: visitorPassData.unit_number,
          compound_name: visitorPassData.compound_name
        });

        Alert.alert(
          'Check-in Successful',
          `${visitorPassData.visitor_name} has been checked in successfully.\n\nVisiting: Unit ${visitorPassData.unit_number}\nCompound: ${visitorPassData.compound_name}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        const errorMessage = getErrorMessage(checkInResult.error);
        Alert.alert('Check-in Failed', errorMessage);
      }

    } catch (error) {
      console.error('Error processing visitor QR scan:', error);
      Alert.alert('Error', 'Failed to process visitor check-in');
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'VISITOR_PASS_NOT_FOUND':
        return 'Visitor pass not found. Please check the QR code.';
      case 'VISITOR_PASS_EXPIRED':
        return 'This visitor pass has expired.';
      case 'VISITOR_PASS_CANCELLED':
        return 'This visitor pass has been cancelled.';
      case 'VISITOR_ALREADY_CHECKED_IN':
        return 'This visitor has already been checked in.';
      case 'INVALID_VISITOR_PASS':
        return 'Invalid visitor pass data.';
      default:
        return 'An error occurred while checking in the visitor. Please try again.';
    }
  };

  const handleQRScanError = (error: Error) => {
    console.error('QR scan error:', error);
    Alert.alert('Scan Error', 'Failed to scan QR code. Please try again.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3182CE" />
          <Text style={styles.loadingText}>Processing visitor check-in...</Text>
        </View>
      )}

      <QRScanner
        title="Visitor Check-in"
        subtitle="Scan visitor pass QR code"
        onScanSuccess={handleQRScanSuccess}
        onScanError={handleQRScanError}
        enableVibration={true}
        scanDelay={3000}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default VisitorQRScanScreen;