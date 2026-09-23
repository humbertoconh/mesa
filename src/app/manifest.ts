import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mesa",
    short_name: "Mesa",
    description: "Lo que come la casa, contado entre todos.",
    start_url: "/hoy",
    display: "standalone",
    background_color: "#FAF6EF",
    theme_color: "#1F5D45",
    lang: "es",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
