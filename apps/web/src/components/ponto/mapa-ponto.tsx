'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapaPontoProps {
  latitude: number
  longitude: number
  /** Centro do geofence do contrato. Sem isso, o circulo nao e desenhado. */
  local?: { latitude: number; longitude: number; raioM: number } | null
  dentroDoRaio?: boolean
}

// tiles raster do CARTO: claro minimalista, gratuito e sem chave.
// raster em vez de vetorial de proposito: nao usa webgl nem web worker.
// versao escura trocada em tempo de execucao conforme o tema (.dark)
const TILES_CLARO = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const TILES_ESCURO = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

/** fundo do container, combina com o tile (evita flash de cor errada no carregamento) */
const FUNDO_CLARO = '#f2f0ec'
const FUNDO_ESCURO = '#201d1a'
const AZUL = '#113a5d'
const VERMELHO = '#dc2626'

/** ponto do usuario no estilo Uber: bolinha com halo, nao pin */
function criarMarcador() {
  return L.divIcon({
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: `<div style="
      width:14px;height:14px;margin:3px;border-radius:9999px;
      background:${AZUL};border:2px solid #fff;
      box-shadow:0 0 0 5px rgba(17,58,93,.18), 0 2px 8px rgba(0,0,0,.28);
    "></div>`,
  })
}

export function MapaPonto({ latitude, longitude, local, dentroDoRaio = true }: MapaPontoProps) {
  const container = useRef<HTMLDivElement>(null)
  const mapa = useRef<L.Map | null>(null)
  const marcador = useRef<L.Marker | null>(null)
  const circulo = useRef<L.Circle | null>(null)
  const tileLayer = useRef<L.TileLayer | null>(null)

  useEffect(() => {
    if (!container.current || mapa.current) return

    const m = L.map(container.current, {
      center: [latitude, longitude],
      zoom: 16,
      // tela de bater ponto: mapa e contexto, nao ferramenta de navegacao
      zoomControl: false,
      attributionControl: false,
    })

    const escuro = document.documentElement.classList.contains('dark')
    tileLayer.current = L.tileLayer(escuro ? TILES_ESCURO : TILES_CLARO, {
      maxZoom: 20,
    }).addTo(m)
    mapa.current = m

    // o leaflet mede o container na criacao. se ele ainda nao tinha altura,
    // os tiles ficam desalinhados ate um invalidateSize
    const observer = new ResizeObserver(() => m.invalidateSize())
    observer.observe(container.current)

    return () => {
      observer.disconnect()
      m.remove()
      mapa.current = null
      marcador.current = null
      circulo.current = null
      tileLayer.current = null
    }
  }, [])

  // troca os tiles e o fundo quando o tema muda (ex.: vira da noite pro dia)
  useEffect(() => {
    const alvo = container.current
    const html = document.documentElement
    if (!alvo) return

    const atualizar = () => {
      const escuro = html.classList.contains('dark')
      alvo.style.background = escuro ? FUNDO_ESCURO : FUNDO_CLARO
      if (tileLayer.current) {
        tileLayer.current.setUrl(escuro ? TILES_ESCURO : TILES_CLARO)
      }
    }
    atualizar()

    const observer = new MutationObserver(atualizar)
    observer.observe(html, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // reposiciona sem recriar o mapa quando o GPS atualiza
  useEffect(() => {
    const m = mapa.current
    if (!m) return

    m.setView([latitude, longitude], m.getZoom(), { animate: true })

    if (!marcador.current) {
      marcador.current = L.marker([latitude, longitude], { icon: criarMarcador() }).addTo(m)
    } else {
      marcador.current.setLatLng([latitude, longitude])
    }
  }, [latitude, longitude])

  // circulo do geofence. o leaflet aceita raio em metros direto
  useEffect(() => {
    const m = mapa.current
    if (!m || !local) return

    const cor = dentroDoRaio ? AZUL : VERMELHO
    const estilo = { color: cor, weight: 1.5, opacity: 0.45, fillColor: cor, fillOpacity: 0.1 }

    if (!circulo.current) {
      circulo.current = L.circle([local.latitude, local.longitude], {
        radius: local.raioM,
        ...estilo,
      }).addTo(m)
    } else {
      circulo.current.setLatLng([local.latitude, local.longitude])
      circulo.current.setRadius(local.raioM)
      circulo.current.setStyle(estilo)
    }
  }, [local, dentroDoRaio])

  return (
    <div className="relative isolate h-48 w-full overflow-hidden border-b border-border">
      <div ref={container} className="absolute inset-0" />
    </div>
  )
}
