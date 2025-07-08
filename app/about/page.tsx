"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Award, Globe, Zap, Shield, Heart, ArrowRight, TrendingUp, Sparkles, Eye, Star, CheckCircle, Building2, Home, HeartHandshake, Landmark, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import Link from "next/link"
import { useTranslation } from "react-i18next"

export default function AboutPage() {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)
  const [activeValue, setActiveValue] = useState(0)

  useEffect(() => {
    setIsVisible(true)
    
    // Rotate active value card
    const interval = setInterval(() => {
      setActiveValue(prev => (prev + 1) % 4)
    }, 3000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Dynamic Hero Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20" />
        
        {/* Floating Geometric Shapes */}
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{ 
            y: [0, 30, 0],
            rotate: [0, -5, 0]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-20 right-20 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/4 w-24 h-24 bg-blue-300/30 rounded-lg rotate-45"
        />

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mb-8"
          >
            <Badge className="bg-white/20 border-white/30 text-white mb-6 px-4 py-2">
              <Sparkles className="h-4 w-4 mr-2" />
              {t('about.badge', 'The Future of Real Estate')}
            </Badge>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 text-white">
              <span className="block">
                {t('about.heroTitle1', 'Transform')}
              </span>
              <span className="block bg-gradient-to-r from-amber-200 via-orange-200 to-amber-300 bg-clip-text text-transparent">
                {t('about.heroTitle2', 'Real Estate')}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto text-white/90 leading-relaxed">
              {t('about.heroDescription', "We're revolutionizing property discovery with immersive virtual experiences, AI-powered insights, and seamless auction platforms that connect buyers and sellers globally.")}
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link href="/properties">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                {t('about.exploreProperties', 'Explore Properties')}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/auctions">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                {t('about.viewAuctions', 'View Live Auctions')}
                <Eye className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </motion.div>

          {/* Enhanced Stats Section */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto"
          >
            {[
              { value: 10000, label: t('about.stats.properties', 'Properties Listed'), suffix: '+' },
              { value: 25000, label: t('about.stats.virtualTours', 'Virtual Tours Created'), suffix: '+' },
              { value: 5000, label: t('about.stats.clients', 'Happy Clients'), suffix: '+' },
              { value: 15, label: t('about.stats.cities', 'Cities Covered'), suffix: '+' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.2 + index * 0.1, duration: 0.5 }}
                className="backdrop-blur-sm bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <div className="text-3xl md:text-4xl font-bold mb-2 text-white">
                  <AnimatedCounter value={stat.value} />{stat.suffix}
                </div>
                <div className="text-sm text-white/80 leading-tight">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Mission Section */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/dots.svg')] bg-center opacity-40" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-6xl mx-auto"
          >
            <div className="text-center mb-16">
              <Badge className="bg-blue-100 text-blue-600 mb-6 px-4 py-2">
                <Heart className="h-4 w-4 mr-2" />
                {t('about.missionBadge', 'Our Mission')}
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                {t('about.missionTitle', 'Democratizing Real Estate')}
              </h2>
              <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
                {t('about.missionDescription', "We're breaking down barriers in property discovery, making it possible for anyone, anywhere to explore, experience, and invest in real estate through cutting-edge technology.")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {[
                {
                  icon: Globe,
                  title: t('about.mission.global.title', 'Global Reach'),
                  description: t('about.mission.global.description', 'Connect buyers and sellers across continents with seamless multilingual support.'),
                  color: 'from-blue-600 to-blue-700'
                },
                {
                  icon: Zap,
                  title: t('about.mission.innovation.title', 'Innovation First'),
                  description: t('about.mission.innovation.description', 'Leading the industry with VR technology, AI assistance, and live auction platforms.'),
                  color: 'from-amber-500 to-orange-600'
                },
                {
                  icon: HeartHandshake,
                  title: t('about.mission.trust.title', 'Trust & Transparency'),
                  description: t('about.mission.trust.description', 'Building confidence through verified listings, secure transactions, and honest communication.'),
                  color: 'from-emerald-500 to-green-600'
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <Card className="h-full hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-0 shadow-lg">
                    <CardContent className="p-8 text-center">
                      <div className={`w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4">{item.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 md:p-12 text-white text-center"
            >
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                {t('about.impact.title', 'Making Real Estate Accessible to Everyone')}
              </h3>
              <p className="text-lg opacity-90 mb-6 max-w-3xl mx-auto">
                {t('about.impact.description', "From first-time homebuyers to seasoned investors, we're creating tools that empower informed decisions and meaningful connections in the property market.")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/properties">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-white/90">
                    {t('about.startExploring', 'Start Exploring')}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-30" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="bg-slate-100 text-slate-600 mb-6 px-4 py-2">
              <Star className="h-4 w-4 mr-2" />
              {t('about.valuesBadge', 'Our Core Values')}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              {t('about.valuesTitle', 'What Drives Us Forward')}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              {t('about.valuesDescription', 'These fundamental principles shape our culture, guide our decisions, and define how we serve our global community.')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {[
              {
                icon: Globe,
                title: t('about.values.accessibility.title', 'Global Accessibility'),
                description: t('about.values.accessibility.description', 'Breaking down geographical barriers to make property exploration accessible worldwide.'),
                color: 'from-blue-600 to-blue-700',
                bgColor: 'bg-blue-50',
                delay: 0
              },
              {
                icon: Zap,
                title: t('about.values.innovation.title', 'Innovation First'),
                description: t('about.values.innovation.description', 'Pioneering cutting-edge technology to revolutionize real estate experiences.'),
                color: 'from-amber-500 to-orange-600',
                bgColor: 'bg-amber-50',
                delay: 0.1
              },
              {
                icon: Shield,
                title: t('about.values.trust.title', 'Trust & Security'),
                description: t('about.values.trust.description', 'Ensuring secure, reliable, and transparent property information for all users.'),
                color: 'from-emerald-500 to-green-600',
                bgColor: 'bg-emerald-50',
                delay: 0.2
              },
              {
                icon: Heart,
                title: t('about.values.customer.title', 'Customer Focused'),
                description: t('about.values.customer.description', 'Every feature designed with our users\' needs and experiences at the center.'),
                color: 'from-purple-600 to-indigo-700',
                bgColor: 'bg-purple-50',
                delay: 0.3
              }
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: value.delay, duration: 0.6 }}
                viewport={{ once: true }}
                className={`group cursor-pointer ${index === activeValue ? 'scale-105' : ''}`}
              >
                <Card className={`h-full hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border-0 shadow-lg overflow-hidden ${value.bgColor} ${index === activeValue ? 'ring-2 ring-blue-500 shadow-2xl' : ''}`}>
                  <CardContent className="p-8 text-center relative">
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br ${value.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <value.icon className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4 group-hover:text-blue-600 transition-colors">
                      {value.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors">
                      {value.description}
                    </p>
                    
                    {/* Animated background element */}
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Values Impact Statement */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl border border-slate-100">
              <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
                {t('about.valuesImpact.title', 'Living Our Values Every Day')}
              </h3>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                {t('about.valuesImpact.description', 'These values aren\'t just words on a page—they\'re the foundation of every interaction, every feature, and every decision we make as we build the future of real estate technology.')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="p-4">
                  <div className="text-2xl font-bold text-blue-600 mb-2">24/7</div>
                  <div className="text-sm text-slate-600">{t('about.valuesImpact.support', 'Global Support')}</div>
                </div>
                <div className="p-4">
                  <div className="text-2xl font-bold text-purple-600 mb-2">100%</div>
                  <div className="text-sm text-slate-600">{t('about.valuesImpact.secure', 'Secure Transactions')}</div>
                </div>
                <div className="p-4">
                  <div className="text-2xl font-bold text-green-600 mb-2">∞</div>
                  <div className="text-sm text-slate-600">{t('about.valuesImpact.innovation', 'Innovation Potential')}</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hexagon-pattern.svg')] bg-center opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="bg-emerald-100 text-emerald-600 mb-6 px-4 py-2">
              <Users className="h-4 w-4 mr-2" />
              {t('about.teamBadge', 'Meet Our Team')}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              {t('about.teamTitle', 'The Minds Behind Innovation')}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              {t('about.teamDescription', 'Our diverse team of visionaries, engineers, and designers are united by a shared passion for transforming the real estate industry through technology.')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {[
              {
                name: t('about.team.ceo.name', 'Sarah Ahmed'),
                role: t('about.team.ceo.role', 'CEO & Founder'),
                bio: t('about.team.ceo.bio', 'Former real estate executive with 15+ years of experience in property technology and virtual reality.'),
                color: 'from-blue-600 to-blue-700',
                bgColor: 'bg-blue-50'
              },
              {
                name: t('about.team.cto.name', 'Mohamed Hassan'),
                role: t('about.team.cto.role', 'CTO'),
                bio: t('about.team.cto.bio', 'AI and 3D technology expert, previously led engineering teams at major tech companies.'),
                color: 'from-amber-500 to-orange-600',
                bgColor: 'bg-amber-50'
              },
              {
                name: t('about.team.design.name', 'Layla Mansour'),
                role: t('about.team.design.role', 'Head of Design'),
                bio: t('about.team.design.bio', 'Award-winning UX designer specializing in immersive experiences and virtual environments.'),
                color: 'from-emerald-500 to-green-600',
                bgColor: 'bg-emerald-50'
              },
              {
                name: t('about.team.ai.name', 'Ahmed Farouk'),
                role: t('about.team.ai.role', 'Head of AI'),
                bio: t('about.team.ai.bio', 'Machine learning researcher focused on natural language processing and conversational AI.'),
                color: 'from-purple-600 to-indigo-700',
                bgColor: 'bg-purple-50'
              }
            ].map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="group"
              >
                <Card className={`text-center hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border-0 shadow-lg ${member.bgColor} overflow-hidden`}>
                  <CardContent className="p-8 relative">
                    <div className="relative mb-6">
                      <div className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl`}>
                        <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center">
                          <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-white font-bold text-2xl`}>
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        </div>
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center group-hover:scale-125 transition-transform duration-300">
                        <Star className="h-4 w-4 text-yellow-800" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-blue-600 font-semibold mb-4 text-sm uppercase tracking-wide">
                      {member.role}
                    </p>
                    <p className="text-slate-600 text-sm leading-relaxed group-hover:text-slate-700 transition-colors">
                      {member.bio}
                    </p>
                    
                    {/* Animated background glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Team Culture Statement */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl border border-slate-100">
              <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
                {t('about.culture.title', 'Building Tomorrow, Together')}
              </h3>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                {t('about.culture.description', 'Our team thrives on collaboration, innovation, and a shared commitment to creating technology that makes a real difference in people\'s lives. We believe the best solutions come from diverse perspectives and bold thinking.')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                  {t('about.joinTeam', 'Join Our Team')}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/circuit-pattern.svg')] bg-center opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="bg-amber-100 text-amber-600 mb-6 px-4 py-2">
              <Zap className="h-4 w-4 mr-2" />
              {t('about.technologyBadge', 'Cutting-Edge Technology')}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {t('about.technologyTitle', 'Powered by Innovation')}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              {t('about.technologyDescription', 'We leverage cutting-edge technologies to create immersive, intelligent, and globally accessible real estate experiences that set new industry standards.')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: Building2,
                title: t('about.technology.vr.title', '3D Virtual Reality'),
                description: t('about.technology.vr.description', 'Photorealistic 3D environments powered by advanced rendering technology and professional photography equipment.'),
                color: 'from-amber-500 to-orange-600',
                bgColor: 'bg-amber-50',
                features: ['360° Property Tours', 'Real-time Rendering', 'VR Headset Support']
              },
              {
                icon: Users,
                title: t('about.technology.ai.title', 'AI Assistance'),
                description: t('about.technology.ai.description', 'Intelligent virtual assistants trained on property data and real estate expertise to answer questions in real-time.'),
                color: 'from-emerald-500 to-green-600',
                bgColor: 'bg-emerald-50',
                features: ['Natural Language Processing', 'Property Recommendations', 'Market Analysis']
              },
              {
                icon: Globe,
                title: t('about.technology.global.title', 'Global Platform'),
                description: t('about.technology.global.description', 'Cloud-based infrastructure supporting multiple languages and currencies for seamless international property exploration.'),
                color: 'from-purple-600 to-indigo-700',
                bgColor: 'bg-purple-50',
                features: ['Multi-language Support', 'Global Payments', 'Real-time Sync']
              }
            ].map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                viewport={{ once: true }}
                className="group"
              >
                <Card className={`hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border-0 shadow-lg ${tech.bgColor} overflow-hidden h-full`}>
                  <CardContent className="p-8 relative h-full flex flex-col">
                    <div className={`w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br ${tech.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <tech.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4 text-center group-hover:text-blue-600 transition-colors">
                      {tech.title}
                    </h3>
                    <p className="text-slate-600 text-center mb-6 leading-relaxed group-hover:text-slate-700 transition-colors flex-grow">
                      {tech.description}
                    </p>
                    
                    {/* Feature List */}
                    <div className="space-y-2">
                      {tech.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center text-sm text-slate-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Animated background element */}
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Technology Innovation Statement */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto"
          >
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-100">
              <h3 className="text-2xl font-bold text-slate-800 mb-4">
                {t('about.innovation.title', 'Innovation at Our Core')}
              </h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                {t('about.innovation.description', 'We invest heavily in R&D to stay ahead of technological trends, ensuring our platform remains at the forefront of real estate innovation.')}
              </p>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm text-slate-600">{t('about.innovation.commitment', 'Continuous Innovation')}</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
              <h3 className="text-2xl font-bold mb-4">
                {t('about.future.title', 'Future-Ready Architecture')}
              </h3>
              <p className="opacity-90 leading-relaxed mb-6">
                {t('about.future.description', 'Built on scalable cloud infrastructure with AI-first design principles, our platform is ready for the next decade of real estate evolution.')}
              </p>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm opacity-90">{t('about.future.commitment', 'Built for Tomorrow')}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-blue-700 text-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[url('/wave-pattern.svg')] bg-center opacity-20" />
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
        />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <Badge className="bg-white/20 border-white/30 text-white mb-8 px-6 py-3">
              <Sparkles className="h-5 w-5 mr-2" />
              {t('about.ctaBadge', 'Ready to Transform Your Property Search?')}
            </Badge>
            
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="block mb-2">
                {t('about.ctaTitle1', 'Experience the')}
              </span>
              <span className="block bg-gradient-to-r from-amber-200 via-orange-200 to-amber-300 bg-clip-text text-transparent">
                {t('about.ctaTitle2', 'Future of Real Estate')}
              </span>
            </h2>
            
            <p className="text-xl md:text-2xl mb-12 opacity-90 max-w-3xl mx-auto leading-relaxed">
              {t('about.ctaDescription', 'Join thousands of users who have already discovered their dream properties through our revolutionary platform. Start exploring today.')}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
              <div className="backdrop-blur-sm bg-white/10 rounded-xl p-6 border border-white/20">
                <div className="text-2xl font-bold mb-2">10,000+</div>
                <div className="text-sm opacity-80">{t('about.ctaStats.properties', 'Properties Listed')}</div>
              </div>
              <div className="backdrop-blur-sm bg-white/10 rounded-xl p-6 border border-white/20">
                <div className="text-2xl font-bold mb-2">25,000+</div>
                <div className="text-sm opacity-80">{t('about.ctaStats.virtualTours', 'Virtual Tours')}</div>
              </div>
              <div className="backdrop-blur-sm bg-white/10 rounded-xl p-6 border border-white/20">
                <div className="text-2xl font-bold mb-2">5,000+</div>
                <div className="text-sm opacity-80">{t('about.ctaStats.clients', 'Happy Clients')}</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/properties">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-white/90 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 px-8 py-4 text-lg font-semibold"
                >
                  {t('about.exploreProperties', 'Explore Properties')}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/auctions">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 px-8 py-4 text-lg font-semibold"
                >
                  {t('about.viewAuctions', 'View Live Auctions')}
                  <Eye className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}