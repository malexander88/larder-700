import type { Food, Ingredient, Nutrients, Recipe } from "./schema"

export const ZERO: Nutrients = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fibre: 0,
}

export function addNutrients(a: Nutrients, b: Nutrients): Nutrients {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
    fibre: a.fibre + b.fibre,
  }
}

export function scaleNutrients(n: Nutrients, factor: number): Nutrients {
  return {
    calories: n.calories * factor,
    protein: n.protein * factor,
    carbs: n.carbs * factor,
    fat: n.fat * factor,
    fibre: n.fibre * factor,
  }
}

export function roundNutrients(n: Nutrients): Nutrients {
  return {
    calories: Math.round(n.calories),
    protein: Math.round(n.protein * 10) / 10,
    carbs: Math.round(n.carbs * 10) / 10,
    fat: Math.round(n.fat * 10) / 10,
    fibre: Math.round(n.fibre * 10) / 10,
  }
}

export function ingredientNutrients(
  ingredient: Ingredient,
  foods: Record<string, Food>,
  grams = ingredient.grams,
): Nutrients {
  const food = foods[ingredient.nutritionId]
  if (!food) {
    throw new Error(`Unknown nutritionId "${ingredient.nutritionId}"`)
  }
  return scaleNutrients(food.per100g, grams / 100)
}

export function recipeTotals(recipe: Recipe, foods: Record<string, Food>): Nutrients {
  return recipe.ingredients.reduce(
    (sum, ingredient) => addNutrients(sum, ingredientNutrients(ingredient, foods)),
    ZERO,
  )
}

export function perServing(recipe: Recipe, foods: Record<string, Food>): Nutrients {
  return scaleNutrients(recipeTotals(recipe, foods), 1 / recipe.servings)
}

export type CalorieLine = {
  nutritionId: string
  name: string
  calories: number
  share: number
}

export function calorieBreakdown(
  recipe: Recipe,
  foods: Record<string, Food>,
  servings = recipe.servings,
): CalorieLine[] {
  const factor = servings / recipe.servings
  const lines = recipe.ingredients.map((ingredient) => {
    const food = foods[ingredient.nutritionId]
    const calories = ingredientNutrients(ingredient, foods).calories * factor
    return {
      nutritionId: ingredient.nutritionId,
      name: food?.shopName ?? ingredient.nutritionId,
      calories,
      share: 0,
    }
  })
  const total = lines.reduce((sum, line) => sum + line.calories, 0) || 1
  return lines
    .map((line) => ({ ...line, share: line.calories / total }))
    .sort((a, b) => b.calories - a.calories)
}
