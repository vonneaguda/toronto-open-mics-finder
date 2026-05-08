const CACHE_KEY = 'toronto-open-mics-nominatim-v1'

type CacheEntry = { lat: number; lng: number; ts: number }

function readCache(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    const obj = JSON.parse(raw) as Record<string, CacheEntry>
    return obj && typeof obj === 'object' ? obj : {}
  } catch {
    return {}
  }
}

function writeCache(entry: Record<string, CacheEntry>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    /* quota */
  }
}

function normalizeQuery(q: string): string {
  return q.replace(/\s+/g, ' ').trim().toLowerCase()
}

const memory = new Map<string, CacheEntry | null>()

/** Global queue so we never hit Nominatim in parallel */
let queueTail: Promise<void> = Promise.resolve()

function enqueue(task: () => Promise<void>): Promise<void> {
  const next = queueTail.then(() => task())
  queueTail = next.catch(() => {})
  return next
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  const q = normalizeQuery(address)
  if (!q) return null

  if (memory.has(q)) {
    const hit = memory.get(q)
    return hit ? { lat: hit.lat, lng: hit.lng } : null
  }

  const disk = readCache()
  if (disk[q]) {
    memory.set(q, disk[q])
    return { lat: disk[q].lat, lng: disk[q].lng }
  }

  await enqueue(async () => {
    await delay(1100)
    const params = new URLSearchParams({
      format: 'json',
      q: address + ', Canada',
      limit: '1',
    })
    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'TorontoOpenMicsFinder/1.0 (community listing)',
      },
    })
    if (!res.ok) {
      memory.set(q, null)
      return
    }
    const json = (await res.json()) as { lat?: string; lon?: string }[]
    const first = json[0]
    if (!first?.lat || !first?.lon) {
      memory.set(q, null)
      return
    }
    const lat = parseFloat(first.lat)
    const lng = parseFloat(first.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      memory.set(q, null)
      return
    }
    const entry: CacheEntry = { lat, lng, ts: Date.now() }
    memory.set(q, entry)
    const updated = readCache()
    updated[q] = entry
    writeCache(updated)
  })

  const hit = memory.get(q)
  return hit ? { lat: hit.lat, lng: hit.lng } : null
}

export async function resolveMicLatLng(mic: {
  venueAddress: string
  venueName: string
}): Promise<{ lat: number; lng: number } | null> {
  const addr = mic.venueAddress.trim()
  const venue = mic.venueName.trim()
  const query = addr || venue
  if (!query) return null
  return geocodeAddress(query)
}
