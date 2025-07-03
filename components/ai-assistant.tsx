"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Mic, MicOff, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AIAssistantProps {
  isOpen: boolean
  onClose: () => void
  propertyData: any
  currentRoom: string
  tourContext: {
    visitedRooms: string[]
    timeInRoom: number
    totalTimeSpent: number
  }
}

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
}

export function AIAssistant({ isOpen, onClose, propertyData, currentRoom, tourContext }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "ar", name: "العربية", flag: "🇪🇬" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "es", name: "Español", flag: "🇪🇸" },
  ]

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Send initial greeting based on context
      const greeting = generateContextualGreeting()
      addMessage("assistant", greeting)
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const generateContextualGreeting = () => {
    const roomName = currentRoom.replace("-", " ")
    const timeMinutes = Math.floor(tourContext.timeInRoom / 60)

    const greetings = {
      en: {
        high: `Hi! I see you've been exploring the ${roomName} for ${timeMinutes} minutes. What interests you most about this space?`,
        medium: `Hello! You're currently viewing the ${roomName}. How can I help you learn more about this property?`,
        low: `Welcome! I'm here to help you with any questions about the ${roomName} or this property.`,
      },
      ar: {
        high: `مرحباً! أرى أنك تستكشف ${roomName} منذ ${timeMinutes} دقائق. ما الذي يثير اهتمامك أكثر في هذا المكان؟`,
        medium: `أهلاً! أنت تشاهد حالياً ${roomName}. كيف يمكنني مساعدتك لتعرف المزيد عن هذا العقار؟`,
        low: `أهلاً وسهلاً! أنا هنا لمساعدتك في أي أسئلة حول ${roomName} أو هذا العقار.`,
      },
    }

    const engagementLevel =
      tourContext.visitedRooms.length > 2 ? "high" : tourContext.timeInRoom > 120 ? "medium" : "low"

    const langGreetings = greetings[selectedLanguage as keyof typeof greetings] || greetings.en
    return langGreetings[engagementLevel as keyof typeof langGreetings]
  }

  const addMessage = (type: "user" | "assistant", content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newMessage])
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage = inputValue.trim()
    setInputValue("")
    addMessage("user", userMessage)
    setIsTyping(true)

    try {
      // Call OpenAI API with property context
      const response = await fetch('/api/chat/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          propertyId: propertyData.id,
          currentRoom,
          tourContext,
          propertyData
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      addMessage("assistant", data.response)
      
      // Text-to-speech if enabled
      if (isSpeaking) {
        speakText(data.response)
      }
    } catch (error) {
      console.error('Error getting AI response:', error)
      // Fallback to hardcoded response
      const fallbackResponse = generateAIResponse(userMessage)
      addMessage("assistant", fallbackResponse)
      
      if (isSpeaking) {
        speakText(fallbackResponse)
      }
    } finally {
      setIsTyping(false)
    }
  }

  const generateAIResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase()
    const roomName = currentRoom.replace("-", " ")

    // Context-aware responses based on current room and property data
    if (lowerMessage.includes("price") || lowerMessage.includes("cost")) {
      return `This ${propertyData.title} is priced at ${propertyData.price}. Given its location in ${propertyData.location} and the premium features like ${propertyData.features && propertyData.features.length > 0 ? propertyData.features.slice(0, 2).join(" and ") : "modern amenities"}, it offers excellent value for money.`
    }

    if (lowerMessage.includes("size") || lowerMessage.includes("area")) {
      return `This property offers ${propertyData.sqm} square meters of living space with ${propertyData.beds} bedrooms and ${propertyData.baths} bathrooms. The ${roomName} you're currently viewing is spacious and well-designed.`
    }

    if (lowerMessage.includes("kitchen") && currentRoom === "kitchen") {
      return `You're in the perfect spot to ask about the kitchen! This modern kitchen features premium appliances, granite countertops, and plenty of storage space. It's designed for both everyday cooking and entertaining.`
    }

    if (lowerMessage.includes("bedroom") && currentRoom.includes("bedroom")) {
      return `This ${roomName} offers a peaceful retreat with ${propertyData.features && propertyData.features.length > 0 ? (propertyData.features.find((f: string) => f.includes("view")) || "beautiful views") : "beautiful views"}. The room is spacious enough for a king-size bed and includes ample closet space.`
    }

    if (lowerMessage.includes("bathroom")) {
      return `The bathrooms in this property feature modern fixtures, marble tiles, and premium finishes. ${currentRoom === "bathroom" ? "You're currently viewing one of them - notice the attention to detail in the design." : "Would you like to navigate to the bathroom to see it in detail?"}`
    }

    if (lowerMessage.includes("location") || lowerMessage.includes("area")) {
      return `This property is located in ${propertyData.location}, which is a highly desirable area. You'll be close to ${propertyData.nearbyServices && propertyData.nearbyServices.length > 0
        ? propertyData.nearbyServices.slice(0, 2).map((s: any) => s.name).join(" and ")
        : "essential services"}, making it very convenient for daily life.`
    }

    if (lowerMessage.includes("features") || lowerMessage.includes("amenities")) {
      return `This property comes with fantastic amenities including ${propertyData.features && propertyData.features.length > 0 ? propertyData.features.slice(0, 3).join(", ") : "modern features"}. The building also offers ${propertyData.features && propertyData.features.length > 0 ? (propertyData.features.find((f: string) => f.includes("security")) || "security features") : "security features"} for your peace of mind.`
    }

    // Default contextual response
    return `Great question! Since you're currently in the ${roomName}, I can tell you that this space is designed with modern living in mind. ${propertyData.description.split(".")[0]}. Would you like to know anything specific about this room or the property?`
  }

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = selectedLanguage === "ar" ? "ar-EG" : "en-US"
      speechSynthesis.speak(utterance)
    }
  }

  const startListening = () => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.lang = selectedLanguage === "ar" ? "ar-EG" : "en-US"
      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputValue(transcript)
      }
      recognition.start()
    }
  }

  const suggestedQuestions = [
    "What's the price of this property?",
    "Tell me about the kitchen features",
    "What's nearby this location?",
    "How big is this room?",
    "What amenities are included?",
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">AI</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Property Assistant</h3>
                  <p className="text-sm text-slate-600">Currently in: {currentRoom.replace("-", " ")}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Language Selector */}
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="text-sm border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Select language"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsSpeaking(!isSpeaking)}
                  className={isSpeaking ? "bg-blue-100" : ""}
                >
                  {isSpeaking ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.type === "user" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${message.type === "user" ? "text-blue-100" : "text-slate-500"}`}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-2xl px-4 py-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Suggested Questions */}
              {messages.length === 1 && (
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">Suggested questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setInputValue(question)
                          setTimeout(() => handleSendMessage(), 100)
                        }}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={`Ask: ${question}`}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 border-t border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask me anything about this property..."
                    className="pr-12"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={startListening}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 ${
                      isListening ? "bg-red-100 text-red-600" : ""
                    }`}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>
                <Button onClick={handleSendMessage} disabled={!inputValue.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
