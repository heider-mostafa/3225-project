import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';
import { heygenManager, type HeyGenSession } from '@/lib/heygen/HeygenAgentManager';

interface UnifiedPropertyAgentProps {
  propertyId: string;
  trigger?: React.ReactNode;
  onSessionStart?: (sessionId: string) => void;
  onSessionEnd?: (sessionId: string) => void;
  autoStart?: boolean;
}

export const UnifiedPropertyAgent: React.FC<UnifiedPropertyAgentProps> = ({
  propertyId,
  trigger,
  onSessionStart,
  onSessionEnd,
  autoStart = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<HeyGenSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Auto-start session if specified
  useEffect(() => {
    if (autoStart && !session) {
      handleStartSession();
    }
  }, [autoStart]);

  // Create and start HeyGen session
  const handleStartSession = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Make API call to create session
      const response = await fetch('/api/heygen/live-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: propertyId,
          agentType: 'general',
          question: 'User started video call from virtual tour'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Check if this is a mock session
      if (data.session.isMockSession) {
        console.log('Using mock HeyGen session for development');
        setSession(data.session);
        await initializeMockConnection();
      } else {
        setSession(data.session);
        await initializeConnection(data.session);
      }
      
      onSessionStart?.(data.session.sessionId);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize mock connection for development
  const initializeMockConnection = async () => {
    console.log('Initializing mock HeyGen connection...');
    setConnectionStatus('connecting');
    
    // Simulate connection process
    setTimeout(() => {
      setConnectionStatus('connected');
      setIsConnected(true);
      
      // Simulate avatar video with a placeholder
      if (videoRef.current) {
        // Create a canvas with a simple animation as placeholder
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        
        let frame = 0;
        const animate = () => {
          if (ctx) {
            // Clear canvas
            ctx.fillStyle = '#1f2937';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw animated elements
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.arc(320 + Math.sin(frame * 0.1) * 50, 240, 80, 0, Math.PI * 2);
            ctx.fill();
            
            // Add text
            ctx.fillStyle = '#ffffff';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Mock AI Agent', 320, 350);
            ctx.fillText('Sarah - Property Expert', 320, 380);
            
            frame++;
          }
          
          if (isConnected) {
            requestAnimationFrame(animate);
          }
        };
        
        animate();
        
        // Convert canvas to video stream
        const stream = canvas.captureStream(30);
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
    }, 2000); // 2 second delay to simulate real connection
  };

  // Initialize WebRTC and WebSocket connection
  const initializeConnection = async (sessionData: HeyGenSession) => {
    setConnectionStatus('connecting');

    try {
      // Initialize WebSocket
      const websocket = new WebSocket(sessionData.websocket_url);
      websocketRef.current = websocket;

      websocket.onopen = () => {
        console.log('WebSocket connected');
        websocket.send(JSON.stringify({
          type: 'session_start',
          session_id: sessionData.session_id,
          access_token: sessionData.access_token,
          property_id: propertyId,
          knowledge_domains: ['financial', 'legal', 'condition', 'location', 'scheduling']
        }));
      };

      websocket.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        await handleWebSocketMessage(data);
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error occurred');
        setConnectionStatus('disconnected');
      };

      websocket.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
        setIsConnected(false);
      };

      // Initialize WebRTC
      await initializeWebRTC(sessionData);

    } catch (error) {
      console.error('Connection initialization error:', error);
      setError('Failed to initialize connection');
      setConnectionStatus('disconnected');
    }
  };

  // Initialize WebRTC connection
  const initializeWebRTC = async (sessionData: HeyGenSession) => {
    try {
      const configuration: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };
      
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;

      // Get user media
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      localStreamRef.current = localStream;

      // Add local stream to peer connection
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });

      // Handle remote stream (HeyGen avatar video)
      peerConnection.ontrack = (event) => {
        console.log('Received remote stream');
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          setIsConnected(true);
          setConnectionStatus('connected');
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && websocketRef.current) {
          websocketRef.current.send(JSON.stringify({
            type: 'ice_candidate',
            candidate: event.candidate
          }));
        }
      };

      // Connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
          setConnectionStatus('connected');
          setIsConnected(true);
        } else if (peerConnection.connectionState === 'disconnected' || 
                   peerConnection.connectionState === 'failed') {
          setConnectionStatus('disconnected');
          setIsConnected(false);
        }
      };

    } catch (error) {
      console.error('WebRTC initialization error:', error);
      setError('Failed to access camera/microphone');
    }
  };

  // Handle WebSocket messages
  const handleWebSocketMessage = async (data: any) => {
    try {
      switch (data.type) {
        case 'offer':
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await peerConnectionRef.current.createAnswer();
            await peerConnectionRef.current.setLocalDescription(answer);
            
            websocketRef.current?.send(JSON.stringify({
              type: 'answer',
              answer: answer
            }));
          }
          break;

        case 'ice_candidate':
          if (peerConnectionRef.current && data.candidate) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
          break;

        case 'agent_response':
          // Handle agent's response
          console.log('Agent response:', data.message);
          break;

        case 'error':
          setError(data.message);
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  };

  // Toggle mute state
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // End session
  const handleEndSession = async () => {
    if (session) {
      try {
        await heygenManager.endSession(session.session_id);
        onSessionEnd?.(session.session_id);
      } catch (error) {
        console.error('Error ending session:', error);
      }
    }

    // Cleanup
    if (websocketRef.current) {
      websocketRef.current.close();
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    setSession(null);
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setIsOpen(false);
  };

  // Helper function to get current user ID
  const getCurrentUserId = (): string => {
    // Try to get from localStorage or generate anonymous ID
    const stored = localStorage.getItem('anonymous_user_id');
    if (stored) return stored;
    
    const newId = `anon_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('anonymous_user_id', newId);
    return newId;
  };

  return (
    <>
      {trigger && (
        <div onClick={() => setIsOpen(true)}>
          {trigger}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Property Assistant</DialogTitle>
          </DialogHeader>

          <Card className="relative">
            <CardContent className="p-0">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full aspect-video bg-black"
              />
              
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
              )}

              {error && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={toggleMute}
                  className="bg-white/10 hover:bg-white/20"
                >
                  {isMuted ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleEndSession}
                >
                  End Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
}; 