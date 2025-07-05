"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  CheckCircle, 
  Gift, 
  Phone, 
  MapPin, 
  Home,
  Calendar,
  DollarSign,
  Loader2,
  X
} from "lucide-react"

// Enhanced validation schema for lead capture
const leadCaptureSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email").or(z.literal("")),
  whatsapp_number: z.string().min(10, "Please enter a valid WhatsApp number"),
  location: z.string().min(1, "Please select a location"),
  price_range: z.string().min(1, "Please select a price range"),
  property_type: z.string().min(1, "Please select a property type"),
  timeline: z.string().min(1, "Please select your timeline"),
})

type LeadCaptureFormData = z.infer<typeof leadCaptureSchema>

// Egypt locations for the dropdown
const egyptLocations = [
  "New Cairo",
  "Sheikh Zayed",
  "Zamalek", 
  "Maadi",
  "Heliopolis",
  "6th of October",
  "Giza",
  "Dokki",
  "Mohandessin",
  "Nasr City",
  "Rehab",
  "Katameya",
  "El Gouna",
  "Hurghada",
  "Alexandria",
  "Other"
]

// Price ranges optimized for Egypt market
const priceRanges = [
  "1.5M-3M EGP",
  "3M-5M EGP", 
  "5M-8M EGP",
  "8M-15M EGP",
  "15M+ EGP"
]

// Property types
const propertyTypes = [
  "Apartment",
  "Villa",
  "Townhouse",
  "Penthouse",
  "Studio",
  "Duplex",
  "Commercial",
  "Land"
]

// Timeline options
const timelineOptions = [
  "Immediately (0-2 months)",
  "Soon (2-4 months)", 
  "Later this year (4-8 months)",
  "Just exploring options"
]

interface LeadCaptureFormProps {
  trigger?: React.ReactNode
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

export function LeadCaptureForm({ 
  trigger, 
  isOpen, 
  onOpenChange,
  className = "",
  utm_source,
  utm_medium, 
  utm_campaign
}: LeadCaptureFormProps) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [open, setOpen] = useState(isOpen || false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm<LeadCaptureFormData>({
    resolver: zodResolver(leadCaptureSchema)
  })

  const watchedValues = watch()

  // Handle dialog open/close
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    onOpenChange?.(newOpen)
    if (!newOpen) {
      // Reset form when closing
      setTimeout(() => {
        setStep(1)
        setIsSuccess(false)
        setSubmitError(null)
        reset()
      }, 300)
    }
  }

