"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from 'react-i18next'
import { 
  Calendar, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  Play, 
  Eye, 
  Globe,
  CheckCircle,
  Gift,
  Clock,
  Camera,
  TrendingUp,
  Users,
  Star,
  Phone,
  Maximize2,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TourViewer } from "@/components/tour-viewer"
import { LeadCaptureForm } from "@/components/LeadCaptureForm"
import Link from "next/link"

export default function ComingSoonPage() {
  const { t, i18n } = useTranslation()
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [currentTourIndex, setCurrentTourIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [loadedTours, setLoadedTours] = useState<string[]>([])
  const [activeTours, setActiveTours] = useState<string[]>([])
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [fullscreenTour, setFullscreenTour] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    setMounted(true)
    // Auto-load all tours to prevent mobile Safari iframe initialization issues
    // Tours 2 and 3 were crashing because they were loaded on-demand
    setLoadedTours(['1', '2', '3'])
  }, [])

  // Countdown timer effect
  useEffect(() => {
    if (!mounted) return

    const calculateTimeLeft = () => {
      const now = new Date()
      const currentYear = now.getFullYear()
      let targetDate = new Date(currentYear, 8, 1) // September 1st (month is 0-indexed)
      
      // If we're past September 1st this year, target next year
      if (now > targetDate) {
        targetDate = new Date(currentYear + 1, 8, 1)
      }
      
      // Countdown is always active from now until September 1st

      const difference = targetDate.getTime() - now.getTime()
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)
        
        return { days, hours, minutes, seconds }
      }
      
      return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    // Set initial value
    setTimeLeft(calculateTimeLeft())

    return () => clearInterval(timer)
  }, [mounted])

  // Mouse tracking for interactive background
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = document.getElementById('virtual-tour-cta')?.getBoundingClientRect()
      if (rect) {
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100
        })
      }
    }

    const ctaElement = document.getElementById('virtual-tour-cta')
    if (ctaElement) {
      ctaElement.addEventListener('mousemove', handleMouseMove)
      return () => ctaElement.removeEventListener('mousemove', handleMouseMove)
    }
  }, [mounted])

  // Real virtual tour data for preview
  const sampleTours = [
    {
      id: "1",
      title: "Luxury Villa in New Cairo",
      location: "New Cairo, Egypt",
      virtual_tour_url: "https://realsee.ai/KlNNkv54",
      image: "/api/placeholder/600/400",
      bedrooms: 4,
      bathrooms: 3,
      square_meters: 350
    },
    {
      id: "2", 
      title: "Modern Apartment in Zamalek",
      location: "Zamalek, Cairo",
      virtual_tour_url: "https://realsee.ai/98OORjlW",
      image: "/api/placeholder/600/400",
      bedrooms: 2,
      bathrooms: 2,
      square_meters: 150
    },
    {
      id: "3",
      title: "Penthouse in Maadi",
      location: "Maadi, Cairo", 
      virtual_tour_url: "https://realsee.ai/P5vvkz9k",
      image: "/api/placeholder/600/400",
      bedrooms: 3,
      bathrooms: 2,
      square_meters: 200
    }
  ]

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    // TODO: Implement email collection API
    console.log("Email submitted:", email)
    setIsSubmitted(true)
    
    // Reset after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false)
      setEmail("")
    }, 3000)
  }

  // Auto-rotate tours every 5 seconds
  useEffect(() => {
    if (!mounted) return
    
    const interval = setInterval(() => {
      setCurrentTourIndex((prev) => (prev + 1) % sampleTours.length)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [mounted])

  const handleTourClick = (tourId: string) => {
    if (!loadedTours.includes(tourId)) {
      setLoadedTours(prev => [...prev, tourId])
    }
  }

  const handleTourMouseDown = (tourId: string) => {
    setActiveTours(prev => [...prev, tourId])
  }

  const handleTourMouseUp = (tourId: string) => {
    setActiveTours(prev => prev.filter(id => id !== tourId))
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="relative min-h-screen sm:h-screen flex items-center justify-center overflow-hidden py-8 sm:py-0">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-slate-900/30" />
        
        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-blue-400/30 rounded-full"
              animate={{
                y: [0, -100, 0],
                x: [0, Math.random() * 100 - 50, 0],
                scale: [1, 1.5, 1],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto w-full">
          {/* Coming Soon Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Badge className="bg-blue-600 text-white px-6 py-2 text-lg font-semibold">
              <Calendar className="w-4 h-4 mr-2" />
              {mounted ? t('comingSoon.launchDate', 'Coming September 1st') : 'Coming September 1st'}
            </Badge>
          </motion.div>

          {/* Countdown Banner */}
          {mounted && (timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <div className="bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-purple-600/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-2xl mx-auto">
                <div className="text-center mb-4">
                  <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">
                    {t('comingSoon.countdownTitle', 'Launch Countdown')}
                  </h3>
                  <p className="text-slate-600 text-sm md:text-base">
                    {t('comingSoon.countdownSubtitle', 'Get ready for the future of real estate')}
                  </p>
                </div>
                
                <div className="grid grid-cols-4 gap-2 md:gap-4">
                  {[
                    { value: timeLeft.days, label: t('comingSoon.days', 'Days') },
                    { value: timeLeft.hours, label: t('comingSoon.hours', 'Hours') },
                    { value: timeLeft.minutes, label: t('comingSoon.minutes', 'Min') },
                    { value: timeLeft.seconds, label: t('comingSoon.seconds', 'Sec') }
                  ].map((unit, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="bg-white/20 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center"
                    >
                      <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 mb-1">
                        {unit.value.toString().padStart(2, '0')}
                      </div>
                      <div className="text-xs md:text-sm text-slate-600 font-medium">
                        {unit.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-slate-800 mb-4 sm:mb-6 leading-tight"
          >
            {mounted ? t('comingSoon.heroTitle', 'The Future of') : 'The Future of'}{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {mounted ? t('comingSoon.heroTitleHighlight', 'Real Estate') : 'Real Estate'}
            </span>{" "}
            {mounted ? t('comingSoon.heroTitleEnd', 'is Here') : 'is Here'}
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-lg sm:text-xl md:text-2xl text-slate-600 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            {mounted ? t('comingSoon.heroDescription', 'Experience properties like never before with AI-powered virtual tours, instant expert guidance, and immersive 3D exploration') : 'Experience properties like never before with AI-powered virtual tours, instant expert guidance, and immersive 3D exploration'}
          </motion.p>

          {/* Features Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-8 sm:mb-12"
          >
            {[
              { icon: Globe, text: mounted ? t('comingSoon.feature1', '3D Virtual Tours') : '3D Virtual Tours' },
              { icon: Sparkles, text: mounted ? t('comingSoon.feature2', 'AI Voice Agent') : 'AI Voice Agent' },
              { icon: Eye, text: mounted ? t('comingSoon.feature3', 'Immersive Experience') : 'Immersive Experience' }
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-1 sm:gap-2 bg-white/10 backdrop-blur-md rounded-full px-2 sm:px-4 py-1 sm:py-2 text-slate-700"
              >
                <feature.icon className="w-3 sm:w-4 h-3 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Email Capture Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="max-w-md mx-auto"
          >
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleEmailSubmit}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <Input
                    type="email"
                    placeholder={mounted ? t('comingSoon.emailPlaceholder', 'Enter your email address') : 'Enter your email address'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 h-12 text-lg bg-white/10 backdrop-blur-md border-white/20 text-slate-800 placeholder:text-slate-500"
                    required
                  />
                  <Button
                    type="submit"
                    className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {mounted ? t('comingSoon.notifyMe', 'Notify Me') : 'Notify Me'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-green-500/10 backdrop-blur-md border border-green-500/20 rounded-lg p-4 text-green-700"
                >
                  <CheckCircle className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-semibold">{mounted ? t('comingSoon.successTitle', "You're on the list!") : "You're on the list!"}</p>
                  <p className="text-sm">{mounted ? t('comingSoon.successMessage', "We'll notify you on September 1st") : "We'll notify you on September 1st"}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Virtual Tour Preview Section */}
      <section className="py-12 md:py-20 bg-slate-50">
        <div className="w-full">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="text-center mb-8 md:mb-16 px-4"
          >
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-slate-800 mb-4 md:mb-6">
              {mounted ? t('comingSoon.sneakPeekTitle', 'Get a Sneak Peek') : 'Get a Sneak Peek'}
            </h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
              {mounted ? t('comingSoon.sneakPeekDescription', 'Experience our revolutionary virtual tour technology with these preview samples') : 'Experience our revolutionary virtual tour technology with these preview samples'}
            </p>
          </motion.div>

          {/* Tour Cards */}
          <div className="flex flex-col md:grid md:grid-cols-3 w-full">
            {sampleTours.map((tour, index) => (
              <motion.div
                key={tour.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group w-full"
              >
                <div className="space-y-2">
                  <div 
                    className="relative h-64 md:h-96 w-full overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                    onClick={() => handleTourClick(tour.id)}
                  >
                    {/* Embedded Virtual Tour - Only load when clicked */}
                    {loadedTours.includes(tour.id) ? (
                      <>
                        <TourViewer 
                          tourId={tour.id}
                          propertyId={tour.id}
                          tourUrl={tour.virtual_tour_url}
                          className="w-full h-full rounded-lg"
                          hideRoomMenu={true}
                        />

                        {/* Transparent Hover Overlay - Same as property details */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-lg flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
                            <div className="flex items-center space-x-2 text-slate-800">
                              <Maximize2 className="h-4 w-4" />
                              <span className="text-sm font-medium">{mounted ? t('comingSoon.clickToExplore', 'Click to Explore') : 'Click to Explore'}</span>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Preview overlay before loading */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50 backdrop-blur-sm rounded-lg" />
                        <div className="absolute inset-0 flex items-center justify-center px-4">
                          <div className="text-center text-slate-700">
                            <Eye className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-2 md:mb-4 opacity-60" />
                            <p className="text-base md:text-lg font-semibold mb-1 md:mb-2">{mounted ? t('comingSoon.clickToLoad', 'Click to Load Virtual Tour') : 'Click to Load Virtual Tour'}</p>
                            <p className="text-xs md:text-sm opacity-70 px-2">{tour.title}</p>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Tour Badge */}
                    <div className="absolute top-2 md:top-4 right-2 md:right-4 z-10">
                      <Badge className="bg-blue-600/90 text-white backdrop-blur-sm text-xs md:text-sm">
                        <Globe className="w-2 md:w-3 h-2 md:h-3 mr-1" />
                        {mounted ? t('comingSoon.liveTour', 'Live Tour') : 'Live Tour'}
                      </Badge>
                    </div>

                    {/* Coming Soon Badge */}
                    <div className="absolute top-2 md:top-4 left-2 md:left-4 z-10">
                      <Badge className="bg-purple-600/90 text-white animate-pulse backdrop-blur-sm text-xs md:text-sm">
                        <Clock className="w-2 md:w-3 h-2 md:h-3 mr-1" />
                        {mounted ? t('comingSoon.launchDateShort', 'Sept 1st') : 'Sept 1st'}
                      </Badge>
                    </div>
                  </div>

                  {/* Fullscreen Button - Same as property details */}
                  {loadedTours.includes(tour.id) && (
                    <button
                      onClick={() => setFullscreenTour(tour.id)}
                      className="w-full mt-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-700 rounded-lg transition-all duration-200 border border-gray-200 hover:border-gray-300 text-sm font-medium flex items-center justify-center space-x-2 group"
                    >
                      <Maximize2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      <span>{mounted ? t('comingSoon.viewInFullscreen', 'View in Fullscreen') : 'View in Fullscreen'}</span>
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Free Virtual Tour CTA - Copied from Homepage */}
          <section id="virtual-tour-cta" className="relative py-16 md:py-32 overflow-hidden bg-white">
            <div className="container mx-auto px-4 relative z-10">
              {/* Premium Card Container */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                viewport={{ once: true }}
                className="relative max-w-5xl mx-auto"
              >
                {/* Animated Background Gradient */}
                <div className="absolute inset-0 rounded-[2rem] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 opacity-95" />
                  <div 
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59,130,246,0.5) 0%, transparent 50%)`,
                    }}
                  />
                  {/* Subtle grid pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                      backgroundSize: '50px 50px'
                    }} />
                  </div>
                  {/* Animated particles */}
                  <div className="absolute inset-0">
                    {[...Array(15)].map((_, i) => {
                      // Use index-based deterministic positioning to avoid hydration mismatch
                      const x = (i * 13.7 + 7) % 100;
                      const y = (i * 17.3 + 12) % 100;
                      const scale = 0.5 + (i % 5) * 0.1;
                      const duration = 15 + (i % 8) * 2;
                      const delay = (i % 10);
                      
                      return (
                        <motion.div
                          key={i}
                          className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-50"
                          initial={{ 
                            x: x + "%",
                            y: y + "%",
                            scale: scale
                          }}
                          animate={{
                            y: [null, "-20%", "120%"],
                            opacity: [0, 0.8, 0]
                          }}
                          transition={{
                            duration: duration,
                            repeat: Infinity,
                            delay: delay,
                            ease: "linear"
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Glass Morphism Content Container */}
                <div className="relative bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 md:p-12 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                  {/* Premium Badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="absolute -top-6 left-1/2 transform -translate-x-1/2"
                  >
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 md:px-8 py-2 md:py-3 rounded-full font-bold shadow-xl flex items-center gap-2 text-sm md:text-base">
                      <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                      {mounted ? t('cta.exclusiveOffer', 'EXCLUSIVE OFFER') : 'EXCLUSIVE OFFER'}
                      <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                  </motion.div>

                  {/* Main Content */}
                  <div className="text-center space-y-6 md:space-y-8 pt-8">
                    {/* Title */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-white">
                          {mounted ? t('cta.getYourFree', 'Get Your FREE') : 'Get Your FREE'}
                        </span>
                        <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 animate-pulse">
                          {mounted ? t('cta.virtualTour3D', '3D Virtual Tour') : '3D Virtual Tour'}
                        </span>
                      </h2>
                    </motion.div>

                    {/* Value Proposition */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="space-y-4"
                    >
                      <div className="inline-flex items-center gap-2 md:gap-3 bg-white/10 backdrop-blur px-4 md:px-6 py-2 md:py-3 rounded-full">
                        <Star className="w-5 h-5 md:w-6 md:h-6 text-blue-400 fill-current" />
                        <span className="text-lg md:text-2xl font-semibold text-white">
                          {mounted ? t('cta.worth', 'Worth') : 'Worth'} <span className="text-cyan-400">{mounted ? t('cta.priceEGP', '5,000 EGP') : '5,000 EGP'}</span>
                        </span>
                        <div className="w-px h-4 md:h-6 bg-white/30" />
                        <span className="text-emerald-400 font-bold text-sm md:text-base">{mounted ? t('cta.hundredPercentFree', '100% FREE') : '100% FREE'}</span>
                      </div>
                      
                      <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
                        {mounted ? t('cta.sellFasterDescription', 'Sell your property 73% faster with immersive virtual tours that captivate serious buyers') : 'Sell your property 73% faster with immersive virtual tours that captivate serious buyers'}
                      </p>
                    </motion.div>

                    {/* Features Grid */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 my-8 md:my-10"
                    >
                      {[
                        { icon: Camera, title: mounted ? t('cta.professionalPhotography', 'Professional Photography') : 'Professional Photography', desc: mounted ? t('cta.hdrDroneShots', 'HDR & Drone shots') : 'HDR & Drone shots', color: "from-blue-500 to-cyan-500" },
                        { icon: TrendingUp, title: mounted ? t('cta.interactive3DTour', 'Interactive 3D Tour') : 'Interactive 3D Tour', desc: mounted ? t('cta.dollhouseFloorPlans', 'Dollhouse & Floor plans') : 'Dollhouse & Floor plans', color: "from-cyan-500 to-teal-500" },
                        { icon: Users, title: mounted ? t('cta.brokerNetwork', 'Broker Network') : 'Broker Network', desc: mounted ? t('cta.activeAgents', '1000+ active agents') : '1000+ active agents', color: "from-teal-500 to-blue-500" }
                      ].map((feature, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.05, y: -5 }}
                          className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10 hover:border-white/20 transition-all duration-300 group"
                        >
                          <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${feature.color} p-2 md:p-3 mb-3 md:mb-4 group-hover:shadow-lg transition-shadow mx-auto`}>
                            <feature.icon className="w-full h-full text-white" />
                          </div>
                          <h3 className="text-white font-semibold text-base md:text-lg mb-1">{feature.title}</h3>
                          <p className="text-slate-400 text-xs md:text-sm">{feature.desc}</p>
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* CTA Button */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                    >
                      <LeadCaptureForm
                        trigger={
                          <Button 
                            size="lg" 
                            className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-lg sm:text-xl px-6 sm:px-12 py-6 sm:py-8 rounded-full shadow-2xl hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] transition-all duration-300 transform hover:scale-105 w-full sm:w-auto min-h-[64px] sm:min-h-auto"
                          >
                            <span className="relative z-10 flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                              <div className="flex items-center gap-2">
                                <Gift className="h-5 w-5 sm:h-7 sm:w-7 flex-shrink-0" />
                                <span className="block sm:hidden text-center leading-tight">
                                  {mounted ? t('cta.claimFreeVirtualTour', 'Claim My FREE Virtual Tour').replace(' ', '\n') : 'Claim My FREE\nVirtual Tour'}
                                </span>
                                <span className="hidden sm:block text-center">{mounted ? t('cta.claimFreeVirtualTour', 'Claim My FREE Virtual Tour') : 'Claim My FREE Virtual Tour'}</span>
                              </div>
                              <ArrowRight className="h-4 w-4 sm:h-6 sm:w-6 group-hover:translate-x-1 transition-transform flex-shrink-0 block sm:inline-block" />
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </Button>
                        }
                        utm_source="coming-soon-page"
                        utm_medium="cta"
                        utm_campaign="free-virtual-tour"
                      />
                    </motion.div>

                    {/* Urgency Indicators */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.7 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-center gap-4 md:gap-6 text-xs md:text-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Clock className="h-4 w-4" />
                          <span>{mounted ? t('cta.spotsLeft', 'Only 12 spots left') : 'Only 12 spots left'}</span>
                        </div>
                        <div className="w-px h-4 bg-white/30" />
                        <div className="flex items-center gap-2 text-slate-400">
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                          <span>{mounted ? t('cta.noCreditCard', 'No credit card required') : 'No credit card required'}</span>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="max-w-xs mx-auto">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: "0%" }}
                            whileInView={{ width: "76%" }}
                            transition={{ duration: 1, delay: 0.8 }}
                            className="h-full bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full"
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">{mounted ? t('cta.claimedThisMonth', '38 of 50 claimed this month') : '38 of 50 claimed this month'}</p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white">
                  <rect x="12" y="8" width="28" height="48" stroke="currentColor" strokeWidth="4"/>
                  <polygon points="12,8 36,20 36,52 12,56" fill="currentColor"/>
                  <circle cx="28" cy="32" r="2.5" fill="black"/>
                </svg>
                <span className="text-2xl font-black font-montserrat tracking-tight">OpenBeit</span>
              </div>
              <p className="text-slate-400 mb-4">
                {mounted ? t('footer.description', 'Revolutionizing real estate with immersive virtual tours and AI assistance.') : 'Revolutionizing real estate with immersive virtual tours and AI assistance.'}
              </p>
              <div className="flex space-x-4">
                <Button size="sm" variant="outline" className="border-slate-600 text-slate-400 hover:text-white">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="border-slate-600 text-slate-400 hover:text-white">
                  <Mail className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="border-slate-600 text-slate-400 hover:text-white">
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{mounted ? t('footer.properties', 'Properties') : 'Properties'}</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link href="/properties?type=apartment" className="hover:text-white transition-colors">
                    {mounted ? t('footer.apartments', 'Apartments') : 'Apartments'}
                  </Link>
                </li>
                <li>
                  <Link href="/properties?type=villa" className="hover:text-white transition-colors">
                    {mounted ? t('footer.villas', 'Villas') : 'Villas'}
                  </Link>
                </li>
                <li>
                  <Link href="/properties?type=penthouse" className="hover:text-white transition-colors">
                    {mounted ? t('footer.penthouses', 'Penthouses') : 'Penthouses'}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{mounted ? t('footer.services', 'Services') : 'Services'}</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link href="/virtual-tours" className="hover:text-white transition-colors">
                    {mounted ? t('footer.virtualTours', 'Virtual Tours') : 'Virtual Tours'}
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    {mounted ? t('footer.aiAssistance', 'AI Assistance') : 'AI Assistance'}
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    {mounted ? t('footer.propertyManagement', 'Property Management') : 'Property Management'}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{mounted ? t('footer.contact', 'Contact') : 'Contact'}</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <a href="tel:+201234567890" className="hover:text-white transition-colors">
                    +20 123 456 7890
                  </a>
                </li>
                <li>
                  <a href="mailto:info@virtualestate.com" className="hover:text-white transition-colors">
                    info@virtualestate.com
                  </a>
                </li>
                <li>{mounted ? t('footer.location', 'Cairo, Egypt') : 'Cairo, Egypt'}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 OpenBeit. {mounted ? t('footer.rights', 'All rights reserved.') : 'All rights reserved.'}</p>
          </div>
        </div>
      </footer>

      {/* Fullscreen Tour Modal - Same as property details */}
      {fullscreenTour && (
        <div className="fixed inset-0 bg-black z-50">
          <div className="absolute top-4 right-4 z-10 flex gap-4">
            <Button
              onClick={() => setFullscreenTour(null)}
              variant="outline"
              size="icon"
              className="bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/30"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <TourViewer 
            tourId={fullscreenTour}
            propertyId={fullscreenTour}
            tourUrl={sampleTours.find(tour => tour.id === fullscreenTour)?.virtual_tour_url}
            className="w-full h-full"
            fullscreen={true}
          />
        </div>
      )}

    </div>
  )
}
