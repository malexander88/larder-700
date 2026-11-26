import { AISLE_LABELS, AISLE_ORDER, type AISLES } from "./constants"
import { formatNumber } from "./format"
import type { Food } from "./schema"

export type Unit = "g" | "kg" | "ml" | "l" | "tsp" | "tbsp" | "count"

export type Quantity = {
  amount: number
  unit: Unit
}

export type UnitFactors = {
  gramsPerMl?: number
  gramsPerPiece?: number
}

export type ListSource = {
  slug: string
  title: string
}

export type ShoppingLine = {
  key: string
  nutritionId: string
  name: string
  aisle: (typeof AISLES)[number]
  quantities: Quantity[]
  checked: boolean
  sources: ListSource[]
}

export type ShoppingAddition = {
  nutritionId: string
  name?: string
  grams?: number
  quantity?: Quantity
  source?: ListSource
}

const PREP_WORDS = new Set([
  "diced",
  "sliced",
  "chopped",
  "grated",
  "crushed",
  "minced",
  "peeled",
  "trimmed",
  "halved",
  "quartered",
  "deseeded",
  "roughly",
  "finely",
  "thinly",
  "fresh",
])

const PLURAL_EXCEPTIONS = new Set(["asparagus", "molasses", "hummus", "couscous", "citrus"])

export const SHOPPING_LIST_KEY = "larder700-shopping-list-v1"
export const LEGACY_BASKET_KEY = "larder700-basket-v1"

export function canonicalIngredientName(name: string): string {
  const words = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word && !PREP_WORDS.has(word))
    .map(singular)
  return words.join(" ")
}

