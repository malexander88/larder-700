"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Compass, Search, ShoppingBasket } from "lucide-react"
import { useShoppingList } from "@/components/use-basket"
import { cn } from "cn"

const tabs = [
  { href: "/", label: "Discover", icon: Compass },
  { href: "/search/", label: "Search", icon: Search },
  { href: "/basket/", label: "List", icon: ShoppingBasket },
]

export function MobileTabs() {
  const pathname = usePathname()
  const { lines } = useShoppingList()
  const count = lines.reduce((sum, line) => sum + (line.checked ? 0 : 1), 0)

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      aria-label="Primary"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-3">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href.replace(/\/$/, ""))
          const Icon = tab.icon
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium tracking-wide text-muted-foreground",
                  active && "text-primary",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                {tab.label}
                {tab.href === "/basket/" && count > 0 && (
                  <span className="absolute top-1.5 right-[28%] grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                    {count}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
