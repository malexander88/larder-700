import { Browser } from "@capacitor/browser"
import { Capacitor } from "@capacitor/core"

export async function openExternal(url: string) {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url })
    return
  }
  window.open(url, "_blank", "noopener,noreferrer")
}

export function recipeHref(slug: string): string {
  if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
    return `/recipe/view/?slug=${encodeURIComponent(slug)}`
  }
  return `/recipe/${slug}/`
}
