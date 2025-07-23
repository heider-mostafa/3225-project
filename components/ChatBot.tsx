"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Loader2, Mic, Volume2, X, ChevronDown, Check, MapPin, Bed, Bath, Square, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { heygenManager } from '@/lib/heygen/HeygenAgentManager'
import type { AgentType } from '@/lib/heygen/HeygenAgentManager';
import Link from "next/link";
import { translationService } from '@/lib/translation-service';

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ar", label: "العربية", flag: "🇪🇬" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

const SUGGESTIONS = [
  "Show me houses under $1M",
  "Any 3-bedroom homes in Sheikh Zayed?",
  "What are the best areas for families?",
  "How do I book a virtual tour?",
  "Can I get mortgage advice?",
  "How does this app work?",
  "What are the latest listings?",
  "Do you have pet-friendly properties?",
];

// Translation mapping for suggestions
const SUGGESTION_TRANSLATIONS: { [key: string]: { [lang: string]: string } } = {
  "Show me houses under $1M": {
    ar: "أرني منازل تحت مليون دولار",
    fr: "Montrez-moi des maisons sous 1M$",
    es: "Muéstrame casas menores a $1M"
  },
  "Any 3-bedroom homes in Sheikh Zayed?": {
    ar: "أي منازل 3 غرف نوم في الشيخ زايد؟",
    fr: "Des maisons 3 chambres à Sheikh Zayed?",
    es: "¿Casas de 3 habitaciones en Sheikh Zayed?"
  },
  "What are the best areas for families?": {
    ar: "ما هي أفضل المناطق للعائلات؟",
    fr: "Quelles sont les meilleures zones pour les familles?",
    es: "¿Cuáles son las mejores áreas para familias?"
  },
  "How do I book a virtual tour?": {
    ar: "كيف يمكنني حجز جولة افتراضية؟",
    fr: "Comment réserver une visite virtuelle?",
    es: "¿Cómo reservo un tour virtual?"
  },
  "Can I get mortgage advice?": {
    ar: "هل يمكنني الحصول على نصائح الرهن العقاري؟",
    fr: "Puis-je obtenir des conseils hypothécaires?",
    es: "¿Puedo obtener asesoramiento hipotecario?"
  },
  "How does this app work?": {
    ar: "كيف يعمل هذا التطبيق؟",
    fr: "Comment fonctionne cette application?",
    es: "¿Cómo funciona esta aplicación?"
  },
  "What are the latest listings?": {
    ar: "ما هي آخر القوائم؟",
    fr: "Quelles sont les dernières annonces?",
    es: "¿Cuáles son las últimas propiedades?"
  },
  "Do you have pet-friendly properties?": {
    ar: "هل لديكم عقارات مناسبة للحيوانات الأليفة؟",
    fr: "Avez-vous des propriétés acceptant les animaux?",
    es: "¿Tienen propiedades que admiten mascotas?"
  }
};

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  properties?: PropertyRecommendation[];
  responseText?: string;
}

interface PropertyRecommendation {
  id: string;
  title: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  address: string;
  city: string;
  state: string;
  propertyType: string;
  image: string;
  link: string;
  features: string[];
}

interface Property {
  id: string;
  title: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  city: string;
  address: string;
  property_type: string;
}

// Helper function to check if a query is a property search
const isPropertySearchQuery = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  const searchKeywords = [
    'show me', 'find', 'search', 'looking for', 'want to see',
    'houses', 'homes', 'properties', 'apartments', 'villas',
    'under', 'below', 'maximum', 'budget', 'price',
    'bedroom', 'bathroom', 'sqm', 'square meters'
  ];
  
  return searchKeywords.some(keyword => lowerMessage.includes(keyword));
};

