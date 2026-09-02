import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Spinner } from '../components/ui/Spinner'
import type { MemberRole } from '../types'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles?: MemberRole[]
  requireExecutive?: boolean
  requireAdmin?: boolean
}

export function RoleGuard({ children, allowedRoles, requireExecutive, requireAdmin }: RoleGuardProps) {
  const { profile, loading, isAdmin } = useAuth()

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

  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/unauthorized" replace />
  }

  if (requireExecutive && !profile.is_executive_member) {
    return <Navigate to="/unauthorized" replace />
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
