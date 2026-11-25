import nutritionDb from "../data/nutrition.json"
import type { Food } from "./schema"

export const nutritionMethod = nutritionDb.method

export const foods = nutritionDb.foods as Record<string, Food>

export function getFood(id: string): Food {
  const food = foods[id]
  if (!food) throw new Error(`Unknown nutritionId "${id}"`)
  return food
}
