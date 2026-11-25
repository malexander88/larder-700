"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { SlidersHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
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

export function RecipeBrowser({ catalog: seed }: { catalog: CatalogItem[] }) {
  const library = useLibrary()
  const catalog = library.catalog ?? seed
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [pull, setPull] = useState(0)
  const [hydrated, setHydrated] = useState(false)
  const [visible, setVisible] = useState(PAGE)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setFilters(readFilters())
    setHydrated(true)
  }, [])

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

  function openFilters() {
    dialogRef.current?.showModal()
  }

  function closeFilters() {
    dialogRef.current?.close()
  }

  const fields = (
    <FilterFields
      filters={filters}
      onChange={setFilters}
      onClear={() => setFilters({ ...DEFAULT_FILTERS, query: filters.query, sort: filters.sort })}
    />
  )

  return (
    <div
      className="mx-auto max-w-6xl px-4 py-8"
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
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-primary">Northern Ireland kitchens · grams, ml and fan ovens</p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight sm:text-5xl">Dinners under 700 kcal</h1>
        <p className="mt-3 text-base text-muted-foreground">
          {catalog.length} suppers so far, each one added up from the ingredients on the page. Search, filter, then send the list to Tesco.
        </p>
        {library.native && (
          <p className="mt-2 text-sm text-primary" aria-live="polite">
            {library.refreshing ? "Checking for new dinners…" : library.status || "Pull down to refresh dinners."}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="recipe-search">Search by name or ingredient</Label>
          <Input
            id="recipe-search"
            value={filters.query}
            onChange={(event) => setFilters({ ...filters, query: event.target.value })}
            placeholder="Try salmon, chickpea, pak choi…"
            className="mt-1.5 h-11 bg-card"
          />
        </div>
        <div className="sm:w-56">
          <Label htmlFor="recipe-sort">Sort</Label>
          <select
            id="recipe-sort"
            value={filters.sort}
            onChange={(event) => setFilters({ ...filters, sort: event.target.value as SortKey })}
            className="mt-1.5 h-11 w-full rounded-lg border border-input bg-card px-3 text-sm"
          >
            {SORTS.map((sort) => (
              <option key={sort.id} value={sort.id}>
                {sort.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" variant="outline" className="h-11 lg:hidden" onClick={openFilters}>
          <SlidersHorizontal />
          Filters{activeCount ? ` (${activeCount})` : ""}
        </Button>
      </div>

      <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
        {results.length} {results.length === 1 ? "dinner" : "dinners"}
        {filters.query ? ` matching “${filters.query}”` : ""}
      </p>

      <div className="mt-4 grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-2xl border border-border bg-card p-4">{fields}</div>
        </aside>
        <div>
          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
              <h2 className="font-serif text-2xl">Nothing matches that</h2>
              <p className="mt-2 text-muted-foreground">Clear a filter or try a broader ingredient, like chicken or tomato.</p>
              <Button type="button" className="mt-4 h-11" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Reset filters
              </Button>
            </div>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((recipe) => (
                <li key={recipe.slug}>
                  <RecipeCard recipe={recipe} native={library.native} />
                </li>
              ))}
            </ul>
          )}
          {shown.length < results.length && (
            <div className="mt-8 flex justify-center">
              <Button type="button" variant="outline" className="h-11" onClick={() => setVisible((count) => count + PAGE)}>
                Show more dinners
              </Button>
            </div>
          )}
          <div ref={sentinelRef} className="h-1" aria-hidden />
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className="m-0 h-full max-h-none w-[min(100%,24rem)] max-w-none rounded-none border-r border-border bg-background p-0 backdrop:bg-black/40"
        onClose={() => undefined}
        aria-label="Filters"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-serif text-xl">Filters</h2>
          <Button type="button" variant="ghost" onClick={closeFilters}>
            Done
          </Button>
        </div>
        <div className="p-4">{fields}</div>
      </dialog>
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
                "rounded-full border px-2.5 py-1 text-xs font-medium",
                on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-secondary",
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

function RecipeCard({ recipe, native }: { recipe: CatalogItem; native: boolean }) {
  const href = native ? `/recipe/view/?slug=${encodeURIComponent(recipe.slug)}` : `/recipe/${recipe.slug}/`
  return (
    <Link
      href={href}
      className="group block h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <DishImage
        file={recipe.image.replace(/^.*\//, "")}
        alt={recipe.imageAlt}
        className="aspect-[4/3] w-full object-cover"
      />
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <span>{recipe.cuisine}</span>
          <span className="text-foreground">{recipe.calories} kcal</span>
        </div>
        <h2 className="font-serif text-xl leading-tight group-hover:text-primary">{recipe.title}</h2>
        <p className="line-clamp-2 text-sm text-muted-foreground">{recipe.summary}</p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Badge variant="secondary">
            {recipe.totalMinutes} min
          </Badge>
          <Badge variant="secondary">{recipe.proteinG} g protein</Badge>
          {recipe.dietary.includes("vegan") && <Badge variant="outline">Vegan</Badge>}
          {recipe.dietary.includes("vegetarian") && !recipe.dietary.includes("vegan") && (
            <Badge variant="outline">Vegetarian</Badge>
          )}
        </div>
      </div>
    </Link>
  )
}
