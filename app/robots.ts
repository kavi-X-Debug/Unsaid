import type { MetadataRoute } from "next";

const baseUrl = "https://unsaid.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/u/", "/profile/", "/privacy-policy"],
        disallow: ["/inbox", "/profile", "/login", "/signup", "/verify-email", "/api/"]
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  };
}

