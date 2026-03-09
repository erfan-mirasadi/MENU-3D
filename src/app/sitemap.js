const BASE_URL = "https://menu-3d.com";
const LANGS = ["en", "tr", "fa", "ar", "de", "ru"];

export default function sitemap() {
  const landingPages = LANGS.map((lang) => ({
    url: `${BASE_URL}/${lang}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1.0,
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
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    ...landingPages,
  ];
}
