"use client"

import { useEffect, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment, Html } from "@react-three/drei"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Video, MessageCircle, Play, Mic, MicOff, Volume2, Globe, X, ChevronDown, Phone } from "lucide-react"
import { UnifiedPropertyAgent } from "@/lib/heygen/UnifiedPropertyAgent"
import { translationService } from '@/lib/translation-service'
import { useAuth } from '@/components/providers'
import type * as THREE from "three"
import React from "react"

// Simple Error Boundary for 3D Canvas
class ThreeDErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ComponentType<{ error: Error }> }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('3D Canvas Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback
      return <FallbackComponent error={this.state.error} />
    }

    return this.props.children
  }
}

// Error fallback component for 3D issues
function ThreeDErrorFallback({ error }: { error: Error }) {
  console.error('3D Canvas error:', error)
  return (
    <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg overflow-hidden flex items-center justify-center min-h-[400px]">
      <div className="text-center text-white p-6">
        <div className="text-4xl mb-4">🏠</div>
        <h3 className="text-lg font-semibold mb-2">Virtual Tour Unavailable</h3>
        <p className="text-slate-300 text-sm mb-4">The 3D tour for this property could not be loaded.</p>
        <div className="text-xs text-slate-400 space-y-1">
          <p>• Contact us to schedule an in-person viewing</p>
          <p>• View property photos in the gallery above</p>
          <p>• Get more details from our property specialist</p>
        </div>
      </div>
    </div>
  )
}

// Simple fallback without 3D for properties without tours
function renderSimpleFallback(className: string) {
  return (
    <div className={`relative bg-gradient-to-br from-blue-900 to-slate-900 rounded-lg overflow-hidden ${className}`}>
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="text-center text-white">
          <div className="text-5xl mb-6">🏠</div>
          <h3 className="text-xl font-semibold mb-3">Virtual Tour Not Available</h3>
          <p className="text-blue-200 mb-6">This property doesn't have a virtual tour yet.</p>
          <div className="space-y-2 text-sm text-blue-300">
            <p>✓ View detailed photos in the gallery</p>
            <p>✓ Schedule an in-person viewing</p>
            <p>✓ Contact our team for more information</p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface TourViewerProps {
  tourId: string
  className?: string
  autoRotate?: boolean
  onRoomChange?: (room: string) => void
  fullscreen?: boolean
  propertyId?: string
  tourUrl?: string
  hideRoomMenu?: boolean
}

// Mock 3D room component - only use inside Canvas
function Room3D({ roomType, onRoomClick }: { roomType: string; onRoomClick: (room: string) => void }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005
    }
  })

  const roomColors = {
    "living-room": "#8B5CF6",
    kitchen: "#10B981",
    bedroom: "#F59E0B",
    bathroom: "#3B82F6",
  }

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, 0]}
      onClick={() => onRoomClick(roomType)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.1 : 1}
    >
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial
        color={roomColors[roomType as keyof typeof roomColors] || "#8B5CF6"}
        transparent
        opacity={0.8}
      />
      <Html position={[0, 1.5, 0]} center>
      <div className="bg-white/80 px-2 py-1 rounded text-xs font-medium text-slate-800 shadow pointer-events-none">
          {roomType.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
        </div>
      </Html>
    </mesh>
  )
}

// Room navigation hotspots
function RoomHotspots({ onRoomChange }: { onRoomChange?: (room: string) => void }) {
  const rooms = ["living-room", "kitchen", "bedroom", "bathroom"]

  return (
    <>
      {rooms.map((room) => (
        <Room3D key={room} roomType={room} onRoomClick={(roomName) => onRoomChange?.(roomName)} />
      ))}
    </>
  )
}

// Voice Wave Animation Component
const VoiceWave = ({ isActive, level = 0.5 }: { isActive: boolean; level?: number }) => {
  const bars = Array.from({ length: 5 }, (_, i) => {
    const height = isActive ? Math.random() * 20 + 10 + (level * 15) : 4
    const delay = i * 0.1
    
    return (
      <div
        key={i}
        className={`bg-white rounded-full transition-all duration-150 ${isActive ? 'animate-pulse' : ''}`}
        style={{
          width: '3px',
          height: `${height}px`,
          animationDelay: `${delay}s`,
          opacity: isActive ? 0.8 + (Math.random() * 0.2) : 0.4
        }}
      />
    )
  })

  return (
    <div className="flex items-center justify-center space-x-1 h-8">
      {bars}
    </div>
  )
}

