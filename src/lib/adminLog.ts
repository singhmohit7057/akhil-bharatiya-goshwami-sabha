import { supabase } from './supabase'

export type LogAction = 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'upload' | 'import'

export async function logAction(
  action: LogAction,
  entityType: string,
  entityName: string,
  entityId?: string,
  details?: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user?.id || '').single()
    await supabase.from('admin_logs').insert({
      admin_id: user?.id || null,
      admin_name: profile?.full_name || user?.email || 'Admin',
      action,
      entity_type: entityType,
      entity_name: entityName,
      entity_id: entityId || null,
      details: details || null,
    })
  } catch {
    // Log silently — never block main operation
  }
}