function singular(word: string): string {
  if (PLURAL_EXCEPTIONS.has(word) || word.length <= 3) return word
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`
  if (/(ches|shes|xes|zes|sses)$/.test(word)) return word.slice(0, -2)
  if (word.endsWith("oes") && word.length > 4) return word.slice(0, -2)
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1)
  return word
}

export function ingredientKey(nutritionId: string, name: string): string {
  const id = nutritionId.trim().toLowerCase()
  if (id) return `id:${id}`
  return `name:${canonicalIngredientName(name)}`
}

function roundAmount(value: number): number {
  return Math.round(value * 10) / 10
}

type Base =
  | { kind: "mass"; grams: number }
  | { kind: "volume"; ml: number }
  | { kind: "count"; count: number }

function toBase(quantity: Quantity, factors: UnitFactors): Base | null {
  const amount = quantity.amount
  if (!Number.isFinite(amount) || amount === 0) return null
  if (quantity.unit === "g") return { kind: "mass", grams: amount }
  if (quantity.unit === "kg") return { kind: "mass", grams: amount * 1000 }
  if (quantity.unit === "count") {
    if (factors.gramsPerPiece) return { kind: "mass", grams: amount * factors.gramsPerPiece }
    return { kind: "count", count: amount }
  }
  const ml = quantity.unit === "ml" ? amount : quantity.unit === "l" ? amount * 1000 : quantity.unit === "tsp" ? amount * 5 : quantity.unit === "tbsp" ? amount * 15 : null
  if (ml == null) return null
  if (factors.gramsPerMl) return { kind: "mass", grams: ml * factors.gramsPerMl }
  return { kind: "volume", ml }
}

function displayMass(grams: number): Quantity {
  if (grams >= 1000) return { amount: roundAmount(grams / 1000), unit: "kg" }
  return { amount: roundAmount(grams), unit: "g" }
}

function displayVolume(ml: number): Quantity {
  if (ml >= 1000) return { amount: roundAmount(ml / 1000), unit: "l" }
  return { amount: roundAmount(ml), unit: "ml" }
}

export function sumQuantities(quantities: Quantity[], factors: UnitFactors = {}): Quantity[] {
  let grams = 0
  let ml = 0
  let count = 0
  let hasMass = false
  let hasVolume = false
  let hasCount = false

  for (const quantity of quantities) {
    const base = toBase(quantity, factors)
    if (!base) continue
    if (base.kind === "mass") {
      grams += base.grams
      hasMass = true
    } else if (base.kind === "volume") {
      ml += base.ml
      hasVolume = true
    } else {
      count += base.count
      hasCount = true
    }
  }

  const summed: Quantity[] = []
  if (hasCount && Math.abs(count) > 0) summed.push({ amount: roundAmount(count), unit: "count" })
  if (hasMass && Math.abs(grams) > 0) summed.push(displayMass(grams))
  if (hasVolume && Math.abs(ml) > 0) summed.push(displayVolume(ml))
  return summed
}

export function formatQuantityPart(quantity: Quantity): string {
  const amount = formatNumber(quantity.amount)
  if (quantity.unit === "count") return amount
  return `${amount}${quantity.unit}`
}

export function formatQuantityList(quantities: Quantity[]): string {
  return quantities.map(formatQuantityPart).join(" + ")
}

function factorsFor(food: Food | undefined): UnitFactors {
  return { gramsPerMl: food?.gramsPerMl, gramsPerPiece: food?.gramsPerPiece }
}

function additionQuantity(addition: ShoppingAddition): Quantity | null {
  if (addition.quantity && addition.quantity.amount > 0) return addition.quantity
  if (addition.grams && addition.grams > 0) return { amount: addition.grams, unit: "g" }
  return null
}

export function addToShoppingList(
  lines: ShoppingLine[],
  additions: ShoppingAddition[],
  foods: Record<string, Food>,
): ShoppingLine[] {
  const next = lines.map((line) => ({
    ...line,
    quantities: line.quantities.map((quantity) => ({ ...quantity })),
    sources: line.sources.map((source) => ({ ...source })),
  }))

  for (const addition of additions) {
    const quantity = additionQuantity(addition)
    if (!quantity) continue
    const food = foods[addition.nutritionId]
    if (food?.shopping === false) continue
    const name = food?.shopName || addition.name || addition.nutritionId
    const key = ingredientKey(addition.nutritionId, name)
    const existing = next.find((line) => line.key === key)
    if (existing) {
      existing.quantities = sumQuantities([...existing.quantities, quantity], factorsFor(food ?? foods[existing.nutritionId]))
      existing.checked = false
      if (addition.source && !existing.sources.some((source) => source.slug === addition.source?.slug)) {
        existing.sources.push({ ...addition.source })
      }
    } else {
      next.push({
        key,
        nutritionId: addition.nutritionId,
        name,
        aisle: food?.aisle ?? "world",
        quantities: sumQuantities([quantity], factorsFor(food)),
        checked: false,
        sources: addition.source ? [{ ...addition.source }] : [],
      })
    }
  }

  return next
}

export function groupShoppingList(lines: ShoppingLine[]): { aisle: ShoppingLine["aisle"]; label: string; lines: ShoppingLine[] }[] {
  return AISLE_ORDER.map((aisle) => ({
    aisle,
    label: AISLE_LABELS[aisle],
    lines: lines.filter((line) => line.aisle === aisle),
  })).filter((group) => group.lines.length > 0)
}

export function shoppingListPlainText(lines: ShoppingLine[]): string {
  const groups = groupShoppingList(lines)
  const parts = ["Healthy Dinners shopping list", ""]
  for (const group of groups) {
    parts.push(group.label)
    for (const line of group.lines) {
      const mark = line.checked ? "[x]" : "[ ]"
      parts.push(`${mark} ${line.name} — ${formatQuantityList(line.quantities)}`)
      if (line.sources.length) parts.push(`    from: ${line.sources.map((source) => source.title).join(", ")}`)
    }
    parts.push("")
  }
  return parts.join("\n").trim()
}

type LegacyLine = {
  nutritionId?: string
  name?: string
  aisle?: ShoppingLine["aisle"]
  grams?: number
  quantities?: Quantity[]
  checked?: boolean
  sources?: ListSource[]
}

function isQuantity(value: unknown): value is Quantity {
  if (!value || typeof value !== "object") return false
  const quantity = value as Quantity
  return typeof quantity.amount === "number" && typeof quantity.unit === "string"
}

export function migrateShoppingLines(raw: unknown, foods: Record<string, Food> = {}): ShoppingLine[] {
  if (!Array.isArray(raw)) return []
  const additions: ShoppingAddition[] = []
  const checked = new Map<string, boolean>()
  for (const item of raw as LegacyLine[]) {
    if (!item || typeof item !== "object") continue
    const nutritionId = typeof item.nutritionId === "string" ? item.nutritionId : ""
    const name = typeof item.name === "string" ? item.name : nutritionId
    const source = item.sources?.[0]
    if (Array.isArray(item.quantities) && item.quantities.every(isQuantity)) {
      for (const quantity of item.quantities) {
        additions.push({ nutritionId, name, quantity, source })
      }
    } else if (typeof item.grams === "number") {
      additions.push({ nutritionId, name, grams: item.grams, source })
    } else continue
    const key = ingredientKey(nutritionId, name)
    if (item.checked) checked.set(key, true)
  }
  return addToShoppingList([], additions, foods).map((line) => ({
    ...line,
    checked: checked.get(line.key) ?? false,
    sources: mergeLegacySources(raw as LegacyLine[], line),
  }))
}

function mergeLegacySources(raw: LegacyLine[], line: ShoppingLine): ListSource[] {
  const found = new Map<string, ListSource>()
  for (const source of line.sources) found.set(source.slug, source)
  for (const item of raw) {
    const nutritionId = typeof item.nutritionId === "string" ? item.nutritionId : ""
    const name = typeof item.name === "string" ? item.name : nutritionId
    if (ingredientKey(nutritionId, name) !== line.key) continue
    for (const source of item.sources ?? []) {
      if (source?.slug && source.title) found.set(source.slug, { slug: source.slug, title: source.title })
    }
  }
  return [...found.values()]
}
