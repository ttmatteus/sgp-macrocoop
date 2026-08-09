const RAIO_TERRA_M = 6371000

function paraRadianos(graus: number): number {
  return (graus * Math.PI) / 180
}

// mesma haversine do backend (apps/api/src/common/geo.ts). aqui e so pra
// mostrar dentro/fora na tela antes de bater. quem decide de verdade e a API
export function distanciaMetros(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = paraRadianos(lat2 - lat1)
  const dLng = paraRadianos(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(paraRadianos(lat1)) * Math.cos(paraRadianos(lat2)) * Math.sin(dLng / 2) ** 2
  return RAIO_TERRA_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
