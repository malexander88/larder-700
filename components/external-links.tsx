"use client"

import { useEffect } from "react"
import { Capacitor } from "@capacitor/core"
import { openExternal } from "@/lib/open-external"

export function ExternalLinks() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest?.("a")
      if (!anchor) return
      const href = anchor.getAttribute("href")
      if (!href || href.startsWith("#") || href.startsWith("/") || href.startsWith("javascript:")) return
      if (href.startsWith("http://") || href.startsWith("https://")) {
        event.preventDefault()
        void openExternal(href)
      }
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [])
  return null
}
