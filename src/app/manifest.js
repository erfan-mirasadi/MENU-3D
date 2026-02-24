export default function manifest() {
  return {
    name: "Menu 3D",
    short_name: "Menu 3D",
    description: "Pro Digital 3D Menu",
    start_url: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#000000",
    theme_color: "#000000",
    launch_handler: {
      client_mode: "navigate-existing",
    },
    categories: ["food", "lifestyle"],
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
