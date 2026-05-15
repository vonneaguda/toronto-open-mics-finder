import L from 'leaflet'
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

let patched = false

/** Leaflet's default marker assets break under bundlers — patch once */
export function ensureLeafletDefaultIcons(): void {
  if (patched) return
  patched = true

  const Default = L.Icon.Default.prototype as unknown as {
    _getIconUrl?: string
  }
  delete Default._getIconUrl

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetina,
    iconUrl,
    shadowUrl,
  })
}
