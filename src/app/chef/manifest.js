
export default function manifest() {
  return {
    name: "Menu 3D — Chef",
    short_name: "Kitchen",
    description: "Menu 3D Kitchen Display",
    start_url: "/chef/dashboard",
    scope: "/chef",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/chef-icon.jpeg",
        sizes: "192x192",
        type: "image/jpeg",
      },
      {
        src: "/chef-icon.jpeg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any maskable",
      },
    ],
  };
}
