import type { Metadata } from "next"
import { ShoppingListView } from "@/components/basket-view"

export const metadata: Metadata = {
  title: "Shopping list",
  description: "Ingredients from your dinners, merged by food and grouped by aisle.",
}

export default function BasketPage() {
  return <ShoppingListView />
}
