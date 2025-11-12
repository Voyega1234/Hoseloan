import type { Metadata } from "next"
import localFont from "next/font/local"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const plexThai = localFont({
  src: [
    { path: "./fonts/IBM_Plex_Sans_Thai (1)/IBMPlexSansThai-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/IBM_Plex_Sans_Thai (1)/IBMPlexSansThai-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/IBM_Plex_Sans_Thai (1)/IBMPlexSansThai-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/IBM_Plex_Sans_Thai (1)/IBMPlexSansThai-Bold.ttf", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-plex-thai",
})

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th">
      <body className={`${plexThai.variable} ${plexThai.className} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
