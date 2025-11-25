import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface QRGeneratorProps {
  value: string;
  size?: number;
  backgroundColor?: string;
  color?: string;
  title?: string;
  subtitle?: string;
  logo?: string;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({
  value,
  size = 200,
  backgroundColor = '#FFFFFF',
  color = '#000000',
  title,
  subtitle,
  logo
}) => {
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      
      <View style={[styles.qrContainer, { backgroundColor }]}>
        <QRCode
          value={value}
          size={size}
          color={color}
          backgroundColor={backgroundColor}
          logo={logo ? { uri: logo } : undefined}
          logoSize={logo ? 30 : 0}
          logoBackgroundColor={backgroundColor}
          logoMargin={2}
          logoBorderRadius={15}
          quietZone={10}
          enableLinearGradient={false}
          ecl="M"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#2D3748',
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 16,
    textAlign: 'center',
  },
  qrContainer: {
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default QRGenerator;