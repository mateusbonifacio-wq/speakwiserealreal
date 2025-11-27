import './globals.css'

export const metadata = {
  title: 'SpeakWise - Pitch Coach',
  description: 'AI-powered pitch coaching application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

