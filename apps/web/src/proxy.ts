import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// tudo que n tiver aqui e protegido
const ROTAS_PUBLICAS = ['/', '/login', '/recuperar-senha', '/manifest.webmanifest']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (ROTAS_PUBLICAS.includes(pathname)) {
    return NextResponse.next()
  }

  const sessao = request.cookies.get('session')
  if (!sessao) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)',
  ],
}