  const onSubmit = async (data: LeadCaptureFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      // Clean email field - convert empty string to null for API
      const cleanData = {
        ...data,
        email: data.email === "" ? null : data.email,
        utm_source,
        utm_medium,
        utm_campaign
      }
      
      // Submit to our API endpoint
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Server error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setIsSuccess(true)
        setStep(4) // Success step
      } else {
        throw new Error(result.error || 'Failed to submit lead')
      }
    } catch (error) {
      console.error('Lead submission error:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setSubmitError(errorMessage)
      
      // Stay on the current step so user can try again
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1)
      setSubmitError(null) // Clear any previous errors when moving forward
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
      setSubmitError(null) // Clear any previous errors when moving backward
    }
  }

  const getStepProgress = () => (step / 3) * 100

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold text-center">
            Get Your FREE 3D Virtual Tour
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="h-5 w-5 text-primary" />
              <span className="font-semibold text-primary">Worth 5,000 EGP - Completely FREE!</span>
            </div>
            Professional 3D virtual tour of your property for faster sales
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getStepProgress()}%` }}
                />
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Step 1: Contact Information */}
                {step === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Phone className="h-5 w-5 text-primary" />
                      Contact Information
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          {...register("name")}
                          placeholder="Enter your full name"
                          className="mt-1 h-12 text-base"
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="whatsapp_number">WhatsApp Number *</Label>
                        <Input
                          id="whatsapp_number"
                          {...register("whatsapp_number")}
                          placeholder="+20 101 234 5678"
                          className="mt-1 h-12 text-base"
                        />
                        {errors.whatsapp_number && (
                          <p className="text-sm text-red-500 mt-1">{errors.whatsapp_number.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="email">Email (Optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          {...register("email")}
                          placeholder="your.email@example.com"
                          className="mt-1 h-12 text-base"
                        />
                        {errors.email && (
                          <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    <Button 
                      type="button" 
                      onClick={nextStep}
                      className="w-full h-12 text-base font-medium"
                      disabled={!watchedValues.name || !watchedValues.whatsapp_number}
                    >
                      Continue
                    </Button>
                  </div>
                )}

                {/* Step 2: Property Information */}
                {step === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Home className="h-5 w-5 text-primary" />
                      Property Details
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location">Location *</Label>
                        <Select onValueChange={(value) => setValue("location", value)}>
                          <SelectTrigger className="mt-1 h-12 text-base">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {egyptLocations.map((location) => (
                              <SelectItem key={location} value={location}>
                                {location}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.location && (
                          <p className="text-sm text-red-500 mt-1">{errors.location.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="property_type">Property Type *</Label>
                        <Select onValueChange={(value) => setValue("property_type", value)}>
                          <SelectTrigger className="mt-1 h-12 text-base">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {propertyTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.property_type && (
                          <p className="text-sm text-red-500 mt-1">{errors.property_type.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="price_range">Expected Price Range *</Label>
                      <Select onValueChange={(value) => setValue("price_range", value)}>
                        <SelectTrigger className="mt-1 h-12 text-base">
                          <SelectValue placeholder="Select price range" />
                        </SelectTrigger>
                        <SelectContent>
                          {priceRanges.map((range) => (
                            <SelectItem key={range} value={range}>
                              {range}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.price_range && (
                        <p className="text-sm text-red-500 mt-1">{errors.price_range.message}</p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button type="button" onClick={prevStep} variant="outline" className="flex-1 h-12 text-base font-medium">
                        Back
                      </Button>
                      <Button 
                        type="button" 
                        onClick={nextStep}
                        className="flex-1 h-12 text-base font-medium"
                        disabled={!watchedValues.location || !watchedValues.property_type || !watchedValues.price_range}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Timeline & Submit */}
                {step === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Selling Timeline
                    </h3>
                    
                    <div>
                      <Label htmlFor="timeline">When are you looking to sell? *</Label>
                      <Select onValueChange={(value) => setValue("timeline", value)}>
                        <SelectTrigger className="mt-1 h-12 text-base">
                          <SelectValue placeholder="Select timeline" />
                        </SelectTrigger>
                        <SelectContent>
                          {timelineOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.timeline && (
                        <p className="text-sm text-red-500 mt-1">{errors.timeline.message}</p>
                      )}
                    </div>

                    {/* Benefits Summary */}
                    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-3">What happens next:</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Quick 3-minute qualification call</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Professional photographer booking</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">3D virtual tour creation (48h delivery)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Marketing to our broker network</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Error Message Display */}
                    {submitError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <X className="h-5 w-5 text-red-500" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-red-800">Submission Failed</h4>
                            <p className="text-sm text-red-700 mt-1">{submitError}</p>
                            <p className="text-xs text-red-600 mt-2">Please check your information and try again.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSubmitError(null)}
                            className="flex-shrink-0 text-red-400 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button type="button" onClick={prevStep} variant="outline" className="flex-1 h-12 text-base font-medium">
                        Back
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1 h-14 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
                        disabled={isSubmitting || !watchedValues.timeline}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <div className="flex items-center justify-center gap-2 px-2">
                            <Gift className="h-5 w-5" />
                            <span className="text-center">Get My FREE Tour</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </motion.div>
          ) : (
            /* Success Step */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-8"
            >
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-green-600">Application Received!</h3>
                <p className="text-gray-600">
                  Thanks {watchedValues.name}! Your property qualifies for our FREE 3D virtual tour.
                </p>
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>📞 I'll call you in 5 minutes for a quick 3-minute qualification</p>
                    <p>📱 Make sure your phone {watchedValues.whatsapp_number} is available</p>
                    <p>📸 If qualified, we'll book your photo shoot immediately</p>
                  </div>
                </CardContent>
              </Card>

              <Button 
                onClick={() => handleOpenChange(false)}
                className="w-full h-12 text-base font-medium"
              >
                Close
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}