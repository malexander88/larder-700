import { timeBucket, type TimeBucket } from "./constants"

export type CatalogItem = {
  slug: string
  title: string
  summary: string
  cuisine: string
  protein: string
  dietary: string[]
  difficulty: string
  servings: number
  prepMinutes: number
  cookMinutes: number
  totalMinutes: number
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fibreG: number
  image: string
  imageAlt: string
  search: string
}

export type SortKey = "calories-asc" | "calories-desc" | "time" | "protein" | "title"

export type Filters = {
  query: string
  cuisines: string[]
  proteins: string[]
  times: TimeBucket[]
  dietary: string[]
  calorieMin: number
  calorieMax: number
  sort: SortKey
}

export const DEFAULT_FILTERS: Filters = {
  query: "",
  cuisines: [],
  proteins: [],
  times: [],
  dietary: [],
  calorieMin: 0,
  calorieMax: 700,
  sort: "time",
}

export function applyFilters(items: CatalogItem[], filters: Filters): CatalogItem[] {
  const query = filters.query.trim().toLowerCase()
  const next = items.filter((item) => {
    if (query && !item.search.includes(query)) return false
    if (filters.cuisines.length && !filters.cuisines.includes(item.cuisine)) return false
    if (filters.proteins.length && !filters.proteins.includes(item.protein)) return false
    if (filters.times.length && !filters.times.includes(timeBucket(item.totalMinutes))) return false
    if (filters.dietary.some((tag) => !item.dietary.includes(tag))) return false
    if (item.calories < filters.calorieMin || item.calories > filters.calorieMax) return false
    return true
  })

  next.sort((a, b) => {
    switch (filters.sort) {
      case "calories-desc":
        return b.calories - a.calories || a.title.localeCompare(b.title)
      case "calories-asc":
        return a.calories - b.calories || a.title.localeCompare(b.title)
      case "protein":
        return b.proteinG - a.proteinG || a.title.localeCompare(b.title)
      case "title":
        return a.title.localeCompare(b.title)
      case "time":
      default:
        return a.totalMinutes - b.totalMinutes || a.calories - b.calories
    }
  })

  return next
}
