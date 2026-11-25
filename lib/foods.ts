import nutritionDb from "../data/nutrition.json"
import type { Food } from "./schema"

export const nutritionMethod = nutritionDb.method

export const foods: Record<string, Food> = { ...(nutritionDb.foods as Record<string, Food>) }

export function mergeFoods(extra: Record<string, Food> | undefined) {
  if (!extra) return
  for (const [id, food] of Object.entries(extra)) {
    if (!foods[id]) foods[id] = food
  }
}

export function getFood(id: string): Food {
  const food = foods[id]
  if (!food) throw new Error(`Unknown nutritionId "${id}"`)
  return food
}
