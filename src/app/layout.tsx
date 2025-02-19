import { CurrencyProvider } from '@/lib/hooks/useCurrency'
import { ThemeProvider } from '@/lib/theme/ThemeProvider'
import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://moneyonly,net'),
  title: {
    default: 'TenApp - Personal Finance Dashboard',
    template: '%s | TenApp',
  },
  description: 'Track your finances, manage accounts, and achieve your financial goals with TenApp',
  keywords: ['personal finance', 'finance dashboard', 'money management', 'budgeting', 'expense tracking'],
  authors: [{ name: 'TenApp Team' }],
  creator: 'TenApp',
  publisher: 'TenApp',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        url: '/favicon-32x32.png',
      },
    ],
  },
  manifest: '/site.webmanifest',
  applicationName: 'TenApp',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TenApp',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  openGraph: {
    type: 'website',
    siteName: 'TenApp',
    title: 'TenApp - Personal Finance Dashboard',
    description: 'Track your finances, manage accounts, and achieve your financial goals with TenApp',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TenApp - Personal Finance Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TenApp - Personal Finance Dashboard',
    description: 'Track your finances, manage accounts, and achieve your financial goals with TenApp',
    images: ['/twitter-image.png'],
    creator: '@tenapp',
  },
  category: 'Finance',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#18181b' },
  ],
  colorScheme: 'dark light',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} antialiased`}
    >
      <head />
      <body
        className="font-sans"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <CurrencyProvider>
            <div className="min-h-screen bg-[var(--background-primary)]">
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:p-4 focus:bg-[var(--background-primary)] focus:text-[var(--text-primary)]"
              >
                Skip to main content
              </a>
              <main id="main-content" role="main" className="relative">
                {children}
              </main>
            </div>
          </CurrencyProvider>
        </ThemeProvider>
        <noscript>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              padding: '1rem',
              backgroundColor: '#f44336',
              color: 'white',
              textAlign: 'center',
              zIndex: 9999,
            }}
          >
            JavaScript is required to use TenApp. Please enable JavaScript in your browser settings.
          </div>
        </noscript>
      </body>
    </html>
  )
}
