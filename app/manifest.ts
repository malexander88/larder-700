import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Healthy Dinners",
    short_name: "Healthy Dinners",
    description: "Tasty dinners under 700 calories",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f3ea",
    theme_color: "#1f6b45",
  }
}
