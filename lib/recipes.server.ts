import fs from "node:fs"
import path from "node:path"
import { foods } from "./foods"
import type { CatalogItem } from "./filter"
import { perServing, roundNutrients } from "./nutrition"
import { recipeSchema, type Recipe } from "./schema"

const RECIPES_DIR = path.join(process.cwd(), "data", "recipes")

let productionCache: Recipe[] | null = null

export function recipesDirectory(): string {
  return RECIPES_DIR
}

export function loadRecipes(): Recipe[] {
  if (process.env.NODE_ENV === "production" && productionCache) return productionCache
  if (!fs.existsSync(RECIPES_DIR)) return []

  const recipes = fs
    .readdirSync(RECIPES_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => {
      const raw = JSON.parse(fs.readFileSync(path.join(RECIPES_DIR, file), "utf8")) as unknown
      return recipeSchema.parse(raw)
    })

  if (process.env.NODE_ENV === "production") productionCache = recipes
  return recipes
}

export function getRecipe(slug: string): Recipe | undefined {
  return loadRecipes().find((recipe) => recipe.slug === slug)
}

export function loadCatalog(): CatalogItem[] {
  return loadRecipes().map((recipe) => {
    const per = roundNutrients(perServing(recipe, foods))
    const ingredientNames = recipe.ingredients.map(
      (ingredient) => foods[ingredient.nutritionId]?.shopName ?? ingredient.nutritionId,
    )
    return {
      slug: recipe.slug,
      title: recipe.title,
      summary: recipe.summary,
      cuisine: recipe.cuisine,
      protein: recipe.protein,
      dietary: recipe.dietary,
      difficulty: recipe.difficulty,
      servings: recipe.servings,
      prepMinutes: recipe.prepMinutes,
      cookMinutes: recipe.cookMinutes,
      totalMinutes: recipe.prepMinutes + recipe.cookMinutes,
      calories: per.calories,
      proteinG: per.protein,
      carbsG: per.carbs,
      fatG: per.fat,
      fibreG: per.fibre,
      image: `/images/recipes/${recipe.image.file}`,
      imageAlt: recipe.image.alt,
      search: [recipe.title, recipe.summary, recipe.cuisine, recipe.protein, ...ingredientNames]
        .join(" ")
        .toLowerCase(),
    }
  })
}
