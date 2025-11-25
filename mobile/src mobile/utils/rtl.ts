import { I18nManager } from 'react-native';
import i18n from '../config/i18n';

/**
 * RTL (Right-to-Left) language support utilities
 * for proper Arabic language layout handling
 */

export const isRTL = (): boolean => {
  return i18n.language === 'ar' || I18nManager.isRTL;
};

export const setRTL = (isRTL: boolean): void => {
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
    // Note: App restart is required for RTL changes to take effect
    // This would be handled by asking user to restart or using RNRestart
  }
};

export const getTextAlign = (): 'left' | 'right' => {
  return isRTL() ? 'right' : 'left';
};

export const getFlexDirection = (): 'row' | 'row-reverse' => {
  return isRTL() ? 'row-reverse' : 'row';
};

export const getWritingDirection = (): 'rtl' | 'ltr' => {
  return isRTL() ? 'rtl' : 'ltr';
};

// Style helpers for RTL support
export const rtlStyles = {
  text: {
    textAlign: getTextAlign() as any,
    writingDirection: getWritingDirection() as any,
  },
  flexRow: {
    flexDirection: getFlexDirection() as any,
  },
  paddingHorizontal: (left: number, right: number) => ({
    paddingLeft: isRTL() ? right : left,
    paddingRight: isRTL() ? left : right,
  }),
  marginHorizontal: (left: number, right: number) => ({
    marginLeft: isRTL() ? right : left,
    marginRight: isRTL() ? left : right,
  }),
}; 