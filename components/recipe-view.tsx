"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { DishImage } from "@/components/dish-image"
import { Check, Minus, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useShoppingList } from "@/components/use-basket"
import { addToShoppingList } from "@/lib/shopping-list"
import { DIETARY_LABELS, PROTEIN_LABELS, type DIETARY_TAGS } from "@/lib/constants"
import { foods } from "@/lib/foods"
import { formatKcal, formatMinutes, formatQuantity } from "@/lib/format"
import { calorieBreakdown, perServing, roundNutrients, scaleNutrients } from "@/lib/nutrition"
import type { Recipe } from "@/lib/schema"

type DietaryTag = (typeof DIETARY_TAGS)[number]

export function RecipeView({ recipe }: { recipe: Recipe }) {
  const base = recipe.servings
  const [servings, setServings] = useState(base)
  const [picked, setPicked] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(recipe.ingredients.map((ingredient, index) => [index, !ingredient.optional])),
  )
  const [notice, setNotice] = useState("")
  const { lines, replace } = useShoppingList()
  const scale = servings / base
  const per = roundNutrients(perServing(recipe, foods))
  const total = roundNutrients(scaleNutrients(perServing(recipe, foods), servings))
  const breakdown = useMemo(() => calorieBreakdown(recipe, foods, servings).slice(0, 6), [recipe, servings])
  const timeline = recipe.steps.reduce<number[]>((marks, step) => {
    marks.push((marks.at(-1) ?? 0) + step.minutes)
    return marks
  }, [])

  function add(which: "selected" | "all") {
    const additions = recipe.ingredients.flatMap((ingredient, index) => {
      if (which === "selected" && !picked[index]) return []
      return [
        {
          nutritionId: ingredient.nutritionId,
          grams: ingredient.grams * scale,
          source: { slug: recipe.slug, title: recipe.title },
        },
      ]
    })
    replace(addToShoppingList(lines, additions, foods))
    setNotice(
      additions.length
        ? `Added ${additions.length} ingredients for ${servings} ${servings === 1 ? "serving" : "servings"}.`
        : "Tick at least one ingredient.",
    )
  }

  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">
          Dinners
        </Link>{" "}
        / {recipe.cuisine}
      </p>
      <div className="mt-4 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <DishImage
            file={recipe.image.file}
            alt={recipe.image.alt}
            priority
            className="aspect-[4/3] h-auto w-full rounded-3xl object-cover"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Photo: {recipe.image.credit}. {recipe.image.license}.{" "}
            <a href={recipe.image.sourceUrl} className="underline-offset-4 hover:underline">
              Source
            </a>
          </p>
        </div>
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge>{recipe.cuisine}</Badge>
            <Badge variant="secondary">{PROTEIN_LABELS[recipe.protein]}</Badge>
            <Badge variant="outline">{recipe.difficulty}</Badge>
            {recipe.dietary.map((tag) => (
              <Badge key={tag} variant="outline">
                {DIETARY_LABELS[tag as DietaryTag] ?? tag}
              </Badge>
            ))}
          </div>
          <h1 className="mt-3 font-serif text-4xl tracking-tight">{recipe.title}</h1>
          <p className="mt-3 text-muted-foreground">{recipe.summary}</p>
          <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
            <Stat label="Prep" value={formatMinutes(recipe.prepMinutes)} />
            <Stat label="Cook" value={formatMinutes(recipe.cookMinutes)} />
            <Stat label="Total" value={formatMinutes(recipe.prepMinutes + recipe.cookMinutes)} />
          </dl>
          <div className="mt-5 flex items-center gap-3">
            <span className="text-sm font-medium" id="servings-label">
              Servings
            </span>
            <div className="flex items-center rounded-full border border-border bg-card">
              <button
                type="button"
                className="grid size-10 place-items-center"
                aria-label="Fewer servings"
                onClick={() => setServings((value) => Math.max(1, value - 1))}
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center font-semibold" aria-live="polite" aria-labelledby="servings-label">
                {servings}
              </span>
              <button
                type="button"
                className="grid size-10 place-items-center"
                aria-label="More servings"
                onClick={() => setServings((value) => Math.min(12, value + 1))}
              >
                <Plus className="size-4" />
              </button>
            </div>
            <span className="text-sm text-muted-foreground">Recipe written for {base}</span>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-serif text-2xl">Ingredients</h2>
            <p className="text-sm text-muted-foreground">Scaled to {servings}</p>
          </div>
          <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
            {recipe.ingredients.map((ingredient, index) => {
              const food = foods[ingredient.nutritionId]
              const grams = ingredient.grams * scale
              return (
                <li key={`${ingredient.nutritionId}-${index}`} className="flex items-start gap-3 px-3 py-3">
                  <Checkbox
                    checked={picked[index] !== false}
                    onCheckedChange={(checked) => setPicked({ ...picked, [index]: checked === true })}
                    aria-label={`Include ${food.shopName}`}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{food.shopName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatQuantity(grams, food)}
                      {ingredient.prepNote ? ` · ${ingredient.prepNote}` : ""}
                      {ingredient.optional ? " · optional" : ""}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" className="h-11" onClick={() => add("selected")}>
              Add to shopping list
            </Button>
            <Button variant="ghost" className="h-11" render={<Link href="/basket/" />}>
              Open shopping list
            </Button>
          </div>
          {notice && (
            <p className="mt-3 text-sm text-primary" role="status">
              <Check className="mr-1 inline size-4" />
              {notice}
            </p>
          )}

          <h2 className="mt-10 font-serif text-2xl">Equipment</h2>
          <ul className="mt-3 space-y-2">
            {recipe.equipment.map((item) => (
              <li key={item.name} className="rounded-xl border border-border bg-card px-3 py-2 text-sm">
                <span className="font-medium">{item.name}</span>
                {item.notes && <span className="text-muted-foreground"> · {item.notes}</span>}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl">Method</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Timeline total {formatMinutes(recipe.prepMinutes + recipe.cookMinutes)}. Oven temperatures are fan.
          </p>
          <ol className="mt-4 space-y-4">
            {recipe.steps.map((step, index) => {
              const start = index === 0 ? 0 : timeline[index - 1]
              return (
                <li key={index} className="grid grid-cols-[4.5rem_1fr] gap-3">
                  <div className="text-sm">
                    <p className="font-semibold text-primary">{step.minutes} min</p>
                    <p className="text-muted-foreground">
                      {start}–{timeline[index]}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-sm leading-6">{step.instruction}</p>
                    {step.temperatureC && (
                      <p className="mt-2 text-sm font-medium">Fan oven {step.temperatureC}°C</p>
                    )}
                    {step.heat && <p className="mt-2 text-sm font-medium capitalize">{step.heat}</p>}
                    {step.tip && <p className="mt-2 text-sm text-muted-foreground">Tip: {step.tip}</p>}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      </div>

      <section className="mt-12 rounded-3xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-serif text-2xl">Computed nutrition</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Added up from the per-100 g values on each ingredient, then divided by {base} servings. Scaling the recipe changes the pot, not the per-serving figures. The stored check figure is {recipe.statedPerServing.calories} kcal.
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat label="Per serving" value={formatKcal(per.calories)} />
          <Stat label="Protein" value={`${per.protein} g`} />
          <Stat label="Carbs" value={`${per.carbs} g`} />
          <Stat label="Fat" value={`${per.fat} g`} />
          <Stat label="Fibre" value={`${per.fibre} g`} />
        </dl>
        <p className="mt-4 text-sm">
          This batch, {servings} {servings === 1 ? "serving" : "servings"}: <strong>{formatKcal(total.calories)}</strong>, {total.protein} g protein.
        </p>
        <h3 className="mt-6 text-sm font-medium">Where the calories come from</h3>
        <ul className="mt-3 space-y-2">
          {breakdown.map((line) => (
            <li key={line.nutritionId}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{line.name}</span>
                <span>{Math.round(line.calories)} kcal</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, line.share * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </article>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/70 px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  )
}
