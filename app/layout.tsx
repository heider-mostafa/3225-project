import './globals.css'
import Navbar from '@/components/navbar'
import { Providers } from '@/components/providers'
import { StructuredData } from '@/components/structured-data'
import { EnhancedPageTransition } from '@/components/ui/page-transition'
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
    // English keywords
    'real estate Egypt',
    'properties Cairo',
    'apartments Alexandria',
    'villas for sale',
    'luxury homes',
    'property investment',
    'real estate platform',
    'virtual tours',
    'property search',
    'OpenBeit',
    'properties New Cairo',
    'apartments Zamalek',
    'villas Maadi',
    'penthouses Egypt',
    
    // Arabic keywords (HUGE SEO OPPORTUNITY)
    'عقارات مصر',
    'عقارات القاهرة',
    'شقق للبيع',
    'فلل للبيع',
    'عقارات الزمالك',
    'شقق المعادي',
    'عقارات القاهرة الجديدة',
    'بنتهاوس مصر',
    'عقارات فاخرة',
    'أوبن بيت'
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
      'en': 'https://openbeit.com',
      'ar': 'https://openbeit.com',
      'x-default': 'https://openbeit.com',
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
  manifest: '/manifest.json',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const themeColor = [
  { media: '(prefers-color-scheme: light)', color: '#2563eb' },
  { media: '(prefers-color-scheme: dark)', color: '#1d4ed8' }
]

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
        
        {/* Meta Pixel Code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID || 'YOUR_PIXEL_ID'}');
              fbq('track', 'PageView');
            `,
          }}
        />
        
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
        
        {/* Debug Next.js hydration on mobile */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Debug Next.js hydration
              window.addEventListener('DOMContentLoaded', function() {
                console.log('🔍 DOM loaded - checking Next.js:', {
                  nextData: !!window.__NEXT_DATA__,
                  react: !!window.React,
                  nextRouter: !!window.next?.router
                });
                
                // Mobile-specific debugging
                if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                  setTimeout(() => {
                    console.log('📱 Mobile hydration check:', {
                      nextData: !!window.__NEXT_DATA__,
                      reactRoot: !!document.querySelector('#__next'),
                      buttons: document.querySelectorAll('button').length,
                      eventListeners: document.querySelector('button')?.onclick !== null
                    });
                  }, 3000);
                }
              });
              
              // Temporarily disable service worker for mobile debugging
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister();
                    console.log('SW unregistered for debugging:', registration);
                  }
                });
              }
            `,
          }}
        />
        
        {/* Mobile optimization CSS */}
        <style dangerouslySetInnerHTML={{
          __html: `
            html, body {
              overflow-x: hidden !important;
              width: 100% !important;
              position: relative !important;
            }
            
            * {
              max-width: 100% !important;
            }
            
            /* Prevent horizontal scroll on mobile */
            @media (max-width: 768px) {
              .container {
                padding-left: 1rem !important;
                padding-right: 1rem !important;
              }
            }
          `
        }} />
      </head>
      <body className={`${cairo.variable} ${amiri.variable} ${montserrat.variable}`} style={{ overflowX: 'hidden', touchAction: 'pan-y pinch-zoom' }}>
        <Providers>
          <Navbar />
          <main>
            <EnhancedPageTransition>
              {children}
            </EnhancedPageTransition>
          </main>
        </Providers>
      </body>
    </html>
  )
}
