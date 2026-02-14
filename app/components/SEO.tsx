"use client";

import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  jsonLd?: object | object[];
}

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://transdomlogistics.com";

export default function SEO({
  title = "Transdom Express - Global Shipping & Logistics Solutions",
  description = "Premier international shipping and logistics services. Ship to 200+ countries with DHL, FedEx, UPS. Fast delivery, competitive rates, 24/7 support.",
  keywords,
  canonical,
  ogImage = "/assets/og-image.jpg",
  ogType = "website",
  noindex = false,
  jsonLd,
}: SEOProps) {
  useEffect(() => {
    const fullTitle = title.includes("Transdom")
      ? title
      : `${title} | Transdom Express Logistics`;

    const canonicalUrl = canonical || siteUrl;
    const fullOgImage = ogImage.startsWith("http")
      ? ogImage
      : `${siteUrl}${ogImage}`;

    // Update document title
    document.title = fullTitle;

    // Helper function to set meta tag
    const setMetaTag = (
      selector: string,
      content: string,
      attr = "content",
    ) => {
      let element = document.querySelector(selector) as HTMLMetaElement;
      if (!element) {
        element = document.createElement("meta");
        const attrName = selector.includes("property=")
          ? "property"
          : selector.includes("name=")
            ? "name"
            : "";
        const attrValue = selector.match(/["']([^"']+)["']/)?.[1];
        if (attrName && attrValue) {
          element.setAttribute(attrName, attrValue);
        }
        document.head.appendChild(element);
      }
      element.setAttribute(attr, content);
    };

    // Set basic meta tags
    setMetaTag('meta[name="description"]', description);
    if (keywords) setMetaTag('meta[name="keywords"]', keywords);

    // Set canonical link
    let canonicalLink = document.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

    // Set robots if noindex
    if (noindex) {
      setMetaTag('meta[name="robots"]', "noindex,nofollow");
    }

    // OpenGraph tags
    setMetaTag('meta[property="og:type"]', ogType);
    setMetaTag('meta[property="og:title"]', fullTitle);
    setMetaTag('meta[property="og:description"]', description);
    setMetaTag('meta[property="og:url"]', canonicalUrl);
    setMetaTag('meta[property="og:image"]', fullOgImage);
    setMetaTag('meta[property="og:site_name"]', "Transdom Express Logistics");

    // Twitter tags
    setMetaTag('meta[name="twitter:card"]', "summary_large_image");
    setMetaTag('meta[name="twitter:title"]', fullTitle);
    setMetaTag('meta[name="twitter:description"]', description);
    setMetaTag('meta[name="twitter:image"]', fullOgImage);
    setMetaTag('meta[name="twitter:creator"]', "@transdomexpress");

    // JSON-LD Structured Data
    if (jsonLd) {
      let script = document.querySelector(
        "script[data-seo-jsonld]",
      ) as HTMLScriptElement;
      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.setAttribute("data-seo-jsonld", "true");
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(
        Array.isArray(jsonLd) ? jsonLd : [jsonLd],
      );
    }
  }, [
    title,
    description,
    keywords,
    canonical,
    ogImage,
    ogType,
    noindex,
    jsonLd,
  ]);

  return null;
}
