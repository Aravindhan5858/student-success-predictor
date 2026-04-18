import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'

function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <Card className="p-7 text-center sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">404</p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Page not found</h1>
          <p className="mt-3 text-sm text-slate-500">The page you are looking for does not exist.</p>
          <Link to="/dashboard" className="mt-6 block">
            <Button>Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    </main>
  )
}

export default NotFound
