import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://transdomlogistics.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default:
      "Transdom Express - Global Shipping & Logistics Solutions | Ship to 200+ Countries",
    template: "%s | Transdom Express Logistics",
  },
  description:
    "Premier international shipping and logistics services. Get instant quotes, track shipments, and ship to 200+ countries with DHL, FedEx, UPS. Fast delivery, competitive rates, 24/7 support.",
  keywords: [
    "international shipping",
    "global logistics",
    "freight forwarding",
    "express delivery",
    "cargo shipping",
    "DHL shipping",
    "FedEx shipping",
    "UPS shipping",
    "worldwide courier",
    "international freight",
    "logistics services",
    "shipping to Nigeria",
    "air freight",
    "sea freight",
    "door to door delivery",
    "customs clearance",
    "ecommerce shipping",
    "business shipping solutions",
    "parcel delivery",
    "package tracking",
  ],
  authors: [{ name: "Transdom Express Logistics" }],
  creator: "Transdom Express",
  publisher: "Transdom Express",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Transdom Express Logistics",
    title: "Transdom Express - Global Shipping & Logistics Solutions",
    description:
      "Premier international shipping and logistics services. Ship to 200+ countries with DHL, FedEx, UPS. Fast delivery, competitive rates, 24/7 support.",
    images: [
      {
        url: "/assets/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Transdom Express - Global Shipping Solutions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Transdom Express - Global Shipping & Logistics Solutions",
    description:
      "Premier international shipping and logistics services. Ship to 200+ countries with competitive rates.",
    images: ["/assets/og-image.jpg"],
    creator: "@transdomexpress",
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  verification: {
    google: "google-site-verification-code",
    yandex: "yandex-verification-code",
    // Add your actual verification codes when available
  },
  category: "logistics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Transdom Express Logistics",
    url: siteUrl,
    logo: `${siteUrl}/assets/transdom_logo.svg`,
    description:
      "Premier international shipping and logistics services provider",
    address: {
      "@type": "PostalAddress",
      addressCountry: "NG",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      availableLanguage: ["English"],
      areaServed: "Worldwide",
    },
    sameAs: [
      "https://facebook.com/transdomexpress",
      "https://twitter.com/transdomexpress",
      "https://linkedin.com/company/transdomexpress",
      "https://instagram.com/transdomexpress",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Transdom Express",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/quotation?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#1B5E20" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
