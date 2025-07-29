import './globals.css'
import Navbar from '@/components/navbar'
import { Providers } from '@/components/providers'
import { HomepageRedirect } from '@/components/homepage-redirect'
import { StructuredData } from '@/components/structured-data'
import { Cairo, Amiri, Montserrat } from 'next/font/google'

// Fonts
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
})

const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata = {
  metadataBase: new URL('https://openbeit.com'),
  title: {
    default: 'OpenBeit - Premium Real Estate Platform in Egypt',
    template: '%s | OpenBeit - Premium Real Estate'
  },
  description: 'Discover luxury properties, apartments, and villas in Egypt with OpenBeit. Advanced search, virtual tours, and expert real estate services. Find your dream home today.',
  keywords: [
    'real estate Egypt',
    'properties Cairo',
    'apartments Alexandria',
    'villas for sale',
    'luxury homes',
    'property investment',
    'real estate platform',
    'virtual tours',
    'property search',
    'OpenBeit'
  ],
  authors: [{ name: 'OpenBeit Real Estate' }],
  creator: 'OpenBeit',
  publisher: 'OpenBeit Real Estate Platform',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://openbeit.com',
    siteName: 'OpenBeit - Premium Real Estate Platform',
    title: 'OpenBeit - Premium Real Estate Platform in Egypt',
    description: 'Discover luxury properties, apartments, and villas in Egypt with OpenBeit. Advanced search, virtual tours, and expert real estate services.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'OpenBeit - Premium Real Estate Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenBeit - Premium Real Estate Platform in Egypt',
    description: 'Discover luxury properties, apartments, and villas in Egypt with OpenBeit. Advanced search, virtual tours, and expert real estate services.',
    images: ['/og-image.jpg'],
    creator: '@openbeit',
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  alternates: {
    canonical: 'https://openbeit.com',
    languages: {
      'en-US': 'https://openbeit.com',
      'ar-EG': 'https://openbeit.com/ar',
    },
  },
  category: 'Real Estate',
  classification: 'Real Estate Platform',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' }
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        {/* Structured Data for SEO */}
        <StructuredData type="organization" />
        <StructuredData type="website" />
        
        {/* TikTok Pixel Code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function (w, d, t) {
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
                var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
                ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};

                ttq.load('D21F183C77U6OAPOT9Q0');
                ttq.page();
              }(window, document, 'ttq');
            `,
          }}
        />
      </head>
      <body className={`${cairo.variable} ${amiri.variable} ${montserrat.variable}`} suppressHydrationWarning={true}>
        <Providers>
          <HomepageRedirect>
            <Navbar />
            <main>
              {children}
            </main>
          </HomepageRedirect>
        </Providers>
      </body>
    </html>
  )
}
