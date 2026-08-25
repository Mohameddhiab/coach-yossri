import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Coach Yosri",
    short_name: "Coach Yosri",
    description: "بالصحة والقوة مع مدربك — خطتك الغذائية وتقدمك في كل مكان",
    start_url: "/plan",
    display: "standalone",
    background_color: "#141518",
    theme_color: "#f59e0b",
    dir: "rtl",
    lang: "ar",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "تسجيل الوزن",
        short_name: "وزن",
        url: "/progression",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "خطة اليوم",
        short_name: "خطة",
        url: "/plan",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}