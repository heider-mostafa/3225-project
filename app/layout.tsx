import './globals.css'
import Navbar from '@/components/navbar'
import { Providers } from '@/components/providers'
import { Cairo, Amiri } from 'next/font/google'

// Arabic fonts
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

export const metadata = {
  title: 'VirtualEstate - Your Real Estate Platform',
  description: 'Find your dream property with VirtualEstate',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={`${cairo.variable} ${amiri.variable}`} suppressHydrationWarning={true}>
        <Providers>
          <Navbar />
          <main>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
