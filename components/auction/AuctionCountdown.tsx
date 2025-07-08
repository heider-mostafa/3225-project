"use client"

import { useState, useEffect } from 'react'
import { Clock, Timer } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AuctionCountdownProps } from '@/types/auction'

export function AuctionCountdown({ 
  targetTime, 
  onTimeUp, 
  className = "",
  compact = false 
}: AuctionCountdownProps & { compact?: boolean }) {
  const { t } = useTranslation()
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    total: number
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const target = new Date(targetTime).getTime()
      const difference = target - now

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        setTimeLeft({ days, hours, minutes, seconds, total: difference })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 })
        onTimeUp?.()
      }
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [targetTime, onTimeUp])

  const formatTime = (value: number) => value.toString().padStart(2, '0')

  if (timeLeft.total <= 0) {
    return (
      <div className={`flex items-center justify-center text-red-600 font-semibold ${className}`}>
        <Timer className="h-4 w-4 mr-2" />
        {t('auction.timeUp', 'Time Up!')}
      </div>
    )
  }

  if (compact) {
    return (
      <span className="font-mono text-sm">
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
      </span>
    )
  }

  return (
    <div className={`text-center ${className}`}>
      <div className="flex items-center justify-center mb-2">
        <Clock className="h-4 w-4 mr-2 text-slate-600" />
        <span className="text-sm text-slate-600 font-medium">
          {t('auction.timeRemaining', 'Time Remaining')}
        </span>
      </div>
      
      <div className="flex justify-center space-x-4">
        {timeLeft.days > 0 && (
          <div className="text-center">
            <div className="bg-slate-800 text-white px-3 py-2 rounded-lg font-mono text-lg font-bold">
              {formatTime(timeLeft.days)}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              {t('auction.days', 'Days')}
            </div>
          </div>
        )}
        
        <div className="text-center">
          <div className="bg-slate-800 text-white px-3 py-2 rounded-lg font-mono text-lg font-bold">
            {formatTime(timeLeft.hours)}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {t('auction.hours', 'Hours')}
          </div>
        </div>
        
        <div className="text-center">
          <div className="bg-slate-800 text-white px-3 py-2 rounded-lg font-mono text-lg font-bold">
            {formatTime(timeLeft.minutes)}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {t('auction.minutes', 'Minutes')}
          </div>
        </div>
        
        <div className="text-center">
          <div className="bg-slate-800 text-white px-3 py-2 rounded-lg font-mono text-lg font-bold">
            {formatTime(timeLeft.seconds)}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {t('auction.seconds', 'Seconds')}
          </div>
        </div>
      </div>
    </div>
  )
}