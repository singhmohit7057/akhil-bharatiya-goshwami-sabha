import { Link } from 'react-router-dom'
import { CheckCircle, Clock } from 'lucide-react'

export function PendingApproval() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Registration Successful!</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <p className="text-sm font-semibold text-amber-800">Verification Pending</p>
          </div>
          <p className="text-sm text-amber-700">
            Your profile has been sent for verification. Once approved by the admin, you will be able to login and access all features.
          </p>
        </div>
        <p className="text-xs text-text-secondary mb-6">
          You will be notified once your account is approved. This usually takes 1-2 business days.
        </p>
        <div className="flex flex-col gap-2">
          <Link to="/" className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors">
            Go to Homepage
          </Link>
          <Link to="/login" className="px-6 py-2.5 border border-border text-text-secondary rounded-lg font-medium hover:bg-gray-50 transition-colors">
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
