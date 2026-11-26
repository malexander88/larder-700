"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { SlidersHorizontal, UtensilsCrossed } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  CUISINES,
  DIETARY_LABELS,
  DIETARY_TAGS,
  PROTEIN_LABELS,
  PROTEINS,
  TIME_BUCKETS,
} from "@/lib/constants"
import { DishImage } from "@/components/dish-image"
import { useLibrary } from "@/components/library-provider"
import { applyFilters, DEFAULT_FILTERS, type CatalogItem, type Filters, type SortKey } from "@/lib/filter"
import { cn } from "cn"

const PAGE = 24

const SORTS: { id: SortKey; label: string }[] = [
  { id: "time", label: "Shortest time" },
  { id: "calories-asc", label: "Calories, low to high" },
  { id: "calories-desc", label: "Calories, high to low" },
  { id: "protein", label: "Highest protein" },
  { id: "title", label: "Name" },
]

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

function readFilters(): Filters {
  const params = new URLSearchParams(window.location.search)
  const sort = params.get("sort")
  return {
    query: params.get("q") ?? "",
    cuisines: params.get("cuisine")?.split(",").filter(Boolean) ?? [],
    proteins: params.get("protein")?.split(",").filter(Boolean) ?? [],
    times: (params.get("time")?.split(",").filter(Boolean) ?? []) as Filters["times"],
    dietary: params.get("diet")?.split(",").filter(Boolean) ?? [],
    calorieMin: Number(params.get("min") ?? 0),
    calorieMax: Number(params.get("max") ?? 700),
    sort: SORTS.some((item) => item.id === sort) ? (sort as SortKey) : "time",
  }
}

