import type { Metadata } from "next"
import { Fraunces, Source_Sans_3 } from "next/font/google"
import { MobileTabs } from "@/components/mobile-tabs"
import { ExternalLinks } from "@/components/external-links"
import { LibraryProvider } from "@/components/library-provider"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import "./globals.css"

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-outfit",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
})

export const metadata: Metadata = {
  applicationName: "Low Cal Dinners",
  title: {
    default: "Low Cal Dinners",
    template: "%s · Low Cal Dinners",
  },
  description: "Tasty dinners under 700 calories. UK measures, supermarket ingredients, every plate under 700 kcal.",
  appleWebApp: {
    title: "Low Cal Dinners",
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={`${sourceSans.variable} ${fraunces.variable}`}>
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
          <main id="content" className="pb-24 md:pb-0">{children}</main>
          <SiteFooter />
          <MobileTabs />
        </LibraryProvider>
      </body>
    </html>
  )
}
