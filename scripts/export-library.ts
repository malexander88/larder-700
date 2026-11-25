import fs from "node:fs"
import path from "node:path"
import { foods } from "../lib/foods"
import { perServing, roundNutrients } from "../lib/nutrition"
import { loadCatalog, loadRecipes } from "../lib/recipes.server"

const root = path.join(process.cwd(), "public", "library")
const recipesDir = path.join(root, "recipes")
fs.mkdirSync(recipesDir, { recursive: true })

const catalog = loadCatalog()
const published = loadRecipes().map((recipe) => {
  const used = [...new Set(recipe.ingredients.map((ingredient) => ingredient.nutritionId))]
  return {
    ...recipe,
    perServing: roundNutrients(perServing(recipe, foods)),
    foods: Object.fromEntries(used.map((id) => [id, foods[id]])),
  }
})

for (const recipe of published) {
  fs.writeFileSync(path.join(recipesDir, `${recipe.slug}.json`), JSON.stringify(recipe))
}

const index = {
  version: 1,
  generatedAt: new Date().toISOString(),
  recipes: catalog,
}

fs.writeFileSync(path.join(root, "catalog.json"), JSON.stringify(index))
console.log(`Exported ${published.length} recipes to public/library`)
