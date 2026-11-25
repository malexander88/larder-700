import { AISLE_LABELS, AISLE_ORDER } from "./constants"
import type { Food } from "./schema"

export type BasketSource = {
  slug: string
  title: string
  grams: number
}

export type BasketLine = {
  key: string
  nutritionId: string
  name: string
  aisle: Food["aisle"]
  grams: number
  checked: boolean
  prepNotes: string[]
  sources: BasketSource[]
}

export type BasketAddition = {
  nutritionId: string
  grams: number
  prepNote?: string
  source: BasketSource
}

export const BASKET_KEY = "larder700-basket-v1"

export function basketLineKey(nutritionId: string): string {
  return nutritionId
}

export function addToBasket(basket: BasketLine[], additions: BasketAddition[], foods: Record<string, Food>): BasketLine[] {
  const next = basket.map((line) => ({ ...line, prepNotes: [...line.prepNotes], sources: [...line.sources] }))

  for (const addition of additions) {
    if (addition.grams <= 0) continue
    const food = foods[addition.nutritionId]
    if (!food || food.shopping === false) continue
    const key = basketLineKey(addition.nutritionId)
    const existing = next.find((line) => line.key === key)
    if (existing) {
      existing.grams = Math.round((existing.grams + addition.grams) * 10) / 10
      existing.checked = false
      if (addition.prepNote && !existing.prepNotes.includes(addition.prepNote)) {
        existing.prepNotes.push(addition.prepNote)
      }
      const sameSource = existing.sources.find((source) => source.slug === addition.source.slug)
      if (sameSource) sameSource.grams = Math.round((sameSource.grams + addition.grams) * 10) / 10
      else existing.sources.push({ ...addition.source })
    } else {
      next.push({
        key,
        nutritionId: addition.nutritionId,
        name: food.shopName,
        aisle: food.aisle,
        grams: Math.round(addition.grams * 10) / 10,
        checked: false,
        prepNotes: addition.prepNote ? [addition.prepNote] : [],
        sources: [{ ...addition.source }],
      })
    }
  }

  return next
}

export function groupBasket(lines: BasketLine[]): { aisle: Food["aisle"]; label: string; lines: BasketLine[] }[] {
  return AISLE_ORDER.map((aisle) => ({
    aisle,
    label: AISLE_LABELS[aisle],
    lines: lines.filter((line) => line.aisle === aisle),
  })).filter((group) => group.lines.length > 0)
}
