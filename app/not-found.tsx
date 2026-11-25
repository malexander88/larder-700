import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-serif text-4xl">That page isn’t on the menu</h1>
      <p className="mt-3 text-muted-foreground">The recipe may have been renamed. Head back to the dinners.</p>
      <Button className="mt-6 h-11" render={<Link href="/" />}>
        Browse dinners
      </Button>
    </div>
  )
}
