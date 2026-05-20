import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dine-dark flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-8xl sm:text-9xl font-black text-white mb-4">404</h1>
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-white/60 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-dine-orange to-dine-coral text-white font-medium btn-shine"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-white/20 text-white font-medium hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}
