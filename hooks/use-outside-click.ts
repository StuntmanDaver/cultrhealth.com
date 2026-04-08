import { useEffect, RefObject } from "react"

export const useOutsideClick = (
  ref: RefObject<HTMLDivElement | null>,
  callback: (event: MouseEvent | TouchEvent) => void,
  enabled: boolean = true
) => {
  useEffect(() => {
    if (!enabled) return

    // Defer listener registration to next frame to avoid capturing
    // the same click/tap event that triggered the modal open
    const raf = requestAnimationFrame(() => {
      document.addEventListener("mousedown", listener)
      document.addEventListener("touchstart", listener)
    })

    function listener(event: MouseEvent | TouchEvent) {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return
      }
      callback(event)
    }

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener("mousedown", listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [ref, callback, enabled])
}
