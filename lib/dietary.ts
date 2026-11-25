import { DIETARY_TAGS, HIGH_PROTEIN_G, LOW_CARB_G, PROTEIN_FLAG } from "./constants"
import type { Food, Nutrients, Recipe } from "./schema"

type DietaryTag = (typeof DIETARY_TAGS)[number]

const BLOCKS_VEGETARIAN = new Set(["meat", "fish", "seafood"])

export function deriveDietaryTags(
  recipe: Pick<Recipe, "ingredients" | "protein">,
  foods: Record<string, Food>,
  perServingNutrients: Nutrients,
): DietaryTag[] {
  const flags = new Set<string>()
  for (const ingredient of recipe.ingredients) {
    const food = foods[ingredient.nutritionId]
    if (!food) continue
    for (const flag of food.flags) flags.add(flag)
  }

  const tags: DietaryTag[] = []
  const vegetarian = ![...BLOCKS_VEGETARIAN].some((flag) => flags.has(flag))
  const vegan = vegetarian && !flags.has("animal") && !flags.has("dairy") && !flags.has("egg")
  if (vegetarian) tags.push("vegetarian")
  if (vegan) tags.push("vegan")
  if (!flags.has("gluten")) tags.push("gluten-free")
  if (!flags.has("dairy")) tags.push("dairy-free")
  if (perServingNutrients.protein >= HIGH_PROTEIN_G) tags.push("high-protein")
  if (perServingNutrients.carbs <= LOW_CARB_G) tags.push("low-carb")
  return tags
}

export function dietaryTagsMatch(declared: readonly string[], derived: readonly string[]): boolean {
  if (declared.length !== derived.length) return false
  return DIETARY_TAGS.every((tag) => declared.includes(tag) === derived.includes(tag))
}

export function proteinFlagPresent(
  recipe: Pick<Recipe, "ingredients" | "protein">,
  foods: Record<string, Food>,
): boolean {
  const needed = PROTEIN_FLAG[recipe.protein]
  return recipe.ingredients.some((ingredient) => {
    const flags = foods[ingredient.nutritionId]?.flags as readonly string[] | undefined
    return flags?.includes(needed) ?? false
  })
}
