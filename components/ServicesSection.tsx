"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  Home,
  DollarSign,
  Building2,
  TrendingUp,
  Play,
  Camera,
  Globe,
  Clock,
  Star,
  Users,
  Zap,
  Shield,
  Eye,
  Map,
  Sparkles,
  BarChart3,
  HeartHandshake,
  CheckCircle,
  ArrowRight,
  Phone,
  Calendar,
  MessageSquare,
  Gift,
  Target,
  Palette,
  Headphones,
  Award,
  Rocket,
  Brain,
  Wand2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { AnimatedCounter } from '@/components/ui/animated-counter'

interface ServiceFeature {
  icon: React.ComponentType<any>
  title: string
  description: string
  highlight: string
  color: string
}

interface UserType {
  id: string
  title: string
  icon: React.ComponentType<any>
  emoji: string
  tagline: string
  description: string
  features: ServiceFeature[]
  stats: Array<{
    value: number
    label: string
    suffix?: string
  }>
  cta: {
    primary: string
    secondary: string
  }
  gradient: string
  visualElement: string
}

const userTypes: UserType[] = [
  {
    id: 'buyers',
    title: 'Property Buyers',
    icon: Home,
    emoji: '🏠',
    tagline: 'Discover Your Dream Property from Anywhere',
    description: 'Experience the future of property hunting with immersive 3D virtual tours and AI-powered assistance.',
    features: [
      {
        icon: Play,
        title: '3D Virtual Tours',
        description: 'Immersive 360° property walkthroughs that make you feel like you\'re actually there',
        highlight: 'Experience Before You Buy',
        color: 'from-blue-500 to-purple-600'
      },
      {
        icon: Headphones,
        title: '24/7 AI Assistant',
        description: 'Get instant property information, schedule viewings, and receive personalized recommendations',
        highlight: 'Always Available',
        color: 'from-emerald-500 to-teal-600'
      },
      {
        icon: Globe,
        title: 'Multi-language Support',
        description: 'Browse properties in Arabic, English, and other languages with seamless translation',
        highlight: 'Your Language',
        color: 'from-orange-500 to-red-600'
      },
      {
        icon: Eye,
        title: 'Remote Viewing',
        description: 'Explore Egyptian properties from Saudi Arabia, UAE, or anywhere in the world',
        highlight: 'Global Access',
        color: 'from-purple-500 to-pink-600'
      },
      {
        icon: Brain,
        title: 'Smart Filtering',
        description: 'AI-powered property recommendations based on your preferences and budget',
        highlight: 'Personalized Results',
        color: 'from-indigo-500 to-blue-600'
      },
      {
        icon: Shield,
        title: 'Verified Properties',
        description: 'All properties are verified and authenticated for your peace of mind',
        highlight: 'Trusted Platform',
        color: 'from-green-500 to-emerald-600'
      }
    ],
    stats: [
      { value: 25000, label: 'Virtual Tours', suffix: '+' },
      { value: 24, label: 'Hours Support', suffix: '/7' },
      { value: 15, label: 'Cities Covered', suffix: '+' }
    ],
    cta: {
      primary: 'Start Virtual Tour',
      secondary: 'Talk to AI Agent'
    },
    gradient: 'from-blue-600 via-purple-600 to-blue-700',
    visualElement: 'virtual-tour-interface'
  },
  {
    id: 'sellers',
    title: 'Property Sellers',
    icon: DollarSign,
    emoji: '💰',
    tagline: 'Sell 73% Faster with Professional Virtual Tours',
    description: 'Get professional photography and virtual tours completely FREE to showcase your property like never before.',
    features: [
      {
        icon: Gift,
        title: 'FREE Service',
        description: 'Complete filming, virtual tour creation, and professional photography at absolutely no cost',
        highlight: '100% Free',
        color: 'from-green-500 to-emerald-600'
      },
      {
        icon: Camera,
        title: 'Professional Photography',
        description: 'HDR photography, drone shots, and twilight captures by certified photographers',
        highlight: 'Studio Quality',
        color: 'from-blue-500 to-indigo-600'
      },
      {
        icon: Palette,
        title: 'Virtual Staging',
        description: 'AI-powered furniture placement and decoration to showcase your property\'s potential',
        highlight: 'Stunning Visuals',
        color: 'from-purple-500 to-pink-600'
      },
      {
        icon: MessageSquare,
        title: 'AI Agent Integration',
        description: '24/7 automated buyer assistance that answers questions and schedules viewings',
        highlight: 'Never Miss a Lead',
        color: 'from-orange-500 to-red-600'
      },
      {
        icon: Rocket,
        title: 'Marketing Boost',
        description: 'Enhanced online presence across all major property platforms and social media',
        highlight: 'Maximum Exposure',
        color: 'from-teal-500 to-cyan-600'
      },
      {
        icon: Target,
        title: 'Qualified Leads',
        description: 'Pre-qualified buyers who have already toured your property virtually',
        highlight: 'Serious Buyers Only',
        color: 'from-indigo-500 to-purple-600'
      }
    ],
    stats: [
      { value: 73, label: 'Faster Sales', suffix: '%' },
      { value: 5000, label: 'Happy Sellers', suffix: '+' },
      { value: 0, label: 'Cost to You', suffix: ' EGP' }
    ],
    cta: {
      primary: 'Get FREE Assessment',
      secondary: 'Book Photography'
    },
    gradient: 'from-green-600 via-emerald-600 to-teal-700',
    visualElement: 'before-after-staging'
  },
  {
    id: 'developers',
    title: 'Real Estate Developers',
    icon: Building2,
    emoji: '🏗️',
    tagline: 'Showcase Projects Before They\'re Built',
    description: 'Transform blueprints into stunning virtual experiences that sell units before construction begins.',
    features: [
      {
        icon: Wand2,
        title: 'Pre-construction Marketing',
        description: 'Create virtual tours of unbuilt properties from architectural plans and 3D models',
        highlight: 'Sell Before Building',
        color: 'from-blue-500 to-indigo-600'
      },
      {
        icon: Palette,
        title: 'Multiple Design Options',
        description: 'Showcase different interior design themes and finishes virtually',
        highlight: 'Endless Possibilities',
        color: 'from-purple-500 to-pink-600'
      },
      {
        icon: BarChart3,
        title: 'Investor Presentations',
        description: 'Professional 3D walkthroughs for investor meetings and funding presentations',
        highlight: 'Impress Investors',
        color: 'from-orange-500 to-red-600'
      },
      {
        icon: Globe,
        title: 'Global Marketing',
        description: 'Attract international buyers and investors with immersive virtual experiences',
        highlight: 'Worldwide Reach',
        color: 'from-teal-500 to-cyan-600'
      },
      {
        icon: Zap,
        title: 'Sales Acceleration',
        description: 'Faster pre-sales and reservations with engaging virtual showrooms',
        highlight: 'Quick Results',
        color: 'from-green-500 to-emerald-600'
      },
      {
        icon: Award,
        title: 'Premium Branding',
        description: 'Establish your brand as innovative and forward-thinking in the market',
        highlight: 'Stand Out',
        color: 'from-indigo-500 to-purple-600'
      }
    ],
    stats: [
      { value: 85, label: 'Pre-sale Success', suffix: '%' },
      { value: 50, label: 'Developer Partners', suffix: '+' },
      { value: 200, label: 'Projects Completed', suffix: '+' }
    ],
    cta: {
      primary: 'Schedule Demo',
      secondary: 'View Portfolio'
    },
    gradient: 'from-orange-600 via-red-600 to-pink-700',
    visualElement: 'blueprint-to-3d'
  },
  {
    id: 'investors',
    title: 'Property Investors',
    icon: TrendingUp,
    emoji: '📈',
    tagline: 'Invest from Your Couch Anywhere in the World',
    description: 'Make informed investment decisions with comprehensive virtual property inspections and AI-powered market analysis.',
    features: [
      {
        icon: Eye,
        title: 'Remote Due Diligence',
        description: 'Comprehensive virtual property inspections with detailed condition reports',
        highlight: 'Thorough Analysis',
        color: 'from-blue-500 to-indigo-600'
      },
      {
        icon: Map,
        title: 'Global Investment',
        description: 'Invest in Egyptian real estate from Saudi Arabia, UAE, or anywhere worldwide',
        highlight: 'International Access',
        color: 'from-purple-500 to-pink-600'
      },
      {
        icon: BarChart3,
        title: 'AI Market Analytics',
        description: 'Property value predictions, market trends, and investment opportunity scoring',
        highlight: 'Data-Driven Decisions',
        color: 'from-green-500 to-emerald-600'
      },
      {
        icon: Building2,
        title: 'Portfolio Management',
        description: 'Track and manage multiple properties virtually with detailed performance metrics',
        highlight: 'Centralized Control',
        color: 'from-orange-500 to-red-600'
      },
      {
        icon: Shield,
        title: 'Risk Reduction',
        description: 'Minimize investment risks with virtual inspections and verified property data',
        highlight: 'Secure Investments',
        color: 'from-teal-500 to-cyan-600'
      },
      {
        icon: Sparkles,
        title: 'Exclusive Opportunities',
        description: 'Access to pre-market properties and exclusive investment opportunities',
        highlight: 'First Access',
        color: 'from-indigo-500 to-purple-600'
      }
    ],
    stats: [
      { value: 40, label: 'Average ROI', suffix: '%' },
      { value: 1000, label: 'Investors Served', suffix: '+' },
      { value: 2, label: 'Billion EGP Invested', suffix: '+' }
    ],
    cta: {
      primary: 'Explore Opportunities',
      secondary: 'Get Market Analysis'
    },
    gradient: 'from-purple-600 via-indigo-600 to-blue-700',
    visualElement: 'investment-dashboard'
  }
]

