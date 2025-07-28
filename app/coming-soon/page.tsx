"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from 'react-i18next'
import { useNumberTranslation } from '@/lib/useNumberTranslation'
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
  X,
  Shield,
  Zap,
  Brain,
  Video,
  Headphones,
  BarChart3,
  Cpu,
  Database,
  Code,
  Cloud
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
  const { translateNumber, isMounted: numberMounted } = useNumberTranslation()
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
    // Only auto-load first tour to prevent mobile Safari from being overwhelmed
    // We'll handle the other tours differently for mobile
    setLoadedTours(['1'])
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
    
    try {
      // Get UTM parameters from URL
      const urlParams = new URLSearchParams(window.location.search)
      const utm_source = urlParams.get('utm_source')
      const utm_medium = urlParams.get('utm_medium')
      const utm_campaign = urlParams.get('utm_campaign')

      const response = await fetch('/api/promo-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          utm_source,
          utm_medium,
          utm_campaign
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setIsSubmitted(true)
        console.log('Email subscribed successfully:', data)
      } else {
        console.error('Failed to subscribe:', data.error)
        setIsSubmitted(true) // Still show success for better UX
      }
    } catch (error) {
      console.error('Error submitting email:', error)
      setIsSubmitted(true) // Still show success for better UX
    }
    
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-8">
        {/* Premium background with geometric patterns */}
        <div className="absolute inset-0">
          {/* Primary gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800" />
          
          {/* Geometric grid pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)`,
              backgroundSize: '100px 100px'
            }} />
          </div>
          
          {/* Ambient glow effects */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        </div>
        
        {/* Floating tech particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400/60 rounded-full"
              animate={{
                y: [0, -100, 0],
                x: [0, Math.random() * 50 - 25, 0],
                scale: [1, 1.5, 1],
                opacity: [0, 0.8, 0]
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 3
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto w-full">
          {/* Premium Coming Soon Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-cyan-400/30 rounded-full px-8 py-4 shadow-2xl">
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-white font-semibold text-lg tracking-wide">
                {mounted ? t('comingSoon.launchDate', 'LAUNCHING SEPTEMBER 1ST') : 'LAUNCHING SEPTEMBER 1ST'}
              </span>
              <Calendar className="w-5 h-5 text-cyan-400" />
            </div>
          </motion.div>

          {/* Premium Countdown Banner */}
          {mounted && (timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-12"
            >
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-3xl mx-auto shadow-2xl">
                <div className="text-center mb-6">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    {t('comingSoon.countdownTitle', 'LAUNCH COUNTDOWN')}
                  </h3>
                  <p className="text-slate-300 text-lg md:text-xl">
                    {t('comingSoon.countdownSubtitle', 'Get ready for the future of real estate development')}
                  </p>
                </div>
                
                <div className="grid grid-cols-4 gap-3 md:gap-6">
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
                      className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 text-center border border-white/10 hover:border-cyan-400/30 transition-all duration-300"
                    >
                      <div className="text-3xl md:text-4xl lg:text-5xl font-black text-cyan-400 mb-2">
                        {numberMounted ? translateNumber(unit.value.toString().padStart(2, '0')) : unit.value.toString().padStart(2, '0')}
                      </div>
                      <div className="text-sm md:text-base text-slate-300 font-semibold tracking-wide">
                        {unit.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Premium Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-[0.9] tracking-tight"
            style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}
          >
            {mounted ? t('comingSoon.heroTitle', 'The Future of') : 'The Future of'}
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent animate-pulse">
              {mounted ? t('comingSoon.heroTitleHighlight', 'Real Estate') : 'Real Estate'}
            </span>
            <br />
            <span className="text-slate-300">
              {mounted ? t('comingSoon.heroTitleEnd', 'Development') : 'Development'}
            </span>
          </motion.h1>

          {/* Premium Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-xl sm:text-2xl md:text-3xl text-slate-300 mb-8 max-w-4xl mx-auto leading-relaxed font-light"
          >
            {mounted ? t('comingSoon.heroDescription', 'Transform how you showcase and sell properties with AI-powered virtual tours, instant lead qualification, and immersive 3D experiences') : 'Transform how you showcase and sell properties with AI-powered virtual tours, instant lead qualification, and immersive 3D experiences'}
          </motion.p>

          {/* Premium Features Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap justify-center gap-3 sm:gap-6 mb-12"
          >
            {[
              { icon: Video, text: mounted ? t('comingSoon.feature1', 'Free 3D Virtual Tours') : 'Free 3D Virtual Tours', color: 'from-cyan-400 to-blue-500' },
              { icon: Brain, text: mounted ? t('comingSoon.feature2', '24/7 AI Assistant') : '24/7 AI Assistant', color: 'from-purple-400 to-pink-500' },
              { icon: Zap, text: mounted ? t('comingSoon.feature3', 'Instant Lead Qualification') : 'Instant Lead Qualification', color: 'from-emerald-400 to-teal-500' }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 text-white hover:bg-white/10 transition-all duration-300"
              >
                <div className={`p-2 rounded-xl bg-gradient-to-r ${feature.color}`}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm sm:text-base font-semibold">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Premium Email Capture Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="max-w-xl mx-auto"
          >
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleEmailSubmit}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <Input
                    type="email"
                    placeholder={mounted ? t('comingSoon.emailPlaceholder', 'Enter your email for early access') : 'Enter your email for early access'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 h-16 text-lg bg-white/5 backdrop-blur-xl border border-white/20 text-white placeholder:text-slate-400 rounded-2xl px-6 focus:border-cyan-400/50 focus:ring-cyan-400/20"
                    required
                  />
                  <Button
                    type="submit"
                    className="h-16 px-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-lg rounded-2xl shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300"
                  >
                    <Mail className="w-5 h-5 mr-3" />
                    {mounted ? t('comingSoon.notifyMe', 'Get Early Access') : 'Get Early Access'}
                    <ArrowRight className="w-5 h-5 ml-3" />
                  </Button>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-emerald-500/10 backdrop-blur-xl border border-emerald-400/30 rounded-2xl p-6 text-emerald-300"
                >
                  <CheckCircle className="w-8 h-8 mx-auto mb-3 text-emerald-400" />
                  <p className="font-bold text-lg">{mounted ? t('comingSoon.successTitle', "You're on the VIP list!") : "You're on the VIP list!"}</p>
                  <p className="text-sm text-emerald-200">{mounted ? t('comingSoon.successMessage', "We'll notify you with exclusive early access on September 1st") : "We'll notify you with exclusive early access on September 1st"}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        {/* Section divider */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
        {/* Light background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(0,212,255,0.1) 1px, transparent 0)`,
              backgroundSize: '60px 60px'
            }} />
          </div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6">
              {mounted ? t('valueProposition.title', 'What We Do') : 'What We Do'}
            </h2>
            <p className="text-xl md:text-2xl text-slate-700 max-w-3xl mx-auto leading-relaxed">
              {mounted ? t('valueProposition.subtitle', 'We revolutionize property showcasing with cutting-edge technology that transforms how developers sell real estate') : 'We revolutionize property showcasing with cutting-edge technology that transforms how developers sell real estate'}
            </p>
          </div>

          {/* Value Proposition Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: Video,
                title: mounted ? t('valueProposition.benefit1.title', 'Free Professional 3D Virtual Tours') : 'Free Professional 3D Virtual Tours',
                description: mounted ? t('valueProposition.benefit1.description', 'Complete property filming and 3D tour creation at no cost. Professional-grade immersive experiences that captivate buyers.') : 'Complete property filming and 3D tour creation at no cost. Professional-grade immersive experiences that captivate buyers.',
                color: 'from-cyan-400 to-blue-500',
                bgColor: 'from-cyan-500/20 to-blue-500/20'
              },
              {
                icon: Brain,
                title: mounted ? t('valueProposition.benefit2.title', '24/7 AI Property Assistant') : '24/7 AI Property Assistant',
                description: mounted ? t('valueProposition.benefit2.description', 'Intelligent AI agent handles inquiries, qualifies leads, and provides detailed property information around the clock.') : 'Intelligent AI agent handles inquiries, qualifies leads, and provides detailed property information around the clock.',
                color: 'from-purple-400 to-pink-500',
                bgColor: 'from-purple-500/20 to-pink-500/20'
              },
              {
                icon: Zap,
                title: mounted ? t('valueProposition.benefit3.title', 'Instant Lead Qualification') : 'Instant Lead Qualification',
                description: mounted ? t('valueProposition.benefit3.description', 'Advanced algorithms instantly identify and prioritize serious buyers, maximizing your time and conversion rates.') : 'Advanced algorithms instantly identify and prioritize serious buyers, maximizing your time and conversion rates.',
                color: 'from-emerald-400 to-teal-500',
                bgColor: 'from-emerald-500/20 to-teal-500/20'
              }
            ].map((benefit, index) => (
              <div
                key={index}
                className="group"
              >
                <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-500 h-full">
                  <CardContent className="p-8">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${benefit.color} p-4 mb-6 shadow-lg`}>
                      <benefit.icon className="w-full h-full text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">{benefit.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{benefit.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
        {/* Section divider */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-300/50 to-transparent"></div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-blue-950 relative overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
              {mounted ? t('howItWorks.title', 'How It Works') : 'How It Works'}
            </h2>
            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              {mounted ? t('howItWorks.subtitle', 'Three simple steps to transform your property marketing') : 'Three simple steps to transform your property marketing'}
            </p>
          </motion.div>

          {/* Process Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                step: '01',
                icon: Camera,
                title: mounted ? t('howItWorks.step1.title', 'We Film Your Property') : 'We Film Your Property',
                subtitle: mounted ? t('howItWorks.step1.subtitle', '(Free)') : '(Free)',
                description: mounted ? t('howItWorks.step1.description', 'Our professional photographers capture your property with advanced 3D scanning technology and high-resolution cameras.') : 'Our professional photographers capture your property with advanced 3D scanning technology and high-resolution cameras.',
                color: 'from-cyan-400 to-blue-500'
              },
              {
                step: '02',
                icon: Video,
                title: mounted ? t('howItWorks.step2.title', 'Create Immersive Virtual Tours') : 'Create Immersive Virtual Tours',
                subtitle: '',
                description: mounted ? t('howItWorks.step2.description', 'We transform the captured data into stunning 3D virtual tours with dollhouse views, floor plans, and interactive features.') : 'We transform the captured data into stunning 3D virtual tours with dollhouse views, floor plans, and interactive features.',
                color: 'from-purple-400 to-pink-500'
              },
              {
                step: '03',
                icon: Brain,
                title: mounted ? t('howItWorks.step3.title', 'AI Assistant Handles Inquiries') : 'AI Assistant Handles Inquiries',
                subtitle: mounted ? t('howItWorks.step3.subtitle', '24/7') : '24/7',
                description: mounted ? t('howItWorks.step3.description', 'Our AI agent engages visitors, answers questions, qualifies leads, and schedules appointments automatically.') : 'Our AI agent engages visitors, answers questions, qualifies leads, and schedules appointments automatically.',
                color: 'from-emerald-400 to-teal-500'
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.2 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                {/* Step number */}
                <div className="text-6xl md:text-7xl font-black text-white/10 mb-4">
                  {step.step}
                </div>
                
                {/* Icon */}
                <div className={`w-20 h-20 mx-auto rounded-3xl bg-gradient-to-r ${step.color} p-5 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-2xl`}>
                  <step.icon className="w-full h-full text-white" />
                </div>
                
                {/* Content */}
                <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                {step.subtitle && (
                  <Badge className={`bg-gradient-to-r ${step.color} text-white mb-4`}>
                    {step.subtitle}
                  </Badge>
                )}
                <p className="text-slate-300 leading-relaxed max-w-sm mx-auto">{step.description}</p>
                
                {/* Connector line (except for last item) */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-white/20 to-transparent transform -translate-y-1/2 translate-x-8" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
        {/* Section divider */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </section>

      {/* Enhanced Virtual Tour Preview Section */}
      <section className="py-20 bg-gradient-to-br from-white to-slate-50 relative overflow-hidden">
        {/* Light background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
          {/* Geometric pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(rgba(0,212,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(0,212,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '80px 80px'
            }} />
          </div>
        </div>
        <div className="w-full relative z-10">
          {/* Enhanced Section Header */}
          <div className="text-center mb-16 px-4">
            <div className="inline-flex items-center gap-3 bg-cyan-500 text-white rounded-full px-6 py-3 mb-8 shadow-lg">
              <Eye className="w-5 h-5" />
              <span className="font-semibold text-sm tracking-wide">
                {mounted ? t('comingSoon.sneakPeekBadge', 'EXPERIENCE THE DIFFERENCE') : 'EXPERIENCE THE DIFFERENCE'}
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6">
              {mounted ? t('comingSoon.sneakPeekTitle', 'Preview Our Technology') : 'Preview Our Technology'}
            </h2>
            <p className="text-xl md:text-2xl text-slate-700 max-w-3xl mx-auto leading-relaxed">
              {mounted ? t('comingSoon.sneakPeekDescription', 'Experience our revolutionary virtual tour technology with these interactive property previews') : 'Experience our revolutionary virtual tour technology with these interactive property previews'}
            </p>
          </div>

          {/* Tour Cards */}
          <div className="flex flex-col md:grid md:grid-cols-3 w-full">
            {sampleTours.map((tour, index) => (
              <div
                key={tour.id}
                className="group w-full"
              >
                <div className="space-y-4">
                  <div 
                    className="relative h-64 md:h-96 w-full overflow-hidden rounded-2xl hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-500 cursor-pointer group bg-white/5 backdrop-blur-xl border border-white/10"
                    onClick={() => handleTourClick(tour.id)}
                  >
                    {/* Embedded Virtual Tour - Only load when clicked */}
                    {loadedTours.includes(tour.id) ? (
                      <>
                        <TourViewer 
                          tourId={tour.id}
                          propertyId={tour.id}
                          tourUrl={tour.virtual_tour_url}
                          className="w-full h-full rounded-2xl"
                          hideRoomMenu={true}
                          hideConversationalAI={true}
                        />

                        {/* Enhanced Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-2xl flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/10 backdrop-blur-xl border border-cyan-400/30 px-6 py-3 rounded-full">
                            <div className="flex items-center space-x-2 text-white">
                              <Maximize2 className="h-5 w-5 text-cyan-400" />
                              <span className="text-sm font-semibold">{mounted ? t('comingSoon.clickToExplore', 'Click to Explore') : 'Click to Explore'}</span>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Enhanced Preview overlay before loading */}
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-400/30 to-slate-500/30 backdrop-blur-sm rounded-2xl" />
                        <div className="absolute inset-0 flex items-center justify-center px-4">
                          <div className="text-center text-white">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-white/10 backdrop-blur-xl border border-cyan-400/30 flex items-center justify-center mb-4">
                              <Eye className="w-8 h-8 text-cyan-400" />
                            </div>
                            <p className="text-lg font-bold mb-2">{mounted ? t('comingSoon.clickToLoad', 'Click to Load Virtual Tour') : 'Click to Load Virtual Tour'}</p>
                            <p className="text-sm text-slate-300 px-2">{tour.title}</p>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Enhanced Tour Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white backdrop-blur-xl border border-white/20 rounded-full px-3 py-2 text-xs font-bold flex items-center gap-2">
                        <Globe className="w-3 h-3" />
                        {mounted ? t('comingSoon.liveTour', 'Live Tour') : 'Live Tour'}
                      </div>
                    </div>

                    {/* Enhanced Coming Soon Badge */}
                    <div className="absolute top-4 left-4 z-10">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white animate-pulse backdrop-blur-xl border border-white/20 rounded-full px-3 py-2 text-xs font-bold flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {mounted ? t('comingSoon.launchDateShort', 'Sept 1st') : 'Sept 1st'}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Fullscreen Button */}
                  {loadedTours.includes(tour.id) && (
                    <button
                      onClick={() => setFullscreenTour(tour.id)}
                      className="w-full mt-4 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 hover:border-cyan-400 rounded-2xl transition-all duration-300 text-sm font-semibold flex items-center justify-center space-x-3 group shadow-lg"
                    >
                      <Maximize2 className="h-5 w-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                      <span>{mounted ? t('comingSoon.viewInFullscreen', 'View in Fullscreen') : 'View in Fullscreen'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Free Virtual Tour CTA - Enhanced for light section */}
          <section id="virtual-tour-cta" className="relative py-16 md:py-32 overflow-hidden bg-gradient-to-br from-slate-100 to-blue-100">
            <div className="container mx-auto px-4 relative z-10">
              {/* Premium Card Container */}
              <div className="relative max-w-5xl mx-auto">
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
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 md:px-8 py-2 md:py-3 rounded-full font-bold shadow-xl flex items-center gap-2 text-sm md:text-base">
                      <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                      {mounted ? t('cta.exclusiveOffer', 'EXCLUSIVE OFFER') : 'EXCLUSIVE OFFER'}
                      <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="text-center space-y-6 md:space-y-8 pt-8">
                    {/* Title */}
                    <div>
                      <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-white">
                          {mounted ? t('cta.getYourFree', 'Get Your FREE') : 'Get Your FREE'}
                        </span>
                        <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 animate-pulse">
                          {mounted ? t('cta.virtualTour3D', '3D Virtual Tour') : '3D Virtual Tour'}
                        </span>
                      </h2>
                    </div>

                    {/* Value Proposition */}
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 md:gap-3 bg-white/10 backdrop-blur px-4 md:px-6 py-2 md:py-3 rounded-full">
                        <Star className="w-5 h-5 md:w-6 md:h-6 text-blue-400 fill-current" />
                        <span className="text-lg md:text-2xl font-semibold text-white">
                          {mounted ? t('cta.worth', 'Worth') : 'Worth'} <span className="text-cyan-400">{mounted ? t('cta.priceEGP', '50,000 EGP') : '50,000 EGP'}</span>
                        </span>
                        <div className="w-px h-4 md:h-6 bg-white/30" />
                        <span className="text-emerald-400 font-bold text-sm md:text-base">{mounted ? t('cta.hundredPercentFree', '100% FREE') : '100% FREE'}</span>
                      </div>
                      
                      <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
                        {mounted ? t('cta.sellFasterDescription', 'Sell your property 73% faster with immersive virtual tours that captivate serious buyers') : 'Sell your property 73% faster with immersive virtual tours that captivate serious buyers'}
                      </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 my-8 md:my-10">
                      {[
                        { icon: Camera, title: mounted ? t('cta.professionalPhotography', 'Professional Photography') : 'Professional Photography', desc: mounted ? t('cta.hdrDroneShots', 'HDR & Drone shots') : 'HDR & Drone shots', color: "from-blue-500 to-cyan-500" },
                        { icon: TrendingUp, title: mounted ? t('cta.interactive3DTour', 'Interactive 3D Tour') : 'Interactive 3D Tour', desc: mounted ? t('cta.dollhouseFloorPlans', 'Dollhouse & Floor plans') : 'Dollhouse & Floor plans', color: "from-cyan-500 to-teal-500" },
                        { icon: Users, title: mounted ? t('cta.brokerNetwork', 'Broker Network') : 'Broker Network', desc: mounted ? t('cta.activeAgents', '1000+ active agents') : '1000+ active agents', color: "from-teal-500 to-blue-500" }
                      ].map((feature, index) => (
                        <div
                          key={index}
                          className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10 hover:border-white/20 transition-all duration-300 group"
                        >
                          <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${feature.color} p-2 md:p-3 mb-3 md:mb-4 group-hover:shadow-lg transition-shadow mx-auto`}>
                            <feature.icon className="w-full h-full text-white" />
                          </div>
                          <h3 className="text-white font-semibold text-base md:text-lg mb-1">{feature.title}</h3>
                          <p className="text-slate-400 text-xs md:text-sm">{feature.desc}</p>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <div>
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
                    </div>

                    {/* Urgency Indicators */}
                    <div className="space-y-3">
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
                          <div className="h-full bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full w-3/4" />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">{mounted ? t('cta.claimedThisMonth', '38 of 50 claimed this month') : '38 of 50 claimed this month'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
        {/* Section divider */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-300/50 to-transparent"></div>
      </section>

      {/* Developer Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/5 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/5 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-emerald-400/30 rounded-full px-6 py-3 mb-8">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span className="text-white font-semibold text-sm tracking-wide">
                {mounted ? t('developerBenefits.badge', 'BUILT FOR DEVELOPERS') : 'BUILT FOR DEVELOPERS'}
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
              {mounted ? t('developerBenefits.title', 'Why Developers Choose Us') : 'Why Developers Choose Us'}
            </h2>
            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              {mounted ? t('developerBenefits.subtitle', 'Proven results that transform your sales process and maximize revenue') : 'Proven results that transform your sales process and maximize revenue'}
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                metric: '73%',
                label: mounted ? t('developerBenefits.metric1.label', 'Faster Sales Cycle') : 'Faster Sales Cycle',
                description: mounted ? t('developerBenefits.metric1.description', 'Virtual tours reduce the need for multiple site visits, accelerating decision-making') : 'Virtual tours reduce the need for multiple site visits, accelerating decision-making',
                icon: TrendingUp,
                color: 'from-emerald-400 to-teal-500'
              },
              {
                metric: '50%',
                label: mounted ? t('developerBenefits.metric2.label', 'Reduction in Site Visits') : 'Reduction in Site Visits',
                description: mounted ? t('developerBenefits.metric2.description', 'Pre-qualified leads arrive ready to buy, saving time and resources') : 'Pre-qualified leads arrive ready to buy, saving time and resources',
                icon: Users,
                color: 'from-cyan-400 to-blue-500'
              },
              {
                metric: '24/7',
                label: mounted ? t('developerBenefits.metric3.label', 'Automated Responses') : 'Automated Responses',
                description: mounted ? t('developerBenefits.metric3.description', 'AI assistant captures leads and provides information around the clock') : 'AI assistant captures leads and provides information around the clock',
                icon: Brain,
                color: 'from-purple-400 to-pink-500'
              }
            ].map((item, index) => (
              <div
                key={index}
                className="text-center group"
              >
                <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-500 h-full">
                  <CardContent className="p-8">
                    {/* Icon */}
                    <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r ${item.color} p-4 mb-6`}>
                      <item.icon className="w-full h-full text-white" />
                    </div>
                    
                    {/* Metric */}
                    <div className={`text-5xl font-black mb-2 bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                      {item.metric}
                    </div>
                    
                    {/* Label */}
                    <h3 className="text-xl font-bold text-white mb-4">{item.label}</h3>
                    
                    {/* Description */}
                    <p className="text-slate-300 leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center items-center gap-6 md:gap-12"
          >
            {[
              { icon: Shield, text: mounted ? t('developerBenefits.trust1', 'Enterprise Security') : 'Enterprise Security' },
              { icon: Database, text: mounted ? t('developerBenefits.trust2', 'Data Protection') : 'Data Protection' },
              { icon: CheckCircle, text: mounted ? t('developerBenefits.trust3', 'GDPR Compliant') : 'GDPR Compliant' }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 text-slate-300">
                <item.icon className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
        {/* Section divider */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </section>

      {/* Tech Stack Preview Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-white relative overflow-hidden">
        {/* Light tech background pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(0,212,255,0.2) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
          {/* Subtle gradient overlays */}
          <div className="absolute top-0 left-1/3 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 bg-purple-600 text-white rounded-full px-6 py-3 mb-8 shadow-lg">
              <Cpu className="w-5 h-5" />
              <span className="font-semibold text-sm tracking-wide">
                {mounted ? t('techStack.badge', 'POWERED BY ADVANCED AI') : 'POWERED BY ADVANCED AI'}
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6">
              {mounted ? t('techStack.title', 'Cutting-Edge Technology') : 'Cutting-Edge Technology'}
            </h2>
            <p className="text-xl md:text-2xl text-slate-700 max-w-3xl mx-auto leading-relaxed">
              {mounted ? t('techStack.subtitle', 'Built with the latest technologies to deliver unmatched performance and reliability') : 'Built with the latest technologies to deliver unmatched performance and reliability'}
            </p>
          </div>

          {/* Tech Icons Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: Brain, name: 'AI & Machine Learning', color: 'from-purple-400 to-pink-500' },
              { icon: Cloud, name: 'Cloud Infrastructure', color: 'from-cyan-400 to-blue-500' },
              { icon: Video, name: '3D Rendering Engine', color: 'from-emerald-400 to-teal-500' },
              { icon: Database, name: 'Real-time Analytics', color: 'from-orange-400 to-red-500' }
            ].map((tech, index) => (
              <div
                key={index}
                className="text-center group"
              >
                <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 hover:border-slate-300 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-r ${tech.color} p-3 mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <tech.icon className="w-full h-full text-white" />
                  </div>
                  <p className="text-slate-800 font-semibold text-sm">{tech.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Section divider */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-300/50 to-transparent"></div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-16 relative overflow-hidden">
        {/* Footer background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white">
                  <rect x="12" y="8" width="28" height="48" stroke="currentColor" strokeWidth="4"/>
                  <polygon points="12,8 36,20 36,52 12,56" fill="currentColor"/>
                  <circle cx="28" cy="32" r="2.5" fill="black"/>
                </svg>
                <span className="text-2xl font-black font-montserrat tracking-tight">OpenBeit</span>
              </div>
              <p className="text-slate-300 mb-6 text-lg">
                {mounted ? t('footer.description', 'Revolutionizing real estate with immersive virtual tours and AI assistance.') : 'Revolutionizing real estate with immersive virtual tours and AI assistance.'}
              </p>
              <div className="flex space-x-4">
                <Button size="sm" variant="outline" className="border-white/20 text-slate-300 hover:text-white hover:border-cyan-400/50 bg-white/5 backdrop-blur-xl rounded-xl">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="border-white/20 text-slate-300 hover:text-white hover:border-cyan-400/50 bg-white/5 backdrop-blur-xl rounded-xl">
                  <Mail className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="border-white/20 text-slate-300 hover:text-white hover:border-cyan-400/50 bg-white/5 backdrop-blur-xl rounded-xl">
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* <div>
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
            </div> */}
            <div>
              <h4 className="font-bold text-xl mb-6 text-white">{mounted ? t('footer.contact', 'Contact') : 'Contact'}</h4>
              <ul className="space-y-4 text-slate-300">
                <li>
                  <a href="tel:+201211164331" className="hover:text-cyan-400 transition-colors flex items-center gap-2 text-lg">
                    <Phone className="w-4 h-4" />
                    +20 121 116 4331
                  </a>
                </li>
                <li>
                  <a href="mailto:info@openbeit.com" className="hover:text-cyan-400 transition-colors flex items-center gap-2 text-lg">
                    <Mail className="w-4 h-4" />
                    info@openbeit.com
                  </a>
                </li>
                <li className="flex items-center gap-2 text-lg">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {mounted ? t('footer.location', 'Cairo, Egypt') : 'Cairo, Egypt'}
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-12 pt-8 text-center text-slate-300">
            <p className="text-lg">&copy; 2024 OpenBeit. {mounted ? t('footer.rights', 'All rights reserved.') : 'All rights reserved.'}</p>
          </div>
        </div>
      </footer>

      {/* Fullscreen Tour Modal - Mobile Safari optimized */}
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
          {(() => {
            const isMobile = typeof window !== 'undefined' && 
              /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            const tourUrl = sampleTours.find(tour => tour.id === fullscreenTour)?.virtual_tour_url;
            
            if (isMobile) {
              // For mobile devices, provide a launch screen instead of problematic iframe
              return (
                <div className="flex items-center justify-center w-full h-full p-8">
                  <div className="text-center text-white max-w-md">
                    <div className="text-8xl mb-8">🏠</div>
                    <h2 className="text-3xl font-bold mb-4">
                      {sampleTours.find(tour => tour.id === fullscreenTour)?.title}
                    </h2>
                    <p className="text-slate-300 mb-8 text-lg">
                      This tour has interactive features including dollhouse view, floor plans, and 3D navigation. Opening in a new tab prevents crashes and provides the best mobile experience.
                    </p>
                    <Button
                      onClick={() => {
                        window.open(tourUrl, '_blank', 'noopener,noreferrer');
                        setFullscreenTour(null); // Close modal after opening
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl text-xl mb-4"
                    >
                      <Globe className="w-6 h-6 mr-3" />
                      Launch Virtual Tour
                    </Button>
                    <p className="text-xs text-slate-400">
                      Optimized for mobile • Full interactive features
                    </p>
                  </div>
                </div>
              );
            }
            
            // For desktop, use the iframe as normal
            return (
              <TourViewer 
                tourId={fullscreenTour}
                propertyId={fullscreenTour}
                tourUrl={tourUrl}
                className="w-full h-full"
                fullscreen={true}
                hideConversationalAI={true}
              />
            );
          })()}
        </div>
      )}

    </div>
  )
}
