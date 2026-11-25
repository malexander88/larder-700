export const GITHUB_OWNER = "malexander88"
export const GITHUB_REPO = "larder-700"
export const PAGES_ORIGIN = `https://${GITHUB_OWNER}.github.io/${GITHUB_REPO}`
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ""

export function bundledUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${BASE_PATH}${normalized}`
}

export function remoteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${PAGES_ORIGIN}${normalized}`
}
