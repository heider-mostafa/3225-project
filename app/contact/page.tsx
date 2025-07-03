"use client"

import type React from "react"

import { useState } from "react"
import { MapPin, Phone, Mail, Clock, Send, MessageSquare, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useTranslation } from "react-i18next"

export default function ContactPage() {
  const { t } = useTranslation()
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    preferredContact: "email",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      alert(t('contact.validation.fillAllFields', 'Please fill in all required fields'))
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      alert(t('contact.validation.invalidEmail', 'Please enter a valid email address'))
      return
    }

    // Handle form submission
    console.log("Form submitted:", formData)
    // In a real app, this would send to an API
    alert(t('contact.validation.thankYouMessage', "Thank you for your message! We'll get back to you soon."))

    // Reset form
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
      preferredContact: "email",
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">{t('contact.pageTitle', 'Get in Touch')}</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {t('contact.pageDescription', "Have questions about our virtual tours or need help finding the perfect property? We're here to help you every step of the way.")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  {t('contact.formTitle', 'Send us a Message')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('contact.fullName', 'Full Name')} *</label>
                      <Input
                        required
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder={t('contact.fullNamePlaceholder', 'Your full name')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('contact.emailAddress', 'Email Address')} *</label>
                      <Input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder={t('contact.emailPlaceholder', 'your.email@example.com')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('contact.phoneNumber', 'Phone Number')}</label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder={t('contact.phonePlaceholder', '+20 123 456 7890')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('contact.preferredContactMethod', 'Preferred Contact Method')}</label>
                      <Select
                        value={formData.preferredContact}
                        onValueChange={(value) => handleInputChange("preferredContact", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">{t('contact.contactMethods.email', 'Email')}</SelectItem>
                          <SelectItem value="phone">{t('contact.contactMethods.phone', 'Phone')}</SelectItem>
                          <SelectItem value="whatsapp">{t('contact.contactMethods.whatsapp', 'WhatsApp')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('contact.subject', 'Subject')} *</label>
                    <Select value={formData.subject} onValueChange={(value) => handleInputChange("subject", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('contact.subjectPlaceholder', 'Select a subject')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="property-inquiry">{t('contact.subjects.propertyInquiry', 'Property Inquiry')}</SelectItem>
                        <SelectItem value="virtual-tour">{t('contact.subjects.virtualTour', 'Virtual Tour Support')}</SelectItem>
                        <SelectItem value="technical-support">{t('contact.subjects.technicalSupport', 'Technical Support')}</SelectItem>
                        <SelectItem value="partnership">{t('contact.subjects.partnership', 'Partnership Opportunities')}</SelectItem>
                        <SelectItem value="general">{t('contact.subjects.general', 'General Question')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('contact.message', 'Message')} *</label>
                    <Textarea
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      placeholder={t('contact.messagePlaceholder', 'Tell us how we can help you...')}
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg">
                    <Send className="h-4 w-4 mr-2" />
                    {t('contact.sendMessage', 'Send Message')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Map Section - Moved under the form */}
            <Card>
              <CardHeader>
                <CardTitle>{t('contact.map.title', 'Find Us')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] bg-slate-200 rounded-lg flex items-center justify-center">
                  <p className="text-slate-600">{t('contact.map.placeholder', 'Interactive Map Would Be Here')}</p>
                  {/* In a real app, you would integrate with Google Maps or similar */}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information and FAQ */}
          <div className="space-y-6">
            {/* Contact Details */}
            <Card>
              <CardHeader>
                <CardTitle>{t('contact.contactInfo.title', 'Contact Information')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium text-slate-800">{t('contact.contactInfo.address', 'Address')}</p>
                    <p className="text-slate-600 whitespace-pre-line">
                      {t('contact.contactInfo.addressDetails', '123 Business District\nNew Cairo, Egypt\n11835')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium text-slate-800">{t('contact.contactInfo.phone', 'Phone')}</p>
                    <a href="tel:+201234567890" className="text-slate-600 hover:text-blue-600 transition-colors">
                      +20 123 456 7890
                    </a>
                    <br />
                    <a href="tel:+209876543210" className="text-slate-600 hover:text-blue-600 transition-colors">
                      +20 987 654 3210
                    </a>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium text-slate-800">{t('contact.contactInfo.email', 'Email')}</p>
                    <a
                      href="mailto:info@virtualestate.com"
                      className="text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      info@virtualestate.com
                    </a>
                    <br />
                    <a
                      href="mailto:support@virtualestate.com"
                      className="text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      support@virtualestate.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium text-slate-800">{t('contact.contactInfo.businessHours', 'Business Hours')}</p>
                    <p className="text-slate-600 whitespace-pre-line">
                      {t('contact.contactInfo.businessHoursDetails', 'Sunday - Thursday: 9:00 AM - 6:00 PM\nFriday - Saturday: 10:00 AM - 4:00 PM')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>{t('contact.quickActions.title', 'Quick Actions')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    // In a real app, this would open a calendar widget
                    alert(t('contact.quickActions.calendarBooking', 'Calendar booking feature would open here'))
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {t('contact.quickActions.scheduleVirtualTour', 'Schedule a Virtual Tour')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    // In a real app, this would open a chat widget
                    alert(t('contact.quickActions.liveChatAlert', 'Live chat would open here'))
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t('contact.quickActions.liveChatSupport', 'Live Chat Support')}
                </Button>
                <Link href="/properties">
                  <Button variant="outline" className="w-full justify-start">
                    <MapPin className="h-4 w-4 mr-2" />
                    {t('contact.quickActions.browseProperties', 'Browse Properties')}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* FAQ */}
            <Card>
              <CardHeader>
                <CardTitle>{t('contact.faq.title', 'Frequently Asked Questions')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-800 mb-1">{t('contact.faq.questions.virtualTours.question', 'How do virtual tours work?')}</h4>
                  <p className="text-sm text-slate-600">
                    {t('contact.faq.questions.virtualTours.answer', 'Our 3D virtual tours allow you to explore properties remotely using your computer or mobile device.')}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 mb-1">{t('contact.faq.questions.aiAssistant.question', 'Is the AI assistant free?')}</h4>
                  <p className="text-sm text-slate-600">
                    {t('contact.faq.questions.aiAssistant.answer', 'Yes! Our AI assistant is completely free and available 24/7 to answer your property questions.')}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 mb-1">{t('contact.faq.questions.physicalViewing.question', 'Can I schedule a physical viewing?')}</h4>
                  <p className="text-sm text-slate-600">
                    {t('contact.faq.questions.physicalViewing.answer', 'Contact us to arrange an in-person viewing after exploring virtually.')}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 mb-1">{t('contact.faq.questions.coverage.question', 'What areas do you cover?')}</h4>
                  <p className="text-sm text-slate-600">
                    {t('contact.faq.questions.coverage.answer', 'We currently operate in New Cairo and surrounding areas, with plans to expand to other prime locations in Egypt.')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
