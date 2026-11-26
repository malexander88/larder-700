"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingBasket } from "lucide-react"
import { useBasket } from "@/components/use-basket"
import { cn } from "cn"

const links = [
  { href: "/", label: "Dinners" },
  { href: "/basket/", label: "Basket" },
  { href: "/about/", label: "How we count" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const { lines } = useBasket()
  const count = lines.reduce((sum, line) => sum + (line.checked ? 0 : 1), 0)

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2 font-serif text-lg tracking-tight sm:text-xl">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-[11px] font-semibold text-primary-foreground">
            700
          </span>
          <span className="truncate">Healthy Dinners</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1" aria-label="Primary">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href.replace(/\/$/, ""))
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground",
                  active && "bg-secondary text-foreground",
                  link.href === "/about/" && "hidden sm:inline",
                )}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            )
          })}
          <Link
            href="/basket/"
            className="relative ml-1 grid size-10 place-items-center rounded-full hover:bg-secondary"
            aria-label={count ? `Basket, ${count} items still to buy` : "Basket, empty"}
          >
            <ShoppingBasket className="size-5" />
            {count > 0 && (
              <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-paprika px-1 text-[10px] font-semibold text-white">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  )
}
