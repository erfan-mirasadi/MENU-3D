// Scoped PWA manifest for the Cashier role.
// When installed, this PWA opens directly to /cashier/dashboard.
export default function manifest() {
  return {
    name: "Menu 3D — Cashier",
    short_name: "Cashier",
    description: "Menu 3D Cashier Panel",
    start_url: "/cashier/dashboard",
    scope: "/cashier",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/cashier-icon.jpeg",
        sizes: "192x192",
        type: "image/jpeg",
      },
      {
        src: "/cashier-icon.jpeg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any maskable",
      },
    ],
  };
}
