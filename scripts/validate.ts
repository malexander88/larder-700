import fs from "node:fs"
import path from "node:path"
import sharp from "sharp"
import { KCAL_TOLERANCE, MAX_KCAL } from "../lib/constants"
import { deriveDietaryTags, dietaryTagsMatch, proteinFlagPresent } from "../lib/dietary"
import { foods } from "../lib/foods"
import { perServing } from "../lib/nutrition"
import { foodSchema, nutritionDbSchema, recipeSchema, type Recipe } from "../lib/schema"

const root = process.cwd()
const recipesDir = path.join(root, "data", "recipes")
const imageDir = path.join(root, "public", "images", "recipes")
const errors: string[] = []
const started = Date.now()

function fail(message: string) {
  errors.push(message)
}

function relDiff(stated: number, computed: number) {
  const denom = Math.max(Math.abs(computed), 1)
  return Math.abs(stated - computed) / denom
}

const dbRaw = JSON.parse(fs.readFileSync(path.join(root, "data", "nutrition.json"), "utf8"))
const dbParsed = nutritionDbSchema.safeParse(dbRaw)
if (!dbParsed.success) {
  fail(`data/nutrition.json: ${dbParsed.error.issues.map((issue) => issue.message).join("; ")}`)
} else {
  for (const [id, food] of Object.entries(dbParsed.data.foods)) {
    const parsedFood = foodSchema.parse(food)
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) fail(`nutrition id "${id}" must be kebab-case`)
    if (parsedFood.displayAs !== "g" && !parsedFood.gramsPerMl) {
      fail(`${id}: displayAs ${parsedFood.displayAs} needs gramsPerMl`)
    }
    if (Boolean(parsedFood.pieceLabel) !== Boolean(parsedFood.gramsPerPiece)) {
      fail(`${id}: pieceLabel and gramsPerPiece must be set together`)
    }
    const { calories, protein, carbs, fat } = parsedFood.per100g
    const atwater = 4 * protein + 4 * carbs + 9 * fat
    const drift = Math.abs(atwater - calories)
    if (drift > Math.max(8, calories * 0.15)) {
      fail(`${id}: calories ${calories} are too far from Atwater ${atwater.toFixed(0)}`)
    }
  }
}

const files = fs.existsSync(recipesDir)
  ? fs.readdirSync(recipesDir).filter((file) => file.endsWith(".json")).sort()
  : []

if (files.length < 30) fail(`Expected at least 30 recipes, found ${files.length}`)

const recipes: Recipe[] = []
for (const file of files) {
  const full = path.join(recipesDir, file)
  let raw: unknown
  try {
    raw = JSON.parse(fs.readFileSync(full, "utf8"))
  } catch (error) {
    fail(`${file}: invalid JSON (${error instanceof Error ? error.message : "parse error"})`)
    continue
  }
  const parsed = recipeSchema.safeParse(raw)
  if (!parsed.success) {
    const detail = parsed.error.issues
      .slice(0, 6)
      .map((issue) => `${issue.path.join(".") || "recipe"}: ${issue.message}`)
      .join("; ")
    fail(`${file}: ${detail}`)
    continue
  }
  if (`${parsed.data.slug}.json` !== file) fail(`${file}: filename must match slug`)
  recipes.push(parsed.data)
}

const seen = new Set<string>()
for (const recipe of recipes) {
  if (seen.has(recipe.slug)) fail(`duplicate slug ${recipe.slug}`)
  seen.add(recipe.slug)

  for (const ingredient of recipe.ingredients) {
    if (!foods[ingredient.nutritionId]) {
      fail(`${recipe.slug}: unknown nutritionId ${ingredient.nutritionId}`)
    }
  }

  let computed
  try {
    computed = perServing(recipe, foods)
  } catch (error) {
    fail(`${recipe.slug}: ${error instanceof Error ? error.message : "nutrition failed"}`)
    continue
  }

  if (computed.calories > MAX_KCAL) {
    fail(`${recipe.slug}: computed ${computed.calories.toFixed(1)} kcal per serving exceeds ${MAX_KCAL}`)
  }
  if (recipe.statedPerServing.calories > MAX_KCAL) {
    fail(`${recipe.slug}: stated ${recipe.statedPerServing.calories} kcal exceeds ${MAX_KCAL}`)
  }

  const pairs: [keyof typeof computed, string][] = [
    ["calories", "calories"],
    ["protein", "protein"],
    ["carbs", "carbs"],
    ["fat", "fat"],
    ["fibre", "fibre"],
  ]
  for (const [key, label] of pairs) {
    const stated = recipe.statedPerServing[key]
    const diff = relDiff(stated, computed[key])
    const tiny = key !== "calories" && Math.abs(stated - computed[key]) <= 1.5
    if (diff > KCAL_TOLERANCE && !tiny) {
      fail(
        `${recipe.slug}: stated ${label} ${stated} differs from computed ${computed[key].toFixed(1)} by ${Math.round(diff * 100)}%`,
      )
    }
  }

  const derived = deriveDietaryTags(recipe, foods, computed)
  if (!dietaryTagsMatch(recipe.dietary, derived)) {
    fail(`${recipe.slug}: dietary tags [${recipe.dietary.join(", ")}] should be [${derived.join(", ")}]`)
  }
  if (!proteinFlagPresent(recipe, foods)) {
    fail(`${recipe.slug}: no ingredient carries the ${recipe.protein} flag`)
  }
}

