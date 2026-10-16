# Brand

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="../../public/brand/taskly-logo-ivory.svg">
  <img alt="Taskly" src="../../public/brand/taskly-logo-graphite.svg" width="280">
</picture>

The Taskly logo and how to use it. The assets live in [`public/brand/`](../../public/brand), so the app serves them at `/brand/…` and the docs use the same files.

## Files

| Asset | Graphite | Ivory | Use |
|---|---|---|---|
| Monogram | [svg](../../public/brand/taskly-monogram-graphite.svg) | [svg](../../public/brand/taskly-monogram-ivory.svg) | Small spaces, in-app headers, notifications |
| Wordmark | [svg](../../public/brand/taskly-wordmark-graphite.svg) | [svg](../../public/brand/taskly-wordmark-ivory.svg) | When the monogram is already visible nearby |
| Horizontal logo | [svg](../../public/brand/taskly-logo-graphite.svg) | [svg](../../public/brand/taskly-logo-ivory.svg) | README, website, presentations |
| App icon | [svg](../../public/brand/taskly-app-icon.svg) · [png 1024](../../public/brand/taskly-app-icon-1024.png) | | Home screen, stores |
| PWA icons | [192](../../public/icons/icon-192.png) · [512](../../public/icons/icon-512.png) · [maskable 512](../../public/icons/icon-maskable-512.png) | | Web app manifest |
| Social preview | [png 1280×640](social-preview.png) | | GitHub repository card, link previews |

[`source/`](source) holds the original artwork exactly as delivered. The files in `public/brand/` use the same paths with a tight `viewBox`, so they align without extra margins. In the app, the `Monogram`, `Wordmark` and `Logo` components in `src/components/brand/logo.tsx` draw the same paths in `currentColor`.

## Colors

| Name | Value | Use |
|---|---|---|
| Graphite | `#171717` | Logo on light backgrounds, app icon background |
| Ivory | `#F5F3ED` | Logo on dark backgrounds, monogram on the app icon |

The logo is graphite or ivory, nothing else. The accent color belongs to the user and never touches the logo ([D-012](../design/DECISIONS.md#d-012--a-monochrome-brand-the-color-belongs-to-the-user)).

## Rules

- **Clear space:** keep at least the width of the monogram's lower block empty around the logo.
- **Minimum size:** monogram 16 px, horizontal logo 96 px wide.
- **App icon:** ivory monogram on graphite, at 62% of the icon width. The favicon uses 78% so the two shapes stay apart at 16 px. The maskable icon uses 50% to stay inside Android's safe zone.
- **Don't** recolor the logo, add effects or shadows, stretch, rotate, or rebuild the wordmark in another typeface.
- **Don't** put the graphite logo on dark backgrounds or the ivory one on light backgrounds: use the matching version.

## Generated files

The PNG icons, the favicon and the social preview are rasterized from the official paths, not redrawn. If the artwork changes, regenerate them from the new SVGs rather than editing the PNGs.

## GitHub social preview

GitHub doesn't allow setting the repository card through its API. To use [social-preview.png](social-preview.png), go to the repository's **Settings › General › Social preview** and upload it.
