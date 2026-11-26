import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Calories are estimates from the ingredient weights.</p>
        <p>
          <Link href="/about/" className="underline-offset-4 hover:underline">
            Nutrition method and shop links
          </Link>
        </p>
      </div>
    </footer>
  )
}
