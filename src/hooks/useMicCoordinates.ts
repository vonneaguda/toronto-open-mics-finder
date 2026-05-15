import { startTransition, useEffect, useState } from 'react'
import type { Mic } from '../lib/normalize'
import { resolveMicLatLng } from '../lib/geocode'

export function useMicCoordinates(mics: Mic[]) {
  const [coordsById, setCoordsById] = useState<Record<string, { lat: number; lng: number }>>({})
  const [pending, setPending] = useState(true)

  useEffect(() => {
    let cancelled = false

    startTransition(() => {
      setCoordsById({})
      setPending(true)
    })

    async function run() {
      const next: Record<string, { lat: number; lng: number }> = {}
      for (const mic of mics) {
        if (cancelled) return
        if (mic.sheetLat != null && mic.sheetLng != null) {
          next[mic.id] = { lat: mic.sheetLat, lng: mic.sheetLng }
          setCoordsById({ ...next })
          continue
        }
        const ll = await resolveMicLatLng(mic)
        if (cancelled) return
        if (ll) next[mic.id] = ll
        setCoordsById({ ...next })
      }
      if (!cancelled) setPending(false)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [mics])

  return { coordsById, pending }
}
