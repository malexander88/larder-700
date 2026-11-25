import { z } from "zod"
import {
  AISLES,
  CUISINES,
  DIETARY_TAGS,
  DIFFICULTIES,
  DISPLAY_UNITS,
  FOOD_FLAGS,
  LICENSES,
  PROTEINS,
} from "./constants"

export const nutrientSchema = z.object({
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  fibre: z.number().nonnegative(),
})

export const foodSchema = z.object({
  shopName: z.string().min(2).max(80),
  label: z.string().min(2).max(120),
  aisle: z.enum(AISLES),
  per100g: nutrientSchema,
  displayAs: z.enum(DISPLAY_UNITS),
  gramsPerMl: z.number().positive().optional(),
  pieceLabel: z.string().min(2).max(60).optional(),
  gramsPerPiece: z.number().positive().optional(),
  flags: z.array(z.enum(FOOD_FLAGS)),
  shopping: z.boolean(),
})

export const nutritionDbSchema = z.object({
  version: z.literal(1),
  method: z.string().min(20),
  foods: z.record(z.string(), foodSchema),
})

export const ingredientSchema = z.object({
  nutritionId: z.string().min(2).max(60),
  grams: z.number().positive().max(5000),
  prepNote: z.string().min(2).max(140).optional(),
  optional: z.boolean().optional(),
})

export const equipmentSchema = z.object({
  name: z.string().min(2).max(80),
  notes: z.string().min(2).max(140).optional(),
})

export const stepSchema = z
  .object({
    instruction: z.string().min(40).max(800),
    minutes: z.number().int().positive().max(180),
    temperatureC: z.number().int().min(80).max(250).optional(),
    heat: z.string().min(2).max(80).optional(),
    tip: z.string().min(8).max(280).optional(),
  })
  .refine((step) => step.temperatureC == null || step.heat == null, {
    message: "Use fan-oven temperatureC or a hob heat note, not both.",
  })

export const imageSchema = z.object({
  file: z.string().regex(/^[a-z0-9-]+\.webp$/, "Image file must be a kebab-case .webp"),
  alt: z.string().min(12).max(180),
  credit: z.string().min(2).max(180),
  sourceUrl: z.string().url().refine((url) => url.startsWith("https://"), "Image source must be https"),
  license: z.enum(LICENSES),
})

export const recipeSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be kebab-case"),
    title: z.string().min(8).max(70),
    summary: z.string().min(40).max(280),
    cuisine: z.enum(CUISINES),
    protein: z.enum(PROTEINS),
    dietary: z.array(z.enum(DIETARY_TAGS)),
    difficulty: z.enum(DIFFICULTIES),
    servings: z.number().int().min(1).max(8),
    prepMinutes: z.number().int().min(0).max(120),
    cookMinutes: z.number().int().min(1).max(240),
    equipment: z.array(equipmentSchema).min(2).max(8),
    ingredients: z.array(ingredientSchema).min(5).max(30),
    steps: z.array(stepSchema).min(4).max(14),
    image: imageSchema,
    statedPerServing: nutrientSchema,
  })
  .refine((recipe) => recipe.image.file === `${recipe.slug}.webp`, {
    message: "image.file must be <slug>.webp",
  })
  .refine(
    (recipe) =>
      recipe.prepMinutes + recipe.cookMinutes ===
      recipe.steps.reduce((sum, step) => sum + step.minutes, 0),
    { message: "prepMinutes + cookMinutes must equal the sum of step minutes" },
  )

export type Recipe = z.infer<typeof recipeSchema>
export type Ingredient = z.infer<typeof ingredientSchema>
export type Food = z.infer<typeof foodSchema>
export type Nutrients = z.infer<typeof nutrientSchema>
export type RecipeStep = z.infer<typeof stepSchema>
