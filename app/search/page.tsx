import { RecipeBrowser } from "@/components/recipe-browser"
import { loadCatalog } from "@/lib/recipes.server"

export default function SearchPage() {
  const catalog = loadCatalog()
  return <RecipeBrowser catalog={catalog} focusSearch />
}
