import { gsap } from 'gsap'

// adaptado do ds-sgp (components/docs/cursor-demo-utils.ts): cursor fake que
// se move por cima de um card via top/left em %, e um "ripple" de clique

export function pctTop(card: HTMLElement, target: HTMLElement): string {
  const cardRect = card.getBoundingClientRect()
  const r = target.getBoundingClientRect()
  return `${((r.top - cardRect.top + r.height / 2) / cardRect.height) * 100}%`
}

export function pctLeft(card: HTMLElement, target: HTMLElement): string {
  const cardRect = card.getBoundingClientRect()
  const r = target.getBoundingClientRect()
  return `${((r.left - cardRect.left + r.width / 2) / cardRect.width) * 100}%`
}

export function spawnRippleOn(el: HTMLElement, color: string): void {
  const size = el.offsetHeight * 2.4
  const ripple = document.createElement('span')
  Object.assign(ripple.style, {
    position: 'absolute',
    left: `${el.offsetWidth / 2 - size / 2}px`,
    top: `${el.offsetHeight / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '9999px',
    background: color,
    pointerEvents: 'none',
  })
  el.style.position = el.style.position || 'relative'
  el.style.overflow = 'hidden'
  el.appendChild(ripple)
  gsap.fromTo(
    ripple,
    { scale: 0, opacity: 0.35 },
    { scale: 1, opacity: 0, duration: 0.6, ease: 'power2.out', onComplete: () => ripple.remove() },
  )
}
