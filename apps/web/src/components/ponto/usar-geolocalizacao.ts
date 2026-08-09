'use client'

import { useCallback, useEffect, useState } from 'react'

export type ErroGeo = 'permissao-negada' | 'indisponivel' | 'timeout' | 'sem-suporte' | 'origem-insegura'

/** pendente = nunca perguntou, entao vale mostrar o card explicando antes */
export type EstadoPermissao = 'verificando' | 'pendente' | 'concedida' | 'negada'

export interface Posicao {
  latitude: number
  longitude: number
  precisaoM: number
}

interface EstadoGeo {
  posicao: Posicao | null
  erro: ErroGeo | null
  carregando: boolean
}

function traduzirErro(codigo: number): ErroGeo {
  if (codigo === 1) {
    // navegador bloqueia geolocalizacao fora de https/localhost e devolve o
    // mesmo codigo de permissao negada, sem nem mostrar o popup
    if (typeof window !== 'undefined' && !window.isSecureContext) return 'origem-insegura'
    return 'permissao-negada'
  }
  if (codigo === 3) return 'timeout'
  return 'indisponivel'
}

export function usarGeolocalizacao() {
  const [estado, setEstado] = useState<EstadoGeo>({
    posicao: null,
    erro: null,
    carregando: false,
  })
  const [permissao, setPermissao] = useState<EstadoPermissao>('verificando')

  const capturar = useCallback((): Promise<Posicao | null> => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setEstado({ posicao: null, erro: 'sem-suporte', carregando: false })
      return Promise.resolve(null)
    }

    setEstado((s) => ({ ...s, carregando: true, erro: null }))

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const posicao = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            precisaoM: pos.coords.accuracy,
          }
          setEstado({ posicao, erro: null, carregando: false })
          setPermissao('concedida')
          resolve(posicao)
        },
        (err) => {
          const erro = traduzirErro(err.code)
          setEstado({ posicao: null, erro, carregando: false })
          if (erro === 'permissao-negada' || erro === 'origem-insegura') setPermissao('negada')
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      )
    })
  }, [])

  // descobre se ja tem permissao sem disparar o popup. se ja tiver, captura
  // direto; se nunca perguntou, a tela mostra o card antes de pedir
  useEffect(() => {
    let cancelado = false

    async function verificar() {
      if (typeof window === 'undefined') return

      if (!window.isSecureContext) {
        setEstado({ posicao: null, erro: 'origem-insegura', carregando: false })
        setPermissao('negada')
        return
      }

      if (!navigator.permissions?.query) {
        // sem Permissions API nao da pra saber sem perguntar: mostra o card
        setPermissao('pendente')
        return
      }

      try {
        const status = await navigator.permissions.query({ name: 'geolocation' })
        if (cancelado) return

        if (status.state === 'granted') {
          setPermissao('concedida')
          void capturar()
        } else if (status.state === 'denied') {
          setPermissao('negada')
          setEstado({ posicao: null, erro: 'permissao-negada', carregando: false })
        } else {
          setPermissao('pendente')
        }
      } catch {
        if (!cancelado) setPermissao('pendente')
      }
    }

    void verificar()
    return () => {
      cancelado = true
    }
  }, [capturar])

  return { ...estado, permissao, capturar }
}
