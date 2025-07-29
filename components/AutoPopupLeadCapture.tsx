"use client"

import { useState, useEffect } from "react"
import { LeadCaptureForm } from "@/components/LeadCaptureForm"

interface AutoPopupLeadCaptureProps {
  delaySeconds?: number
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  disabled?: boolean
}

export function AutoPopupLeadCapture({ 
  delaySeconds = 10,
  utm_source = "coming-soon-auto-popup",
  utm_medium = "popup",
  utm_campaign = "free-virtual-tour-auto",
  disabled = false
}: AutoPopupLeadCaptureProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)

  useEffect(() => {
    // Don't trigger if disabled
    if (disabled || hasTriggered) return

    // Check if user has already seen this popup in this session
    const hasSeenPopup = sessionStorage.getItem('leadCapturePopupShown')
    if (hasSeenPopup) return

    // Set timer to show popup after specified delay
    const timer = setTimeout(() => {
      setIsOpen(true)
      setHasTriggered(true)
      // Mark as shown in session storage to prevent multiple shows
      sessionStorage.setItem('leadCapturePopupShown', 'true')
    }, delaySeconds * 1000)

    // Cleanup timer if component unmounts
    return () => clearTimeout(timer)
  }, [delaySeconds, disabled, hasTriggered])

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
  }

  return (
    <LeadCaptureForm
      isOpen={isOpen}
      onClose={handleClose}
      onOpenChange={handleOpenChange}
      utm_source={utm_source}
      utm_medium={utm_medium}
      utm_campaign={utm_campaign}
    />
  )
}