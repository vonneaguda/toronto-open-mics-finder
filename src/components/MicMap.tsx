import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Mic } from '../lib/normalize'
import { ensureLeafletDefaultIcons } from '../map/leafletIcons'

ensureLeafletDefaultIcons()

const TORONTO_CENTER: [number, number] = [43.6532, -79.3832]

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (!points.length) {
      map.setView(TORONTO_CENTER, 11)
      return
    }
    const b = L.latLngBounds(points.map(([lat, lng]) => [lat, lng]))
    map.fitBounds(b, { padding: [48, 48], maxZoom: 14 })
  }, [map, points])
  return null
}

type Props = {
  mics: Mic[]
  coordsById: Record<string, { lat: number; lng: number }>
}

export function MicMap({ mics, coordsById }: Props) {
  const points = useMemo(() => {
    const ps: [number, number][] = []
    for (const mic of mics) {
      const c = coordsById[mic.id]
      if (c) ps.push([c.lat, c.lng])
    }
    return ps
  }, [mics, coordsById])

  return (
    <div className="h-[300px] overflow-hidden rounded-2xl border border-zinc-200 shadow-inner dark:border-zinc-700 md:h-[min(560px,calc(100vh-14rem))] md:min-h-[420px]">
      <MapContainer
        center={TORONTO_CENTER}
        zoom={11}
        className="h-full w-full [&_.leaflet-control-attribution]:text-[10px]"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {mics.map((mic) => {
          const c = coordsById[mic.id]
          if (!c) return null
          return (
            <Marker key={mic.id} position={[c.lat, c.lng]}>
              <Popup>
                <div className="max-w-[220px] text-sm">
                  <p className="text-xs font-semibold text-violet-700">
                    {mic.sheetTabDay} sheet
                  </p>
                  <p className="mt-1 font-semibold">{mic.showName}</p>
                  {mic.venueName ? (
                    <p className="text-zinc-700">{mic.venueName}</p>
                  ) : null}
                  {mic.showtimeRaw ? (
                    <p className="text-zinc-600">{mic.showtimeRaw}</p>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
