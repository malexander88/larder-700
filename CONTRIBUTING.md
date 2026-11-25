# Contributing

New dinners are data, not code. Follow [ADDING_RECIPES.md](ADDING_RECIPES.md): one JSON file per recipe, one WebP, then `npm run validate`.

`npm run build` refuses to compile if validation fails. On GitHub, `.github/workflows/ci.yml` runs that check for pulls and for pushes to `main`.

Do not copy another site’s method word for word. Do not hotlink images. Do not add a recipe whose photo is a different dish.
