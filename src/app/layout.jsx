import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata = {
  title: 'Vereinsplattform - Digitales Vereinsmanagement',
  description: 'Die moderne Plattform für digitales Vereinsmanagement',
}

export default function RootLayout({ children }) {
  return (
    <html lang="de" className="dark">
      <body className={`${inter.className} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
