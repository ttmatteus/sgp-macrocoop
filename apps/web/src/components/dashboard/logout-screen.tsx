'use client'

export function LogoutScreen() {
  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-primary text-primary-foreground">
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className="flex size-32 items-center justify-center overflow-hidden rounded-full bg-primary-foreground/95 p-4 shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element -- gif animado, o next/image tira a animação */}
          <img src="/face-triste.gif" alt="" className="size-full object-contain" />
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold">Até logo!</p>
          <p className="mt-1 text-sm text-primary-foreground/80">Você saiu da sua conta.</p>
        </div>
      </div>

      <svg
        aria-hidden
        viewBox="0 0 380 80"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full text-primary-foreground/10"
        fill="currentColor"
      >
        <path d="M0,80 L0,50 C40,50 70,10 130,10 C180,10 200,45 250,45 C300,45 330,15 380,15 L380,80 Z" />
      </svg>
    </div>
  )
}
