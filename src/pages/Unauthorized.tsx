import { Link } from 'react-router-dom'
import { ShieldX } from 'lucide-react'

export function Unauthorized() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <ShieldX className="w-16 h-16 text-red-400 mb-4" />
      <p className="text-xl font-semibold text-text-primary mb-2">Access Denied</p>
      <p className="text-text-secondary mb-6">You do not have permission to view this page.</p>
      <Link to="/" className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors">
        Go Home
      </Link>
    </div>
  )
}
