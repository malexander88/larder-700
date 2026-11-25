"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { Capacitor } from "@capacitor/core"
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem"
import type { CatalogItem } from "@/lib/filter"
import { mergeFoods } from "@/lib/foods"
import { bundledUrl, remoteUrl } from "@/lib/site"
import type { Food, Recipe } from "@/lib/schema"

export type PublishedRecipe = Recipe & {
  perServing?: Recipe["statedPerServing"]
  foods?: Record<string, Food>
}

type CatalogFile = {
  version: number
  generatedAt: string
  recipes: CatalogItem[]
}

type LibraryContextValue = {
  catalog: CatalogItem[] | null
  source: "seed" | "cache" | "remote"
  refreshing: boolean
  status: string
  refresh: () => Promise<void>
  loadRecipe: (slug: string) => Promise<PublishedRecipe | null>
  native: boolean
}

const LibraryContext = createContext<LibraryContextValue | null>(null)

const CATALOG_KEY = "library/catalog.json"

function recipeKey(slug: string) {
  return `library/recipes/${slug}.json`
}

async function readStored(path: string): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await Filesystem.readFile({ path, directory: Directory.Data, encoding: Encoding.UTF8 })
      return typeof result.data === "string" ? result.data : null
    } catch {
      return null
    }
  }
  try {
    return localStorage.getItem(`larder700:${path}`)
  } catch {
    return null
  }
}

async function writeStored(path: string, text: string) {
  if (Capacitor.isNativePlatform()) {
    const folder = path.slice(0, path.lastIndexOf("/"))
    if (folder) {
      await Filesystem.mkdir({ path: folder, directory: Directory.Data, recursive: true }).catch(() => undefined)
    }
    await Filesystem.writeFile({ path, directory: Directory.Data, encoding: Encoding.UTF8, data: text })
    return
  }
  try {
    localStorage.setItem(`larder700:${path}`, text)
  } catch {
    // The browser quota can fill up once hundreds of recipes are cached.
  }
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { cache: "no-cache" })
    if (!response.ok) return null
    return await response.text()
  } catch {
    return null
  }
}

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [catalog, setCatalog] = useState<CatalogItem[] | null>(null)
  const [source, setSource] = useState<LibraryContextValue["source"]>("seed")
  const [refreshing, setRefreshing] = useState(false)
  const [status, setStatus] = useState("")
  const [native, setNative] = useState(false)

  const applyCatalog = useCallback((file: CatalogFile, nextSource: LibraryContextValue["source"]) => {
    setCatalog(file.recipes)
    setSource(nextSource)
  }, [])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    setStatus("Checking for new dinners…")
    const text = await fetchText(remoteUrl("/library/catalog.json"))
    if (!text) {
      setStatus("Offline. Showing saved dinners.")
      setRefreshing(false)
      return
    }
    const file = JSON.parse(text) as CatalogFile
    await writeStored(CATALOG_KEY, text)
    applyCatalog(file, "remote")
    setStatus(`Updated ${new Date(file.generatedAt).toLocaleString("en-GB")}`)
    setRefreshing(false)
  }, [applyCatalog])

  useEffect(() => {
    setNative(Capacitor.isNativePlatform())
  }, [])

  useEffect(() => {
    if (!native) return
    let cancel = false
    ;(async () => {
      const cached = await readStored(CATALOG_KEY)
      if (!cancel && cached) {
        applyCatalog(JSON.parse(cached) as CatalogFile, "cache")
      }
      if (!cancel) await refresh()
    })()
    return () => {
      cancel = true
    }
  }, [native, applyCatalog, refresh])

  const loadRecipe = useCallback(async (slug: string) => {
    const cached = await readStored(recipeKey(slug))
    const fromCache = cached ? (JSON.parse(cached) as PublishedRecipe) : null
    const bundled = await fetchText(bundledUrl(`/library/recipes/${slug}.json`))
    const fromBundle = bundled ? (JSON.parse(bundled) as PublishedRecipe) : null
    let recipe = fromCache ?? fromBundle
    const remote = await fetchText(remoteUrl(`/library/recipes/${slug}.json`))
    if (remote) {
      recipe = JSON.parse(remote) as PublishedRecipe
      await writeStored(recipeKey(slug), remote)
    }
    if (recipe?.foods) mergeFoods(recipe.foods)
    return recipe
  }, [])

  const value = useMemo(
    () => ({ catalog, source, refreshing, status, refresh, loadRecipe, native }),
    [catalog, source, refreshing, status, refresh, loadRecipe, native],
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary() {
  const value = useContext(LibraryContext)
  if (!value) throw new Error("useLibrary must be used inside LibraryProvider")
  return value
}
