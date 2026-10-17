import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Taskly",
    short_name: "Taskly",
    description: "Ta journée, triée par Claude. Your day, sorted by Claude.",
    start_url: "/today",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f2f2f7",
    theme_color: "#f2f2f7",
    categories: ["productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      // Safari's "Add to Dock" on the Mac wants an opaque, full-bleed 1024 icon (WebKit, Safari 17.2+).
      { src: "/icons/icon-1024.png", sizes: "1024x1024", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-1024.png", sizes: "1024x1024", type: "image/png", purpose: "maskable" },
    ],
  };
}
