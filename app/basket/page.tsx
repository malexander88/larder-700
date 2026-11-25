import type { Metadata } from "next"
import { BasketView } from "@/components/basket-view"

export const metadata: Metadata = {
  title: "Shopping basket",
  description: "Merged shopping list with Tesco, Sainsbury’s and Asda search links.",
}

export default function BasketPage() {
  return <BasketView />
}
