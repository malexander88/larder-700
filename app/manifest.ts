import type { MetadataRoute } from "next"

export const dynamic = "force-static"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Low Cal Dinners",
    short_name: "Low Cal Dinners",
    description: "Tasty dinners under 700 calories",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f1e7",
    theme_color: "#1c3d32",
  }
}