// PropertyCard component for chat
const PropertyChatCard = ({ property }: { property: PropertyRecommendation }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Link href={property.link} target="_blank" rel="noopener noreferrer">
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer border border-slate-200 bg-white">
        <div className="relative h-40 w-full overflow-hidden">
          <img
            src={property.image}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-property.jpg';
            }}
          />
          <div className="absolute top-2 right-2">
            <ExternalLink className="h-4 w-4 text-white bg-black/50 rounded p-1" />
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-slate-800 mb-2 text-sm line-clamp-2">{property.title}</h3>
          <div className="flex items-center text-slate-600 mb-2 text-xs">
            <MapPin className="h-3 w-3 mr-1" />
            {property.city}, {property.state}
          </div>
          <div className="text-lg font-bold text-blue-600 mb-3">
            {formatPrice(property.price)}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600 mb-2">
            <div className="flex items-center">
              <Bed className="h-3 w-3 mr-1" />
              {property.bedrooms}
            </div>
            <div className="flex items-center">
              <Bath className="h-3 w-3 mr-1" />
              {property.bathrooms}
            </div>
            <div className="flex items-center">
              <Square className="h-3 w-3 mr-1" />
              {property.sqm}
            </div>
          </div>
          {property.features && property.features.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {property.features.slice(0, 2).map((feature) => (
                <span key={feature} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                  {feature}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
};

export function ChatBot({ propertyId, agentType, onClose }: { propertyId: string; agentType: AgentType; onClose?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [soundOn, setSoundOn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Audio states
  const [isListening, setIsListening] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognition | null>(null);

  // Initialize with language-aware greeting
  useEffect(() => {
    if (!isInitialized) {
      const initializeChatBot = async () => {
        try {
          // Get current language from translation service
          const currentLang = translationService.getCurrentLanguage();
          
          // Find the language in our LANGUAGES array
          const detectedLang = LANGUAGES.find(lang => lang.code === currentLang) || LANGUAGES[0];
          setSelectedLang(detectedLang);
          
          // Set the greeting message based on detected language
          const englishGreeting = "Welcome! I'm here to help you with any questions about finding your next home or using our platform.";
          let greetingMessage = englishGreeting;
          
          // Translate greeting if not English
          if (currentLang !== 'en') {
            try {
              greetingMessage = await translationService.translateText(englishGreeting, currentLang, 'en');
            } catch (error) {
              console.error('Failed to translate greeting:', error);
              greetingMessage = englishGreeting; // Fallback to English
            }
          }
          
          // Set initial message
          setMessages([{
            role: "assistant",
            content: greetingMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          }]);
          
          setIsInitialized(true);
        } catch (error) {
          console.error('Failed to initialize ChatBot:', error);
          // Fallback to English greeting
          setMessages([{
            role: "assistant",
            content: "Welcome! I'm here to help you with any questions about finding your next home or using our platform.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          }]);
          setIsInitialized(true);
        }
      };
      
      initializeChatBot();
    }
  }, [isInitialized]);

  // Listen for language changes and update greeting accordingly
  useEffect(() => {
    const handleLanguageChange = async (event: CustomEvent<string>) => {
      const newLang = event.detail;
      const detectedLang = LANGUAGES.find(lang => lang.code === newLang) || LANGUAGES[0];
      setSelectedLang(detectedLang);
      
      // Update greeting message if it's the first message
      if (messages.length === 1 && messages[0].role === "assistant") {
        const englishGreeting = "Welcome! I'm here to help you with any questions about finding your next home or using our platform.";
        let greetingMessage = englishGreeting;
        
        if (newLang !== 'en') {
          try {
            greetingMessage = await translationService.translateText(englishGreeting, newLang, 'en');
          } catch (error) {
            console.error('Failed to translate greeting:', error);
            greetingMessage = englishGreeting;
          }
        }
        
        setMessages([{
          role: "assistant",
          content: greetingMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }]);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('languageChange', handleLanguageChange as EventListener);
      return () => {
        window.removeEventListener('languageChange', handleLanguageChange as EventListener);
      };
    }
  }, [messages]);

  useEffect(() => {
    try {
      if (scrollRef.current && typeof scrollRef.current.scrollTo === 'function') {
        // Use scrollTo for better compatibility
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth'
        });
      } else if (scrollRef.current && 'scrollTop' in scrollRef.current) {
        // Fallback to scrollTop
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    } catch (error) {
      // Silently ignore scroll errors to prevent crashes
      console.debug('Scroll error (non-critical):', error);
    }
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = selectedLang.code === 'ar' ? 'ar-EG' : 
                        selectedLang.code === 'fr' ? 'fr-FR' : 
                        selectedLang.code === 'es' ? 'es-ES' : 'en-US';
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      setSpeechRecognition(recognition);
    }
  }, [selectedLang]);

  // Handle microphone click
  const handleMicrophoneClick = async () => {
    if (!speechRecognition) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    if (isListening) {
      speechRecognition.stop();
      setIsListening(false);
    } else {
      try {
        // Request microphone permission
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        speechRecognition.start();
        setIsListening(true);
      } catch (error) {
        console.error('Microphone access denied:', error);
        alert('Please allow microphone access to use voice input');
      }
    }
  };

  // Text-to-speech for responses
  const speakResponse = (text: string) => {
    if (!soundOn || !('speechSynthesis' in window)) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLang.code === 'ar' ? 'ar-EG' : 
                     selectedLang.code === 'fr' ? 'fr-FR' : 
                     selectedLang.code === 'es' ? 'es-ES' : 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    speechSynthesis.speak(utterance);
  };

  // Get translated suggestion
  const getTranslatedSuggestion = (suggestion: string) => {
    if (selectedLang.code === 'en') return suggestion;
    return SUGGESTION_TRANSLATIONS[suggestion]?.[selectedLang.code] || suggestion;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Check if this is a property search query
      if (isPropertySearchQuery(userMessage.content)) {
        // Call property recommendations API
        const response = await fetch('/api/chat/recommendations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: userMessage.content,
            maxResults: 3
          }),
        });

        if (response.ok) {
          const data = await response.json();
          
          const assistantMessage = {
            role: "assistant" as const,
            content: data.responseText || "Here are some properties I found for you:",
            properties: data.recommendations || [],
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          
          setMessages((prev) => [...prev, assistantMessage]);
          
          // Speak the response if sound is enabled
          speakResponse(assistantMessage.content);
        } else {
          throw new Error('Failed to get property recommendations');
        }
      } else {
        // Call regular OpenAI API for general chat
        const response = await fetch('/api/chat/openai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage.content,
            propertyId,
            currentRoom: "living room",
            tourContext: null,
            propertyData: null
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get AI response');
        }

        const data = await response.json();
        
        const assistantMessage = {
          role: "assistant" as const,
          content: data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
        
        // Speak the response if sound is enabled
        speakResponse(assistantMessage.content);
      }

    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = {
        role: "assistant" as const,
        content: "I'm sorry, I'm having trouble connecting right now. Please try asking your question again or contact our support team for assistance.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      
      // Speak the error message if sound is enabled
      speakResponse(errorMessage.content);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <Card className="w-full max-w-xl mx-auto h-[600px] flex flex-col rounded-2xl shadow-2xl border-none bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow">
            <Bot className="h-7 w-7" />
          </div>
          <div>
            <div className="font-semibold text-lg text-slate-900">Property Assistant</div>
            <div className="text-xs text-slate-500">Currently in: living room</div>
          </div>
        </div>
        <div className="flex items-center gap-2 relative">
          {/* Language Dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full px-2"
              onClick={() => setLangOpen((v) => !v)}
              aria-label="Select language"
            >
              <span className="text-lg mr-1">{selectedLang.flag}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border z-50">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    className={`flex items-center w-full px-3 py-2 text-sm hover:bg-slate-100 ${selectedLang.code === lang.code ? "font-semibold" : ""}`}
                    onClick={() => {
                      setSelectedLang(lang);
                      setLangOpen(false);
                      // Update translation service language
                      translationService.saveCurrentLanguage(lang.code);
                      // Trigger language change event
                      if (typeof window !== 'undefined') {
                        const event = new CustomEvent('languageChange', { detail: lang.code });
                        window.dispatchEvent(event);
                      }
                    }}
                  >
                    <span className="mr-2 text-lg">{lang.flag}</span>
                    {lang.label}
                    {selectedLang.code === lang.code && <Check className="ml-auto h-4 w-4 text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Sound Button */}
          <Button
            variant={soundOn ? "default" : "ghost"}
            size="icon"
            className="rounded-full"
            aria-label="Toggle sound"
            onClick={() => setSoundOn((v) => !v)}
          >
            <Volume2 className="h-5 w-5" />
          </Button>
          {/* Close Button (for modal use) */}
          {onClose && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-gray-100" 
              aria-label="Close chat"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef} 
        className="flex-1 px-6 py-4 bg-slate-50 overflow-y-auto max-h-[400px]"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="space-y-6">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] ${
                    message.role === "user"
                      ? "bg-blue-600 text-white rounded-2xl px-5 py-4"
                      : "space-y-3"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div className="space-y-3">
                      {/* Text Response */}
                      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4">
                        <div className="text-sm mb-1">{message.content}</div>
                        <div className="text-xs text-slate-400 text-right mt-1">{message.timestamp}</div>
                      </div>
                      
                      {/* Property Cards */}
                      {message.properties && message.properties.length > 0 && (
                        <div className="grid grid-cols-1 gap-3">
                          {message.properties.map((property) => (
                            <PropertyChatCard key={property.id} property={property} />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="text-sm mb-1">{message.content}</div>
                      <div className="text-xs text-slate-400 text-right mt-1">{message.timestamp}</div>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-slate-500 text-sm">Searching properties...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Suggestions */}
      <div className="px-6 pb-2 pt-1 bg-white border-t">
        <div className="text-xs text-slate-500 mb-2">Suggested questions:</div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-sm text-slate-700 border border-slate-200 transition"
              onClick={() => handleSuggestion(suggestion)}
              type="button"
            >
              {getTranslatedSuggestion(suggestion)}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-slate-50 rounded-b-2xl">
        <div className="flex items-center gap-2">
          <Button 
            type="button" 
            variant={isListening ? "default" : "ghost"} 
            size="icon" 
            className={`rounded-full ${isListening ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : ''}`}
            onClick={handleMicrophoneClick}
            disabled={isLoading}
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            <Mic className={`h-5 w-5 ${isListening ? 'text-white' : 'text-slate-400'}`} />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about this property..."
            disabled={isLoading}
            className="flex-1 border-2 focus-visible:ring-2 focus-visible:ring-blue-600 bg-white"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 rounded-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
} 