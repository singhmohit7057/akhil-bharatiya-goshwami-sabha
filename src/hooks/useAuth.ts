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
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      setProfile(null)
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
  }

  async function resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email)
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
    isSuperAdmin,
    isExecutiveMember,
    isApproved,
    hasRole,
    refreshProfile: () => user && fetchProfile(user.id),
  }
}
