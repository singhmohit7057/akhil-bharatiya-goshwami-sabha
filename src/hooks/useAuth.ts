import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { MemberRole, Profile } from '../types'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) {
      setProfile(data as Profile)
    } else if (error) {
      // Only sign out if profile row genuinely doesn't exist (PGRST116 = no rows)
      // Don't sign out on network/schema errors to avoid unexpected logouts
      if (error.code === 'PGRST116') {
        await supabase.auth.signOut()
        setUser(null)
        setSession(null)
        setProfile(null)
      }
      // For other errors (network, etc.) just clear loading without signing out
    }
    setLoading(false)
  }

  async function signUp(email: string, password: string, metadata: { full_name: string; phone?: string; gender?: string; gotra?: string; city?: string; state?: string }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })
    return { data, error }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error && data.user) {
      // Log login after profile is fetched (defer slightly)
      setTimeout(async () => {
        const { data: prof } = await supabase.from('profiles').select('full_name, admin_level').eq('id', data.user!.id).single()
        if (prof?.admin_level && prof.admin_level !== 'none') {
          await supabase.from('admin_logs').insert({
            admin_id: data.user!.id,
            admin_name: prof.full_name || email,
            action: 'login',
            entity_type: 'session',
            entity_name: `Logged in`,
            details: `Email: ${email}`,
          })
        }
      }, 1000)
    }
    return { data, error }
  }

  async function signOut() {
    if (profile && profile.admin_level && profile.admin_level !== 'none') {
      await supabase.from('admin_logs').insert({
        admin_id: profile.id,
        admin_name: profile.full_name || '',
        action: 'logout',
        entity_type: 'session',
        entity_name: 'Logged out',
      })
    }
    await supabase.auth.signOut()
    setProfile(null)
  }

  async function resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  }

  function isAdmin(): boolean {
    if (!profile) return false
    return profile.admin_level === 'admin' || profile.admin_level === 'super_admin'
  }

  function isSuperAdmin(): boolean {
    if (!profile) return false
    return profile.admin_level === 'super_admin'
  }

  function isViewer(): boolean {
    if (!profile) return false
    return profile.admin_level === 'viewer'
  }

  // Check if admin has a specific permission (super_admin always has all)
  function hasPermission(perm: string): boolean {
    if (!profile) return false
    if (profile.admin_level === 'super_admin') return true
    if (profile.admin_level !== 'admin') return false
    const perms: string[] = (profile as any).admin_permissions || []
    return perms.includes(perm)
  }

  // Can write/modify (not viewer, and has permission if admin)
  function canWrite(section?: string): boolean {
    if (!profile) return false
    if (profile.admin_level === 'super_admin') return true
    if (profile.admin_level === 'viewer') return false
    if (profile.admin_level === 'admin') {
      return section ? hasPermission(section) : true
    }
    return false
  }

  function isExecutiveMember(): boolean {
    return profile?.is_executive_member ?? false
  }

  function isApproved(): boolean {
    return profile?.account_status === 'active'
  }

  function hasRole(roles: MemberRole[]): boolean {
    if (!profile) return false
    return roles.includes(profile.role)
  }

  return {
    session,
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    isAdmin,
    isViewer,
    hasPermission,
    canWrite,
    isSuperAdmin,
    isExecutiveMember,
    isApproved,
    hasRole,
    refreshProfile: () => user && fetchProfile(user.id),
  }
}
