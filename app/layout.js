import './globals.css'

export const metadata = {
  title: 'ThaeGyiKoneThuLay – Live Football',
  description: 'Watch live football matches from around the world',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
