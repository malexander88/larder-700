"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { RecipeView } from "@/components/recipe-view"
import { useLibrary, type PublishedRecipe } from "@/components/library-provider"
import { Button } from "@/components/ui/button"

function RuntimeRecipe() {
  const params = useSearchParams()
  const slug = params.get("slug") ?? ""
  const { loadRecipe } = useLibrary()
  const [recipe, setRecipe] = useState<PublishedRecipe | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    if (!slug) return
    let cancel = false
    setMissing(false)
    loadRecipe(slug).then((loaded) => {
      if (cancel) return
      setRecipe(loaded)
      setMissing(!loaded)
    })
    return () => {
      cancel = true
    }
  }, [slug, loadRecipe])

  if (!slug || missing) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-serif text-3xl">That dinner isn’t in the library yet</h1>
        <Button className="mt-6 h-11" render={<Link href="/" />}>
          Back to dinners
        </Button>
      </div>
    )
  }

  if (!recipe) {
    return <p className="px-4 py-16 text-muted-foreground">Loading the recipe…</p>
  }

  return <RecipeView recipe={recipe} />
}

export default function RecipeViewPage() {
  return (
    <Suspense fallback={<p className="px-4 py-16 text-muted-foreground">Loading the recipe…</p>}>
      <RuntimeRecipe />
    </Suspense>
  )
}
