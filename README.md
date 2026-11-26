# Healthy Dinners

Tasty dinners under 700 calories. Every recipe is under 700 kcal a serving, measured in grams, millilitres and fan-oven degrees, with the ingredient names you would type into Tesco. The GitHub repository and the Pages path stay `larder-700`.

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

That old path currently redirects to `/shop/en-GB/search`, and it still opens the groceries search. You pick the product, size and price. The basket page can open the current item, step to the next, or try to open every search (browsers often block the burst).

Sainsbury’s (`/gol-ui/SearchResults/…`) and Asda (`/groceries/search/…`) are linked for the same ingredients. Delivery depends on the postcode.

A bookmarklet, “Next Tesco item”, can be dragged to the bookmarks bar. On tesco.com it fills the next search and shows which item you are on. It does not press Add and it does not check out.

An auto-click userscript was considered and left out:

- Tesco’s terms restrict automated use of the site.
- The first result is often the wrong product (a ready meal, a different size, a sponsored line).
- The button markup changes, and a script that clicks it would add that wrong product to a signed-in account with no review.

Copy and share are there for anything the links don’t cover.

## Adding recipes

See [ADDING_RECIPES.md](ADDING_RECIPES.md). Short version: add `data/recipes/<slug>.json` and `public/images/recipes/<slug>.webp`, then `npm run validate`.

Images are real photographs, turned into WebP at most 1200 px wide, with a credit and an allowed licence stored on the recipe. The home page loads a slim catalogue and reveals 24 cards at a time, so a few hundred dinners stay quick to filter. Validation reads files and image headers in one pass; it does not call the network.

## Publishing

The public site is GitHub Pages for [malexander88/larder-700](https://github.com/malexander88/larder-700):

https://malexander88.github.io/larder-700/

`.github/workflows/pages.yml` runs on every push to `main`, including a recipe-only push. The Pages build sets `NEXT_PUBLIC_BASE_PATH=/larder-700` so assets and links match a project site. It also writes `library/catalog.json` and `library/recipes/<slug>.json` into the site. That is the feed the Android app reads.

GitHub Pages on a public repository is free. A private repository would need a paid plan for Pages. Vercel’s free hobby plan can also host this static export from the same GitHub repo (import the repo, production branch `main`, build command `npm run build:pages`) if you ever want a second URL.

`.github/workflows/ci.yml` runs the build on pulls and on pushes to `main`, so a recipe that fails the calorie check does not deploy.

## Android app

The APK is a shell. On launch, and when you pull down on the dinner list, it downloads the Pages catalogue, recipe files and photos, and keeps them on the phone. If the phone is offline it uses the last download, or the dinners bundled in that APK if it has never been online. Adding a recipe and pushing to `main` updates the website and the installed app. It does not require a new APK.

Shop links use the system browser, so Tesco, Sainsbury’s and Asda open in Chrome (or the shop’s app, if Android offers it). The basket stays in the app’s local storage.

`.github/workflows/apk.yml` builds a debug APK when app code changes, and when you run the workflow by hand. It does not run for changes that are only under `data/recipes/` or `public/images/recipes/`. The APK is attached to the Actions run and to the rolling prerelease tag `android-latest`.

Install the debug APK with “Install unknown apps” allowed for your browser or files app. Open the APK. Android will warn that it is not from the Play Store; that is expected for this debug build.

```bash
npm run apk
```

The file is `android/app/build/outputs/apk/debug/app-debug.apk`.