export function RecipeBrowser({ catalog: seed, focusSearch = false }: { catalog: CatalogItem[]; focusSearch?: boolean }) {
  const library = useLibrary()
  const catalog = library.catalog ?? seed
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [pull, setPull] = useState(0)
  const [hydrated, setHydrated] = useState(false)
  const [visible, setVisible] = useState(PAGE)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setFilters(readFilters())
    setHydrated(true)
    if (focusSearch) searchRef.current?.focus()
  }, [focusSearch])

  useEffect(() => {
    if (!hydrated) return
    const params = new URLSearchParams()
    if (filters.query) params.set("q", filters.query)
    if (filters.cuisines.length) params.set("cuisine", filters.cuisines.join(","))
    if (filters.proteins.length) params.set("protein", filters.proteins.join(","))
    if (filters.times.length) params.set("time", filters.times.join(","))
    if (filters.dietary.length) params.set("diet", filters.dietary.join(","))
    if (filters.calorieMin > 0) params.set("min", String(filters.calorieMin))
    if (filters.calorieMax < 700) params.set("max", String(filters.calorieMax))
    if (filters.sort !== "time") params.set("sort", filters.sort)
    const query = params.toString()
    window.history.replaceState(null, "", query ? `/?${query}` : "/")
  }, [filters, hydrated])

  const results = useMemo(() => applyFilters(catalog, filters), [catalog, filters])
  const shown = results.slice(0, visible)
  const filterKey = JSON.stringify(filters)

  useEffect(() => {
    setVisible(PAGE)
  }, [filterKey])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisible((count) => count + PAGE)
      },
      { rootMargin: "500px" },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [shown.length, results.length])

  const activeCount =
    filters.cuisines.length +
    filters.proteins.length +
    filters.times.length +
    filters.dietary.length +
    (filters.calorieMin > 0 || filters.calorieMax < 700 ? 1 : 0)

  const fields = (
    <FilterFields
      filters={filters}
      onChange={setFilters}
      onClear={() => setFilters({ ...DEFAULT_FILTERS, query: filters.query, sort: filters.sort })}
    />
  )

  const featured = activeCount === 0 && !filters.query ? results[0] : undefined
  const grid = featured ? shown.filter((recipe) => recipe.slug !== featured.slug) : shown

  return (
    <div
      className="mx-auto max-w-6xl pb-8"
      onTouchStart={(event) => {
        if (!library.native || window.scrollY > 0) return
        event.currentTarget.dataset.pullStart = String(event.touches[0]?.clientY ?? 0)
      }}
      onTouchMove={(event) => {
        const start = Number(event.currentTarget.dataset.pullStart || 0)
        if (!library.native || !start) return
        setPull(Math.max(0, (event.touches[0]?.clientY ?? 0) - start))
      }}
      onTouchEnd={() => {
        if (library.native && pull > 70) void library.refresh()
        setPull(0)
      }}
    >
      <div className="px-5 pt-6 md:px-6">
        <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">Tasty dinners under 700 calories</p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight sm:text-5xl">{focusSearch ? "Search" : "Tonight"}</h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
          {catalog.length} measured suppers. Pick one, scale the servings, and send the ingredients to your list.
        </p>
        {library.native && (
          <p className="mt-2 text-sm text-primary" aria-live="polite">
            {library.refreshing ? "Checking for new dinners…" : library.status || "Pull down to refresh dinners."}
          </p>
        )}
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto px-5 pb-1 md:px-6" aria-label="Cuisines">
        <button
          type="button"
          className={cn(
            "shrink-0 rounded-full px-3.5 py-2 text-sm transition",
            filters.cuisines.length === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
          )}
          onClick={() => setFilters({ ...filters, cuisines: [] })}
        >
          All
        </button>
        {CUISINES.map((cuisine) => {
          const on = filters.cuisines.includes(cuisine)
          return (
            <button
              key={cuisine}
              type="button"
              aria-pressed={on}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-2 text-sm transition",
                on ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
              )}
              onClick={() => setFilters({ ...filters, cuisines: on ? [] : [cuisine] })}
            >
              {cuisine}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex items-end gap-2 px-5 md:px-6">
        <div className="min-w-0 flex-1">
          <Label htmlFor="recipe-search" className="sr-only">
            Search by name or ingredient
          </Label>
          <Input
            ref={searchRef}
            id="recipe-search"
            value={filters.query}
            onChange={(event) => setFilters({ ...filters, query: event.target.value })}
            placeholder="Salmon, chickpea, pak choi…"
            className="h-12 rounded-full border-transparent bg-card px-5 shadow-sm"
          />
        </div>
        <Button type="button" variant="outline" className="h-12 rounded-full px-4 lg:hidden" onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal className="size-4" />
          Filters{activeCount ? ` ${activeCount}` : ""}
        </Button>
      </div>

      {featured && (
        <div className="mt-6 px-0 md:px-6">
          <RecipeCard recipe={featured} native={library.native} featured />
        </div>
      )}

      <p className="mt-6 px-5 text-sm text-muted-foreground md:px-6" aria-live="polite">
        {results.length} {results.length === 1 ? "dinner" : "dinners"}
        {filters.query ? ` matching “${filters.query}”` : ""}
      </p>

      <div className="mt-4 grid gap-8 px-5 md:px-6 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-3xl bg-card p-5 shadow-sm">{fields}</div>
        </aside>
        <div>
          {!hydrated ? (
            <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <li key={index} className="animate-pulse overflow-hidden rounded-3xl bg-card shadow-sm">
                  <div className="aspect-[4/5] bg-muted" />
                  <div className="space-y-2 p-4">
                    <div className="h-3 w-1/3 rounded-full bg-muted" />
                    <div className="h-5 w-3/4 rounded-full bg-muted" />
                  </div>
                </li>
              ))}
            </ul>
          ) : results.length === 0 ? (
            <div className="rounded-3xl bg-card px-6 py-16 text-center shadow-sm">
              <UtensilsCrossed className="mx-auto size-8 text-primary" />
              <h2 className="mt-4 font-serif text-3xl">Nothing matches that</h2>
              <p className="mt-2 text-muted-foreground">Clear a filter or try a broader ingredient, like chicken or tomato.</p>
              <Button type="button" className="mt-5 h-11 rounded-full px-5" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Reset filters
              </Button>
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {grid.map((recipe) => (
                <li key={recipe.slug}>
                  <RecipeCard recipe={recipe} native={library.native} />
                </li>
              ))}
            </ul>
          )}
          {shown.length < results.length && (
            <div className="mt-8 flex justify-center">
              <Button type="button" variant="outline" className="h-11 rounded-full px-5" onClick={() => setVisible((count) => count + PAGE)}>
                Show more dinners
              </Button>
            </div>
          )}
          <div ref={sentinelRef} className="h-1" aria-hidden />
        </div>
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="max-h-[86vh] overflow-y-auto rounded-t-3xl px-2 pb-8">
          <SheetHeader>
            <SheetTitle className="font-serif text-2xl">Filters</SheetTitle>
          </SheetHeader>
          <div className="px-4">{fields}</div>
          <div className="px-4 pt-2">
            <Button type="button" className="h-12 w-full rounded-full" onClick={() => setFiltersOpen(false)}>
              Show {results.length} dinners
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function FilterFields({
  filters,
  onChange,
  onClear,
}: {
  filters: Filters
  onChange: (filters: Filters) => void
  onClear: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg">Filters</h2>
        <button type="button" className="text-sm text-primary underline-offset-4 hover:underline" onClick={onClear}>
          Clear
        </button>
      </div>
      <ChipGroup
        label="Cuisine"
        options={CUISINES.map((cuisine) => ({ id: cuisine, label: cuisine }))}
        selected={filters.cuisines}
        onToggle={(id) => onChange({ ...filters, cuisines: toggle(filters.cuisines, id) })}
      />
      <ChipGroup
        label="Main protein"
        options={PROTEINS.map((protein) => ({ id: protein, label: PROTEIN_LABELS[protein] }))}
        selected={filters.proteins}
        onToggle={(id) => onChange({ ...filters, proteins: toggle(filters.proteins, id) })}
      />
      <ChipGroup
        label="Total time"
        options={TIME_BUCKETS.map((bucket) => ({ id: bucket.id, label: bucket.label }))}
        selected={filters.times}
        onToggle={(id) => onChange({ ...filters, times: toggle(filters.times, id) as Filters["times"] })}
      />
      <ChipGroup
        label="Diet"
        hint="All selected tags must apply."
        options={DIETARY_TAGS.map((tag) => ({ id: tag, label: DIETARY_LABELS[tag] }))}
        selected={filters.dietary}
        onToggle={(id) => onChange({ ...filters, dietary: toggle(filters.dietary, id) })}
      />
      <div>
        <Label htmlFor="recipe-sort">Sort</Label>
        <select
          id="recipe-sort"
          value={filters.sort}
          onChange={(event) => onChange({ ...filters, sort: event.target.value as SortKey })}
          className="mt-2 h-11 w-full rounded-full border border-input bg-background px-4 text-sm"
        >
          {SORTS.map((sort) => (
            <option key={sort.id} value={sort.id}>
              {sort.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <Label>Calories per serving</Label>
          <span className="text-sm text-muted-foreground">
            {filters.calorieMin}–{filters.calorieMax}
          </span>
        </div>
        <Slider
          min={0}
          max={700}
          step={10}
          value={[filters.calorieMin, filters.calorieMax]}
          onValueChange={(value) => {
            const nums = Array.isArray(value) ? [...value] : [value]
            onChange({ ...filters, calorieMin: nums[0] ?? 0, calorieMax: nums[1] ?? 700 })
          }}
          aria-label="Calorie range"
        />
      </div>
    </div>
  )
}

function ChipGroup({
  label,
  hint,
  options,
  selected,
  onToggle,
}: {
  label: string
  hint?: string
  options: { id: string; label: string }[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{label}</legend>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((option) => {
          const on = selected.includes(option.id)
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(option.id)}
              className={cn(
                "min-h-9 rounded-full px-3 py-1.5 text-sm transition",
                on ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function RecipeCard({ recipe, native, featured = false }: { recipe: CatalogItem; native: boolean; featured?: boolean }) {
  const href = native ? `/recipe/view/?slug=${encodeURIComponent(recipe.slug)}` : `/recipe/${recipe.slug}/`
  return (
    <Link
      href={href}
      className={cn(
        "group relative block overflow-hidden bg-card shadow-[0_12px_40px_-24px_rgba(40,30,20,0.45)] transition duration-300 hover:-translate-y-0.5",
        featured ? "md:rounded-3xl" : "rounded-3xl",
      )}
    >
      <DishImage
        file={recipe.image.replace(/^.*\//, "")}
        alt={recipe.imageAlt}
        priority={featured}
        className={cn("w-full object-cover", featured ? "aspect-[4/5] sm:aspect-[16/9]" : "aspect-[4/5]")}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
      <div className={cn("absolute inset-x-0 bottom-0 text-white", featured ? "p-5 sm:p-8" : "p-4")}>
        <p className="text-[11px] tracking-[0.16em] uppercase opacity-90">{recipe.cuisine}</p>
        <h2 className={cn("mt-1 font-serif leading-tight", featured ? "text-3xl sm:text-5xl" : "text-2xl")}>{recipe.title}</h2>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs backdrop-blur-sm">{recipe.calories} kcal</span>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs backdrop-blur-sm">{recipe.proteinG} g protein</span>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs backdrop-blur-sm">{recipe.totalMinutes} min</span>
        </div>
      </div>
    </Link>
  )
}
