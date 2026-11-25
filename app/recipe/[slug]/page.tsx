import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { RecipeView } from "@/components/recipe-view"
import { getRecipe, loadRecipes } from "@/lib/recipes.server"

export function generateStaticParams() {
  return loadRecipes().map((recipe) => ({ slug: recipe.slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const recipe = getRecipe(slug)
  if (!recipe) return { title: "Recipe" }
  return {
    title: recipe.title,
    description: recipe.summary,
  }
}

export default async function RecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const recipe = getRecipe(slug)
  if (!recipe) notFound()
  return <RecipeView recipe={recipe} />
}
