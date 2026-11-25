import type { Food } from "./schema"

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0"
  const rounded = Math.round(value * 10) / 10
  if (Math.abs(rounded - Math.round(rounded)) < 0.05) return String(Math.round(rounded))
  return rounded.toFixed(1)
}

export function formatGrams(grams: number): string {
  return `${formatNumber(grams)} g`
}

export function formatQuantity(grams: number, food: Food): string {
  if (food.pieceLabel && food.gramsPerPiece) {
    const pieces = grams / food.gramsPerPiece
    return `${formatNumber(pieces)} ${food.pieceLabel} (${formatNumber(grams)} g)`
  }

  if ((food.displayAs === "ml" || food.displayAs === "tsp" || food.displayAs === "tbsp") && food.gramsPerMl) {
    const ml = grams / food.gramsPerMl
    if (food.displayAs === "ml") {
      return `${formatNumber(ml)} ml`
    }
    if (food.displayAs === "tsp") {
      return `${formatNumber(ml / 5)} tsp`
    }
    return `${formatNumber(ml / 15)} tbsp`
  }

  return formatGrams(grams)
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (rest === 0) return `${hours} hr`
  return `${hours} hr ${rest} min`
}

export function formatKcal(value: number): string {
  return `${Math.round(value)} kcal`
}