function tokens(value: string) {
  const stop = new Set(["with", "and", "the", "for", "from", "into", "over", "style"])
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stop.has(word)),
  )
}

function jaccard(a: Set<string>, b: Set<string>) {
  let intersection = 0
  for (const token of a) if (b.has(token)) intersection += 1
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

function levenshtein(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i += 1) {
    let previous = i - 1
    row[0] = i
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j]
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + cost)
      previous = current
    }
  }
  return row[b.length]
}

for (let i = 0; i < recipes.length; i += 1) {
  const titleA = tokens(recipes[i].title)
  const ingredientsA = new Set(recipes[i].ingredients.map((item) => item.nutritionId))
  const normalA = recipes[i].title.toLowerCase()
  for (let j = i + 1; j < recipes.length; j += 1) {
    const titleScore = jaccard(titleA, tokens(recipes[j].title))
    const ingredientScore = jaccard(ingredientsA, new Set(recipes[j].ingredients.map((item) => item.nutritionId)))
    const normalB = recipes[j].title.toLowerCase()
    let titleRatio = 0
    if (titleScore >= 0.34 && Math.abs(normalA.length - normalB.length) <= 18) {
      const distance = levenshtein(normalA, normalB)
      titleRatio = 1 - distance / Math.max(normalA.length, normalB.length)
    }
    if (titleScore >= 0.72 || titleRatio >= 0.84 || ingredientScore >= 0.78) {
      fail(
        `near-duplicate: ${recipes[i].slug} and ${recipes[j].slug} (title ${titleScore.toFixed(2)}, edit ${titleRatio.toFixed(2)}, ingredients ${ingredientScore.toFixed(2)})`,
      )
    }
  }
}

const schemaPath = path.join(root, "data", "recipe.schema.json")
if (!fs.existsSync(schemaPath)) {
  fail("data/recipe.schema.json is missing. Run npm run schema")
} else {
  const committed = JSON.parse(fs.readFileSync(schemaPath, "utf8")) as {
    title?: string
    definitions?: { Recipe?: unknown }
  }
  if (committed.title !== "Recipe" || !committed.definitions?.Recipe) {
    fail("data/recipe.schema.json is out of date. Run npm run schema")
  }
}

async function checkImages() {
  const used = new Set<string>()
  await mapPool(recipes, 12, async (recipe) => {
    const file = recipe.image.file
    if (used.has(file)) fail(`${recipe.slug}: image ${file} is used more than once`)
    used.add(file)
    const full = path.join(imageDir, file)
    if (!fs.existsSync(full)) {
      fail(`${recipe.slug}: missing image public/images/recipes/${file}`)
      return
    }
    const size = fs.statSync(full).size
    if (size < 12_000 || size > 280_000) {
      fail(`${recipe.slug}: image is ${(size / 1024).toFixed(0)} KB; keep WebP between 12 KB and 280 KB`)
    }
    try {
      const meta = await sharp(full).metadata()
      if (meta.format !== "webp") fail(`${recipe.slug}: image must be WebP`)
      if (!meta.width || meta.width < 800 || meta.width > 1400) {
        fail(`${recipe.slug}: image width ${meta.width ?? "?"}px should be 800–1400`)
      }
      if (!meta.height || meta.height < 520) {
        fail(`${recipe.slug}: image height ${meta.height ?? "?"}px should be at least 520`)
      }
    } catch (error) {
      fail(`${recipe.slug}: could not read image (${error instanceof Error ? error.message : "sharp"})`)
    }
  })
}

async function mapPool<T>(items: T[], size: number, worker: (item: T) => Promise<void>) {
  let index = 0
  async function run() {
    while (index < items.length) {
      const current = items[index]
      index += 1
      await worker(current)
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, () => run()))
}

async function main() {
  await checkImages()
  const elapsed = Date.now() - started
  if (errors.length) {
    console.error(`Validation failed with ${errors.length} problem${errors.length === 1 ? "" : "s"} (${elapsed} ms)\n`)
    for (const error of errors) console.error(`- ${error}`)
    process.exit(1)
  }
  console.log(`Validated ${recipes.length} recipes and ${Object.keys(foods).length} foods in ${elapsed} ms`)
}

main()
