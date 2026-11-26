import type { Metadata } from "next"
import { HIGH_PROTEIN_G, LOW_CARB_G, MAX_KCAL } from "@/lib/constants"
import { nutritionMethod } from "@/lib/foods"

export const metadata: Metadata = {
  title: "How we count",
  description: "How Low Cal Dinners calculates calories and how the shopping list works.",
}

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-6 px-4 py-10 text-[15px] leading-7">
      <h1 className="font-serif text-4xl">How we count</h1>
      <p>
        Every dinner is stored as weights in grams. The page multiplies those weights by a per-100 g reference and divides by the number of servings. The figure you see is that computed total. A stored check figure has to stay within 10% of it, and neither may go over {MAX_KCAL} kcal.
      </p>
      <p>{nutritionMethod}</p>
      <p>
        High protein means at least {HIGH_PROTEIN_G} g protein per serving. Low carb means {LOW_CARB_G} g of carbohydrate or less. Vegetarian, vegan, gluten-free and dairy-free are decided from the ingredients, not typed in by hand. A vegan dish also shows as vegetarian.
      </p>
      <h2 className="font-serif text-2xl">Shopping list</h2>
      <p>
        Add a dinner and the ingredients land on one list, scaled to the servings you chose. The same food from two recipes becomes one line, with the amounts added together. Tick items off, remove them, or copy and share the list. It stays on this phone.
      </p>
      <p>Quantities use the weight you would buy. A teaspoon of oil is shown as a spoon measure, and the grams behind it are what the calories use.</p>
    </article>
  )
}
