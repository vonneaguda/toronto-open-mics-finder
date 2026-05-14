import { useEffect, useState, useMemo } from 'react'
import type { Mic } from '../lib/normalize'

type CommuteSignal = 'walkable' | 'subway' | 'bus' | null

export function useCommuteSignal(mic: Mic | null): CommuteSignal {
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)

  // Get user location once
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      (error) => {
        console.warn('Geolocation denied or unavailable:', error)
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000, // 5 minutes cache
      }
    )
  }, [])

  // Calculate signal synchronously based on mic and user location
  const signal = useMemo(() => {
    if (!mic || !mic.sheetLat || !mic.sheetLng || !userLocation) {
      return null
    }

    // Calculate approximate distance in km
    const distance = calculateDistance(userLocation.lat, userLocation.lng, mic.sheetLat, mic.sheetLng)
    
    // Simple heuristics for Toronto commute
    if (distance <= 1.0) {
      return 'walkable'
    } else if (distance <= 8.0) {
      return 'subway'
    } else {
      return 'bus'
    }
  }, [mic, userLocation])

  return signal
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export function getCommuteSignalDisplay(signal: CommuteSignal): {
  text: string
  color: string
  icon: string
} {
  switch (signal) {
    case 'walkable':
      return {
        text: 'Walkable',
        color: 'bg-green-100 text-green-900 dark:bg-green-950/80 dark:text-green-200',
        icon: '🚶'
      }
    case 'subway':
      return {
        text: 'Subway',
        color: 'bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200',
        icon: '🚇'
      }
    case 'bus':
      return {
        text: 'Bus',
        color: 'bg-orange-100 text-orange-900 dark:bg-orange-950/80 dark:text-orange-200',
        icon: '🚌'
      }
    default:
      return {
        text: '',
        color: '',
        icon: ''
      }
  }
}
