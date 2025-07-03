"use client"

import { Users, Award, Globe, Zap, Shield, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { useTranslation } from "react-i18next"

// All content now uses translation keys

export default function AboutPage() {
  const { t } = useTranslation()
  
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">{t('about.pageTitle', 'About VirtualEstate')}</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            {t('about.pageDescription', "We're revolutionizing real estate with immersive virtual tours and AI-powered assistance.")}
          </p>
        </div>

        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-6">{t('about.heroTitle', 'Revolutionizing Real Estate')}</h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
              {t('about.heroDescription', "We're transforming how people discover, explore, and connect with properties through cutting-edge virtual reality and AI technology.")}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">10,000+</div>
                <div className="text-sm opacity-80">{t('about.stats.propertiesLabel', 'Properties Toured')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">50+</div>
                <div className="text-sm opacity-80">{t('about.stats.citiesLabel', 'Cities Covered')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">25</div>
                <div className="text-sm opacity-80">{t('about.stats.languagesLabel', 'Languages Supported')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">98%</div>
                <div className="text-sm opacity-80">{t('about.stats.satisfactionLabel', 'Customer Satisfaction')}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-slate-800 mb-6">{t('about.missionTitle', 'Our Mission')}</h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                {t('about.missionDescription1', "At VirtualEstate, we believe that finding the perfect home shouldn't be limited by distance, time zones, or language barriers. Our mission is to democratize property exploration through immersive virtual tours and intelligent AI assistance, making real estate accessible to everyone, everywhere.")}
              </p>
              <p className="text-lg text-slate-600 leading-relaxed">
                {t('about.missionDescription2', "We're not just showing properties – we're creating experiences that help people make informed decisions about one of life's most important investments: their home.")}
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-800 mb-4">{t('about.valuesTitle', 'Our Values')}</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                {t('about.valuesDescription', 'These core values guide everything we do and shape how we build products for our users.')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="text-center hover:shadow-lg transition-all duration-300 group cursor-pointer">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                    <Globe className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-3">{t('about.values.accessibility.title', 'Global Accessibility')}</h3>
                  <p className="text-slate-600">{t('about.values.accessibility.description', 'Making property viewing accessible to anyone, anywhere in the world, breaking down geographical barriers.')}</p>
                </CardContent>
              </Card>
              <Card className="text-center hover:shadow-lg transition-all duration-300 group cursor-pointer">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                    <Zap className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-3">{t('about.values.innovation.title', 'Innovation First')}</h3>
                  <p className="text-slate-600">{t('about.values.innovation.description', 'Constantly pushing the boundaries of technology to create the most immersive property experiences.')}</p>
                </CardContent>
              </Card>
              <Card className="text-center hover:shadow-lg transition-all duration-300 group cursor-pointer">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-3">{t('about.values.trust.title', 'Trust & Security')}</h3>
                  <p className="text-slate-600">{t('about.values.trust.description', 'Ensuring secure, reliable, and transparent property information for all our users.')}</p>
                </CardContent>
              </Card>
              <Card className="text-center hover:shadow-lg transition-all duration-300 group cursor-pointer">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                    <Heart className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-3">{t('about.values.customer.title', 'Customer Focused')}</h3>
                  <p className="text-slate-600">{t('about.values.customer.description', 'Every feature we build is designed with our users\' needs and experiences at the center.')}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-800 mb-4">{t('about.teamTitle', 'Meet Our Team')}</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                {t('about.teamDescription', 'Our diverse team of experts combines deep real estate knowledge with cutting-edge technology expertise.')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <img
                    src="/placeholder.svg?height=300&width=300"
                    alt={t('about.team.ceo.name', 'Sarah Ahmed')}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover group-hover:scale-105 transition-transform"
                  />
                  <h3 className="text-xl font-semibold text-slate-800 mb-1">{t('about.team.ceo.name', 'Sarah Ahmed')}</h3>
                  <p className="text-blue-600 font-medium mb-3">{t('about.team.ceo.role', 'CEO & Founder')}</p>
                  <p className="text-sm text-slate-600">{t('about.team.ceo.bio', 'Former real estate executive with 15+ years of experience in property technology and virtual reality.')}</p>
                </CardContent>
              </Card>
              <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <img
                    src="/placeholder.svg?height=300&width=300"
                    alt={t('about.team.cto.name', 'Mohamed Hassan')}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover group-hover:scale-105 transition-transform"
                  />
                  <h3 className="text-xl font-semibold text-slate-800 mb-1">{t('about.team.cto.name', 'Mohamed Hassan')}</h3>
                  <p className="text-blue-600 font-medium mb-3">{t('about.team.cto.role', 'CTO')}</p>
                  <p className="text-sm text-slate-600">{t('about.team.cto.bio', 'AI and 3D technology expert, previously led engineering teams at major tech companies.')}</p>
                </CardContent>
              </Card>
              <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <img
                    src="/placeholder.svg?height=300&width=300"
                    alt={t('about.team.design.name', 'Layla Mansour')}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover group-hover:scale-105 transition-transform"
                  />
                  <h3 className="text-xl font-semibold text-slate-800 mb-1">{t('about.team.design.name', 'Layla Mansour')}</h3>
                  <p className="text-blue-600 font-medium mb-3">{t('about.team.design.role', 'Head of Design')}</p>
                  <p className="text-sm text-slate-600">{t('about.team.design.bio', 'Award-winning UX designer specializing in immersive experiences and virtual environments.')}</p>
                </CardContent>
              </Card>
              <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <img
                    src="/placeholder.svg?height=300&width=300"
                    alt={t('about.team.ai.name', 'Ahmed Farouk')}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover group-hover:scale-105 transition-transform"
                  />
                  <h3 className="text-xl font-semibold text-slate-800 mb-1">{t('about.team.ai.name', 'Ahmed Farouk')}</h3>
                  <p className="text-blue-600 font-medium mb-3">{t('about.team.ai.role', 'Head of AI')}</p>
                  <p className="text-sm text-slate-600">{t('about.team.ai.bio', 'Machine learning researcher focused on natural language processing and conversational AI.')}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-800 mb-4">{t('about.technologyTitle', 'Powered by Advanced Technology')}</h2>
                <p className="text-slate-600 max-w-2xl mx-auto">
                  {t('about.technologyDescription', 'We leverage the latest in 3D visualization, artificial intelligence, and cloud computing to deliver unparalleled property experiences.')}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                      <Award className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-3">{t('about.technology.vr.title', '3D Virtual Reality')}</h3>
                    <p className="text-slate-600">
                      {t('about.technology.vr.description', 'Photorealistic 3D environments powered by advanced rendering technology and professional photography equipment.')}
                    </p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-3">{t('about.technology.ai.title', 'AI Assistance')}</h3>
                    <p className="text-slate-600">
                      {t('about.technology.ai.description', 'Intelligent virtual assistants trained on property data and real estate expertise to answer questions in real-time.')}
                    </p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Globe className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-3">{t('about.technology.global.title', 'Global Platform')}</h3>
                    <p className="text-slate-600">
                      {t('about.technology.global.description', 'Cloud-based infrastructure supporting multiple languages and currencies for seamless international property exploration.')}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">{t('about.ctaTitle', 'Ready to Experience the Future of Real Estate?')}</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              {t('about.ctaDescription', 'Join thousands of users who have already discovered their dream properties through our platform.')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/properties">
                <Button size="lg" variant="secondary">
                  {t('about.exploreProperties', 'Explore Properties')}
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-blue-600"
                >
                  {t('about.getInTouch', 'Get in Touch')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}