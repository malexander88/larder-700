"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useBasket } from "@/components/use-basket"
import { groupBasket, type BasketLine } from "@/lib/basket"
import { foods } from "@/lib/foods"
import { formatQuantity } from "@/lib/format"
import { ASDA, GROCERS, SAINSBURYS, shoppingListText, TESCO, tescoBookmarklet } from "@/lib/grocers"

export function BasketView() {
  const { lines, ready, replace } = useBasket()
  const [notice, setNotice] = useState("")
  const [step, setStep] = useState(0)
  const [includeChecked, setIncludeChecked] = useState(false)

  const groups = useMemo(() => groupBasket(lines), [lines])
  const remaining = lines.filter((line) => !line.checked)
  const shopLines = includeChecked ? lines : remaining
  const queries = shopLines.map((line) => line.name)
  const bookmark = tescoBookmarklet(queries)
  const text = shoppingListText(
    shopLines.map((line) => ({
      name: line.name,
      quantity: formatQuantity(line.grams, foods[line.nutritionId]),
      aisle: groups.find((group) => group.aisle === line.aisle)?.label ?? line.aisle,
      checked: line.checked,
    })),
  )

  function update(key: string, patch: Partial<BasketLine>) {
    replace(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)))
  }

  function openAll(makeUrl: (query: string) => string) {
    if (queries.length === 0) return
    queries.forEach((query, index) => {
      window.setTimeout(() => window.open(makeUrl(query), "_blank", "noopener"), index * 350)
    })
    setNotice("If only one tab opened, allow pop-ups or use the step-through below.")
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
        await navigator.share({ title: "Larder 700 shopping list", text })
        return
      } catch {
        return
      }
    }
    await copyList()
  }

  if (!ready) {
    return <p className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground">Opening your basket…</p>
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-serif text-4xl">Your basket is empty</h1>
        <p className="mt-3 text-muted-foreground">
          Open a dinner and add the ingredients. They stay in this browser until you clear them.
        </p>
        <Button className="mt-6 h-11" render={<Link href="/" />}>
          Browse dinners
        </Button>
      </div>
    )
  }

  const current = queries[Math.min(step, Math.max(queries.length - 1, 0))]

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_20rem]">
      <div>
        <h1 className="font-serif text-4xl">Shopping basket</h1>
        <p className="mt-2 text-muted-foreground" aria-live="polite">
          {remaining.length} still to buy · {lines.length - remaining.length} ticked off. The same ingredient from two recipes is merged.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => replace(lines.map((line) => ({ ...line, checked: true })))}>
            Tick all
          </Button>
          <Button type="button" variant="outline" onClick={() => replace(lines.filter((line) => !line.checked))}>
            Remove ticked
          </Button>
          <Button type="button" variant="ghost" onClick={() => replace([])}>
            Clear basket
          </Button>
        </div>
        <div className="mt-6 space-y-6">
          {groups.map((group) => (
            <section key={group.aisle}>
              <h2 className="font-serif text-xl">{group.label}</h2>
              <ul className="mt-2 divide-y divide-border rounded-2xl border border-border bg-card">
                {group.lines.map((line) => {
                  const food = foods[line.nutritionId]
                  return (
                    <li key={line.key} className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-start">
                      <Checkbox
                        checked={line.checked}
                        onCheckedChange={(checked) => update(line.key, { checked: checked === true })}
                        aria-label={`Tick off ${line.name}`}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <p className={line.checked ? "text-muted-foreground line-through" : "font-medium"}>{line.name}</p>
                        <p className="text-sm text-muted-foreground">{formatQuantity(line.grams, food)}</p>
                        {line.prepNotes.length > 0 && (
                          <p className="text-xs text-muted-foreground">{line.prepNotes.join(" · ")}</p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          From {line.sources.map((source) => source.title).join(", ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground" htmlFor={`grams-${line.key}`}>
                          Grams
                        </label>
                        <Input
                          id={`grams-${line.key}`}
                          type="number"
                          min={1}
                          step={1}
                          value={Math.round(line.grams)}
                          onChange={(event) => update(line.key, { grams: Number(event.target.value) || line.grams })}
                          className="h-9 w-24"
                        />
                        <Button type="button" variant="ghost" size="sm" onClick={() => replace(lines.filter((item) => item.key !== line.key))}>
                          Remove
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <aside className="h-fit space-y-4 lg:sticky lg:top-20">
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="font-serif text-2xl">Send to Tesco</h2>
          <p className="mt-2 text-sm text-muted-foreground">{TESCO.note}</p>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <Checkbox checked={includeChecked} onCheckedChange={(checked) => setIncludeChecked(checked === true)} />
            Include ticked items
          </label>
          <div className="mt-4 space-y-2">
            <Button type="button" className="h-11 w-full" disabled={!current} onClick={() => current && window.open(TESCO.searchUrl(current), "_blank", "noopener")}>
              Open this item on Tesco
            </Button>
            <p className="text-sm">
              {queries.length === 0 ? "Nothing left to search." : `${Math.min(step + 1, queries.length)} of ${queries.length}: ${current}`}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" disabled={step <= 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={step >= queries.length - 1}
                onClick={() => setStep((value) => Math.min(queries.length - 1, value + 1))}
              >
                Next
              </Button>
            </div>
            <Button type="button" variant="secondary" className="w-full" onClick={() => openAll(TESCO.searchUrl)}>
              Open all Tesco searches
            </Button>
          </div>
          <ul className="mt-4 max-h-48 space-y-1 overflow-auto text-sm">
            {shopLines.map((line) => (
              <li key={line.key}>
                <a className="underline-offset-4 hover:underline" href={TESCO.searchUrl(line.name)} target="_blank" rel="noreferrer">
                  {line.name}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="font-serif text-xl">Also in Northern Ireland</h2>
          <p className="mt-2 text-sm text-muted-foreground">{SAINSBURYS.note}</p>
          <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => current && window.open(SAINSBURYS.searchUrl(current), "_blank", "noopener")}>
            This item on Sainsbury’s
          </Button>
          <p className="mt-3 text-sm text-muted-foreground">{ASDA.note}</p>
          <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => current && window.open(ASDA.searchUrl(current), "_blank", "noopener")}>
            This item on Asda
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">Ocado does not deliver to Northern Ireland, so it isn’t offered here.</p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="font-serif text-xl">Copy or share</h2>
          <div className="mt-3 flex gap-2">
            <Button type="button" className="flex-1" onClick={copyList}>
              Copy list
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={shareList}>
              Share
            </Button>
          </div>
          <textarea readOnly value={text} className="mt-3 h-36 w-full rounded-lg border border-input bg-background p-2 text-xs" aria-label="Shopping list text" />
          <div className="mt-4">
            <h3 className="text-sm font-medium">Guided Tesco bookmarklet</h3>
            {bookmark.href ? (
              <>
                <a href={bookmark.href} className="mt-2 inline-block rounded-full bg-primary px-3 py-2 text-sm text-primary-foreground">
                  Next Tesco item
                </a>
                <p className="mt-2 text-xs text-muted-foreground">
                  Drag that link to your bookmarks bar, then click it on tesco.com. It searches the next ingredient and never presses Add or checkout.
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">{bookmark.reason} Use the step-through instead.</p>
            )}
          </div>
        </section>
        {notice && (
          <p className="text-sm text-primary" role="status">
            {notice}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Other searches: {GROCERS.map((grocer) => grocer.name).join(", ")}.
        </p>
      </aside>
    </div>
  )
}
