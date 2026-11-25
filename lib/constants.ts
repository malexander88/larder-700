export const CUISINES = [
  "Italian",
  "Indian",
  "Mexican",
  "Chinese",
  "Thai",
  "Mediterranean",
  "British",
  "Middle Eastern",
  "Japanese",
] as const

export const PROTEINS = [
  "chicken",
  "beef",
  "pork",
  "fish",
  "seafood",
  "turkey",
  "tofu",
  "eggs",
  "legumes",
] as const

export const DIETARY_TAGS = [
  "vegetarian",
  "vegan",
  "gluten-free",
  "dairy-free",
  "high-protein",
  "low-carb",
] as const

export const DIFFICULTIES = ["easy", "moderate"] as const

export const AISLES = [
  "fruit-veg",
  "meat-fish",
  "dairy-eggs",
  "plant-based",
  "bakery",
  "frozen",
  "tins-jars",
  "grains",
  "spices",
  "oils-sauces",
  "world",
] as const

export const AISLE_LABELS: Record<(typeof AISLES)[number], string> = {
  "fruit-veg": "Fruit & veg",
  "meat-fish": "Meat & fish",
  "dairy-eggs": "Dairy & eggs",
  "plant-based": "Plant-based",
  bakery: "Bakery",
  frozen: "Frozen",
  "tins-jars": "Tins, jars & packets",
  grains: "Rice, pasta & grains",
  spices: "Herbs & spices",
  "oils-sauces": "Oils, sauces & condiments",
  world: "World foods",
}

export const AISLE_ORDER = AISLES

export const DISPLAY_UNITS = ["g", "ml", "tsp", "tbsp"] as const

export const FOOD_FLAGS = [
  "meat",
  "animal",
  "chicken",
  "turkey",
  "beef",
  "pork",
  "fish",
  "seafood",
  "tofu",
  "egg",
  "legume",
  "dairy",
  "gluten",
] as const

export const PROTEIN_FLAG: Record<(typeof PROTEINS)[number], string> = {
  chicken: "chicken",
  beef: "beef",
  pork: "pork",
  fish: "fish",
  seafood: "seafood",
  turkey: "turkey",
  tofu: "tofu",
  eggs: "egg",
  legumes: "legume",
}

export const HIGH_PROTEIN_G = 30
export const LOW_CARB_G = 25
export const MAX_KCAL = 700
export const KCAL_TOLERANCE = 0.1

export const LICENSES = [
  "Unsplash License",
  "Pexels License",
  "CC0",
  "CC0 1.0",
  "CC BY 2.0",
  "CC BY 2.5",
  "CC BY 3.0",
  "CC BY 4.0",
  "CC BY-SA 2.0",
  "CC BY-SA 2.5",
  "CC BY-SA 3.0",
  "CC BY-SA 4.0",
  "Public domain",
  "Public Domain",
] as const

export const TIME_BUCKETS = [
  { id: "under-20", label: "Under 20 min" },
  { id: "20-40", label: "20–40 min" },
  { id: "40-plus", label: "40+ min" },
] as const

export type TimeBucket = (typeof TIME_BUCKETS)[number]["id"]

export function timeBucket(totalMinutes: number): TimeBucket {
  if (totalMinutes < 20) return "under-20"
  if (totalMinutes <= 40) return "20-40"
  return "40-plus"
}

export const DIETARY_LABELS: Record<(typeof DIETARY_TAGS)[number], string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  "gluten-free": "Gluten-free",
  "dairy-free": "Dairy-free",
  "high-protein": "High protein",
  "low-carb": "Low carb",
}

export const PROTEIN_LABELS: Record<(typeof PROTEINS)[number], string> = {
  chicken: "Chicken",
  beef: "Beef",
  pork: "Pork",
  fish: "Fish",
  seafood: "Seafood",
  turkey: "Turkey",
  tofu: "Tofu",
  eggs: "Eggs",
  legumes: "Legumes",
}
