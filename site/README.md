# Taskly landing page

A static page that presents Taskly: English at `/`, French at `/fr`. No accounts, no database, no build step.

## Edit it

The HTML is generated, so English and French stay in step. Change the text or the layout in [`scripts/build-site.py`](../scripts/build-site.py), the styles in [`styles.css`](styles.css), then rebuild and commit the result:

```bash
python3 scripts/build-site.py
```

The script copies the framed screenshots from `docs/readme/` (rebuilt by `scripts/build-readme-art.py`) and inlines [Tabler](https://tabler.io/icons) icons from `node_modules`, so run `npm install` once first.

Preview it locally:

```bash
python3 -m http.server 4180 --directory site
```

## Put it on Vercel

1. **Add New › Project**, import the Taskly repository.
2. **Root Directory**: `site`. **Framework Preset**: Other. Leave the build and output settings empty.
3. Deploy. The page is served at `https://<project-name>.vercel.app`.

The official page runs at **https://taskly-day.vercel.app** (Vercel project `taskly`). It isn't connected to Git yet: redeploy with `vercel deploy --prod` from `site/`, or connect the repository in the Vercel dashboard with Root Directory `site` so pushes to `main` redeploy it.

`.vercelignore` keeps this README and any `.env*` file out of the upload: `vercel link` writes a `.env.local` with a Vercel token next to the files, and a static site would publish it.

This project is separate from the app itself: it costs nothing to host and stores no data. `vercel.json` here turns on clean URLs, adds basic security headers and caches the images and the stylesheet for a year: `build-site.py` adds a hash of each file to its URL (`?v=…`), so a changed file gets a new URL and returning visitors see it right after a deploy.
