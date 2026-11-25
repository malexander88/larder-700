"use client"

import { useCallback, useEffect, useState } from "react"
import { BASKET_KEY, type BasketLine } from "@/lib/basket"

const EVENT = "larder700-basket"

function readBasket(): BasketLine[] {
  try {
    const raw = localStorage.getItem(BASKET_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as BasketLine[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function useBasket() {
  const [lines, setLines] = useState<BasketLine[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const sync = () => setLines(readBasket())
    sync()
    setReady(true)
    window.addEventListener(EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  const replace = useCallback((next: BasketLine[]) => {
    localStorage.setItem(BASKET_KEY, JSON.stringify(next))
    setLines(next)
    window.dispatchEvent(new Event(EVENT))
  }, [])

  return { lines, ready, replace }
}