export function ServicesSection() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('buyers')
  const [isVisible, setIsVisible] = useState(false)

  const activeService = userTypes.find(service => service.id === activeTab) || userTypes[0]

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const element = document.getElementById('services-section')
    if (element) {
      observer.observe(element)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section 
      id="services-section" 
      className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-slate-50 via-white to-slate-50 overflow-hidden"
    >
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 sm:mb-12 lg:mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 sm:mb-4">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide">
              Egypt's #1 PropTech Platform
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 mb-4 sm:mb-6 px-2">
            Revolutionizing Real Estate
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              For Everyone
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-2">
            Whether you're buying, selling, developing, or investing - we've got the perfect solution 
            powered by AI and immersive virtual tours.
          </p>
        </motion.div>

        {/* Service Type Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-12 px-2"
        >
          {userTypes.map((service, index) => (
            <motion.button
              key={service.id}
              onClick={() => setActiveTab(service.id)}
              className={`relative px-3 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 cursor-pointer flex-1 min-w-0 sm:flex-none ${
                activeTab === service.id
                  ? 'bg-white shadow-xl text-slate-800 scale-105'
                  : 'bg-slate-100 hover:bg-white text-slate-600 hover:text-slate-800 shadow-md hover:shadow-lg'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
                <span className="text-lg sm:text-2xl">{service.emoji}</span>
                <div className="text-center sm:text-left">
                  <div className="text-xs sm:text-base font-semibold leading-tight">{service.title}</div>
                  <div className="text-xs opacity-70 hidden sm:block">{service.tagline.split(' ').slice(0, 3).join(' ')}</div>
                </div>
              </div>
              
            </motion.button>
          ))}
        </motion.div>

        {/* Active Service Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto"
          >

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12">
              {activeService.features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-xl transition-all duration-300 group border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-4 sm:p-6">
                      <div className={`bg-gradient-to-r ${feature.color} rounded-xl p-2 sm:p-3 w-fit mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-2">
                        <h4 className="text-lg sm:text-xl font-bold text-slate-800 leading-tight">{feature.title}</h4>
                        <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-0 text-xs sm:text-sm shrink-0">
                          {feature.highlight}
                        </Badge>
                      </div>
                      
                      <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  )
}