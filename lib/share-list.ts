import { Capacitor } from "@capacitor/core"
import { Share } from "@capacitor/share"

export async function sharePlainText(title: string, text: string): Promise<"shared" | "copied" | "cancelled"> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share({ title, text, dialogTitle: title })
      return "shared"
    } catch (error) {
      if (isCancel(error)) return "cancelled"
      await navigator.clipboard.writeText(text)
      return "copied"
    }
  }

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text })
      return "shared"
    } catch (error) {
      if (isCancel(error)) return "cancelled"
    }
  }

  await navigator.clipboard.writeText(text)
  return "copied"
}

function isCancel(error: unknown): boolean {
  const name = error instanceof Error ? error.name : ""
  const message = error instanceof Error ? error.message : String(error ?? "")
  return name === "AbortError" || /cancel/i.test(message)
}
