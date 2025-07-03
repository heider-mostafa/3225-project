import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { formatNumber, formatPrice, translateNumbers } from './i18n/config';

export function useNumberTranslation() {
  const { i18n, t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const currentLanguage = i18n.language;
  const isArabic = currentLanguage === 'ar';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const translateNumber = (value: number | string): string => {
    if (!isMounted) return String(value);
    return formatNumber(value, currentLanguage);
  };

  const translatePrice = (price: number | string, currency: string = 'EGP'): string => {
    if (!isMounted) return `$${price}`;
    return formatPrice(price, currentLanguage, currency);
  };

  const translateText = (text: string): string => {
    if (!isMounted || !isArabic) {
      return text;
    }
    return translateNumbers(text, true);
  };

  // SSR-safe translation function
  const safeT = (key: string, fallback: string = '', options?: any): string => {
    if (!isMounted) {
      return fallback || key;
    }
    return String(t(key, fallback, options));
  };

  return {
    translateNumber,
    translatePrice,
    translateText,
    safeT,
    isArabic,
    currentLanguage,
    isMounted
  };
}