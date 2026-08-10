const letras = ['G', 'D', 'C'] as const

// escadinha: uma letra sobe, desce, ai a proxima sobe, num loop. duration
// bate com o delay escalonado (0.4s por letra, 3 letras = 1.2s de volta)
export function GdcLoading({ className = 'text-primary' }: { className?: string }) {
  return (
    <div className="flex items-end gap-1" role="status" aria-label="Carregando">
      {letras.map((letra, i) => (
        <span
          key={letra}
          className={`inline-block text-6xl font-extrabold leading-none tracking-tight [animation:gdc-escadinha_1.2s_ease-in-out_infinite] ${className}`}
          style={{ animationDelay: `${i * 0.4}s` }}
        >
          {letra}
        </span>
      ))}
    </div>
  )
}
