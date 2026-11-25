export type Grocer = {
  id: string
  name: string
  deliversInNorthernIreland: boolean
  note: string
  searchUrl: (query: string) => string
}

export const TESCO: Grocer = {
  id: "tesco",
  name: "Tesco",
  deliversInNorthernIreland: true,
  note: "Tesco groceries delivers across Northern Ireland. Search opens the UK site so you can pick the product and size yourself.",
  searchUrl: (query) => `https://www.tesco.com/groceries/en-GB/search?query=${encodeURIComponent(query)}`,
}

export const SAINSBURYS: Grocer = {
  id: "sainsburys",
  name: "Sainsbury's",
  deliversInNorthernIreland: true,
  note: "Sainsbury's delivers from selected Northern Ireland stores. Check your postcode on their site before you rely on a slot.",
  searchUrl: (query) => `https://www.sainsburys.co.uk/gol-ui/SearchResults/${encodeURIComponent(query)}`,
}

export const ASDA: Grocer = {
  id: "asda",
  name: "Asda",
  deliversInNorthernIreland: true,
  note: "Asda has stores in Northern Ireland. Delivery and click & collect depend on your postcode.",
  searchUrl: (query) => `https://www.asda.com/groceries/search/${encodeURIComponent(query)}`,
}

export const GROCERS = [TESCO, SAINSBURYS, ASDA]

const BOOKMARKLET_ITEM_LIMIT = 25
const BOOKMARKLET_LENGTH_LIMIT = 6000

export function tescoBookmarklet(queries: string[]): { href: string; reason?: string } {
  if (queries.length === 0) {
    return { href: "", reason: "Add something to the basket first." }
  }
  if (queries.length > BOOKMARKLET_ITEM_LIMIT) {
    return {
      href: "",
      reason: `This basket has ${queries.length} lines. Bookmarklets get unreliable past ${BOOKMARKLET_ITEM_LIMIT}, so use the step-through instead.`,
    }
  }

  const payload = JSON.stringify(queries)
  const href =
    `javascript:(function(){` +
    `var items=${payload};` +
    `var k='larder700-step';` +
    `var i=parseInt(localStorage.getItem(k)||'0',10)||0;` +
    `if(i>=items.length){localStorage.removeItem(k);alert('End of the Larder 700 list. Anything in your Tesco basket is what you added yourself.');return;}` +
    `var q=items[i];` +
    `localStorage.setItem(k,String(i+1));` +
    `var id='larder700-bar';` +
    `var bar=document.getElementById(id);` +
    `if(!bar){bar=document.createElement('div');bar.id=id;bar.setAttribute('role','status');bar.style.cssText='position:fixed;z-index:2147483647;left:12px;right:12px;bottom:12px;background:#143c28;color:#f6f1e7;padding:14px 16px;border-radius:16px;font:15px/1.45 system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.28)';document.body.appendChild(bar);}` +
    `bar.textContent='Larder 700 '+(i+1)+' of '+items.length+': '+q+'. Choose the product and tap Add yourself. Click the bookmarklet again for the next item. It never checks out.';` +
    `location.href='https://www.tesco.com/groceries/en-GB/search?query='+encodeURIComponent(q);` +
    `})();`

  if (href.length > BOOKMARKLET_LENGTH_LIMIT) {
    return { href: "", reason: "This list is too long to embed in a bookmarklet. Use the step-through." }
  }
  return { href }
}

export function shoppingListText(lines: { name: string; quantity: string; aisle: string; checked: boolean }[]): string {
  const groups = new Map<string, string[]>()
  for (const line of lines) {
    const bucket = groups.get(line.aisle) ?? []
    bucket.push(`${line.checked ? "[x]" : "[ ]"} ${line.name} — ${line.quantity}`)
    groups.set(line.aisle, bucket)
  }
  const parts = ["Larder 700 shopping list", ""]
  for (const [aisle, rows] of groups) {
    parts.push(aisle, ...rows, "")
  }
  parts.push("Search each item on Tesco: https://www.tesco.com/groceries/en-GB/search?query=")
  return parts.join("\n").trim()
}
