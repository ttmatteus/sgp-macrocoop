'use client'

import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import { gsap } from 'gsap'
import { cn } from '@/lib/utils'

export function Progress({
  value,
  className,
  ...props
}: { value: number } & React.ComponentProps<'div'>) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export function Stepper({
  steps,
  current,
}: {
  steps: string[]
  current: number
}) {
  const circleRefs = useRef<(HTMLSpanElement | null)[]>([])
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([])
  const prevCurrent = useRef(current)

  useEffect(() => {
    const prev = prevCurrent.current

    if (current > prev) {
      // Avançou: anima cada etapa recém-concluída, do índice prev até current - 1
      for (let i = prev; i < current; i++) {
        const circle = circleRefs.current[i]
        const line = lineRefs.current[i]
        if (circle) {
          gsap.fromTo(
            circle,
            { scale: 1 },
            { scale: 1.35, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1 },
          )
        }
        if (line) {
          gsap.fromTo(
            line,
            { scaleX: 0 },
            { scaleX: 1, duration: 0.35, ease: 'power2.inOut', delay: 0.1 },
          )
        }
      }
    } else if (current < prev) {
      // Voltou: reverte a linha da etapa que deixou de estar concluída
      for (let i = current; i < prev; i++) {
        const line = lineRefs.current[i]
        if (line) {
          gsap.to(line, { scaleX: 0, duration: 0.25, ease: 'power2.inOut' })
        }
      }
    }

    prevCurrent.current = current
  }, [current])

  return (
    <ol className="flex w-full items-center">
      {steps.map((step, i) => {
        const done = i < current
        const active = i === current
        return (
          <li
            key={i}
            className={cn('flex items-center', i < steps.length - 1 && 'flex-1')}
          >
            <div className="flex items-center gap-2">
              <span
                ref={(el) => {
                  circleRefs.current[i] = el
                }}
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-300',
                  done && 'border-primary bg-primary text-primary-foreground',
                  active && 'border-primary text-primary',
                  !done && !active && 'border-border text-muted-foreground',
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  'hidden text-sm font-medium sm:inline',
                  active ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className="mx-3 h-px flex-1 overflow-hidden bg-border">
                <span
                  ref={(el) => {
                    lineRefs.current[i] = el
                  }}
                  className="block h-full w-full origin-left bg-primary"
                  style={{ transform: `scaleX(${i < current ? 1 : 0})` }}
                />
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
