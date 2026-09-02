import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Spinner } from '../components/ui/Spinner'

export function ApprovalGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!profile) {
    return <Navigate to="/login" replace />
  }

  if (profile.account_status === 'pending_approval') {
    return <Navigate to="/pending-approval" replace />
  }

  if (profile.account_status === 'rejected' || profile.account_status === 'suspended') {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
