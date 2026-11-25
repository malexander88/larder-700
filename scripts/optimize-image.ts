import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import sharp from "sharp"
import { LICENSES } from "../lib/constants"

function arg(name: string) {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? undefined : process.argv[index + 1]
}

const slug = arg("slug")
const credit = arg("credit")
const source = arg("source")
const license = arg("license")
const input = arg("input")
const url = arg("url")

if (!slug || !credit || !source || !license || (!input && !url)) {
  console.error("Usage: npm run image -- --slug <slug> --credit \"Name\" --source https://... --license \"CC BY 4.0\" (--url https://... | --input ./photo.jpg)")
  process.exit(1)
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error("Slug must be kebab-case")
  process.exit(1)
}
if (!(LICENSES as readonly string[]).includes(license)) {
  console.error(`License must be one of: ${LICENSES.join(", ")}`)
  process.exit(1)
}
if (!source.startsWith("https://")) {
  console.error("Source must be an https URL")
  process.exit(1)
}

async function loadBytes() {
  if (input) return readFileSync(input)
  const response = await fetch(url!)
  if (!response.ok) throw new Error(`Download failed (${response.status})`)
  const payload = await response.arrayBuffer()
  return Buffer.from(payload)
}

const bytes = await loadBytes()

const destDir = path.join("public", "images", "recipes")
mkdirSync(destDir, { recursive: true })
const dest = path.join(destDir, `${slug}.webp`)

await sharp(bytes)
  .rotate()
  .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
  .webp({ quality: 72, effort: 4 })
  .toFile(dest)

const meta = await sharp(dest).metadata()
const image = {
  file: `${slug}.webp`,
  alt: arg("alt") ?? "",
  credit,
  sourceUrl: source,
  license,
}

const recipePath = path.join("data", "recipes", `${slug}.json`)
if (process.argv.includes("--write") && readFileSync(recipePath, "utf8")) {
  const recipe = JSON.parse(readFileSync(recipePath, "utf8")) as { image?: { alt?: string } }
  image.alt = image.alt || recipe.image?.alt || ""
  recipe.image = image
  writeFileSync(recipePath, JSON.stringify(recipe, null, 2) + "\n")
}

console.log(`Wrote ${dest} (${meta.width}×${meta.height})`)
console.log(JSON.stringify(image, null, 2))
