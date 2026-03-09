const BASE_URL = "https://menu-3d.com";
const LANGS = ["en", "tr", "fa", "ar", "de", "ru"];

export default function sitemap() {
  const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const landingPages = LANGS.map((lang) => ({
    url: `${BASE_URL}/${lang}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
    alternates: {
      languages: Object.fromEntries([
        ...LANGS.map((l) => [l, `${BASE_URL}/${l}`]),
        ["x-default", `${BASE_URL}/en`],
      ]),
    },
  }));

  return [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    ...landingPages,
  ];
}
