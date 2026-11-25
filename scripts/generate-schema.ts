import { writeFileSync } from "node:fs"
import { zodToJsonSchema } from "zod-to-json-schema"
import { recipeSchema } from "../lib/schema"

const schema = zodToJsonSchema(recipeSchema, {
  name: "Recipe",
  $refStrategy: "none",
  target: "jsonSchema7",
}) as Record<string, unknown>
schema.title = "Recipe"

writeFileSync("data/recipe.schema.json", JSON.stringify(schema, null, 2) + "\n")
console.log("Wrote data/recipe.schema.json")
