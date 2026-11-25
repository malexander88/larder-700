# Larder 700

Healthy dinners for Northern Ireland kitchens. Every recipe is under 700 kcal a serving, measured in grams, millilitres and fan-oven degrees, with the ingredient names you would type into Tesco.

The library is one JSON file per recipe, so a daily job can add dinners without touching the UI. The home page filters that list in the browser, including once it grows past 500.

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3847](http://127.0.0.1:3847).

```bash
npm run validate   # schema, calories, tags, duplicates, images
npm run build      # validate, then a static export in out/
npm start          # serve the production build on port 3847
```

No API keys. The basket is stored in the browser (`localStorage`).

## What’s in the app

- Search by name or ingredient, and filter by cuisine, protein, time (under 20, 20–40, 40+ minutes), diet and a calorie range. Sort by time, calories or protein.
- A recipe page with equipment, a servings scaler, timed steps, fan temperatures and the computed nutrition, including which ingredients contribute the calories.
- A basket that merges the same ingredient across recipes, groups it by aisle, and lets you tick, edit or remove lines.
- Tesco search links (preferred), plus Sainsbury’s and Asda. Copy, share, or walk the list one item at a time.

## Nutrition

Weights in the recipe are grams as bought (drained, for tins). `data/nutrition.json` holds per-100 g protein, carbohydrate, fat and fibre. Calories use Atwater factors: 4 / 4 / 9. The page shows that computed total. `statedPerServing` has to stay within 10% of it, and neither figure may exceed 700 kcal.

Diet tags are derived from ingredient flags. High protein means at least 30 g per serving. Low carb means 25 g of carbohydrate or less. Details are on the “How we count” page and in [ADDING_RECIPES.md](ADDING_RECIPES.md).

These figures are for cooking, not medical advice.

## Shops, and why there is no “add all to basket”

Tesco does not offer a public basket API. The practical method is a search URL per line:

`https://www.tesco.com/groceries/en-GB/search?query=skinless+chicken+breast+fillets`

That old path currently redirects to `/shop/en-GB/search`, and it still opens the UK groceries search, which is the site Northern Ireland deliveries use. You pick the product, size and price. The basket page can open the current item, step to the next, or try to open every search (browsers often block the burst).

Sainsbury’s delivers from selected Northern Ireland stores (`/gol-ui/SearchResults/…`). Asda has stores in Northern Ireland; delivery depends on the postcode (`/groceries/search/…`). Ocado does not deliver to Northern Ireland, so it is not linked.

A bookmarklet, “Next Tesco item”, can be dragged to the bookmarks bar. On tesco.com it fills the next search and shows which item you are on. It does not press Add and it does not check out.

An auto-click userscript was considered and left out:

- Tesco’s terms restrict automated use of the site.
- The first result is often the wrong product (a ready meal, a different size, a sponsored line).
- The button markup changes, and a script that clicks it would add that wrong product to a signed-in account with no review.

Copy and share are there for anything the links don’t cover.

## Adding recipes

See [ADDING_RECIPES.md](ADDING_RECIPES.md). Short version: add `data/recipes/<slug>.json` and `public/images/recipes/<slug>.webp`, then `npm run validate`.

Images are real photographs, turned into WebP at most 1200 px wide, with a credit and an allowed licence stored on the recipe. The home page loads a slim catalogue and reveals 24 cards at a time, so a few hundred dinners stay quick to filter. Validation reads files and image headers in one pass; it does not call the network.

## Publishing, and a rebuild on every push to main

The site is a static export (`out/`). Two ways to have a push to `main` republish it:

1. **Vercel (simplest for Next.js).** Import the Git repository, leave the production branch as `main`, and leave the build as `npm run build`. Vercel publishes `out/` on every push to `main`. No extra config file is required. This is the option to use if you want the daily recipe job to go live by itself.
2. **GitHub Pages.** In the repository settings, set Pages to “GitHub Actions”. `.github/workflows/pages.yml` validates, builds and deploys `out/` on every push to `main`. The site is served from the repository’s Pages URL. Project sites that are not served from the domain root need a `basePath`; say so before relying on that URL.

This copy of the project does not have a Vercel or GitHub Pages token, so a public URL is not created from here. After the repository exists, connect one of the two options above. Until then, `npm run dev` is the way to use it.

`.github/workflows/ci.yml` runs the same build on pulls and on pushes to `main`, so a recipe that fails the calorie check does not deploy.
