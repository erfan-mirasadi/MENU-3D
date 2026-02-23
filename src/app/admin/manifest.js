
export default function manifest() {
  return {
    name: "Menu 3D — Admin",
    short_name: "Admin",
    description: "Menu 3D Admin Panel",
    start_url: "/admin/dashboard",
    scope: "/admin",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/logo.jpeg",
        sizes: "192x192",
        type: "image/jpeg",
      },
      {
        src: "/logo.jpeg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any maskable",
      },
    ],
  };
}
