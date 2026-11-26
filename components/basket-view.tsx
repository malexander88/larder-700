"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useShoppingList } from "@/components/use-basket"
import { sharePlainText } from "@/lib/share-list"
import { formatQuantityList, groupShoppingList, linesToShare, shoppingListPlainText, type ShoppingLine } from "@/lib/shopping-list"

export function ShoppingListView() {
  const { lines, ready, replace } = useShoppingList()
  const [notice, setNotice] = useState("")
  const groups = useMemo(() => groupShoppingList(lines), [lines])
  const remaining = lines.filter((line) => !line.checked)
  const text = shoppingListPlainText(linesToShare(lines))

  function update(key: string, patch: Partial<ShoppingLine>) {
    replace(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)))
  }

  async function copyList() {
    try {
      await navigator.clipboard.writeText(text)
      setNotice("Shopping list copied.")
    } catch {
      setNotice("Clipboard was blocked. Select the list below and copy it yourself.")
    }
  }

  async function shareList() {
    try {
      const result = await sharePlainText("Low Cal Dinners shopping list", text)
      if (result === "copied") setNotice("Shopping list copied.")
    } catch {
      setNotice("Couldn’t share. Select the list below and copy it yourself.")
    }
  }

  if (!ready) {
    return <p className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground">Opening your shopping list…</p>
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-serif text-4xl">Nothing on the list yet</h1>
        <p className="mt-3 text-muted-foreground">Open a dinner and add its ingredients. They stay on this phone until you clear them.</p>
        <Button className="mt-6 h-11" render={<Link href="/" />}>
          Browse dinners
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <p className="text-xs tracking-[0.18em] text-primary uppercase">For the shop</p>
      <h1 className="mt-2 font-serif text-4xl">Shopping list</h1>
      <p className="mt-2 text-muted-foreground" aria-live="polite">
        {remaining.length} still to buy · {lines.length - remaining.length} ticked off. The same ingredient from two recipes is one line.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" className="h-11 rounded-full px-5" onClick={() => void shareList()}>
          Share
        </Button>
        <Button type="button" variant="outline" className="h-11 rounded-full px-5" onClick={copyList}>
          Copy
        </Button>
        <Button type="button" variant="outline" className="h-11 rounded-full px-5" onClick={() => replace([])}>
          Clear list
        </Button>
      </div>
      {notice && (
        <p className="mt-3 text-sm text-primary" role="status">
          {notice}
        </p>
      )}
      <div className="mt-8 space-y-8">
        {groups.map((group) => (
          <section key={group.aisle}>
            <h2 className="font-serif text-2xl">{group.label}</h2>
            <ul className="mt-3 divide-y divide-border overflow-hidden rounded-3xl bg-card shadow-[0_12px_40px_-28px_rgba(40,30,20,0.5)]">
              {group.lines.map((line) => (
                <li key={line.key} className="flex items-start gap-3 px-3 py-3">
                  <Checkbox
                    checked={line.checked}
                    onCheckedChange={(checked) => update(line.key, { checked: checked === true })}
                    aria-label={`Tick off ${line.name}`}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={line.checked ? "font-medium line-through text-muted-foreground" : "font-medium"}>
                      {line.name}
                      <span className="font-normal text-muted-foreground"> — {formatQuantityList(line.quantities)}</span>
                    </p>
                    {line.sources.length > 0 && (
                      <p className="text-sm text-muted-foreground">From {line.sources.map((source) => source.title).join(", ")}</p>
                    )}
                  </div>
                  <Button type="button" variant="ghost" className="h-8 px-2 text-sm" onClick={() => replace(lines.filter((item) => item.key !== line.key))}>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <textarea readOnly value={text} className="mt-8 h-40 w-full rounded-lg border border-input bg-background p-2 text-xs" aria-label="Shopping list text" />
    </div>
  )
}
