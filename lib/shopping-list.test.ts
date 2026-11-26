import assert from "node:assert/strict"
import test from "node:test"
import type { Food } from "./schema"
import { addToShoppingList, formatQuantityList, sumQuantities, type ShoppingLine } from "./shopping-list"

const mince: Food = {
  shopName: "lean beef mince 5% fat",
  label: "lean beef mince 5% fat",
  aisle: "meat-fish",
  per100g: { calories: 129, protein: 21, carbs: 0, fat: 5, fibre: 0 },
  displayAs: "g",
  flags: ["meat", "animal", "beef"],
  shopping: true,
}

test("150g beef mince plus 250g beef mince is 400g on one line", () => {
  const lines = addToShoppingList(
    [],
    [
      { nutritionId: "beef-mince-5", grams: 150, source: { slug: "cottage-pie", title: "Beef mince cottage pie" } },
      {
        nutritionId: "beef-mince-5",
        name: "Beef Mince",
        quantity: { amount: 250, unit: "g" },
        source: { slug: "chilli", title: "Beef and bean chilli" },
      },
    ],
    { "beef-mince-5": mince },
  )
  assert.equal(lines.length, 1)
  assert.equal(formatQuantityList(lines[0].quantities), "400g")
  assert.equal(lines[0].name, "lean beef mince 5% fat")
  assert.deepEqual(
    lines[0].sources.map((source) => source.title),
    ["Beef mince cottage pie", "Beef and bean chilli"],
  )
})

test("prep notes and plurals do not split the same food id", () => {
  const lines = addToShoppingList(
    [],
    [
      { nutritionId: "onion", name: "onions, diced", grams: 80 },
      { nutritionId: "onion", name: "Onion", quantity: { amount: 0.12, unit: "kg" } },
    ],
    {},
  )
  assert.equal(lines.length, 1)
  assert.equal(formatQuantityList(lines[0].quantities), "200g")
})

test("1000g and above is shown in kilograms", () => {
  assert.equal(formatQuantityList(sumQuantities([{ amount: 600, unit: "g" }, { amount: 500, unit: "g" }])), "1.1kg")
  assert.equal(formatQuantityList(sumQuantities([{ amount: 1, unit: "kg" }, { amount: 250, unit: "g" }])), "1.3kg")
})

test("millilitres and litres add together", () => {
  assert.equal(formatQuantityList(sumQuantities([{ amount: 500, unit: "ml" }, { amount: 0.5, unit: "l" }])), "1l")
})

test("teaspoons and tablespoons add as millilitres", () => {
  assert.equal(formatQuantityList(sumQuantities([{ amount: 2, unit: "tsp" }, { amount: 1, unit: "tbsp" }])), "25ml")
})

test("spoons and grams add when a grams-per-ml factor is known", () => {
  const summed = sumQuantities(
    [
      { amount: 1, unit: "tbsp" },
      { amount: 10, unit: "g" },
    ],
    { gramsPerMl: 0.91 },
  )
  assert.equal(formatQuantityList(summed), "23.7g")
})

test("a count and grams stay side by side when they cannot be converted", () => {
  assert.equal(
    formatQuantityList(
      sumQuantities([
        { amount: 2, unit: "count" },
        { amount: 100, unit: "g" },
      ]),
    ),
    "2 + 100g",
  )
})

test("a count converts to grams when each piece has a weight", () => {
  assert.equal(
    formatQuantityList(sumQuantities([{ amount: 2, unit: "count" }, { amount: 100, unit: "g" }], { gramsPerPiece: 50 })),
    "200g",
  )
})

test("different foods stay on different lines", () => {
  const lines = addToShoppingList(
    [] as ShoppingLine[],
    [
      { nutritionId: "beef-mince-5", grams: 150 },
      { nutritionId: "pork-mince-5", name: "pork mince", grams: 150 },
    ],
    { "beef-mince-5": mince },
  )
  assert.equal(lines.length, 2)
})
