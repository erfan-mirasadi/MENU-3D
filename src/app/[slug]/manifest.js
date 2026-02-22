
export default function manifest() {
  return {
    name: "Menu 3D",
    short_name: "Menu 3D",
    description: "Pro Digital 3D Menu — Scan & Order",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/logo-web.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo-web.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
