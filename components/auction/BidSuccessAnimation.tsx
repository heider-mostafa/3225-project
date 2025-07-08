"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Trophy, Zap, Star, Heart, Crown, Gem, Award } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNumberTranslation } from '@/lib/useNumberTranslation'

interface BidSuccessAnimationProps {
  isVisible: boolean
  bidAmount: number
  isWinning: boolean
  isReserveMet: boolean
  onComplete: () => void
  bidRank?: 'first' | 'outbid_previous' | 'new_high' | 'reserve_met'
}

interface Particle {
  id: number
  x: number
  y: number
  size: number
  color: string
  icon: React.ReactNode
  duration: number
  delay: number
}

const celebrationMessages = {
  first: {
    en: ["First bid! 🎯", "You're leading!", "Great start!"],
    ar: ["أول مزايدة! 🎯", "أنت في المقدمة!", "بداية رائعة!"]
  },
  outbid_previous: {
    en: ["Outbid! 💪", "New leader!", "Taking the lead!"],
    ar: ["تجاوزت المزايدة! 💪", "قائد جديد!", "تولي القيادة!"]
  },
  new_high: {
    en: ["New high bid! 🔥", "Pushing higher!", "Excellent bid!"],
    ar: ["أعلى مزايدة جديدة! 🔥", "دفع أعلى!", "مزايدة ممتازة!"]
  },
  reserve_met: {
    en: ["Reserve met! 🏆", "Qualifying bid!", "You're in the game!"],
    ar: ["تم الوصول للحد الأدنى! 🏆", "مزايدة مؤهلة!", "أنت في اللعبة!"]
  }
}

export function BidSuccessAnimation({ 
  isVisible, 
  bidAmount, 
  isWinning, 
  isReserveMet, 
  onComplete,
  bidRank = 'new_high'
}: BidSuccessAnimationProps) {
  const { i18n } = useTranslation()
  const { translatePrice, safeT } = useNumberTranslation()
  const [particles, setParticles] = useState<Particle[]>([])
  const [showMessage, setShowMessage] = useState(false)
  const [messageIndex, setMessageIndex] = useState(0)

  const currentLang = i18n.language as 'en' | 'ar'
  const messages = celebrationMessages[bidRank][currentLang]

  // Generate particles
  useEffect(() => {
    if (isVisible) {
      const newParticles: Particle[] = []
      const particleCount = isReserveMet ? 12 : 8
      
      const icons = [
        <Sparkles className="w-full h-full" />,
        <Star className="w-full h-full" />,
        <Zap className="w-full h-full" />,
        <Trophy className="w-full h-full" />
      ]

      const colors = isReserveMet 
        ? ['#3B82F6', '#1D4ED8', '#2563EB', '#1E40AF', '#60A5FA', '#93C5FD']
        : ['#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#60A5FA', '#93C5FD']

      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 60 + 20,
          y: Math.random() * 60 + 20,
          size: Math.random() * 12 + 8,
          color: colors[Math.floor(Math.random() * colors.length)],
          icon: icons[Math.floor(Math.random() * icons.length)],
          duration: Math.random() * 2 + 1,
          delay: Math.random() * 0.5
        })
      }

      setParticles(newParticles)
      setShowMessage(true)
      setMessageIndex(Math.floor(Math.random() * messages.length))

      // Play success sound effect
      if (typeof window !== 'undefined' && window.navigator.vibrate) {
        if (isReserveMet) {
          window.navigator.vibrate([100, 50, 100, 50, 200])
        } else {
          window.navigator.vibrate([100, 50, 100])
        }
      }

      // Auto-complete after animation
      const timer = setTimeout(() => {
        onComplete()
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [isVisible, isReserveMet, messages.length, onComplete])

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
        onClick={onComplete}
      >
        {/* Particles */}
        <div className="absolute w-80 h-80 overflow-hidden pointer-events-none">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ 
                x: '50%', 
                y: '50%', 
                scale: 0,
                opacity: 0,
                rotate: 0
              }}
              animate={{ 
                x: `${particle.x}%`, 
                y: `${particle.y}%`,
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                rotate: [0, 360, 720]
              }}
              transition={{ 
                duration: particle.duration, 
                delay: particle.delay,
                ease: "easeOut"
              }}
              className="absolute"
              style={{
                width: particle.size,
                height: particle.size,
                color: particle.color
              }}
            >
              {particle.icon}
            </motion.div>
          ))}
        </div>

        {/* Main Success Card */}
        <motion.div
          initial={{ scale: 0, rotate: -5 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 5 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25 
          }}
          className={`relative bg-gradient-to-br ${
            isReserveMet 
              ? 'from-blue-500 via-blue-600 to-blue-700' 
              : 'from-blue-500 via-blue-600 to-blue-700'
          } p-6 rounded-xl shadow-xl max-w-sm mx-4`}
        >
          {/* Glow effect */}
          <div className={`absolute inset-0 rounded-xl blur-md opacity-50 ${
            isReserveMet 
              ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700' 
              : 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700'
          }`} />
          
          {/* Content */}
          <div className="relative z-10 text-center text-white">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-3"
            >
              {isReserveMet ? (
                <Trophy className="w-12 h-12 mx-auto text-blue-100" />
              ) : (
                <Zap className="w-12 h-12 mx-auto text-blue-100" />
              )}
            </motion.div>

            {/* Success Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <h2 className="text-xl font-bold mb-2">
                {safeT('auction.bidSuccess', 'Bid Placed!')}
              </h2>
              <p className="text-sm font-semibold opacity-90 mb-3">
                {messages[messageIndex]}
              </p>
            </motion.div>

            {/* Bid Amount */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-3"
            >
              <div className="text-xs opacity-80 mb-1">
                {safeT('auction.yourBid', 'Your Bid')}
              </div>
              <div className="text-xl font-bold">
                {translatePrice(bidAmount, 'USD')}
              </div>
            </motion.div>

            {/* Status Badges */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="flex gap-2 justify-center mb-3"
            >
              {isWinning && (
                <div className="bg-blue-400/30 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
                  👑 {safeT('auction.winning', 'Winning')}
                </div>
              )}
              {isReserveMet && (
                <div className="bg-blue-400/30 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
                  ✅ {safeT('auction.reserveMet', 'Reserve Met')}
                </div>
              )}
            </motion.div>

            {/* Tap to Continue */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ delay: 1, duration: 1, repeat: Infinity }}
              className="text-xs opacity-60"
            >
              {safeT('common.tapToContinue', 'Tap to continue')}
            </motion.p>
          </div>
        </motion.div>

        {/* Confetti burst effect */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 0] }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="absolute w-80 h-80 pointer-events-none"
        >
          <div className={`w-full h-full rounded-full ${
            isReserveMet 
              ? 'bg-gradient-radial from-blue-400/30 to-transparent' 
              : 'bg-gradient-radial from-blue-400/20 to-transparent'
          }`} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}