"use client"

import { useCallback, useEffect, useState } from "react"
import { foods } from "@/lib/foods"
import {
  LEGACY_BASKET_KEY,
  SHOPPING_LIST_KEY,
  migrateShoppingLines,
  type ShoppingLine,
} from "@/lib/shopping-list"

const EVENT = "larder700-shopping-list"

function readList(): ShoppingLine[] {
  try {
    const current = localStorage.getItem(SHOPPING_LIST_KEY)
    if (current) {
      const parsed = JSON.parse(current) as unknown
      return migrateShoppingLines(parsed, foods)
    }
    const legacy = localStorage.getItem(LEGACY_BASKET_KEY)
    if (!legacy) return []
    const migrated = migrateShoppingLines(JSON.parse(legacy) as unknown, foods)
    localStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(migrated))
    return migrated
  } catch {
    return []
  }
}

export function useShoppingList() {
  const [lines, setLines] = useState<ShoppingLine[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const sync = () => setLines(readList())
    sync()
    setReady(true)
    window.addEventListener(EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  const replace = useCallback((next: ShoppingLine[]) => {
    localStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(next))
    setLines(next)
    window.dispatchEvent(new Event(EVENT))
  }, [])

  return { lines, ready, replace }
}

export const useBasket = useShoppingList
