"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useShoppingList } from "@/components/use-basket"
import { formatQuantityList, groupShoppingList, shoppingListPlainText, type ShoppingLine } from "@/lib/shopping-list"

export function ShoppingListView() {
  const { lines, ready, replace } = useShoppingList()
  const [notice, setNotice] = useState("")
  const groups = useMemo(() => groupShoppingList(lines), [lines])
  const remaining = lines.filter((line) => !line.checked)
  const text = shoppingListPlainText(lines)

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
    if (navigator.share) {
      try {
        await navigator.share({ title: "Healthy Dinners shopping list", text })
        return
      } catch {
        return
      }
    }
    await copyList()
  }

  if (!ready) {
    return <p className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground">Opening your shopping list…</p>
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-serif text-4xl">Your shopping list is empty</h1>
        <p className="mt-3 text-muted-foreground">Open a dinner and add its ingredients. They stay on this phone until you clear them.</p>
        <Button className="mt-6 h-11" render={<Link href="/" />}>
          Browse dinners
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-serif text-4xl">Shopping list</h1>
      <p className="mt-2 text-muted-foreground" aria-live="polite">
        {remaining.length} still to buy · {lines.length - remaining.length} ticked off. The same ingredient from two recipes is one line.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={copyList}>
          Copy list
        </Button>
        <Button type="button" variant="outline" onClick={() => void shareList()}>
          Share
        </Button>
        <Button type="button" variant="outline" onClick={() => replace([])}>
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
            <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
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
