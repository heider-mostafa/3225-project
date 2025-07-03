"use client"

import { useState, useEffect, useCallback } from "react"

interface TourState {
  currentRoom: string
  visitedRooms: string[]
  timeInRoom: number
  totalTimeSpent: number
  sessionId: string
}

export function useTourState() {
  const [state, setState] = useState<TourState>({
    currentRoom: "living-room",
    visitedRooms: ["living-room"],
    timeInRoom: 0,
    totalTimeSpent: 0,
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  })

  const [roomStartTime, setRoomStartTime] = useState(Date.now())
  const [sessionStartTime] = useState(Date.now())

  // Update time spent in current room
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const timeInCurrentRoom = Math.floor((now - roomStartTime) / 1000)
      const totalTime = Math.floor((now - sessionStartTime) / 1000)

      setState((prev) => ({
        ...prev,
        timeInRoom: timeInCurrentRoom,
        totalTimeSpent: totalTime,
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [roomStartTime, sessionStartTime])

  const updateRoom = useCallback(
    (newRoom: string) => {
      if (newRoom === state.currentRoom) return

      setState((prev) => {
        const visitedRooms = prev.visitedRooms.includes(newRoom) ? prev.visitedRooms : [...prev.visitedRooms, newRoom]

        // Log room change event
        logTourEvent("room_change", {
          from_room: prev.currentRoom,
          to_room: newRoom,
          time_in_previous_room: prev.timeInRoom,
          total_rooms_visited: visitedRooms.length,
        })

        return {
          ...prev,
          currentRoom: newRoom,
          visitedRooms,
          timeInRoom: 0,
        }
      })

      setRoomStartTime(Date.now())
    },
    [state.currentRoom],
  )

  const logTourEvent = (eventType: string, data: any) => {
    const eventData = {
      event_type: eventType,
      session_id: state.sessionId,
      timestamp: new Date().toISOString(),
      current_room: state.currentRoom,
      ...data,
    }

    // In a real app, this would send to analytics API
    console.log("Tour Event:", eventData)

    // Optional: Send to external analytics service
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(eventData)
    // }).catch(err => console.error('Analytics error:', err))
  }

  const getEngagementLevel = useCallback(() => {
    const { visitedRooms, totalTimeSpent } = state

    if (totalTimeSpent > 300 && visitedRooms.length > 2) return "high"
    if (totalTimeSpent > 120 && visitedRooms.length > 1) return "medium"
    return "low"
  }, [state])

  const getTourContext = useCallback(() => {
    return {
      currentRoom: state.currentRoom,
      visitedRooms: state.visitedRooms,
      timeInRoom: state.timeInRoom,
      totalTimeSpent: state.totalTimeSpent,
      engagementLevel: getEngagementLevel(),
      sessionId: state.sessionId,
    }
  }, [state, getEngagementLevel])

  return {
    currentRoom: state.currentRoom,
    visitedRooms: state.visitedRooms,
    timeInRoom: state.timeInRoom,
    totalTimeSpent: state.totalTimeSpent,
    sessionId: state.sessionId,
    updateRoom,
    getTourContext,
    getEngagementLevel,
  }
}
