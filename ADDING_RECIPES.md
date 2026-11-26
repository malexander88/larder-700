# Adding a recipe

One dinner is one file: `data/recipes/<slug>.json`. The picture is `public/images/recipes/<slug>.webp`. Pushing the pair to `main` is what publishes it, once hosting is connected (see the README).

`npm run validate` is the gate. It checks the shape, the calorie rules, the tags, near-duplicate dishes and the image file. `npm run build` runs it first.

## 1. Pick a slug

Lowercase kebab-case, unique, and the same name as the file. `miso-aubergine-tofu` is the file `data/recipes/miso-aubergine-tofu.json` and the image `miso-aubergine-tofu.webp`.

Read the titles already in `data/recipes/` before you write. Validation rejects a title that is a near copy of another, and a dish whose ingredient list overlaps another by about three quarters. Change the dish, not the threshold.

## 2. Write the recipe in your own words

Research is fine. Copying another site’s method is not. Quantities are grams of the food as you buy it (drained weight for a tin). UK names: courgette, coriander, aubergine, mince, fillet, passata, tamari, fan oven.

Look up foods in `data/nutrition.json`. An ingredient is only:

```json
{ "nutritionId": "chicken-breast-raw", "grams": 360, "prepNote": "cut into thick strips" }
```

`shopName` on the food is the name on the shopping list. Do not invent a second name for the same `nutritionId`. If the food is missing, add it to `data/nutrition.json` with per-100 g protein, carbohydrate, fat and fibre. Calories should be close to `4×protein + 4×carbohydrate + 9×fat`. Say whether it is meat, fish, dairy, gluten and so on in `flags`, because the tags are derived from those flags.

Water can be listed. Set `"shopping": false` on a food that should never go on the shopping list.

## 3. Let the numbers be computed

`statedPerServing` is the check figure, per serving, for the servings the recipe is written for:

- `calories`: nearest whole number
- `protein`, `carbs`, `fat`, `fibre`: one decimal place

Validation fails if any of those differs from the computed value by more than 10% (macros also pass when the gap is 1.5 g or less), or if calories per serving are over 700. Aim for a real dinner, roughly 400–650 kcal, so a small edit does not tip it over.

Tags are not free text. They must be exactly the set the ingredients imply, in any order:

| Tag | Rule |
| --- | --- |
| vegetarian | no meat, fish or seafood flags |
| vegan | vegetarian, and no animal, dairy or egg |
| gluten-free | no gluten flag |
| dairy-free | no dairy flag |
| high-protein | at least 30 g protein per serving |
| low-carb | 25 g carbohydrate or less per serving |

A vegan recipe is also vegetarian. The main `protein` must match a flag on at least one ingredient (`eggs` matches the `egg` flag, `legumes` matches `legume`).

`prepMinutes + cookMinutes` must equal the sum of `steps[].minutes`. Those minutes are the elapsed timeline, not overlapping clocks. Oven steps use `temperatureC` (fan). Hob steps use `heat`, such as `"medium hob"`. Not both.

## 4. Add the photograph

Use a real photograph of that dish. Unsplash, Pexels, Wikimedia Commons and other clearly licensed sources are fine. Do not use a picture of a different dish, a restaurant exterior, or anything marked NC or ND.

Save the original, then:

```bash
npm run image -- --slug your-slug \
  --url "https://example.com/photo.jpg" \
  --credit "Photographer Name via Wikimedia Commons" \
  --source "https://commons.wikimedia.org/wiki/File:Example.jpg" \
  --license "CC BY-SA 4.0" \
  --alt "Short description of what is in the picture" \
  --write
```

`--input ./photo.jpg` works instead of `--url`. The script writes a WebP at most 1200 px wide. Validation then requires the file to exist, to be WebP, between 800 and 1400 px wide, at least 520 px tall, and between 12 KB and 280 KB.

Allowed `license` values include `Unsplash License`, `Pexels License`, `CC0`, `CC0 1.0`, `CC BY 2.0`, `CC BY 2.5`, `CC BY 3.0`, `CC BY 4.0`, `CC BY-SA 2.0`, `CC BY-SA 2.5`, `CC BY-SA 3.0`, `CC BY-SA 4.0`, `Public domain`.

Put the same credit on the recipe’s `image` object if you did not pass `--write`.

## 5. Check

```bash
npm run validate
```

Fix every line it prints. On a few hundred files this stays a single quick pass: it reads JSON, does arithmetic, and reads image headers. It does not re-download anything.

The shape is also in `data/recipe.schema.json` (regenerate with `npm run schema` if you change `lib/schema.ts`). The script is stricter than the schema: tags, the 700 kcal cap, the 10% check, duplicates and the image file are enforced there.

## 6. Publish

Commit the JSON file and the WebP. A push to `main` republishes the website, including `library/catalog.json`. Phones that already have the app pick that up the next time they open it or pull down on the dinner list. A new APK is only built when the app code changes.
