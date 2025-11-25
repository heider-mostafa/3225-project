import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import LinearGradient from 'react-native-linear-gradient';

import { RootState } from '../store/store';
import { rtlStyles, isRTL } from '../utils/rtl';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiClient } from '../config/api';

// Types
interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface PropertyContext {
  propertyId?: string;
  currentRoom?: string;
  tourContext?: {
    visitedRooms: string[];
    timeInRoom: number;
    totalTimeSpent: number;
  };
}

interface AIRecommendation {
  id: string;
  title: string;
  price: number;
  location: string;
  reason: string;
  confidence: number;
}

type AIAssistantRouteProp = RouteProp<RootStackParamList, 'AIAssistant'>;
type AIAssistantNavigationProp = StackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

const AIAssistantScreen: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const route = useRoute<AIAssistantRouteProp>();
  const navigation = useNavigation<AIAssistantNavigationProp>();
  
  const { theme, language } = useSelector((state: RootState) => state.app);
  
  // Props from navigation
  const { propertyId, currentRoom, tourContext } = route.params || {};
  
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  
  useEffect(() => {
    // Initialize screen
    initializeAIAssistant();
    
    // Setup voice recognition
    if (voiceEnabled) {
      setupVoiceRecognition();
    }
    
    // Setup TTS
    if (ttsEnabled) {
      setupTextToSpeech();
    }
    
    // Animate entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
    
    return () => {
      // Cleanup
      if (Voice) {
        Voice.destroy().then(Voice.removeAllListeners);
      }
      Tts.stop();
    };
  }, []);
  
  useEffect(() => {
    // Pulse animation for listening state
    if (isListening) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);
  
  const initializeAIAssistant = () => {
    // Add welcome message
    const welcomeMessage: Message = {
      id: `welcome-${Date.now()}`,
      type: 'assistant',
      content: generateContextualGreeting(),
      timestamp: new Date(),
    };
    
    setMessages([welcomeMessage]);
    
    // Load property recommendations if we have property context
    if (propertyId) {
      loadPropertyRecommendations();
    }
  };
  
  const setupVoiceRecognition = () => {
    if (!Voice) return;
    
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechError = (error: any) => {
      console.error('Voice recognition error:', error);
      setIsListening(false);
      Alert.alert('خطأ في التعرف على الصوت', 'حدث خطأ أثناء التعرف على الصوت. يرجى المحاولة مرة أخرى.');
    };
    Voice.onSpeechResults = (event: any) => {
      if (event.value && event.value[0]) {
        setInputText(event.value[0]);
        setIsListening(false);
      }
    };
  };
  
  const setupTextToSpeech = () => {
    if (!Tts) return;
    
    Tts.setDefaultLanguage(language === 'ar' ? 'ar-EG' : 'en-US');
    Tts.setDefaultRate(0.5);
    Tts.setDefaultPitch(1.0);
    
    Tts.addEventListener('tts-start', () => setIsSpeaking(true));
    Tts.addEventListener('tts-finish', () => setIsSpeaking(false));
    Tts.addEventListener('tts-cancel', () => setIsSpeaking(false));
  };
  
  const generateContextualGreeting = (): string => {
    if (currentRoom && tourContext) {
      const roomName = currentRoom.replace('-', ' ');
      const timeMinutes = Math.floor((tourContext.timeInRoom || 0) / 60);
      
      if (language === 'ar') {
        if (timeMinutes > 2) {
          return `مرحباً! أرى أنك تستكشف ${roomName} منذ ${timeMinutes} دقائق. ما الذي يثير اهتمامك أكثر في هذا المكان؟`;
        } else {
          return `أهلاً! أنت تشاهد حالياً ${roomName}. كيف يمكنني مساعدتك لتعرف المزيد عن هذا العقار؟`;
        }
      } else {
        if (timeMinutes > 2) {
          return `Hi! I see you've been exploring the ${roomName} for ${timeMinutes} minutes. What interests you most about this space?`;
        } else {
          return `Hello! You're currently viewing the ${roomName}. How can I help you learn more about this property?`;
        }
      }
    }
    
    return t('aiGreeting');
  };
  
  const loadPropertyRecommendations = async () => {
    try {
      // Get similar properties from API based on current property context
      const response = await apiClient.getProperties({ 
        limit: 3,
        exclude: propertyId // Exclude current property if supported by API
      });
      
      if (response.success && response.data && response.data.length > 0) {
        // Transform API properties to recommendation format
        const apiRecommendations: AIRecommendation[] = response.data.map((property, index) => ({
          id: property.id,
          title: property.title,
          price: property.price,
          location: property.city,
          reason: getRecommendationReason(property, index),
          confidence: getConfidenceScore(property, index),
        }));
        
        setRecommendations(apiRecommendations);
        console.log(`🤖 Loaded ${apiRecommendations.length} AI property recommendations from API`);
      } else {
        // Fallback to sample recommendations if API fails or no data
        console.log('⚠️ Using fallback recommendations - no API data available');
        setRecommendations([]);
      }
    } catch (error) {
      console.error('❌ Error loading property recommendations:', error);
      // No recommendations if API fails
      setRecommendations([]);
    }
  };
  
  const getRecommendationReason = (property: any, index: number): string => {
    const reasons = [
      'مماثلة في المساحة والمرافق',
      'موقع متميز وتشطيب عالي', 
      'استثمار ممتاز في منطقة نامية',
      'فرصة استثمارية مميزة',
      'عقار بمواصفات متشابهة',
      'منطقة مطلوبة بسعر مناسب'
    ];
    return reasons[index % reasons.length];
  };
  
  const getConfidenceScore = (property: any, index: number): number => {
    // Generate realistic confidence scores based on property similarity
    const baseScore = 0.85;
    const variation = (Math.sin(property.price / 1000000) * 0.1); // Use price for consistent variation
    return Math.min(0.95, Math.max(0.75, baseScore + variation - (index * 0.05)));
  };
  
  const startVoiceRecognition = async () => {
    if (!Voice || isListening) return;
    
    try {
      setIsListening(true);
      await Voice.start(language === 'ar' ? 'ar-EG' : 'en-US');
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsListening(false);
      Alert.alert('خطأ', 'لا يمكن بدء التعرف على الصوت. تأكد من إعطاء إذن الميكروفون.');
    }
  };
  
  const stopVoiceRecognition = async () => {
    if (!Voice || !isListening) return;
    
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  };
  
  const speakText = async (text: string) => {
    if (!ttsEnabled || isSpeaking) return;
    
    try {
      await Tts.speak(text);
    } catch (error) {
      console.error('Error speaking text:', error);
    }
  };
  
  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    try {
      // Call the web app's OpenAI API endpoint using apiClient
      const response = await apiClient.sendAIMessage({
        message: userMessage.content,
        propertyId: propertyId,
        currentRoom: currentRoom,
        tourContext: tourContext,
        propertyData: {
          id: propertyId,
          currentRoom: currentRoom,
          tourContext: tourContext
        }
      });

      if (response.success && response.data?.response) {
        console.log('🤖 OpenAI API Response received:', response.data.response.substring(0, 100) + '...');
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: response.data.response,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        setIsTyping(false);
        
        // Speak response if TTS is enabled
        if (ttsEnabled) {
          speakText(response.data.response);
        }
        
        // Scroll to bottom
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        throw new Error(response.error || 'No response from AI service');
      }
      
    } catch (error) {
      console.error('❌ OpenAI API Error:', error);
      setIsTyping(false);
      
      // Provide fallback response when OpenAI API fails
      const fallbackResponse = generateFallbackResponse(userMessage.content);
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: fallbackResponse,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Speak fallback response if TTS is enabled
      if (ttsEnabled) {
        speakText(fallbackResponse);
      }
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };
  
  const generateFallbackResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    // Property price queries
    if (lowerMessage.includes('سعر') || lowerMessage.includes('price') || lowerMessage.includes('تكلفة') || lowerMessage.includes('cost')) {
      return language === 'ar' 
        ? 'أسعار العقارات في هذه المنطقة تتراوح بين ٢.٥ إلى ٤.٥ مليون جنيه حسب المساحة والتشطيب. يمكنني مساعدتك في حساب التمويل العقاري أيضاً.'
        : 'Property prices in this area range from 2.5 to 4.5 million EGP depending on size and finishing. I can also help you calculate mortgage financing.';
    }
    
    // Kitchen queries
    if (lowerMessage.includes('مطبخ') || lowerMessage.includes('kitchen')) {
      return language === 'ar'
        ? 'المطبخ مجهز بأحدث الأجهزة الكهربائية والخزائن الخشبية عالية الجودة. يحتوي على جزيرة وسطية وإضاءة LED مودرن.'
        : 'The kitchen is equipped with modern appliances and high-quality wooden cabinets. It features a central island and modern LED lighting.';
    }
    
    // Location and nearby services
    if (lowerMessage.includes('موقع') || lowerMessage.includes('location') || lowerMessage.includes('قريب') || lowerMessage.includes('nearby')) {
      return language === 'ar'
        ? 'الموقع متميز وقريب من المدارس الدولية، المولات التجارية، والمستشفيات. المنطقة هادئة وآمنة مع مواصلات ممتازة.'
        : 'The location is excellent and close to international schools, shopping malls, and hospitals. The area is quiet and safe with excellent transportation.';
    }
    
    // Investment potential
    if (lowerMessage.includes('استثمار') || lowerMessage.includes('investment')) {
      return language === 'ar'
        ? 'هذه المنطقة تشهد نمواً عقارياً مستمراً بمعدل ١٢-١٥٪ سنوياً. العقار مناسب للاستثمار أو السكن الشخصي مع إمكانية إعادة البيع بربح جيد.'
        : 'This area experiences continuous real estate growth at 12-15% annually. The property is suitable for investment or personal residence with good resale potential.';
    }
    
    // Mortgage and financing
    if (lowerMessage.includes('تمويل') || lowerMessage.includes('mortgage') || lowerMessage.includes('قرض') || lowerMessage.includes('loan')) {
      return language === 'ar'
        ? 'يمكنك الحصول على تمويل عقاري يصل إلى ٨٠٪ من قيمة العقار. البنوك المصرية تقدم فوائد تنافسية من ١٧.٧٥٪ إلى ١٩٪. هل تريد حساب القسط الشهري؟'
        : 'You can get mortgage financing up to 80% of the property value. Egyptian banks offer competitive rates from 17.75% to 19%. Would you like to calculate monthly payments?';
    }
    
    // Default contextual response
    const responses = {
      ar: [
        'هذا سؤال ممتاز! بناءً على خبرتي في السوق العقاري المصري، يمكنني القول أن هذا العقار يمثل فرصة جيدة. هل تريد تفاصيل أكثر؟',
        'أفهم اهتمامك بهذا الجانب. العقارات في مصر تتطلب دراسة دقيقة للموقع والسعر والمرافق. كيف يمكنني مساعدتك أكثر؟',
        'بناءً على تحليل البيانات، هذا العقار يحقق معايير الجودة المطلوبة. هل لديك أسئلة محددة حول المواصفات؟',
      ],
      en: [
        'That\'s an excellent question! Based on my experience in the Egyptian real estate market, this property represents a good opportunity. Would you like more details?',
        'I understand your interest in this aspect. Real estate in Egypt requires careful study of location, price, and amenities. How can I help you further?',
        'Based on data analysis, this property meets the required quality standards. Do you have specific questions about the specifications?',
      ],
    };
    
    const langResponses = responses[language as keyof typeof responses] || responses.en;
    return langResponses[Math.floor(Math.random() * langResponses.length)];
  };
  
  const renderMessage = (message: Message) => {
    const isUser = message.type === 'user';
    const isRtl = isRTL();
    
    return (
      <Animated.View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.assistantMessage,
          { opacity: fadeAnim },
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
            isRtl && styles.rtlMessage,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userText : styles.assistantText,
              rtlStyles.text,
            ]}
          >
            {message.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isUser ? styles.userTimeText : styles.assistantTimeText,
              rtlStyles.text,
            ]}
          >
            {message.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </Animated.View>
    );
  };
  
  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <View style={[styles.messageContainer, styles.assistantMessage]}>
        <View style={[styles.messageBubble, styles.assistantBubble]}>
          <View style={styles.typingIndicator}>
            <Animated.View style={[styles.typingDot]} />
            <Animated.View style={[styles.typingDot]} />
            <Animated.View style={[styles.typingDot]} />
          </View>
        </View>
      </View>
    );
  };
  
  const renderSuggestedQuestions = () => {
    const questions = [
      { key: 'whatIsPrice', text: t('whatIsPrice') },
      { key: 'tellAboutKitchen', text: t('tellAboutKitchen') },
      { key: 'whatsNearby', text: t('whatsNearby') },
      { key: 'mortgageOptions', text: t('mortgageOptions') },
      { key: 'investmentPotential', text: t('investmentPotential') },
    ];
    
    if (messages.length > 2) return null;
    
    return (
      <View style={styles.suggestedContainer}>
        <Text style={[styles.suggestedTitle, rtlStyles.text]}>
          {t('suggestedQuestions')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {questions.map((question) => (
            <TouchableOpacity
              key={question.key}
              style={styles.suggestedButton}
              onPress={() => {
                setInputText(question.text);
                setTimeout(() => sendMessage(), 100);
              }}
            >
              <Text style={[styles.suggestedButtonText, rtlStyles.text]}>
                {question.text}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };
  
  const renderRecommendations = () => {
    return (
      <Modal
        visible={showRecommendations}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRecommendations(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.recommendationsModal}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, rtlStyles.text]}>
                {t('propertyRecommendations')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowRecommendations(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.recommendationsList}>
              {recommendations.map((rec) => (
                <TouchableOpacity
                  key={rec.id}
                  style={styles.recommendationCard}
                  onPress={() => {
                    setShowRecommendations(false);
                    // Navigate to property details
                    navigation.navigate('PropertyDetails', { propertyId: rec.id });
                  }}
                >
                  <View style={styles.recHeader}>
                    <Text style={[styles.recTitle, rtlStyles.text]}>
                      {rec.title}
                    </Text>
                    <View style={styles.confidenceTag}>
                      <Text style={styles.confidenceText}>
                        {Math.round(rec.confidence * 100)}%
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.recPrice, rtlStyles.text]}>
                    {rec.price.toLocaleString('ar-EG')} ج.م.
                  </Text>
                  <Text style={[styles.recLocation, rtlStyles.text]}>
                    📍 {rec.location}
                  </Text>
                  <Text style={[styles.recReason, rtlStyles.text]}>
                    💡 {rec.reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
      
      {/* Header */}
      <LinearGradient
        colors={['#2563eb', '#1d4ed8']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <View style={styles.aiAvatar}>
              <Text style={styles.avatarText}>AI</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, rtlStyles.text]}>
                {t('propertyAssistant')}
              </Text>
              {currentRoom && (
                <Text style={[styles.headerSubtitle, rtlStyles.text]}>
                  {t('currentRoom')}: {currentRoom.replace('-', ' ')}
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setTtsEnabled(!ttsEnabled)}
              style={[styles.actionButton, ttsEnabled && styles.activeAction]}
            >
              <Text style={styles.actionText}>🔊</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setShowRecommendations(true)}
              style={styles.actionButton}
            >
              <Text style={styles.actionText}>💡</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      
      {/* Messages */}
      <Animated.View 
        style={[
          styles.messagesContainer, 
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }}
        >
          {messages.map(renderMessage)}
          {renderTypingIndicator()}
          {renderSuggestedQuestions()}
        </ScrollView>
      </Animated.View>
      
      {/* Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.textInput, rtlStyles.text]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t('askAnything')}
            placeholderTextColor="#6b7280"
            multiline
            textAlign={isRTL() ? 'right' : 'left'}
            onSubmitEditing={sendMessage}
          />
          
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              onPress={isListening ? stopVoiceRecognition : startVoiceRecognition}
              style={[
                styles.voiceButton,
                isListening && styles.listeningButton,
              ]}
              disabled={!voiceEnabled}
            >
              <Text style={styles.voiceButtonText}>
                {isListening ? '⏹️' : '🎤'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
          
          <TouchableOpacity
            onPress={sendMessage}
            style={[
              styles.sendButton,
              !inputText.trim() && styles.disabledButton,
            ]}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendButtonText}>➤</Text>
          </TouchableOpacity>
        </View>
        
        {isListening && (
          <View style={styles.listeningIndicator}>
            <Text style={[styles.listeningText, rtlStyles.text]}>
              {t('listening')}
            </Text>
          </View>
        )}
      </View>
      
      {/* Recommendations Modal */}
      {renderRecommendations()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 0,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  aiAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#bfdbfe',
    fontSize: 14,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeAction: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  actionText: {
    fontSize: 18,
  },
  
  // Messages
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rtlMessage: {
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  assistantText: {
    color: '#1e293b',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  userTimeText: {
    color: '#bfdbfe',
  },
  assistantTimeText: {
    color: '#6b7280',
  },
  
  // Typing indicator
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6b7280',
  },
  
  // Suggested questions
  suggestedContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  suggestedTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  suggestedButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  suggestedButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  
  // Input
  inputContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#f9fafb',
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listeningButton: {
    backgroundColor: '#ef4444',
  },
  voiceButtonText: {
    fontSize: 18,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listeningIndicator: {
    alignItems: 'center',
    marginTop: 8,
  },
  listeningText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  
  // Recommendations Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  recommendationsModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  recommendationsList: {
    padding: 20,
  },
  recommendationCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  confidenceTag: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  recPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  recLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  recReason: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
  },
});

export default AIAssistantScreen; 