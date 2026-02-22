
export default function manifest() {
  return {
    name: "Menu 3D — Waiter",
    short_name: "Waiter",
    description: "Menu 3D Waiter Panel",
    start_url: "/waiter/dashboard",
    scope: "/waiter",
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
