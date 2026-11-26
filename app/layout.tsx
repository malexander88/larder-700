import type { Metadata } from "next"
import { Fraunces, Outfit } from "next/font/google"
import { ExternalLinks } from "@/components/external-links"
import { LibraryProvider } from "@/components/library-provider"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import "./globals.css"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
})

export const metadata: Metadata = {
  applicationName: "Healthy Dinners",
  title: {
    default: "Healthy Dinners",
    template: "%s · Healthy Dinners",
  },
  description: "Tasty dinners under 700 calories. UK measures, supermarket ingredients, every plate under 700 kcal.",
  appleWebApp: {
    title: "Healthy Dinners",
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={`${outfit.variable} ${fraunces.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <LibraryProvider>
          <ExternalLinks />
          <SiteHeader />
          <main id="content">{children}</main>
          <SiteFooter />
        </LibraryProvider>
      </body>
    </html>
  )
}
