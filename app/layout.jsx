import './globals.css'
import { AppProvider } from '@/legacy/context/AppContext'

export const metadata = {
  title: 'Student Success Predictor',
  description: 'Student success prediction and workflow management portal',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