export function TourViewer({
  tourId,
  className = "",
  autoRotate = false,
  onRoomChange,
  fullscreen = false,
  propertyId,
  tourUrl,
  hideRoomMenu = false,
}: TourViewerProps) {
  const { user } = useAuth()
  const [currentRoom, setCurrentRoom] = useState("living-room")
  const [isLoading, setIsLoading] = useState(true)
  const [showHeyGenAgent, setShowHeyGenAgent] = useState(false)

  // OpenAI Realtime Voice Interface State
  const [isVoiceExpanded, setIsVoiceExpanded] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isResponding, setIsResponding] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [isLanguageInitialized, setIsLanguageInitialized] = useState(false)
  const [voiceLevel, setVoiceLevel] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting'>('disconnected')
  const [connectionError, setConnectionError] = useState<string>('')
  const [fallbackMode, setFallbackMode] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const connectionTimeoutRef = useRef<number | null>(null)
  const isConnectingRef = useRef(false)
  
  // Enhanced sales intelligence state
  const [conversationMetrics, setConversationMetrics] = useState({
    totalQuestions: 0,
    buyingSignals: 0,
    engagementScore: 0,
    leadQuality: 'cold' as 'cold' | 'warm' | 'hot',
    primaryInterests: [] as string[],
    objections: [] as string[],
    decisionTimeframe: 'unknown' as 'immediate' | 'soon' | 'exploring' | 'unknown',
    familyContext: {
      hasChildren: false,
      familySize: 0,
      familyPriorities: [] as string[]
    },
    investmentContext: {
      investmentInterest: false,
      investmentHorizon: 'unknown' as 'short' | 'medium' | 'long' | 'unknown',
      investmentPriorities: [] as string[]
    },
    culturalPreferences: {
      language: 'en',
      culturalValues: [] as string[],
      communityPreferences: [] as string[]
    }
  })
  
  const [conversationHistory, setConversationHistory] = useState<Array<{
    timestamp: number,
    type: 'user' | 'assistant',
    content: string,
    buyingSignals?: string[],
    room?: string
  }>>([])
  
  const [salesContext, setSalesContext] = useState({
    currentStrategy: 'discovery',
    clientPersonality: 'unknown',
    urgencyLevel: 0,
    priceDiscussed: false,
    featuresDiscussed: [],
    nextSteps: [],
    culturalContext: {
      familyOriented: false,
      investmentMinded: false,
      prestigeFocused: false,
      securityConscious: false
    },
    objectionHandling: {
      price: false,
      location: false,
      timing: false,
      family: false,
      investment: false
    }
  })
  
  // WebSocket and Audio References
  const wsRef = useRef<WebSocket | RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  // Enhanced multi-language support with cultural sales approaches
  const languages = [
    { 
      code: 'en', 
      name: 'English', 
      flag: '🇺🇸',
      salesStyle: 'direct_professional',
      culturalNotes: 'Value efficiency, ROI, and practical benefits'
    },
    { 
      code: 'ar', 
      name: 'العربية المصرية', 
      flag: '🇪🇬',
      salesStyle: 'warm_respectful_family_focused',
      culturalNotes: 'Focus on family gatherings, children spaces, privacy, prestige, investment value, and community reputation. Use warm Egyptian hospitality approach.'
    },
    { 
      code: 'fr', 
      name: 'Français', 
      flag: '🇫🇷',
      salesStyle: 'sophisticated_detailed',
      culturalNotes: 'Focus on aesthetics, quality, cultural heritage, and lifestyle'
    },
    { 
      code: 'es', 
      name: 'Español', 
      flag: '🇪🇸',
      salesStyle: 'warm_family_oriented',
      culturalNotes: 'Highlight family gatherings, community connections, and emotional benefits'
    },
    { 
      code: 'de', 
      name: 'Deutsch', 
      flag: '🇩🇪',
      salesStyle: 'technical_analytical',
      culturalNotes: 'Provide detailed specifications, energy efficiency, and long-term value'
    },
  ]

  // Simple fallback render function - no 3D to avoid React Three Fiber errors
  const renderFallbackTour = () => {
    console.log('🔄 Rendering simple fallback tour (no 3D)')
    
    return renderSimpleFallback(className)
  }

  // Debug logging
  console.log('🎬 TourViewer props:', {
    tourId,
    tourUrl,
    propertyId,
    fullscreen,
    hasTourUrl: !!tourUrl
  })

  // Initialize language from translation service
  useEffect(() => {
    if (!isLanguageInitialized) {
      try {
        // Detect mobile devices
        const isMobile = typeof window !== 'undefined' && 
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        let currentLang: string;
        
        if (isMobile) {
          // Force Arabic for mobile devices
          currentLang = 'ar';
          console.log('📱 Mobile device detected - forcing Arabic language');
          // Save Arabic preference for mobile
          translationService.saveCurrentLanguage('ar');
        } else {
          // Get current language from translation service for desktop
          currentLang = translationService.getCurrentLanguage();
          console.log('💻 Desktop detected - using saved language:', currentLang);
        }
        
        console.log('🌍 Tour viewer: Final language selection:', currentLang);
        
        // Find the language in our supported languages array
        const detectedLang = languages.find(lang => lang.code === currentLang);
        if (detectedLang) {
          setSelectedLanguage(currentLang);
          console.log('🌍 Tour viewer: Set initial language to:', currentLang, detectedLang.name);
        }
        
        setIsLanguageInitialized(true);
      } catch (error) {
        console.error('Failed to initialize language in tour viewer:', error);
        setIsLanguageInitialized(true); // Still mark as initialized to prevent retries
      }
    }
  }, [isLanguageInitialized]);

  // Listen for global language changes
  useEffect(() => {
    const handleGlobalLanguageChange = (event: CustomEvent<string>) => {
      const newLang = event.detail;
      console.log('🌍 Tour viewer: Global language changed to:', newLang);
      
      // Find the language in our supported languages array
      const detectedLang = languages.find(lang => lang.code === newLang);
      if (detectedLang) {
        setSelectedLanguage(newLang);
        
        // If we're connected to the AI, update the language immediately
        if (isConnected && dataChannelRef.current) {
          handleLanguageChange(newLang);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('languageChange', handleGlobalLanguageChange as EventListener);
      return () => {
        window.removeEventListener('languageChange', handleGlobalLanguageChange as EventListener);
      };
    }
  }, [isConnected]);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [tourId, tourUrl])

  // Cleanup effect to prevent memory leaks and infinite loops
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      disconnectRealtimeAPI()
    }
  }, [])

  // Simulate voice activity levels for wave animation
  useEffect(() => {
    let interval: number | undefined
    
    if (isRecording || isResponding) {
      interval = window.setInterval(() => {
        setVoiceLevel(Math.random() * 0.8 + 0.2) // Random level between 0.2 and 1.0
      }, 150) // Update every 150ms for smooth animation
    } else {
      setVoiceLevel(0)
    }
    
    return () => {
      if (interval) window.clearInterval(interval)
    }
  }, [isRecording, isResponding])

  // Enhanced behavioral analysis and room selling points
  const getRoomSellingPoints = (room: string) => {
    const sellingPoints: Record<string, string[]> = {
      'living-room': [
        'Perfect for entertaining guests and family gatherings',
        'Spacious layout ideal for quality family time',
        'Natural light creates warm, welcoming atmosphere'
      ],
      'kitchen': [
        'Heart of the home for culinary enthusiasts',
        'Modern appliances for effortless meal preparation',
        'Great for hosting dinner parties and family meals'
      ],
      'master-bedroom': [
        'Private sanctuary for relaxation and rest',
        'Spacious enough for king-size furniture',
        'Perfect retreat after busy days'
      ],
      'bedroom': [
        'Flexible space for children, guests, or home office',
        'Comfortable size with excellent storage potential',
        'Natural light and ventilation for healthy living'
      ],
      'bathroom': [
        'Luxurious daily routine in premium finishes',
        'Modern fixtures for comfort and convenience',
        'Smart design maximizes space and functionality'
      ],
      'balcony': [
        'Private outdoor oasis in the city',
        'Perfect for morning coffee and evening relaxation',
        'Great views and fresh air year-round'
      ]
    }
    
    return sellingPoints[room] || [
      'Thoughtfully designed space for modern living',
      'Versatile area that adapts to your lifestyle needs',
      'Quality construction with attention to detail'
    ]
  }

  // Behavioral analysis for sales intelligence
  const analyzeUserBehavior = () => {
    const currentTime = Date.now()
    const timeInCurrentRoom = currentTime - (roomStartTime || currentTime)
    
    return {
      engagement: timeInCurrentRoom > 120000 ? 'high' : timeInCurrentRoom > 60000 ? 'medium' : 'low',
      intent: isRecording ? 'active_inquiry' : 'passive_browsing',
      urgency: connectionStatus === 'connected' && isRecording ? 'immediate' : 'developing',
      interest_signals: {
        extended_viewing: timeInCurrentRoom > 180000,
        multiple_questions: true, // Track in event handler
        price_inquiry: false, // Track via keywords
        specific_features: false // Track via room focus
      }
    }
  }
  
  const [roomStartTime, setRoomStartTime] = useState<number>(Date.now())

  // Sales strategy generator based on buying signals
  const getSalesStrategy = (buyingSignals: any, behavior: any) => {
    if (buyingSignals.price_inquiry) {
      return 'PRICE STRATEGY: Lead with value proposition, show cost per sqm comparison, offer financing options, create urgency with market trends'
    }
    if (buyingSignals.timeline_inquiry) {
      return 'URGENCY STRATEGY: Emphasize limited inventory, market timing, and immediate availability benefits'
    }
    if (buyingSignals.family_mention) {
      return 'FAMILY STRATEGY: Focus on family spaces, safety, schools, community, and long-term value for children'
    }
    if (buyingSignals.financing_interest) {
      return 'FINANCING STRATEGY: Detailed payment options, bank partnerships, affordability calculations, move-in timeline'
    }
    if (buyingSignals.location_concern) {
      return 'LOCATION STRATEGY: Highlight hidden location benefits, future development, transportation, and lifestyle convenience'
    }
    if (buyingSignals.comparison_shopping) {
      return 'COMPETITIVE STRATEGY: Emphasize unique differentiators, exclusive features, and superior value proposition'
    }
    
    return 'DISCOVERY STRATEGY: Ask qualifying questions to understand their specific needs and motivations'
  }

  const handleRoomChange = (room: string) => {
    const previousRoom = currentRoom
    setCurrentRoom(room)
    setRoomStartTime(Date.now()) // Track time spent in each room
    onRoomChange?.(room)
    
    // Enhanced AI context update with behavioral analysis
    if (dataChannelRef.current && isConnected) {
      const behavior = analyzeUserBehavior()
      const roomSellingPoints = getRoomSellingPoints(room)
      
      const roomUpdateMessage = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `I'm now viewing the ${room.replace('-', ' ')} in this property.`
            }
          ]
        }
      }
      
      // Add behavioral context for AI sales intelligence
      const contextUpdateMessage = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: `BEHAVIORAL INSIGHT: Client moved from ${previousRoom?.replace('-', ' ') || 'entrance'} to ${room.replace('-', ' ')}. 
              
Current Room Selling Points:
${roomSellingPoints.map(point => `• ${point}`).join('\n')}

Client Engagement Level: ${behavior.engagement}
Intent Analysis: ${behavior.intent}
Urgency Factor: ${behavior.urgency}

STRATEGY: Proactively highlight room benefits and gauge their reaction. Ask about their specific needs for this space.`
            }
          ]
        }
      }
      
      console.log(`🏠 Enhanced AI context: User moved to ${room.replace('-', ' ')} with behavioral analysis`)
      dataChannelRef.current.send(JSON.stringify(roomUpdateMessage))
      dataChannelRef.current.send(JSON.stringify(contextUpdateMessage))
    }
  }

  const handleTalkToSales = async () => {
    if (!propertyId) {
      console.error('Property ID is required for Talk to Sales')
      return
    }

    try {
      // Create HeyGen session via API
      const response = await fetch('/api/heygen/live-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: propertyId,
          agentType: 'general',
          question: `User started video call from virtual tour. Currently viewing: ${currentRoom.replace('-', ' ')}`
        })
      })

      if (response.ok) {
        setShowHeyGenAgent(true)
      } else {
        const error = await response.json()
        console.error('Failed to start HeyGen session:', error)
        alert('Unable to connect to sales agent. Please try again or contact us directly.')
      }
    } catch (error) {
      console.error('Error starting HeyGen session:', error)
      alert('Connection error. Please check your internet connection and try again.')
    }
  }

  const handleHeyGenSessionStart = (sessionId: string) => {
    console.log('HeyGen session started:', sessionId)
    // Track analytics
    if (propertyId) {
      fetch(`/api/properties/${propertyId}/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'heygen_session_started',
          event_data: {
            session_id: sessionId,
            room: currentRoom,
            source: 'virtual_tour_talk_to_sales'
          }
        })
      }).catch(console.error)
    }
  }

  const handleHeyGenSessionEnd = (sessionId: string) => {
    console.log('HeyGen session ended:', sessionId)
    setShowHeyGenAgent(false)
    // Track analytics
    if (propertyId) {
      fetch(`/api/properties/${propertyId}/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'heygen_session_ended',
          event_data: {
            session_id: sessionId,
            room: currentRoom
          }
        })
      }).catch(console.error)
    }
  }

  // OpenAI Realtime Voice Interface handlers
  // Helper function to safely send data via data channel
  const sendDataChannelMessage = (message: any) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      try {
        dataChannelRef.current.send(JSON.stringify(message))
        return true
      } catch (error) {
        console.error('❌ Failed to send data channel message:', error)
        return false
      }
    } else {
      console.warn('⚠️ Data channel not open, message not sent:', message.type)
      return false
    }
  }

  const handleVoiceToggle = () => {
    console.log('🎤 Voice toggle clicked. Current state:', { isVoiceExpanded, isConnected, connectionStatus })
    
    if (isConnected) {
      // If connected, disconnect
      console.log('🔌 Disconnecting by user request')
      disconnectRealtimeAPI()
      setIsVoiceExpanded(false)
    } else {
      // If not connected, connect
      console.log('🔌 Connecting by user request')
      connectToRealtimeAPI()
      setIsVoiceExpanded(true)
    }
  }

  const attemptReconnection = () => {
    // DISABLED: No automatic reconnection - user must manually connect
    console.log('🔄 Automatic reconnection disabled - user must manually reconnect')
    setConnectionError('Connection lost. Please click the microphone button to reconnect.')
    setConnectionStatus('error')
    return
  }

  const connectToRealtimeAPI = async () => {
    console.log('🚀 connectToRealtimeAPI called. Current state:', { isConnectingRef: isConnectingRef.current, isConnected, connectionStatus })
    
    // Check if user is authenticated before connecting
    if (!user) {
      setConnectionError('Please log in or sign up to use the AI assistant feature.')
      setConnectionStatus('error')
      return
    }
    
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current) {
      console.log('🔄 Connection already in progress, skipping...')
      return
    }
    
    // Prevent connecting if already connected
    if (isConnected || connectionStatus === 'connected') {
      console.log('🔄 Already connected, skipping...')
      return
    }
    
    // Clean up any previous connection state without calling full disconnect
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    if (dataChannelRef.current) {
      dataChannelRef.current.close()
      dataChannelRef.current = null
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current.srcObject = null
      audioElementRef.current = null
    }
    if (mediaStreamRef.current) {
      if ((mediaStreamRef.current as any).micCleanup) {
        (mediaStreamRef.current as any).micCleanup()
      }
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    
    try {
      isConnectingRef.current = true
      setConnectionStatus('connecting')
      setConnectionError('')
      
      console.log('🚀 Attempting to connect to OpenAI Realtime API via WebRTC...')
      
      // Get ephemeral token from backend
      try {
        const tokenResponse = await fetch('/api/realtime/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId })
        })
        
        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json()
          throw new Error(errorData.error || 'Failed to get realtime token')
        }
        
        const { ephemeral_key } = await tokenResponse.json()
        console.log('🎫 Ephemeral token received:', ephemeral_key?.substring(0, 10) + '...')
        
        if (!ephemeral_key) {
          throw new Error('No ephemeral key received from server - check OpenAI API access')
        }
        
        // Create RTCPeerConnection for WebRTC with multiple STUN servers
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' }
          ],
          iceCandidatePoolSize: 10
        })
        wsRef.current = pc as any // Store in ref for cleanup
        
        console.log('🌐 Creating WebRTC peer connection...')
        
        // Set up audio output - play remote audio from the model
        const audioEl = document.createElement('audio')
        audioEl.autoplay = true
        audioElementRef.current = audioEl
        
        // Add WebRTC connection monitoring - minimal and passive
        pc.oniceconnectionstatechange = () => {
          console.log('🧊 ICE connection state:', pc.iceConnectionState)
          
          if (pc.iceConnectionState === 'connected') {
            console.log('✅ ICE connection established successfully')
            setReconnectAttempts(0)
          } else if (pc.iceConnectionState === 'failed') {
            console.error('❌ ICE connection failed - will not auto-reconnect')
          } else if (pc.iceConnectionState === 'disconnected') {
            console.warn('⚠️ ICE connection disconnected - will not auto-reconnect')
          }
        }

        pc.onconnectionstatechange = () => {
          console.log('🔗 WebRTC connection state:', pc.connectionState)
          
          if (pc.connectionState === 'connected') {
            console.log('✅ WebRTC peer connection established')
          } else if (pc.connectionState === 'failed') {
            console.error('❌ WebRTC connection permanently failed')
          } else if (pc.connectionState === 'disconnected') {
            console.warn('⚠️ WebRTC connection disconnected')
          }
        }

        pc.ontrack = (event) => {
          console.log('🔊 Received audio track from AI')
          audioEl.srcObject = event.streams[0]
          setIsResponding(true)
        }
        
        // Set up local audio input (microphone)
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              sampleRate: 24000,
              echoCancellation: true,   // Re-enable for cleaner audio
              noiseSuppression: true,   // Re-enable for cleaner audio
              autoGainControl: true     // Re-enable for consistent levels
            }
          })
          
          mediaStreamRef.current = mediaStream
          console.log('🎤 Microphone access granted:', {
            trackCount: mediaStream.getTracks().length,
            audioTrackSettings: mediaStream.getAudioTracks()[0]?.getSettings(),
            audioConstraints: mediaStream.getAudioTracks()[0]?.getConstraints()
          })
          
          // Test microphone audio levels
          const audioContext = new AudioContext()
          const analyser = audioContext.createAnalyser()
          analyser.fftSize = 256
          analyser.smoothingTimeConstant = 0.8
          const source = audioContext.createMediaStreamSource(mediaStream)
          source.connect(analyser)
          
          const bufferLength = analyser.frequencyBinCount
          const dataArray = new Uint8Array(bufferLength)
          const checkMicLevel = () => {
            // Use getByteTimeDomainData for audio amplitude instead of frequency data
            analyser.getByteTimeDomainData(dataArray)
            
            let sum = 0
            for (let i = 0; i < bufferLength; i++) {
              const normalized = (dataArray[i] - 128) / 128  // Convert to -1 to 1 range
              sum += normalized * normalized  // RMS calculation
            }
            const rms = Math.sqrt(sum / bufferLength)
            const amplitude = Math.round(rms * 100)  // Scale to 0-100
            
            console.log('🎤 Audio level check:', amplitude, '(should be >10 when speaking)')
            if (amplitude > 10) {
              console.log('🔥 SPEECH DETECTED! Level:', amplitude, '- Should trigger OpenAI VAD')
            }
          }
          
          // Test checkMicLevel immediately to see if it works
          console.log('🎤 Testing checkMicLevel function immediately...')
          checkMicLevel()
          
          const micLevelInterval = setInterval(checkMicLevel, 1000)
          console.log('🎤 Audio monitoring interval started with ID:', micLevelInterval)
          
          // Store cleanup function
          ;(mediaStream as any).micCleanup = () => {
            console.log('🎤 Cleaning up audio monitoring interval:', micLevelInterval)
            clearInterval(micLevelInterval)
            audioContext.close()
          }
          
          // Add local audio track to peer connection
          const audioTrack = mediaStream.getAudioTracks()[0]
          if (audioTrack) {
            // Make sure the track is enabled
            audioTrack.enabled = true
            
            // Add track to peer connection with error handling
            try {
              pc.addTrack(audioTrack, mediaStream)
              console.log('🎤 Audio track added to peer connection successfully:', {
                trackId: audioTrack.id,
                trackLabel: audioTrack.label,
                trackEnabled: audioTrack.enabled,
                trackReadyState: audioTrack.readyState,
                trackSettings: audioTrack.getSettings()
              })
              
              // Verify the track is actually working
              console.log('🎤 Audio track verification:', {
                hasAudio: !!audioTrack,
                isLive: audioTrack.readyState === 'live',
                isEnabled: audioTrack.enabled,
                capabilities: audioTrack.getCapabilities ? audioTrack.getCapabilities() : 'Not available'
              })
            } catch (trackError) {
              console.error('❌ Failed to add audio track to peer connection:', trackError)
              throw new Error('Failed to add microphone to voice connection')
            }
          } else {
            console.error('❌ No audio track found in media stream')
            throw new Error('No microphone audio track available')
          }
          setIsRecording(true)
          
        } catch (micError) {
          console.error('❌ Microphone error:', micError)
          throw new Error('Microphone access required for voice chat')
        }
        
        // Set up data channel for sending and receiving Realtime API events
        const dataChannel = pc.createDataChannel('oai-events', {
          ordered: true
        })
        dataChannelRef.current = dataChannel // Store reference for later use
        
        console.log('📡 Data channel created:', {
          readyState: dataChannel.readyState,
          label: dataChannel.label,
          ordered: dataChannel.ordered
        })
        
        // Monitor data channel state changes
        dataChannel.addEventListener('statechange', () => {
          console.log('📡 Data channel state changed:', dataChannel.readyState)
        })

        // Add message handler to process OpenAI responses
        dataChannel.addEventListener('message', (event) => {
          console.log('📨 Raw data channel message received:', event.data)
          try {
            const data = JSON.parse(event.data)
            console.log('📨 Parsed data channel message:', data.type)
            handleRealtimeEvent(data)
          } catch (error) {
            console.error('❌ Error parsing data channel message:', error)
            console.error('❌ Raw data was:', event.data)
          }
        })

        dataChannel.addEventListener('open', async () => {
          console.log('✅ Data channel opened - connection established!')
          isConnectingRef.current = false // Reset connection flag
          setConnectionStatus('connected')
          setIsConnected(true)
          setReconnectAttempts(0) // Reset reconnection counter on successful connection
          setFallbackMode(false) // Reset fallback mode on successful connection
          
          // Get language-specific configuration
          const currentLangObj = languages.find(l => l.code === selectedLanguage) || languages.find(l => l.code === 'en');
          
          // Send initial session configuration with detected language
          const sessionConfig = {
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              instructions: `You are an elite AI real estate specialist helping with property ${propertyId}. Your goal is to create genuine interest and guide prospects toward scheduling viewings.

CURRENT LANGUAGE: ${currentLangObj?.name} (${selectedLanguage})
CULTURAL STYLE: ${currentLangObj?.salesStyle}

CULTURAL CONTEXT:
${currentLangObj?.culturalNotes}

${selectedLanguage === 'ar' ? `
🇪🇬 EGYPTIAN ARABIC SPECIFICS:
- Use warm Egyptian dialect: "إزيك؟" "كده حلو" "ده جميل قوي"
- Family focus: "مناسب للعيلة الكريمة" "الأولاد هيفرحوا"
- Investment angle: "استثمار ممتاز" "فلوسك في أمان"
- Prestige mention: "منطقة محترمة" "مستوى راقي"
- Religious comfort: "إن شاء الله" "ربنا يوفقك"
- Genuine warmth: "عايز خيرك" "حبيبي ده أحسن عقار"

GREETING: Start with "أهلاً وسهلاً! مرحباً بيك في جولة العقار الراقي ده. إزيك؟ هل ده أول مرة تشوف العقار؟"
` : `
INITIAL GREETING: Start with a warm, culturally-appropriate greeting in ${currentLangObj?.name} and immediately ask about their interest in the property.
`}

INITIAL ENGAGEMENT STRATEGY:
1. Start with a warm greeting in their language
2. Ask about their timeline and family situation
3. Identify their priorities and preferences
4. Guide them through the property features
5. Build emotional connection to the space

SALES APPROACH:
- Emphasize family-friendly features
- Highlight investment potential
- Focus on prestige and community
- Address security and privacy
- Discuss payment plans and financing

RESPONSE FRAMEWORK:
1. Acknowledge their interests with empathy
2. Provide specific, relevant information
3. Create emotional connection
4. Bridge to next logical step
5. Ask qualifying questions

Remember: This is a high-end property in Egypt. Focus on prestige, family values, and investment potential. Communicate in ${currentLangObj?.name} with ${currentLangObj?.salesStyle} approach.`,
              voice: selectedLanguage === 'ar' ? 'alloy' : selectedLanguage === 'fr' ? 'alloy' : selectedLanguage === 'es' ? 'alloy' : selectedLanguage === 'de' ? 'alloy' : 'alloy',
              input_audio_format: 'pcm16',
              output_audio_format: 'pcm16',
              input_audio_transcription: { 
                model: 'whisper-1',
                language: selectedLanguage === 'ar' ? 'ar' : selectedLanguage === 'fr' ? 'fr' : selectedLanguage === 'es' ? 'es' : selectedLanguage === 'de' ? 'de' : 'en'
              },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,  // Higher threshold for less sensitive detection
                prefix_padding_ms: 300,
                silence_duration_ms: 800  // Shorter silence duration
              },
              temperature: 0.7,
              max_response_output_tokens: 2048
            }
          }
          
          console.log('📤 Sending session configuration via data channel...')
          sendDataChannelMessage(sessionConfig)
          
          // Send initial greeting in the detected language after a brief delay
          setTimeout(() => {
            if (dataChannel.readyState === 'open') {
              console.log(`🎤 Triggering initial greeting in ${currentLangObj?.name}`)
              
              // Create a conversation item that tells the AI to greet the user
              const greetingInstruction = {
                type: 'conversation.item.create',
                item: {
                  type: 'message',
                  role: 'system',
                  content: [
                    {
                      type: 'input_text',
                      text: `IMPORTANT: Start immediately with your greeting in ${currentLangObj?.name}. ${
                        selectedLanguage === 'ar' ? 
                        'Say: "أهلاً وسهلاً! مرحباً بيك في جولة العقار الراقي ده. إزيك؟ ممكن تقولي إيه اللي مهمك في العقار ده؟"' :
                        selectedLanguage === 'fr' ?
                        'Say: "Bienvenue dans cette visite virtuelle! Comment puis-je vous aider avec cette propriété?"' :
                        selectedLanguage === 'es' ?
                        'Say: "¡Bienvenido a este recorrido virtual! ¿Cómo puedo ayudarle con esta propiedad?"' :
                        selectedLanguage === 'de' ?
                        'Say: "Willkommen zu dieser virtuellen Tour! Wie kann ich Ihnen bei dieser Immobilie helfen?"' :
                        'Say: "Welcome to this virtual property tour! How can I help you with this property?"'
                      } Then wait for their response.`
                    }
                  ]
                }
              }
              
              sendDataChannelMessage(greetingInstruction)
              
              // Trigger response generation to make the AI speak the greeting immediately
              const responseCommand = {
                type: 'response.create',
                response: {
                  modalities: ['audio', 'text']
                }
              }
              sendDataChannelMessage(responseCommand)
            }
          }, 1500) // Wait 1.5 seconds for session to be fully established
        })
        
        // Start the WebRTC session using SDP (Session Description Protocol)
        console.log('🤝 Creating WebRTC offer...')
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false
        })
        await pc.setLocalDescription(offer)
        
        // Send SDP offer to OpenAI Realtime API
        const baseUrl = 'https://api.openai.com/v1/realtime'
        const model = 'gpt-4o-realtime-preview-2024-12-17'
        
        console.log('📡 Sending SDP offer to OpenAI...', {
          offerType: offer.type,
          offerSdpLength: offer.sdp?.length,
          iceGatheringState: pc.iceGatheringState
        })
        
        const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
          method: 'POST',
          body: offer.sdp,
          headers: {
            'Authorization': `Bearer ${ephemeral_key}`,
            'Content-Type': 'application/sdp'
          }
        })
        
        if (!sdpResponse.ok) {
          const errorText = await sdpResponse.text()
          console.error('❌ SDP negotiation failed:', {
            status: sdpResponse.status,
            statusText: sdpResponse.statusText,
            error: errorText
          })
          throw new Error(`SDP negotiation failed: ${sdpResponse.status} ${errorText}`)
        }
        
        // Set remote description with the answer from OpenAI
        const answerSdp = await sdpResponse.text()
        console.log('✅ Received SDP answer from OpenAI', {
          answerLength: answerSdp.length,
          connectionState: pc.connectionState
        })
        
        const answer = {
          type: 'answer' as RTCSdpType,
          sdp: answerSdp
        }
        
        await pc.setRemoteDescription(answer)
        console.log('🎉 WebRTC remote description set successfully!', {
          connectionState: pc.connectionState,
          iceConnectionState: pc.iceConnectionState
        })
        
      } catch (tokenError) {
        console.error('❌ Failed to get ephemeral token or establish connection:', tokenError)
        isConnectingRef.current = false // Reset connection flag
        setConnectionError(`Connection failed: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}`)
        setConnectionStatus('error')
        
        // Suggest using text chat instead
        setTimeout(() => {
          setFallbackMode(true)
        }, 2000)
      }
      
    } catch (error) {
      console.error('❌ Error in connectToRealtimeAPI:', error)
      isConnectingRef.current = false // Reset connection flag
      setConnectionError(error instanceof Error ? error.message : 'Unknown connection error')
      setConnectionStatus('error')
      setFallbackMode(true)
    }
  }

  const cleanupConnection = () => {
    // Only cleanup if we're actually connected or connecting
    if (!isConnectingRef.current && connectionStatus === 'disconnected') {
      return
    }

    isConnectingRef.current = false // Reset connection flag
    setConnectionStatus('disconnected')
    setIsConnected(false)
    setIsRecording(false)
    setIsResponding(false)
    setVoiceLevel(0)
    
    // Clear all timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current)
      connectionTimeoutRef.current = null
    }
    setReconnectAttempts(0) // Reset reconnection counter
    setConnectionError('')
    
    // Clear any pending reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }

  const disconnectRealtimeAPI = () => {
    // Only disconnect if we're actually connected
    if (connectionStatus === 'disconnected') {
      return
    }

    console.log('🔌 Disconnecting from Realtime API...')
    console.trace('🕵️ Disconnect called from:') // This will show what's calling disconnect
    
    // First set disconnected state to prevent race conditions
    isConnectingRef.current = false // Reset connection flag immediately
    setConnectionStatus('disconnected')
    setIsConnected(false)
    
    // Clear any pending reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    // Stop microphone
    if (mediaStreamRef.current) {
      // Call cleanup function for audio monitoring if it exists
      if ((mediaStreamRef.current as any).micCleanup) {
        (mediaStreamRef.current as any).micCleanup()
        console.log('🎤 Audio monitoring cleanup called')
      }
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop()
        console.log('🎤 Stopped microphone track')
      })
      mediaStreamRef.current = null
    }
    
    // Close audio element
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current.srcObject = null
      audioElementRef.current = null
      console.log('🔊 Closed audio element')
    }
    
    // Close data channel first
    if (dataChannelRef.current) {
      dataChannelRef.current.close()
      dataChannelRef.current = null
      console.log('📡 Closed data channel')
    }
    
    // Close RTCPeerConnection (WebRTC)
    if (wsRef.current) {
      if (wsRef.current instanceof RTCPeerConnection) {
        wsRef.current.close()
        console.log('🔌 WebRTC peer connection closed')
      }
      wsRef.current = null
    }
    
    // Clean up states
    cleanupConnection()
    
    console.log('✅ Disconnected from Realtime API successfully')
  }

  const handleRealtimeEvent = (event: any) => {
    console.log('📨 Realtime event:', event.type, event)
    
    switch (event.type) {
      case 'session.created':
        console.log('✅ Session created')
        break
        
      case 'session.updated':
        console.log('✅ Session updated')
        break
        
      case 'input_audio_buffer.append':
        console.log('🎤➡️ Audio data sent to OpenAI buffer')
        break
        
      case 'input_audio_buffer.speech_started':
        console.log('🗣️ User started speaking - OpenAI VAD detected speech!')
        setIsRecording(true)
        setIsResponding(false)
        break
        
      case 'input_audio_buffer.speech_stopped':
        console.log('🤐 User stopped speaking - OpenAI VAD detected silence')
        // Don't immediately set recording to false - let server VAD handle it
        break
        
      case 'input_audio_buffer.committed':
        console.log('💾 Audio buffer committed for processing')
        setIsRecording(false)
        break
        
      case 'conversation.item.created':
        console.log('💬 Conversation item created:', event.item?.type)
        if (event.item?.type === 'message' && event.item?.role === 'user') {
          console.log('👤 User message added to conversation')
        } else if (event.item?.type === 'function_call') {
          console.log('🔧 Function call requested:', event.item?.name, event.item?.arguments)
          // Handle function calls for property knowledge
          if (event.item?.name === 'get_property_knowledge') {
            try {
              const args = JSON.parse(event.item.arguments || '{}')
              handlePropertyKnowledgeRequest(event.item.call_id, args)
            } catch (error) {
              console.error('❌ Error parsing function arguments:', error)
            }
          }
        }
        break
        
      case 'response.created':
        console.log('🤖 AI response started')
        setIsResponding(true)
        setIsRecording(false)
        break
        
      case 'response.function_call_arguments.delta':
        console.log('🔧 Function call arguments delta:', event.delta)
        break
        
      case 'response.function_call_arguments.done':
        console.log('🔧 Function call arguments complete:', event.arguments)
        break
        
      case 'response.audio.delta':
        // WebRTC handles audio automatically via the audio track
        console.log('🔊 AI audio chunk received (handled by WebRTC)')
        break
        
      case 'response.audio.done':
        console.log('✅ AI audio response complete')
        break
        
      case 'response.done':
        console.log('✅ AI response complete')
        setIsResponding(false)
        // Server VAD will automatically handle next input detection
        // Don't force recording state here as it causes conflicts
        break
        
      case 'response.text.delta':
        console.log('📝 AI text delta:', event.delta)
        break
        
      case 'response.audio_transcript.delta':
        console.log('📝 AI transcript delta:', event.delta)
        break
        
      case 'conversation.item.input_audio_transcription.completed':
        console.log('📝 User speech transcribed:', event.transcript)
        
        // Enhanced multilingual sales intelligence
        if (event.transcript) {
          const transcript = event.transcript.toLowerCase()
          const behavior = analyzeUserBehavior()
          
          // Advanced buying signal detection across languages with Egyptian Arabic
          const buyingSignals = {
            price_inquiry: /سعر|السعر|بكام|كام|تمن|فلوس|prix|precio|preis|price|cost|تكلفة|how much|afford|budget|expensive|cheap|غالي|رخيص/i.test(transcript),
            timeline_inquiry: /متى|امتى|قريب|بكرة|النهاردة|الأسبوع الجاي|quand|cuándo|wann|when|soon|timeline|urgent|quickly|move|عايز أشوف/i.test(transcript),
            family_mention: /عائلة|العيلة|الأولاد|العيال|أطفال|ولاد|بنات|famille|familia|familie|family|enfants|niños|kinder|children|kids|spouse|wife|husband|جوزي|مراتي/i.test(transcript),
            financing_interest: /تمويل|بنك|قسط|أقساط|فلوس|financement|financiación|finanzierung|قرض|prêt|préstamo|darlehen|mortgage|loan|payment|bank|credit|كاش|مقدم/i.test(transcript),
            location_concern: /منطقة|المنطقة|الحي|مكان|موقع|lieu|ubicación|standort|location|area|neighborhood|transport|commute|school|shopping|مدارس|مواصلات/i.test(transcript),
            comparison_shopping: /other|أخرى|غيره|عندكم إيه|autre|otro|andere|compare|مقارنة|comparer|comparar|vergleichen|better|أحسن|meilleur|mejor|besser|أفضل/i.test(transcript),
            emotional_connection: /love|حب|بحب|عاجبني|جميل|حلو|رائع|adore|me encanta|liebe|beautiful|perfect|dream|ideal|amazing|wow|عبقري|روعة/i.test(transcript),
            decision_maker: /decide|قرار|هقرر|هفكر|décider|decidir|entscheiden|think about|discuss|partner|spouse|boss|لازم أسأل|هكلم|هشاور/i.test(transcript),
            urgency: /now|الآن|دلوقتي|النهاردة|maintenant|ahora|jetzt|today|this week|immediate|urgent|quick|عاجل|بسرعة|حالاً/i.test(transcript),
            investment_focus: /investment|استثمار|فلوس|عائد|investissement|inversión|investition|roi|return|value|appreciate|market|ربح|مكسب|استثمار عقاري/i.test(transcript)
          }
          
          // Update conversation metrics
          const newMetrics = {
            totalQuestions: conversationMetrics.totalQuestions + 1,
            buyingSignals: conversationMetrics.buyingSignals + Object.values(buyingSignals).filter(Boolean).length,
            engagementScore: Math.min(100, conversationMetrics.engagementScore + (Object.values(buyingSignals).filter(Boolean).length * 10)),
            leadQuality: Object.values(buyingSignals).filter(Boolean).length >= 3 ? 'hot' : 
                       Object.values(buyingSignals).filter(Boolean).length >= 1 ? 'warm' : conversationMetrics.leadQuality,
            primaryInterests: [...conversationMetrics.primaryInterests, ...Object.entries(buyingSignals).filter(([_, value]) => value).map(([key]) => key)],
            decisionTimeframe: buyingSignals.urgency ? 'immediate' : buyingSignals.timeline_inquiry ? 'soon' : conversationMetrics.decisionTimeframe,
            objections: conversationMetrics.objections,
            familyContext: conversationMetrics.familyContext,
            investmentContext: conversationMetrics.investmentContext,
            culturalPreferences: conversationMetrics.culturalPreferences
          }
          
          setConversationMetrics(newMetrics)
          
          // Add to conversation history
          const newConversationEntry = {
            timestamp: Date.now(),
            type: 'user' as const,
            content: event.transcript,
            buyingSignals: Object.entries(buyingSignals).filter(([_, value]) => value).map(([key]) => key),
            room: currentRoom
          }
          
          setConversationHistory(prev => [...prev, newConversationEntry])
          
          // Save lead intelligence to user account if authenticated
          saveLeadIntelligenceToUserAccount(newMetrics, newConversationEntry, buyingSignals)
          
          // Send sales intelligence to AI
          if (Object.values(buyingSignals).some(signal => signal)) {
            const currentLanguage = languages.find(l => l.code === selectedLanguage)
            const intelligenceUpdate = {
              type: 'conversation.item.create',
              item: {
                type: 'message',
                role: 'system',
                content: [
                  {
                    type: 'input_text',
                    text: `🎯 SALES INTELLIGENCE ALERT:
                    
Client Said: "${event.transcript}"
Language: ${currentLanguage?.name} (${currentLanguage?.salesStyle})
Room Context: ${currentRoom.replace('-', ' ')}

🚨 BUYING SIGNALS DETECTED:
${Object.entries(buyingSignals).filter(([key, value]) => value).map(([key]) => `🔥 ${key.replace('_', ' ').toUpperCase()}`).join('\n')}

📊 CLIENT INTELLIGENCE:
• Engagement Level: ${behavior.engagement} (${conversationMetrics.engagementScore}% score)
• Lead Quality: ${conversationMetrics.leadQuality.toUpperCase()}
• Total Questions Asked: ${conversationMetrics.totalQuestions}
• Buying Signals Count: ${conversationMetrics.buyingSignals}

🎭 CULTURAL CONTEXT:
${currentLanguage?.culturalNotes}

🚀 RECOMMENDED STRATEGY:
${getSalesStrategy(buyingSignals, behavior)}

⚡ IMMEDIATE RESPONSE FRAMEWORK:
1. ACKNOWLEDGE their interest/concern with empathy
2. PROVIDE specific, relevant information they're seeking  
3. CREATE emotional connection to the property benefit
4. BRIDGE to next logical step in sales process
5. ASK qualifying question to maintain engagement

🎯 RESPONSE TONE: ${currentLanguage?.salesStyle.replace('_', ' ')} with ${behavior.urgency} urgency

REMEMBER: This is a ${conversationMetrics.leadQuality} lead - adjust energy and closing intensity accordingly!`
                  }
                ]
              }
            }
            
            dataChannelRef.current?.send(JSON.stringify(intelligenceUpdate))
          }
        }
        break
        
      case 'rate_limits.updated':
        console.log('🚦 Rate limits updated')
        break
        
      case 'error':
        console.error('❌ Realtime API error:', event.error)
        setConnectionStatus('error')
        
        // Handle specific error types
        const errorMessage = event.error?.message || 'Unknown error'
        const errorCode = event.error?.code || ''
        
        if (errorMessage.includes('rate_limit') || errorCode === 'rate_limit_exceeded') {
          setConnectionError('Rate limit reached - please wait a moment and try again')
        } else if (errorMessage.includes('token') || errorMessage.includes('authentication')) {
          setConnectionError('Authentication expired - reconnecting...')
          // Attempt to reconnect with new token
          setTimeout(() => {
            attemptReconnection()
          }, 3000)
        } else if (errorMessage.includes('session_expired') || errorMessage.includes('expired')) {
          setConnectionError('Session expired - reconnecting...')
          setTimeout(() => {
            attemptReconnection()
          }, 2000)
        } else {
          setConnectionError(`Connection error: ${errorMessage}`)
          // For unknown errors, try reconnecting after a delay
          setTimeout(() => {
            attemptReconnection()
          }, 5000)
        }
        break
        
      default:
        console.log('📨 Unhandled event:', event.type)
    }
  }

  const handlePropertyKnowledgeRequest = async (callId: string, args: { knowledgeType: string }) => {
    try {
      console.log(`🏠 Fetching ${args.knowledgeType} property knowledge for ${propertyId}`)
      
      // Fetch property knowledge from existing API
      const response = await fetch(`/api/properties/${propertyId}/complete-knowledge`)
      const knowledgeData = await response.json()
      
      // Enhanced sales-focused knowledge formatting
      const salesContext = {
        propertyHighlights: {
          bedrooms: knowledgeData.basicInfo?.bedrooms,
          bathrooms: knowledgeData.basicInfo?.bathrooms,
          squareMeters: knowledgeData.basicInfo?.sqm,
          price: knowledgeData.basicInfo?.price,
          propertyType: knowledgeData.basicInfo?.propertyType,
          yearBuilt: knowledgeData.basicInfo?.yearBuilt,
          title: knowledgeData.basicInfo?.title,
          address: knowledgeData.basicInfo?.address
        },
        
        marketIntelligence: {
          pricePerSqm: Math.round((knowledgeData.basicInfo?.price || 0) / (knowledgeData.basicInfo?.sqm || 1)),
          appreciationRate: '5.2% annually in this area',
          daysOnMarket: 'Properties here sell within 14-21 days',
          competition: 'Only 3 similar properties available in this price range',
          demandLevel: 'High buyer interest - 85% more views than average',
          investmentPotential: 'Excellent ROI due to location and growth trajectory'
        },
        
        emotionalTriggers: {
          lifestyle: `Perfect for ${knowledgeData.basicInfo?.bedrooms === 3 ? 'growing families' : 
                      knowledgeData.basicInfo?.bedrooms === 4 ? 'established families' : 
                      knowledgeData.basicInfo?.bedrooms >= 5 ? 'large families or multi-generational living' : 'young professionals or couples'}`,
          community: 'Prestigious neighborhood with like-minded residents',
          futureValue: 'Smart investment that grows with your family',
          exclusivity: 'Prime location with limited inventory',
          convenience: 'Everything you need within walking distance'
        },
        
        objectionHandlers: {
          price: {
            value: `At ${Math.round((knowledgeData.basicInfo?.price || 0) / (knowledgeData.basicInfo?.sqm || 1))} EGP per sqm, this is 8% below area average`,
            financing: 'Multiple payment plans available with competitive rates',
            comparison: 'Similar properties are priced 15-20% higher'
          },
          location: {
            benefits: 'Strategic location with upcoming infrastructure improvements',
            transport: 'New metro extension planned for 2025',
            amenities: 'Walking distance to top schools and shopping centers'
          },
          condition: {
            quality: 'Move-in ready with premium finishes throughout',
            warranty: 'Comprehensive warranty coverage included',
            maintenance: 'Professionally maintained with detailed service history'
          }
        },
        
        contextualSelling: {
          currentRoom: currentRoom.replace('-', ' '),
          roomBenefits: getRoomSellingPoints(currentRoom),
          tourDuration: 'Client showing strong engagement',
          nextSteps: 'Schedule private viewing or submit preliminary offer'
        },
        
        urgencyFactors: {
          market: 'Interest rates expected to rise next quarter',
          inventory: 'Only 2 units left in this development',
          timing: 'Perfect time to buy before peak season pricing',
          competition: 'Multiple clients have shown serious interest'
        }
      }
      
      // Combine all knowledge with sales context
      const enhancedKnowledge = {
        ...knowledgeData,
        salesContext,
        currentContext: {
          currentRoom: currentRoom.replace('-', ' '),
          tourType: '3D virtual tour',
          userActivity: 'exploring property',
          engagementLevel: 'high'
        }
      }
      
      // Send function result back to AI
      const functionResult = {
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: callId,
          output: JSON.stringify(enhancedKnowledge)
        }
      }
      
      dataChannelRef.current?.send(JSON.stringify(functionResult))
      
      // Enhanced response generation with sales psychology
      const responseCommand = {
        type: 'response.create',
        response: {
          modalities: ['text', 'audio'],
          instructions: `SALES RESPONSE FRAMEWORK:

PROPERTY FACTS (Use exactly):
- ${enhancedKnowledge.salesContext.propertyHighlights.bedrooms} bedrooms
- ${enhancedKnowledge.salesContext.propertyHighlights.bathrooms} bathrooms  
- ${enhancedKnowledge.salesContext.propertyHighlights.squareMeters} square meters
- ${enhancedKnowledge.salesContext.propertyHighlights.price?.toLocaleString()} EGP

RESPONSE STRATEGY for ${args.knowledgeType}:
1. START with empathy/understanding
2. PROVIDE specific factual answer
3. ADD emotional benefit or lifestyle advantage
4. INCLUDE market intelligence for urgency
5. GUIDE toward next action step

TONE: Confident expert who genuinely cares about their best interests
LENGTH: 15-25 seconds of natural speech
CLOSE: Always end with a question or suggested action

Use the sales context and objection handlers to craft a compelling response that moves them closer to commitment.`
        }
      }
      
      dataChannelRef.current?.send(JSON.stringify(responseCommand))
      
    } catch (error) {
      console.error('❌ Error handling property knowledge request:', error)
      
      // Send error response to AI
      const errorResult = {
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: callId,
          output: JSON.stringify({
            error: 'Could not fetch property knowledge',
            message: 'I apologize, but I\'m having trouble accessing the detailed property information right now. Please try asking again.'
          })
        }
      }
      
      dataChannelRef.current?.send(JSON.stringify(errorResult))
    }
  }

  const playAudioChunk = (audioData: string) => {
    try {
      if (!audioElementRef.current) {
        audioElementRef.current = new Audio()
        audioElementRef.current.autoplay = true
      }
      
      // Convert base64 audio to playable format
      const audioBlob = base64ToBlob(audioData, 'audio/pcm')
      const audioUrl = URL.createObjectURL(audioBlob)
      
      audioElementRef.current.src = audioUrl
      audioElementRef.current.play().catch(console.error)
      
    } catch (error) {
      console.error('❌ Error playing audio chunk:', error)
    }
  }

  // Utility functions
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = ''
    const bytes = new Uint8Array(buffer)
    const chunkSize = 0x8000
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize)
      binary += String.fromCharCode.apply(null, Array.from(chunk))
    }
    return btoa(binary)
  }

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  const handleLanguageChange = (langCode: string) => {
    console.log(`🌍 Language changing from ${selectedLanguage} to: ${langCode}`)
    setSelectedLanguage(langCode)
    
    // Update global translation service
    translationService.saveCurrentLanguage(langCode)
    
    // Trigger global language change event for other components
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('languageChange', { detail: langCode });
      window.dispatchEvent(event);
    }
    
    // Update session language if connected with cultural context
    if (dataChannelRef.current && isConnected) {
      const selectedLang = languages.find(l => l.code === langCode)
      
      // First update the session with new language settings
      const sessionUpdate = {
        type: 'session.update',
        session: {
          voice: langCode === 'ar' ? 'sage' : langCode === 'fr' ? 'alloy' : langCode === 'es' ? 'shimmer' : langCode === 'de' ? 'echo' : 'alloy',
          input_audio_transcription: { 
            model: 'whisper-1',
            language: langCode === 'ar' ? 'ar' : langCode === 'fr' ? 'fr' : langCode === 'es' ? 'es' : langCode === 'de' ? 'de' : 'en'
          },
          instructions: `🌍 LANGUAGE SWITCH: Now communicating in ${selectedLang?.name}

📋 CULTURAL ADAPTATION:
${selectedLang?.culturalNotes}

🎨 SALES STYLE: ${selectedLang?.salesStyle}

${selectedLang?.code === 'ar' ? `
🇪🇬 EGYPTIAN ARABIC SPECIFICS:
- Use warm Egyptian dialect: "إزيك؟" "كده حلو" "ده جميل قوي"
- Family focus: "مناسب للعيلة الكريمة" "الأولاد هيفرحوا"
- Investment angle: "استثمار ممتاز" "فلوسك في أمان"
- Prestige mention: "منطقة محترمة" "مستوى راقي"
- Religious comfort: "إن شاء الله" "ربنا يوفقك"
- Genuine warmth: "عايز خيرك" "حبيبي ده أحسن عقار"
` : ''}

💬 Continue the conversation in ${selectedLang?.name}, maintaining your elite real estate agent persona while adapting to this cultural context. Keep building rapport and guiding toward property commitment.`
        }
      }
      dataChannelRef.current.send(JSON.stringify(sessionUpdate))
      
      // Send a greeting in the new language after a brief delay
      setTimeout(() => {
        if (dataChannelRef.current) {
          const greetingMessage = {
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'assistant',
              content: [
                {
                  type: 'input_text',
                  text: langCode === 'ar' ? 
                    `أهلاً وسهلاً! أنا مساعدك العقاري الخاص. إيه رأيك في العقار الجميل ده؟ هل تبحث عن مكان مناسب للعيلة الكريمة؟` :
                    langCode === 'fr' ?
                    `Parfait! Je suis votre assistant immobilier personnel. Que pensez-vous de cette magnifique propriété? Cherchez-vous un espace adapté à votre famille?` :
                    langCode === 'es' ?
                    `¡Perfecto! Soy su asistente inmobiliario personal. ¿Qué opina de esta hermosa propiedad? ¿Busca un espacio adecuado para su familia?` :
                    langCode === 'de' ?
                    `Ausgezeichnet! Ich bin Ihr persönlicher Immobilienassistent. Was denken Sie über diese wunderbare Immobilie? Suchen Sie einen familienfreundlichen Raum?` :
                    `Perfect! I'm your personal real estate assistant. What do you think of this beautiful property? Are you looking for a family-friendly space?`
                }
              ]
            }
          }
          
          dataChannelRef.current.send(JSON.stringify(greetingMessage))
          
          // Trigger response generation
          const responseCommand = {
            type: 'response.create',
            response: {
              modalities: ['audio', 'text']
            }
          }
          sendDataChannelMessage(responseCommand)
        }
      }, 500)
      
      // Track language preference in analytics
      if (propertyId) {
        fetch(`/api/properties/${propertyId}/analytics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'language_preference',
            event_data: {
              language: langCode,
              language_name: selectedLang?.name,
              sales_style: selectedLang?.salesStyle,
              room: currentRoom
            }
          })
        }).catch(console.error)
      }
    }
  }

  // Enhanced lead scoring system
  const calculateLeadScore = () => {
    let score = 0
    
    // Engagement metrics
    score += Math.min(30, conversationMetrics.totalQuestions * 3)
    score += Math.min(40, conversationMetrics.buyingSignals * 8)
    
    // Time spent in tour
    const tourDuration = Date.now() - roomStartTime
    if (tourDuration > 300000) score += 20 // 5+ minutes
    else if (tourDuration > 180000) score += 10 // 3+ minutes
    
    // Room exploration diversity
    const roomsVisited = conversationHistory.filter(h => h.room).length
    score += Math.min(10, roomsVisited * 2)
    
    return Math.min(100, score)
  }

  // Real-time lead qualification
  const getLeadQualification = () => {
    const score = calculateLeadScore()
    const signals = conversationMetrics.buyingSignals
    
    if (score >= 80 && signals >= 4) return { level: 'hot', priority: 'immediate', action: 'Call now!' }
    if (score >= 60 && signals >= 2) return { level: 'warm', priority: 'today', action: 'Schedule viewing' }
    if (score >= 40 || signals >= 1) return { level: 'qualified', priority: 'this week', action: 'Follow up' }
    return { level: 'cold', priority: 'monitor', action: 'Continue nurturing' }
  }

  // Save lead intelligence to authenticated user's account for admin tracking
  const saveLeadIntelligenceToUserAccount = async (metrics: any, conversationEntry: any, buyingSignals: any) => {
    try {
      // Only save if we have meaningful data
      if (metrics.buyingSignals === 0 && metrics.totalQuestions <= 1) return
      
      const leadData = {
        property_id: propertyId,
        conversation_metrics: {
          ...metrics,
          leadScore: calculateLeadScore(),
          qualification: getLeadQualification()
        },
        latest_interaction: {
          ...conversationEntry,
          detected_signals: buyingSignals,
          language_preference: selectedLanguage,
          cultural_context: languages.find(l => l.code === selectedLanguage)?.culturalNotes
        },
        tour_context: {
          current_room: currentRoom,
          rooms_visited: conversationHistory.filter(h => h.room).map(h => h.room),
          tour_duration_ms: Date.now() - roomStartTime,
          session_start: roomStartTime
        },
        market_intelligence: {
          primary_interests: metrics.primaryInterests,
          decision_timeframe: metrics.decisionTimeframe,
          urgency_level: buyingSignals.urgency ? 'high' : buyingSignals.timeline_inquiry ? 'medium' : 'low'
        }
      }

      // Send to analytics endpoint to be saved to user account
      await fetch('/api/profile/lead-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      })

      console.log('📊 Lead intelligence saved to user account')
    } catch (error) {
      console.log('⚠️ Could not save lead intelligence (user may not be authenticated):', error)
    }
  }

  const updateConversationMetrics = (newMetrics: Partial<typeof conversationMetrics>) => {
    setConversationMetrics(prev => ({
      ...prev,
      ...newMetrics,
      familyContext: {
        ...prev.familyContext,
        ...(newMetrics.familyContext || {})
      },
      investmentContext: {
        ...prev.investmentContext,
        ...(newMetrics.investmentContext || {})
      },
      culturalPreferences: {
        ...prev.culturalPreferences,
        ...(newMetrics.culturalPreferences || {})
      }
    }))
  }

  if (isLoading) {
    return (
      <div className={`relative bg-slate-100 rounded-lg overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading 3D Tour...</p>
          </div>
        </div>
      </div>
    )
  }

  // If tourUrl is provided, render iframe-based virtual tour
  if (tourUrl) {
    console.log('🖼️ Rendering iframe with tourUrl:', tourUrl)
    
    // Validate URL before processing
    try {
      new URL(tourUrl) // This will throw if URL is invalid
    } catch (error) {
      console.error('❌ Invalid tour URL provided:', tourUrl, error)
      // Fall back to 3D mock tour for invalid URLs
      return renderFallbackTour()
    }
    
    // Enhance the Realsee URL to start directly in 3D model view
    const enhancedModelUrl = (() => {
      try {
        if (tourUrl.includes('realsee.ai')) {
          const separator = tourUrl.includes('?') ? '&' : '?'
          
          // Strategy 1: Dollhouse view parameters (most common for 3D model view)
          const dollhouseParams = `view=dollhouse&autoplay=1&start=dollhouse&scene=3d&mode=dollhouse`
          
          console.log('🎯 Using dollhouse view parameters for 3D model start')
          return `${tourUrl}${separator}${dollhouseParams}`
        }
        return tourUrl // For non-Realsee URLs, use as-is
      } catch (error) {
        console.error('❌ Error processing tour URL:', error)
        return tourUrl // Return original URL if processing fails
      }
    })()
    
    console.log('🎯 Enhanced model URL:', enhancedModelUrl)
    
    return (
      <div className={`relative bg-slate-900 rounded-lg overflow-hidden ${className}`}>
        {/* 3D Model iframe - fully interactive and responsive */}
        <iframe
          ref={(iframe) => {
            if (iframe) {
              // Add error handler for iframe
              iframe.onerror = () => {
                console.error('❌ Failed to load iframe tour URL:', enhancedModelUrl)
                setIsLoading(false)
              }
              
              // Add load handler
              iframe.onload = () => {
                console.log('✅ Iframe loaded successfully')
                setIsLoading(false)
                
                // Fallback approach: Use JavaScript injection to switch to 3D view
                if (tourUrl.includes('realsee.ai')) {
                  try {
                    // Wait a bit for the tour to fully load, then try to switch to 3D view
                    setTimeout(() => {
                      const injectionScript = `
                        // Try multiple methods to switch to 3D/dollhouse view
                        if (window.switchToDollhouse) window.switchToDollhouse();
                        if (window.switchTo3D) window.switchTo3D();
                        if (window.setView) window.setView('dollhouse');
                        if (window.setMode) window.setMode('3d');
                        
                        // Try to find and click dollhouse/3D button
                        const dollhouseBtn = document.querySelector('[data-view="dollhouse"], .dollhouse-btn, .view-3d, [aria-label*="3D"], [title*="dollhouse"]');
                        if (dollhouseBtn) dollhouseBtn.click();
                        
                        // Alternative: Look for buttons with 3D-related text
                        const buttons = document.querySelectorAll('button, .btn, [role="button"]');
                        buttons.forEach(btn => {
                          const text = btn.textContent?.toLowerCase() || '';
                          if (text.includes('dollhouse') || text.includes('3d') || text.includes('model')) {
                            btn.click();
                          }
                        });
                      `;
                      
                      // Only inject if we can access the iframe content (same-origin)
                      try {
                        const doc = iframe.contentDocument || iframe.contentWindow?.document;
                        if (doc) {
                          const script = doc.createElement('script');
                          script.textContent = injectionScript;
                          doc.head?.appendChild(script);
                          console.log('🎯 Injected 3D view switch script');
                        }
                      } catch (e) {
                        console.log('🔒 Cross-origin iframe - cannot inject script (this is normal for external tours)');
                      }
                    }, 3000); // Wait 3 seconds for tour to load
                  } catch (error) {
                    console.log('⚠️ Could not inject 3D view script:', error);
                  }
                }
              }
            }
          }}
          src={enhancedModelUrl}
          className="w-full h-full border-0 absolute inset-0"
          allowFullScreen
          allow="fullscreen; vr; xr; gyroscope; accelerometer; autoplay; web-share; camera; microphone"
          title="Interactive 3D Property Model"
          style={{ 
            pointerEvents: 'auto',
            minHeight: fullscreen ? '100vh' : '300px',
            zIndex: 1
          }}
        />

        {/* Loading overlay for iframe */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white text-sm">Loading virtual tour...</p>
            </div>
          </div>
        )}

        {/* Minimal corner indicators - positioned to not interfere with interaction */}
        {!fullscreen && (
          <div className="absolute top-3 left-3 opacity-80 hover:opacity-100 transition-opacity pointer-events-none z-10">
            <div className="bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs font-semibold shadow-lg border border-white/20">
              <span className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                <span>3D Interactive</span>
              </span>
            </div>
          </div>
        )}

        {/* AI Agent Tooltip - Only show in non-fullscreen mode */}
        {!fullscreen && propertyId && (
          <div className="absolute top-12 right-3 opacity-70 hover:opacity-100 transition-opacity pointer-events-none z-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-xs font-medium border border-white/20 max-w-[200px]">
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                <span>Ask AI about this property</span>
              </span>
            </div>
          </div>
        )}

        {/* Smart Voice AI Interface - Available in both fullscreen and hero section */}
        {propertyId && (() => {
          // Mobile detection
          const isMobile = typeof window !== 'undefined' && 
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          
          return (
            <div className={`absolute z-10 pointer-events-auto ${fullscreen ? 'top-4 right-4' : 'top-3 right-3'}`}>
              {isMobile ? (
                // Mobile UI - Transparent button with sound waves
                <div className="relative">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVoiceToggle();
                    }}
                    className={`relative bg-transparent border-2 rounded-full w-14 h-14 p-0 transition-all duration-300 ${
                      isConnected 
                        ? 'border-red-400 hover:border-red-300' 
                        : 'border-blue-400 hover:border-blue-300'
                    }`}
                    size="sm"
                  >
                    {/* Background sound waves when active */}
                    {(isRecording || isResponding) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <VoiceWave isActive={isRecording || isResponding} level={voiceLevel} />
                      </div>
                    )}
                    
                    {/* Main icon */}
                    <div className="relative z-10">
                      {isConnected ? (
                        isRecording ? (
                          <Mic className="h-6 w-6 text-green-400 animate-pulse" />
                        ) : isResponding ? (
                          <Volume2 className="h-6 w-6 text-blue-400 animate-pulse" />
                        ) : (
                          <X className="h-6 w-6 text-red-400" />
                        )
                      ) : (
                        <Mic className="h-6 w-6 text-blue-400" />
                      )}
                    </div>
                  </Button>
                  
                  {/* Small status indicator */}
                  {connectionStatus === 'connecting' && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              ) : !isVoiceExpanded ? (
                // Desktop collapsed state - Smart button
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVoiceToggle();
                  }}
                  className={`${fullscreen 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2' 
                    : 'bg-blue-600/90 backdrop-blur-sm border-blue-500/30 text-white hover:bg-blue-700/90 hover:scale-105 transition-all shadow-lg text-xs px-3 py-2 h-auto font-medium'
                  }`}
                  size={fullscreen ? "lg" : "sm"}
                >
                  <Mic className={`${fullscreen ? 'h-5 w-5' : 'h-3 w-3'} mr-1`} />
                  {fullscreen ? 'Ask AI Agent' : 'AI Voice'}
                </Button>
            ) : (
              // Expanded state - Voice interface panel
              <div className={`bg-black/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl transition-all duration-300 ${
                fullscreen ? 'p-6 min-w-[300px]' : 'p-4 min-w-[280px]'
              }`}>
                {/* Header with close button */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white font-medium text-sm">AI Agent Active</span>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVoiceToggle();
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Language Selector */}
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Globe className="h-4 w-4 text-white/60" />
                    <span className="text-white/80 text-xs">Language</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`px-2 py-1 rounded-full text-xs transition-all ${
                          selectedLanguage === lang.code
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        {lang.flag} {lang.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voice Activity Visualization */}
                <div className="mb-4">
                  <div className="flex items-center justify-center mb-2">
                    <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                      isRecording ? 'border-green-400 bg-green-400/20' : 
                      isResponding ? 'border-blue-400 bg-blue-400/20' : 
                      'border-white/30 bg-white/10'
                    }`}>
                      {isRecording ? (
                        <Mic className="h-6 w-6 text-green-400 animate-pulse" />
                      ) : isResponding ? (
                        <Volume2 className="h-6 w-6 text-blue-400 animate-pulse" />
                      ) : (
                        <Mic className="h-6 w-6 text-white/60" />
                      )}
                    </div>
                  </div>
                  
                  {/* Voice Wave Animation */}
                  <VoiceWave isActive={isRecording || isResponding} level={voiceLevel} />
                  
                  {/* Status Text */}
                  <div className="text-center mt-2">
                    <span className="text-white/80 text-xs">
                      {connectionStatus === 'connecting' ? 'Connecting to AI...' :
                       connectionStatus === 'error' ? (
                         <div className="space-y-1">
                           <div className="text-red-300">Connection Failed</div>
                           {connectionError && (
                             <div className="text-red-200 text-xs">{connectionError}</div>
                           )}
                           {fallbackMode && (
                             <div className="text-blue-300">Try text chat instead?</div>
                           )}
                         </div>
                       ) :
                       !isConnected ? 'Ready to connect' :
                       isRecording ? 'Listening... Ask me anything!' : 
                       isResponding ? 'AI is responding...' : 
                       'Connected - ready for voice conversation'}
                    </span>
                  </div>
                </div>

                {/* Manual Voice Toggle */}
                <div className="flex justify-center space-x-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isConnected) {
                        // If connected, disconnect completely
                        disconnectRealtimeAPI();
                      } else {
                        // If not connected, start connection
                        connectToRealtimeAPI();
                      }
                    }}
                    size="sm"
                    variant={isConnected ? "destructive" : connectionStatus === 'error' ? "secondary" : "default"}
                    className="flex items-center space-x-1"
                    disabled={connectionStatus === 'connecting'}
                  >
                    {connectionStatus === 'connecting' ? (
                      <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin" />
                    ) : isConnected ? (
                      <MicOff className="h-3 w-3" />
                    ) : (
                      <Mic className="h-3 w-3" />
                    )}
                    <span className="text-xs">
                      {connectionStatus === 'connecting' ? 'Connecting...' :
                       isConnected ? 'Disconnect' : 
                       connectionStatus === 'error' ? 'Retry' : 'Connect'}
                    </span>
                  </Button>
                  
                  {(connectionStatus === 'error' || fallbackMode) && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Open text chat fallback
                        if (propertyId) {
                          // You can integrate with your existing ChatBot component
                          console.log('Opening text chat fallback for property:', propertyId);
                          // For now, just show an alert - you can replace with actual chat component
                          alert('Text chat fallback would open here. You can integrate this with your existing ChatBot component.');
                        }
                      }}
                      size="sm"
                      variant="outline"
                      className="flex items-center space-x-1 bg-blue-600/20 border-blue-400/30 text-white hover:bg-blue-600/30"
                    >
                      <MessageCircle className="h-3 w-3" />
                      <span className="text-xs">Text Chat</span>
                    </Button>
                  )}
                </div>

                {/* Helpful Tips */}
                <div className="mt-3 pt-3 border-t border-white/10">
                  {connectionStatus === 'error' ? (
                    <div className="text-white/60 text-xs text-center space-y-1">
                      <div className="text-red-300 font-medium">Common Solutions:</div>
                      <div>• Add NEXT_PUBLIC_OPENAI_API_KEY to .env.local</div>
                      <div>• Ensure you have Realtime API access</div>
                      <div>• Try the text chat option below</div>
                    </div>
                  ) : (
                    <div className="text-white/60 text-xs text-center">
                      💡 Ask about: price, features, neighborhood, amenities, or anything else!
                    </div>
                  )}
                </div>
              </div>
            )
          }
          </div>
        );
        })()}

        {/* HeyGen Video Agent Modal */}
        {showHeyGenAgent && propertyId && (
          <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Live Sales Consultation</h2>
                  <p className="text-sm text-slate-600">AI Agent with complete property knowledge</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowHeyGenAgent(false)}
                  className="hover:bg-red-50 hover:border-red-300"
                >
                  End Call
                </Button>
              </div>
              
              {/* Video Component */}
              <div className="flex-1 p-4">
                <UnifiedPropertyAgent
                  propertyId={propertyId}
                  trigger={null}
                  onSessionStart={handleHeyGenSessionStart}
                  onSessionEnd={handleHeyGenSessionEnd}
                  autoStart={true}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Simple fallback for properties without tour URLs
  return (
    <div className={`relative bg-slate-900 rounded-lg overflow-hidden ${className} flex items-center justify-center`}>
      <div className="text-center p-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-600/20 rounded-full flex items-center justify-center">
          <svg 
            className="w-8 h-8 text-blue-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01" />
          </svg>
        </div>
        <h3 className="text-white font-medium mb-2">Virtual Tour Coming Soon</h3>
        <p className="text-white/60 text-sm mb-4">
          3D virtual tour is not available for this property yet.
        </p>
        <p className="text-white/40 text-xs">
          Contact us for more information about this property.
        </p>
      </div>

      {/* Smart Voice AI Interface - Available in both fullscreen and hero section */}
      {propertyId && (
        <div className={`absolute z-10 pointer-events-auto ${fullscreen ? 'top-4 right-4' : 'top-3 right-3'}`}>
          {!isVoiceExpanded ? (
            // Collapsed state - Smart button
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleVoiceToggle();
              }}
              className={`${fullscreen 
                ? 'bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2' 
                : 'bg-blue-600/90 backdrop-blur-sm border-blue-500/30 text-white hover:bg-blue-700/90 hover:scale-105 transition-all shadow-lg text-xs px-3 py-2 h-auto font-medium'
              }`}
              size={fullscreen ? "lg" : "sm"}
            >
              <Mic className={`${fullscreen ? 'h-5 w-5' : 'h-3 w-3'} mr-1`} />
              {fullscreen ? 'Ask AI Agent' : 'AI Voice'}
            </Button>
          ) : (
            // Expanded state - Voice interface panel
            <div className={`bg-black/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl transition-all duration-300 ${
              fullscreen ? 'p-6 min-w-[300px]' : 'p-4 min-w-[280px]'
            }`}>
              {/* Header with close button */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white font-medium text-sm">AI Agent Active</span>
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVoiceToggle();
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Language Selector */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Globe className="h-4 w-4 text-white/60" />
                  <span className="text-white/80 text-xs">Language</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`px-2 py-1 rounded-full text-xs transition-all ${
                        selectedLanguage === lang.code
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {lang.flag} {lang.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Activity Visualization */}
              <div className="mb-4">
                <div className="flex items-center justify-center mb-2">
                  <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    isRecording ? 'border-green-400 bg-green-400/20' : 
                    isResponding ? 'border-blue-400 bg-blue-400/20' : 
                    'border-white/30 bg-white/10'
                  }`}>
                    {isRecording ? (
                      <Mic className="h-6 w-6 text-green-400 animate-pulse" />
                    ) : isResponding ? (
                      <Volume2 className="h-6 w-6 text-blue-400 animate-pulse" />
                    ) : (
                      <Mic className="h-6 w-6 text-white/60" />
                    )}
                  </div>
                </div>
                
                {/* Voice Wave Animation */}
                <VoiceWave isActive={isRecording || isResponding} level={voiceLevel} />
                
                {/* Status Text */}
                <div className="text-center mt-2">
                  <span className="text-white/80 text-xs">
                    {connectionStatus === 'connecting' ? 'Connecting to AI...' :
                     connectionStatus === 'error' ? (
                       <div className="space-y-1">
                         <div className="text-red-300">Connection Failed</div>
                         {connectionError && (
                           <div className="text-red-200 text-xs">{connectionError}</div>
                         )}
                         {fallbackMode && (
                           <div className="text-blue-300">Try text chat instead?</div>
                         )}
                       </div>
                     ) :
                     !isConnected ? 'Ready to connect' :
                     isRecording ? 'Listening... Ask me anything!' : 
                     isResponding ? 'AI is responding...' : 
                     'Connected - ready for voice conversation'}
                  </span>
                </div>
              </div>

              {/* Manual Voice Toggle */}
              <div className="flex justify-center space-x-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isConnected) {
                      // If connected, disconnect completely
                      disconnectRealtimeAPI();
                    } else {
                      // If not connected, start connection
                      connectToRealtimeAPI();
                    }
                  }}
                  size="sm"
                  variant={isConnected ? "destructive" : connectionStatus === 'error' ? "secondary" : "default"}
                  className="flex items-center space-x-1"
                  disabled={connectionStatus === 'connecting'}
                >
                  {connectionStatus === 'connecting' ? (
                    <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin" />
                  ) : isConnected ? (
                    <MicOff className="h-3 w-3" />
                  ) : (
                    <Mic className="h-3 w-3" />
                  )}
                  <span className="text-xs">
                    {connectionStatus === 'connecting' ? 'Connecting...' :
                     isConnected ? 'Disconnect' : 
                     connectionStatus === 'error' ? 'Retry' : 'Connect'}
                  </span>
                </Button>
                
                {(connectionStatus === 'error' || fallbackMode) && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Open text chat fallback
                      if (propertyId) {
                        // You can integrate with your existing ChatBot component
                        console.log('Opening text chat fallback for property:', propertyId);
                        // For now, just show an alert - you can replace with actual chat component
                        alert('Text chat fallback would open here. You can integrate this with your existing ChatBot component.');
                      }
                    }}
                    size="sm"
                    variant="outline"
                    className="flex items-center space-x-1 bg-blue-600/20 border-blue-400/30 text-white hover:bg-blue-600/30"
                  >
                    <MessageCircle className="h-3 w-3" />
                    <span className="text-xs">Text Chat</span>
                  </Button>
                )}
              </div>

              {/* Helpful Tips */}
              <div className="mt-3 pt-3 border-t border-white/10">
                {connectionStatus === 'error' ? (
                  <div className="text-white/60 text-xs text-center space-y-1">
                    <div className="text-red-300 font-medium">Common Solutions:</div>
                    <div>• Add NEXT_PUBLIC_OPENAI_API_KEY to .env.local</div>
                    <div>• Ensure you have Realtime API access</div>
                    <div>• Try the text chat option below</div>
                  </div>
                ) : (
                  <div className="text-white/60 text-xs text-center">
                    💡 Ask about: price, features, neighborhood, amenities, or anything else!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
